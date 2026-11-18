import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

const generateInvoiceNumber = () => {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${Date.now()}-${randomPart}`;
};

// Record a billing plan payment and activate the user's plan atomically
export const recordPlanPayment = mutation({
  args: {
    plan: v.union(v.literal("free"), v.literal("pro")),
    billingCycle: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
    amount: v.number(),
    currency: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("succeeded"),
        v.literal("failed"),
        v.literal("refunded"),
        v.literal("cancelled")
      )
    ),
    paymentProvider: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    providerOrderId: v.optional(v.string()),
    providerPaymentId: v.optional(v.string()),
    providerSubscriptionId: v.optional(v.string()),
    invoiceNumber: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) {
      throw new Error("Authentication required to complete payment");
    }

    if (args.amount < 0) {
      throw new Error("Invalid payment amount");
    }

    const now = Date.now();
    const billingCycle = args.billingCycle || "monthly";
    const status = args.status || "succeeded";
    const durationDays = billingCycle === "yearly" ? 365 : 30;
    const billingPeriodStart = now;
    const billingPeriodEnd = now + durationDays * 24 * 60 * 60 * 1000;
    const invoiceNumber = args.invoiceNumber || generateInvoiceNumber();

    const paymentId = await ctx.db.insert("payments", {
      userId: user._id,
      plan: args.plan,
      billingCycle,
      amount: args.amount,
      currency: args.currency || "INR",
      status,
      paymentProvider: args.paymentProvider || "manual",
      paymentMethod: args.paymentMethod,
      providerOrderId: args.providerOrderId,
      providerPaymentId: args.providerPaymentId,
      providerSubscriptionId: args.providerSubscriptionId,
      invoiceNumber,
      receiptUrl: args.receiptUrl,
      billingPeriodStart,
      billingPeriodEnd,
      failureReason: args.failureReason,
      paidAt: status === "succeeded" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });

    if (status === "succeeded") {
      await ctx.db.patch(user._id, {
        plan: args.plan,
        subscriptionStatus: "active",
        updatedAt: now,
      });
    }

    return {
      success: true,
      paymentId,
      invoiceNumber,
      plan: args.plan,
    };
  },
});

// Fetch billing payment history for the current user
export const getMyPayments = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) {
      return [];
    }

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return payments;
  },
});
