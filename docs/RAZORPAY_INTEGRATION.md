# Evenza: Production Razorpay Monthly Subscription & Offline Ticket Payment Architecture

## 1. Architectural Scope & Core Principles

Evenza maintains a strict separation between SaaS subscription billing and event attendee ticket collection:

1. **Razorpay Subscriptions (Strictly Pro Monthly)**:
   - Razorpay is used **EXCLUSIVELY** for Evenza Pro monthly subscriptions (`monthly` billing cycle only).
   - Manages recurring billing, activations, automatic renewals, cancellations, and status synchronization.
   - **Never used for ticket sales, one-time passes, or event booking payments.**

2. **Event Ticket Collection (Strictly Offline Pay-at-Venue)**:
   - Event ticket payments are handled directly and offline between attendees and event organizers at the physical event venue.
   - Evenza never creates Razorpay orders, charges credit cards, or collects fees for event tickets.
   - Organizers use an in-dashboard authorized offline payment recording and correction workflow with an immutable audit trail.

---

## 2. Razorpay Monthly Subscription Setup

### A. Environment Variables
Configure the following environment variables in your Convex deployment:

```bash
# In Convex Dashboard or via Convex CLI
npx convex env set RAZORPAY_KEY_ID "rzp_test_..."
npx convex env set RAZORPAY_KEY_SECRET "your_razorpay_secret"
npx convex env set RAZORPAY_WEBHOOK_SECRET "your_webhook_secret"
npx convex env set RAZORPAY_MONTHLY_PLAN_ID "plan_..."
```

For Production:
```bash
npx convex env set RAZORPAY_KEY_ID "rzp_live_..." --prod
npx convex env set RAZORPAY_KEY_SECRET "your_live_secret" --prod
npx convex env set RAZORPAY_WEBHOOK_SECRET "your_live_webhook_secret" --prod
npx convex env set RAZORPAY_MONTHLY_PLAN_ID "plan_live_..." --prod
```

### B. Creating the Monthly Subscription Plan in Razorpay Dashboard
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Subscriptions** > **Plans** > **Create Plan**.
3. Configure:
   - **Plan Name**: `Evenza Pro Monthly`
   - **Billing Frequency**: `Monthly`
   - **Billing Interval**: `1`
   - **Amount**: `₹1999` (or your configured Pro pricing)
4. Copy the resulting **Plan ID** (e.g., `plan_Nxxxxxxxxxxxxx`) and set it as `RAZORPAY_MONTHLY_PLAN_ID`.

---

## 3. Subscription Lifecycle & Convex Actions

```
[User Clicks Upgrade to Pro]
            │
            ▼
[Convex Node Action: createProSubscription]
  - Verifies Clerk identity
  - Checks duplicate active subscriptions
  - Calls Razorpay SDK: subscriptions.create({ plan_id, total_count: 60 })
  - Inserts record into `subscriptions` table (status: "created")
  - Returns subscriptionId & keyId to frontend
            │
            ▼
[Frontend: Razorpay Checkout Modal]
  - Opens Razorpay modal with `subscription_id`
  - User authorizes recurring payment (Card / UPI Autopay / NetBanking)
            │
            ▼
[Convex Node Action: verifySubscriptionPayment]
  - Verifies HMAC SHA256 signature:
      expected = HMAC_SHA256(paymentId + "|" + subscriptionId, secret)
  - Validates user ownership of subscription
  - Sets subscription status to "active"
  - Upgrades user plan in `users` table to "pro"
  - Records payment in `payments` table
            │
            ▼
[Webhook Synchronization: /razorpay-webhook]
  - Asynchronous event sync for charges, renewals, cancellations & failures
```

### Supported Webhook Events
Convex exposes an HTTP Router endpoint at:
`https://<YOUR_CONVEX_SITE_URL>/razorpay-webhook`

Configured webhook events:
- `subscription.authenticated`: Customer successfully completed 2FA/e-mandate authorization.
- `subscription.activated`: Subscription is active, user granted Pro status.
- `subscription.charged`: Monthly recurring billing cycle charged successfully. Payment recorded in `payments` table.
- `subscription.pending`: Renewal payment attempt failed or is undergoing retry.
- `subscription.halted`: Retries exhausted. User automatically downgraded to Free.
- `subscription.cancelled`: Cancelled by user or merchant. Access preserved until `currentPeriodEnd`.
- `subscription.completed`: All billing cycles ended. User downgraded to Free.

### Idempotency Protection
- All incoming webhook events are checked against the `processedWebhooks` table using `event.id`.
- Duplicate deliveries from Razorpay are acknowledged with HTTP 200 and safely skipped.

---

## 4. Cancellation Flow

Users can manage or cancel their recurring subscription from the **Billing & Plan** page:
1. When a user clicks **Cancel Subscription**, the frontend invokes `api.payments.subscriptions.cancelProSubscription`.
2. The action calls Razorpay with `cancel_at_cycle_end: true`.
3. The subscription status in Convex is updated to `cancelAtCycleEnd = true`.
4. Pro entitlements remain active until the end of the billing period (`currentPeriodEnd`), after which Convex automatically downgrades the user to Free.

---

## 5. Event Ticket Pay-at-Venue Policy

### A. Attendee Discovery & Booking
1. Attendees select a ticket category and quantity (1 to 5) in `RegisterModal`.
2. Evenza registers the booking with:
   - `bookingStatus`: `confirmed`
   - `paymentStatus`: `pay_at_venue` (for paid tickets) or `paid_at_venue` (for free tickets)
   - `amountDue`: `ticketPrice * quantity`
   - `amountPaid`: `0`
3. A booking confirmation is displayed with a QR code and explicit guidance that payment is due offline at the venue.

### B. Organizer Offline Payment Collection
In the Organizer Event Dashboard (`/my-events/[eventId]`):
1. **Attendee List**: Displays attendee booking quantity, ticket tier, amount due, and payment status badges (`✓ Paid at Venue`, `⏳ Pay at Venue`, `✕ Unpaid`).
2. **Mark as Paid**:
   - Organizers click **Mark as Paid** upon receiving money at the venue.
   - A modal allows selecting the payment method (`Cash`, `UPI`, or `Other`), amount collected, and optional receipt notes.
   - The action verifies that the caller is the event organizer or authorized team member.
   - An immutable record is added to the attendee's `paymentHistory` audit trail.
3. **Authorized Correction Workflow**:
   - If an entry was recorded mistakenly or an attendee was refunded at the venue, organizers click **Correct Status**.
   - Requires entering a mandatory reason for auditability.
   - Status is updated and logged in `paymentHistory`.

---

## 6. Security & Audit Verification Checklist

- [x] **Zero Secret Leakage**: `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are strictly accessed inside Convex Node actions.
- [x] **No Ticket Razorpay Calls**: Zero Razorpay orders or checkouts are ever initiated for ticket purchases.
- [x] **Server-Side Pro Verification**: Mutations, queries, and AI route handlers verify Pro status directly against the Convex database.
- [x] **Signature Verification**: Checkout callbacks and webhook payloads use timing-safe HMAC SHA256 verification.
- [x] **Idempotent Webhooks**: All webhook events are logged in `processedWebhooks` to reject duplicate deliveries.
