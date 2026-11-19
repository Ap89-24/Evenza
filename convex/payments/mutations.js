import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "../_generated/server";

// -----------------------------------------------------------------
// 1. Get user active subscription
// -----------------------------------------------------------------
export const getUserActiveSubscription = query({
  args: { clerkUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let user = null;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
    }

    if (!user && args?.clerkUserId) {
      const users = await ctx.db.query("users").collect();
      user = users.find(
        (u) =>
          u.tokenIdentifier.endsWith(args.clerkUserId) ||
          u.tokenIdentifier === args.clerkUserId
      );
    }

    if (!user) return null;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "authenticated"),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    return subscription || null;
  },
});

// -----------------------------------------------------------------
// 2. Get user billing & payment history
// -----------------------------------------------------------------
export const getUserBillingHistory = query({
  args: { clerkUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let user = null;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
    }

    if (!user && args?.clerkUserId) {
      const users = await ctx.db.query("users").collect();
      user = users.find(
        (u) =>
          u.tokenIdentifier.endsWith(args.clerkUserId) ||
          u.tokenIdentifier === args.clerkUserId
      );
    }

    if (!user) return [];

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return payments.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// -----------------------------------------------------------------
// 3. Internal Mutation: Save newly created subscription
// -----------------------------------------------------------------
export const saveNewSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    clerkUserId: v.string(),
    razorpaySubscriptionId: v.string(),
    razorpayPlanId: v.string(),
    razorpayCustomerId: v.optional(v.string()),
    status: v.union(
      v.literal("created"),
      v.literal("authenticated"),
      v.literal("active"),
      v.literal("pending"),
      v.literal("halted"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("expired")
    ),
    cancelAtCycleEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscription_id", (q) =>
        q.eq("razorpaySubscriptionId", args.razorpaySubscriptionId)
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("subscriptions", {
      userId: args.userId,
      clerkUserId: args.clerkUserId,
      razorpaySubscriptionId: args.razorpaySubscriptionId,
      razorpayPlanId: args.razorpayPlanId,
      razorpayCustomerId: args.razorpayCustomerId,
      billingCycle: "monthly",
      status: args.status,
      cancelAtCycleEnd: args.cancelAtCycleEnd,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// -----------------------------------------------------------------
// 4. Internal Mutation: Update subscription & user entitlement
// -----------------------------------------------------------------
export const updateSubscriptionStatus = internalMutation({
  args: {
    razorpaySubscriptionId: v.string(),
    status: v.union(
      v.literal("created"),
      v.literal("authenticated"),
      v.literal("active"),
      v.literal("pending"),
      v.literal("halted"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("expired")
    ),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtCycleEnd: v.optional(v.boolean()),
    endedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscription_id", (q) =>
        q.eq("razorpaySubscriptionId", args.razorpaySubscriptionId)
      )
      .unique();

    if (!sub) return null;

    const now = Date.now();
    const patchData = {
      status: args.status,
      updatedAt: now,
    };

    if (args.currentPeriodStart !== undefined) patchData.currentPeriodStart = args.currentPeriodStart;
    if (args.currentPeriodEnd !== undefined) patchData.currentPeriodEnd = args.currentPeriodEnd;
    if (args.cancelAtCycleEnd !== undefined) patchData.cancelAtCycleEnd = args.cancelAtCycleEnd;
    if (args.endedAt !== undefined) patchData.endedAt = args.endedAt;

    await ctx.db.patch(sub._id, patchData);

    // Sync user plan based on subscription status
    const shouldBePro = args.status === "active" || args.status === "authenticated";
    const userPlan = shouldBePro ? "pro" : "free";
    const subStatus =
      args.status === "active"
        ? "active"
        : args.status === "cancelled"
        ? "cancelled"
        : args.status === "pending" || args.status === "halted"
        ? "past_due"
        : "inactive";

    await ctx.db.patch(sub.userId, {
      plan: userPlan,
      subscriptionStatus: subStatus,
      updatedAt: now,
    });

    return { subscriptionId: sub._id, userId: sub.userId, plan: userPlan };
  },
});

// -------------------------------------------------------------
// 5. Internal Mutation: Record verified subscription payment
// -------------------------------------------------------------
export const recordVerifiedPayment = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("refunded"),
      v.literal("cancelled")
    ),
    providerPaymentId: v.string(),
    providerSubscriptionId: v.string(),
    providerOrderId: v.optional(v.string()),
    paymentProvider: v.optional(v.string()),
    paymentType: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
    billingCycle: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
    invoiceNumber: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    billingPeriodStart: v.optional(v.number()),
    billingPeriodEnd: v.optional(v.number()),
    failureReason: v.optional(v.string()),
    paidAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if payment already recorded (idempotency)
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_provider_payment", (q) =>
        q.eq("providerPaymentId", args.providerPaymentId)
      )
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        paymentMethod: args.paymentMethod || existing.paymentMethod,
        invoiceNumber: args.invoiceNumber || existing.invoiceNumber,
        receiptUrl: args.receiptUrl || existing.receiptUrl,
        billingPeriodStart: args.billingPeriodStart || existing.billingPeriodStart,
        billingPeriodEnd: args.billingPeriodEnd || existing.billingPeriodEnd,
        paidAt: args.status === "succeeded" ? (args.paidAt || now) : undefined,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("payments", {
      userId: args.userId,
      plan: args.plan || "pro",
      billingCycle: args.billingCycle || "monthly",
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      paymentProvider: args.paymentProvider || "razorpay",
      paymentType: args.paymentType || "subscription_monthly",
      paymentMethod: args.paymentMethod || "card",
      providerOrderId: args.providerOrderId,
      providerPaymentId: args.providerPaymentId,
      providerSubscriptionId: args.providerSubscriptionId,
      invoiceNumber: args.invoiceNumber,
      receiptUrl: args.receiptUrl,
      billingPeriodStart: args.billingPeriodStart,
      billingPeriodEnd: args.billingPeriodEnd,
      failureReason: args.failureReason,
      paidAt: args.status === "succeeded" ? (args.paidAt || now) : undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// -----------------------------------------------------------------
// 6. Internal Query: Get processed webhook by ID
// -----------------------------------------------------------------
export const getProcessedWebhook = internalQuery({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("processedWebhooks")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .unique();
  },
});

// -----------------------------------------------------------------
// 7. Internal Mutation: Record processed webhook (idempotency lock)
// -----------------------------------------------------------------
export const recordProcessedWebhook = internalMutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    status: v.string(),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("processedWebhooks", {
      eventId: args.eventId,
      eventType: args.eventType,
      processedAt: Date.now(),
      status: args.status,
      summary: args.summary,
    });
  },
});

// -----------------------------------------------------------------
// 8. Internal Query: Find user by ID or Token
// -----------------------------------------------------------------
export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getUserByToken = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
  },
});

