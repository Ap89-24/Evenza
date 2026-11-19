"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import crypto from "crypto";

// -------------------------------------------------------------
// Action: Process Incoming Razorpay Webhook Event Idempotently
// -------------------------------------------------------------
export const processWebhookEvent = action({
  args: {
    rawBody: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured on the Convex server.");
    }

    // 1. Verify HMAC SHA256 Webhook Signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(args.rawBody)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(args.signature, "utf-8")
    );

    if (!isValid) {
      throw new Error("Invalid Razorpay webhook signature. Request rejected.");
    }

    // 2. Parse Event JSON
    let event;
    try {
      event = JSON.parse(args.rawBody);
    } catch {
      throw new Error("Invalid JSON webhook payload.");
    }

    const eventId = event.id;
    const eventType = event.event;

    if (!eventId || !eventType) {
      throw new Error("Missing event ID or event type in webhook payload.");
    }

    // 3. Idempotency Check: Prevent duplicate webhook processing
    const alreadyProcessed = await ctx.runQuery(
      internal.payments.mutations.getProcessedWebhook,
      { eventId }
    );

    if (alreadyProcessed) {
      return { status: "duplicate_skipped", eventId };
    }

    // Lock event in processedWebhooks
    await ctx.runMutation(internal.payments.mutations.recordProcessedWebhook, {
      eventId,
      eventType,
      status: "processing",
      summary: `Received ${eventType} at ${new Date().toISOString()}`,
    });

    // 4. Handle Specific Razorpay Subscription Events
    const subEntity = event?.payload?.subscription?.entity;
    const paymentEntity = event?.payload?.payment?.entity;

    if (!subEntity || !subEntity.id) {
      // Not a subscription event (ignore ticket or unrelated events)
      return { status: "ignored_non_subscription", eventType };
    }

    const razorpaySubId = subEntity.id;
    const currentPeriodStart = subEntity.current_start ? subEntity.current_start * 1000 : undefined;
    const currentPeriodEnd = subEntity.current_end ? subEntity.current_end * 1000 : undefined;
    const endedAt = subEntity.ended_at ? subEntity.ended_at * 1000 : undefined;

    switch (eventType) {
      case "subscription.authenticated":
        await ctx.runMutation(internal.payments.mutations.updateSubscriptionStatus, {
          razorpaySubscriptionId: razorpaySubId,
          status: "authenticated",
          currentPeriodStart,
          currentPeriodEnd,
        });
        break;

      case "subscription.activated":
        await ctx.runMutation(internal.payments.mutations.updateSubscriptionStatus, {
          razorpaySubscriptionId: razorpaySubId,
          status: "active",
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtCycleEnd: false,
        });
        break;

      case "subscription.charged":
        // Recurring charge succeeded
        await ctx.runMutation(internal.payments.mutations.updateSubscriptionStatus, {
          razorpaySubscriptionId: razorpaySubId,
          status: "active",
          currentPeriodStart,
          currentPeriodEnd,
        });

        // Record the recurring payment if payment entity exists
        if (paymentEntity && paymentEntity.id) {
          const subscription = await ctx.runQuery(
            internal.payments.mutations.getSubscriptionByRazorpayId,
            { razorpaySubscriptionId: razorpaySubId }
          );

          if (subscription) {
            await ctx.runMutation(internal.payments.mutations.recordVerifiedPayment, {
              userId: subscription.userId,
              amount: paymentEntity.amount ? paymentEntity.amount / 100 : 999,
              currency: paymentEntity.currency || "INR",
              status: "succeeded",
              providerPaymentId: paymentEntity.id,
              providerSubscriptionId: razorpaySubId,
              paymentMethod: paymentEntity.method || "card",
              invoiceNumber: paymentEntity.invoice_id,
              billingPeriodStart: currentPeriodStart,
              billingPeriodEnd: currentPeriodEnd,
            });
          }
        }
        break;

      case "subscription.pending":
        // Payment failed or is pending retry
        await ctx.runMutation(internal.payments.mutations.updateSubscriptionStatus, {
          razorpaySubscriptionId: razorpaySubId,
          status: "pending",
        });
        break;

      case "subscription.halted":
        // Retries exhausted, downgrade user to free
        await ctx.runMutation(internal.payments.mutations.updateSubscriptionStatus, {
          razorpaySubscriptionId: razorpaySubId,
          status: "halted",
          endedAt: Date.now(),
        });
        break;

      case "subscription.cancelled":
        // Subscription cancelled
        await ctx.runMutation(internal.payments.mutations.updateSubscriptionStatus, {
          razorpaySubscriptionId: razorpaySubId,
          status: "cancelled",
          cancelAtCycleEnd: true,
          endedAt: endedAt || Date.now(),
        });
        break;

      case "subscription.completed":
        // End of subscription tenure
        await ctx.runMutation(internal.payments.mutations.updateSubscriptionStatus, {
          razorpaySubscriptionId: razorpaySubId,
          status: "completed",
          endedAt: endedAt || Date.now(),
        });
        break;

      default:
        console.log(`Unhandled subscription event: ${eventType}`);
        break;
    }

    return { status: "processed_successfully", eventId, eventType };
  },
});
