"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal, api } from "../_generated/api";
import crypto from "crypto";
import Razorpay from "razorpay";

// -------------------------------------------------------------
// Action: Secure Server-Side Subscription Payment Verification
// -------------------------------------------------------------
export const verifySubscriptionPayment = action({
  args: {
    razorpayPaymentId: v.string(),
    razorpaySubscriptionId: v.string(),
    razorpaySignature: v.string(),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user with Clerk identity or clerkUserId fallback
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
      throw new Error("Authentication required to verify payment.");
    }

    // 2. Verify subscription exists in database and belongs to user
    const subscription = await ctx.runQuery(
      internal.payments.mutations.getSubscriptionByRazorpayId,
      { razorpaySubscriptionId: args.razorpaySubscriptionId }
    );

    if (!subscription || subscription.userId.toString() !== user._id.toString()) {
      throw new Error("Unauthorized: Subscription does not belong to the authenticated user.");
    }

    // 3. HMAC SHA256 Signature Verification
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new Error("Razorpay Key Secret is not configured on the server.");
    }

    const payload = `${args.razorpayPaymentId}|${args.razorpaySubscriptionId}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(args.razorpaySignature, "utf-8")
    );

    if (!isSignatureValid) {
      throw new Error("Invalid Razorpay payment signature. Transaction rejected.");
    }

    // 4. Fetch subscription and payment details from Razorpay to get accurate cycle dates & amount
    let currentPeriodStart = Date.now();
    let currentPeriodEnd = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days default
    let paymentAmount = 1999;
    let paymentCurrency = "INR";
    let paymentMethod = "upi";
    let providerOrderId = undefined;
    let invoiceNumber = undefined;
    let receiptUrl = undefined;
    let paidAt = Date.now();

    try {
      const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

      const subData = await razorpay.subscriptions.fetch(args.razorpaySubscriptionId);
      if (subData && subData.current_start && subData.current_end) {
        currentPeriodStart = subData.current_start * 1000;
        currentPeriodEnd = subData.current_end * 1000;
      }

      if (args.razorpayPaymentId) {
        const paymentData = await razorpay.payments.fetch(args.razorpayPaymentId);
        if (paymentData) {
          paymentAmount = paymentData.amount ? paymentData.amount / 100 : 1999;
          paymentCurrency = paymentData.currency || "INR";
          paymentMethod = paymentData.method || "upi";
          providerOrderId = paymentData.order_id || undefined;
          invoiceNumber = paymentData.invoice_id || subData?.invoice_id || undefined;
          receiptUrl = paymentData.receipt || undefined;
          paidAt = paymentData.created_at ? paymentData.created_at * 1000 : Date.now();
        }
      }
    } catch (apiErr) {
      console.warn("Could not fetch detailed Razorpay payment metadata, using defaults:", apiErr.message);
    }

    // 5. Update subscription to active and upgrade user to Pro in Convex database
    await ctx.runMutation(internal.payments.mutations.updateSubscriptionStatus, {
      razorpaySubscriptionId: args.razorpaySubscriptionId,
      status: "active",
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtCycleEnd: false,
    });

    // 6. Record payment in payments table
    await ctx.runMutation(internal.payments.mutations.recordVerifiedPayment, {
      userId: user._id,
      amount: paymentAmount,
      currency: paymentCurrency,
      status: "succeeded",
      providerPaymentId: args.razorpayPaymentId,
      providerSubscriptionId: args.razorpaySubscriptionId,
      providerOrderId,
      paymentProvider: "razorpay",
      paymentType: "subscription_monthly",
      paymentMethod,
      plan: "pro",
      billingCycle: "monthly",
      invoiceNumber,
      receiptUrl,
      billingPeriodStart: currentPeriodStart,
      billingPeriodEnd: currentPeriodEnd,
      paidAt,
    });

    return {
      success: true,
      plan: "pro",
      subscriptionId: args.razorpaySubscriptionId,
      message: "Evenza Pro monthly subscription activated successfully! All Pro benefits are unlocked.",
    };
  },
});