export const getSubscriptionByRazorpayId = internalQuery({
  args: { razorpaySubscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_subscription_id", (q) =>
        q.eq("razorpaySubscriptionId", args.razorpaySubscriptionId)
      )
      .unique();
  },
});

// Helper Mutation: Cancel any pending/test subscription immediately
export const cancelStuckSubscription = mutation({
  args: { razorpaySubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscription_id", (q) =>
        q.eq("razorpaySubscriptionId", args.razorpaySubscriptionId)
      )
      .unique();

    if (sub) {
      await ctx.db.patch(sub._id, {
        status: "cancelled",
        cancelAtCycleEnd: false,
        endedAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.patch(sub.userId, {
        plan: "free",
        subscriptionStatus: "cancelled",
        updatedAt: Date.now(),
      });

      return { success: true, message: "Subscription cancelled immediately and user downgraded to Free" };
    }

    return { success: false, message: "Subscription not found" };
  },
});

// Helper Mutation: Insert or backfill a verified payment
export const insertManualPayment = mutation({
  args: {
    userId: v.id("users"),
    providerPaymentId: v.string(),
    providerSubscriptionId: v.string(),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.string(),
    billingPeriodStart: v.optional(v.number()),
    billingPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("payments")
      .withIndex("by_provider_payment", (q) =>
        q.eq("providerPaymentId", args.providerPaymentId)
      )
      .unique();

    const now = Date.now();
    if (existing) return existing._id;

    return await ctx.db.insert("payments", {
      userId: args.userId,
      plan: "pro",
      billingCycle: "monthly",
      amount: args.amount,
      currency: args.currency,
      status: "succeeded",
      paymentProvider: "razorpay",
      paymentType: "subscription_monthly",
      paymentMethod: args.paymentMethod,
      providerPaymentId: args.providerPaymentId,
      providerSubscriptionId: args.providerSubscriptionId,
      billingPeriodStart: args.billingPeriodStart,
      billingPeriodEnd: args.billingPeriodEnd,
      paidAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});
