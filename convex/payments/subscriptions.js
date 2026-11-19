"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal, api } from "../_generated/api";
import Razorpay from "razorpay";

// Initialize Razorpay client securely with environment variables
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment."
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

// -------------------------------------------------------------
// Action: Get Public Key ID for Frontend Checkout initialization
// -------------------------------------------------------------
export const getPublicRazorpayKey = action({
  args: {},
  handler: async () => {
    return (
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      ""
    );
  },
});

// -------------------------------------------------------------
// Action: Create Evenza Pro Monthly Subscription (Production Razorpay)
// -------------------------------------------------------------
export const createProSubscription = action({
  args: {
    clerkUserId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user from Clerk token or fallback to clerkUserId
    const identity = await ctx.auth.getUserIdentity();
    let user = null;
    let clerkUserId = args.clerkUserId;

    if (identity) {
      user = await ctx.runQuery(internal.payments.mutations.getUserByToken, {
        tokenIdentifier: identity.tokenIdentifier,
      });
      clerkUserId = identity.subject;
    }

    if (!user && clerkUserId) {
      user = await ctx.runQuery(api.users.getUserByClerkId, {
        clerkUserId: clerkUserId,
      });
    }

    // Auto-provision user record if signed in via Clerk but not yet synced to Convex
    if (!user && clerkUserId) {
      const newUserId = await ctx.runMutation(internal.users.storeOrUpdateDevUser, {
        clerkUserId: clerkUserId,
        email: args.userEmail || "",
        name: args.userName || "Evenza User",
      });
      user = await ctx.runQuery(internal.payments.mutations.getUserById, { userId: newUserId });
    }

    if (!user) {
      throw new Error("Authentication required. Please sign in to upgrade to Evenza Pro.");
    }

    // 2. Prevent duplicate active subscriptions
    if (user.plan === "pro" && user.subscriptionStatus === "active") {
      throw new Error("You already have an active Evenza Pro subscription.");
    }

    // 3. Verify Razorpay credentials & Plan ID
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const planId = process.env.RAZORPAY_MONTHLY_PLAN_ID;

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials are not configured on the server.");
    }

    if (!planId) {
      throw new Error("Razorpay Monthly Plan ID is not configured. Please set RAZORPAY_MONTHLY_PLAN_ID.");
    }

    // 4. Create real Razorpay Subscription (Strictly MONTHLY, 60 billing cycles max)
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 60, // 5 years of monthly billing cycles
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId: user._id,
        clerkUserId: clerkUserId || identity?.subject,
        appName: "Evenza",
        planType: "pro_monthly",
      },
    });

    if (!subscription || !subscription.id) {
      throw new Error("Failed to create subscription with Razorpay.");
    }

    // 5. Store pending subscription in Convex database
    await ctx.runMutation(internal.payments.mutations.saveNewSubscription, {
      userId: user._id,
      clerkUserId: clerkUserId || identity?.subject || "",
      razorpaySubscriptionId: subscription.id,
      razorpayPlanId: planId,
      status: "created",
      cancelAtCycleEnd: false,
    });

    return {
      subscriptionId: subscription.id,
      keyId: keyId,
      planId: planId,
      amount: 199900, // ₹1999 in paise
      currency: "INR",
      userName: user.name || args.userName || "Evenza User",
      userEmail: user.email || args.userEmail || "",
    };
  },
});

// -------------------------------------------------------------
// Action: Cancel Evenza Pro Monthly Subscription (Immediate Cancellation)
// -------------------------------------------------------------
export const cancelProSubscription = action({
  args: {
    razorpaySubscriptionId: v.optional(v.string()),
    cancelImmediately: v.optional(v.boolean()),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let user = null;
    let clerkUserId = args.clerkUserId;

    if (identity) {
      user = await ctx.runQuery(internal.payments.mutations.getUserByToken, {
        tokenIdentifier: identity.tokenIdentifier,
      });
      clerkUserId = identity.subject;
    }

    if (!user && clerkUserId) {
      user = await ctx.runQuery(api.users.getUserByClerkId, {
        clerkUserId: clerkUserId,
      });
    }

    if (!user) {
      throw new Error("Authentication required.");
    }

    // Find the subscription to cancel
    let subscription = null;
    if (args.razorpaySubscriptionId) {
      subscription = await ctx.runQuery(
        internal.payments.mutations.getSubscriptionByRazorpayId,
        { razorpaySubscriptionId: args.razorpaySubscriptionId }
      );
    } else {
      subscription = await ctx.runQuery(
        api.payments.mutations.getUserActiveSubscription,
        { clerkUserId }
      );
    }

    if (subscription && subscription.userId.toString() !== user._id.toString()) {
      throw new Error("Unauthorized: You do not own this subscription.");
    }

    // Cancel in Razorpay immediately (cancel_at_cycle_end = false)
    if (subscription && subscription.razorpaySubscriptionId) {
      const subId = subscription.razorpaySubscriptionId;
      if (!subId.startsWith("sub_dev_test_")) {
        try {
          const razorpay = getRazorpayInstance();
          // Passing false as 2nd parameter cancels immediately in Razorpay
          await razorpay.subscriptions.cancel(subId, false);
        } catch (err) {
          console.warn("Razorpay API cancel warning:", err.message);
        }
      }

      // Update Convex subscription status to 'cancelled' immediately
      await ctx.runMutation(internal.payments.mutations.updateSubscriptionStatus, {
        razorpaySubscriptionId: subId,
        status: "cancelled",
        cancelAtCycleEnd: false,
        endedAt: Date.now(),
      });
    }

    // Downgrade user's plan to Free immediately
    await ctx.runMutation(internal.users.downgradeToFreePlan, {
      userId: user._id,
    });

    return {
      success: true,
      message: "Your Evenza Pro subscription has been cancelled immediately.",
      cancelAtCycleEnd: false,
      status: "cancelled",
    };
  },
});

// -------------------------------------------------------------
// Action: Sync Subscription status directly from Razorpay API
// -------------------------------------------------------------
export const syncSubscriptionStatus = action({
  args: {
    razorpaySubscriptionId: v.string(),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const razorpay = getRazorpayInstance();
    const subData = await razorpay.subscriptions.fetch(args.razorpaySubscriptionId);

    if (!subData) {
      throw new Error("Subscription not found on Razorpay.");
    }

    const statusMap = {
      created: "created",
      authenticated: "authenticated",
      active: "active",
      pending: "pending",
      halted: "halted",
      cancelled: "cancelled",
      completed: "completed",
      expired: "expired",
    };

    const mappedStatus = statusMap[subData.status] || "pending";

    await ctx.runMutation(internal.payments.mutations.updateSubscriptionStatus, {
      razorpaySubscriptionId: args.razorpaySubscriptionId,
      status: mappedStatus,
      currentPeriodStart: subData.current_start ? subData.current_start * 1000 : undefined,
      currentPeriodEnd: subData.current_end ? subData.current_end * 1000 : undefined,
      cancelAtCycleEnd: subData.ended_at ? true : false,
      endedAt: subData.ended_at ? subData.ended_at * 1000 : undefined,
    });

    return { status: mappedStatus, subData };
  },
});
