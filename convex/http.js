import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// -------------------------------------------------------------
// POST /razorpay-webhook: Secure Razorpay Webhook Endpoint
// -------------------------------------------------------------
http.route({
  path: "/razorpay-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing x-razorpay-signature header." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const rawBody = await request.text();

    if (!rawBody || rawBody.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Empty webhook payload." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      const result = await ctx.runAction(internal.payments.webhooks.processWebhookEvent, {
        rawBody,
        signature,
      });

      return new Response(JSON.stringify({ received: true, result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Razorpay webhook verification error:", err.message);
      return new Response(
        JSON.stringify({ error: "Webhook verification failed: " + err.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
