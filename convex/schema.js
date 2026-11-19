import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";





export default defineSchema({
    //Users table
    users: defineTable({
          name: v.string(),
          tokenIdentifier: v.string(),   //clerk ID fro authentication
            email: v.string(),
            profileImageUrl: v.optional(v.string()),

            //Onboarding fields
            hasCompletedOnboarding: v.boolean(),

            //Location fields
            location: v.optional(
                v.object({
                    city: v.string(),
                    state: v.optional(v.string()),
                    country: v.optional(v.string()),
                })
            ),

            //Interest fields
            interests: v.optional(v.array(v.string())),

            //Organizer tracking 
            freeEventsCreated: v.number(),

            // Plan Entitlements (FREE / PRO)
            plan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
            subscriptionStatus: v.optional(
              v.union(
                v.literal("active"),
                v.literal("inactive"),
                v.literal("cancelled"),
                v.literal("past_due")
              )
            ),
            customDomain: v.optional(v.string()),
            teamMembers: v.optional(
              v.array(
                v.object({
                  email: v.string(),
                  name: v.optional(v.string()),
                  addedAt: v.number(),
                })
              )
            ),

            createdAt: v.number(),
            updatedAt: v.number(),
    }).index("by_token", ["tokenIdentifier"]),

    ///Events Table...
    events: defineTable({
        title: v.string(),
        description: v.string(),
        slug: v.string(),

        //Organizer reference
        organizerId: v.id("users"),
        organizerName: v.string(),

        //Events details..
        category: v.string(),
        tags: v.array(v.string()),

        //Date and Time...
        startDate: v.number(),
        endDate: v.number(),
        timezone: v.string(),

        //Location..
        locationtype:  v.union(v.literal("physical"), v.literal("online")),
        venue: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.string(),
        state: v.optional(v.string()),
        country: v.optional(v.string()),

        //Capacity and tickets..
        capacity: v.number(),
        ticketType: v.union(v.literal("free"), v.literal("paid")),
        ticketPrice: v.optional(v.number()),  //Paid at event offline
        registrationCount: v.number(),

        // Multiple Ticket Types (Pro Feature)
        tickets: v.optional(
          v.array(
            v.object({
              id: v.string(),
              name: v.string(),
              price: v.number(),
              capacity: v.number(),
              description: v.optional(v.string()),
            })
          )
        ),

        // Custom Branding (Pro Feature)
        customBranding: v.optional(
          v.object({
            logoUrl: v.optional(v.string()),
            brandColor: v.optional(v.string()),
            removePlatformBranding: v.optional(v.boolean()),
          })
        ),

        // Custom Domain (Pro Feature)
        customDomain: v.optional(v.string()),

        // Waitlist
        waitlist: v.optional(
          v.array(
            v.object({
              name: v.string(),
              email: v.string(),
              joinedAt: v.number(),
            })
          )
        ),

        //Customization...
        coverImage: v.optional(v.string()),
        themeColor: v.optional(v.string()),

        //Timestamps
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index("by_organizer", ["organizerId"])
      .index("by_category", ["category"])
      .index("by_start_date" , ["startDate"])
      .index("by_slug", ["slug"])
      .searchIndex("search_tittle" , {searchField: "title"}),

    //Registrations Table...
    registrations: defineTable({
        //id of the event..
        eventId: v.id("events"),
        //id of the user..
        userId: v.id("users"),

        //Attendee details..
        attendeeName: v.string(),
        attendeeEmail: v.string(),

        //QR Code Information
        qrCode: v.string(),  //unique id for qr code generation

        //Check-in status...
        checkedIn: v.boolean(),
        checkedInAt: v.optional(v.number()),

        //Status....
        status: v.union(v.literal("registered"), v.literal("cancelled")),
        registeredAt: v.number(),

        // Ticket tier reference if multiple tickets selected
        ticketTypeId: v.optional(v.string()),
        ticketTypeName: v.optional(v.string()),

        // Offline Pay-at-Venue Fields (Zero Razorpay for Tickets)
        ticketQuantity: v.optional(v.number()),
        bookingStatus: v.optional(
          v.union(
            v.literal("reserved"),
            v.literal("confirmed"),
            v.literal("cancelled"),
            v.literal("attended")
          )
        ),
        paymentStatus: v.optional(
          v.union(
            v.literal("pay_at_venue"),
            v.literal("paid_at_venue"),
            v.literal("unpaid"),
            v.literal("refunded")
          )
        ),
        amountDue: v.optional(v.number()),
        amountPaid: v.optional(v.number()),
        paidAtVenueTime: v.optional(v.number()),
        paymentMethodOffline: v.optional(
          v.union(v.literal("cash"), v.literal("upi"), v.literal("other"))
        ),
        collectedByUserId: v.optional(v.id("users")),
        collectedByName: v.optional(v.string()),
        paymentNotes: v.optional(v.string()),
        paymentHistory: v.optional(
          v.array(
            v.object({
              status: v.string(),
              timestamp: v.number(),
              recordedBy: v.string(),
              amount: v.optional(v.number()),
              method: v.optional(v.string()),
              note: v.optional(v.string()),
            })
          )
        ),
    })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_event_user", ["eventId", "userId"])
    .index("by_qrCode", ["qrCode"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_event_payment_status", ["eventId", "paymentStatus"]),

    // Organizer Followers Table
    organizerFollowers: defineTable({
        organizerId: v.id("users"),
        followerUserId: v.id("users"),
        createdAt: v.number(),
    })
    .index("by_organizer", ["organizerId"])
    .index("by_follower", ["followerUserId"])
    .index("by_organizer_follower", ["organizerId", "followerUserId"]),

    // Billing Plan Payments Table
    payments: defineTable({
        // User reference
        userId: v.id("users"),

        // Billing plan & amount details
        plan: v.union(v.literal("free"), v.literal("pro")),
        billingCycle: v.union(v.literal("monthly"), v.literal("yearly")),
        amount: v.number(),
        currency: v.string(), // e.g., "INR", "USD"

        // Payment status
        status: v.union(
            v.literal("pending"),
            v.literal("succeeded"),
            v.literal("failed"),
            v.literal("refunded"),
            v.literal("cancelled")
        ),

        // Payment gateway / provider metadata
        paymentProvider: v.optional(v.string()), // e.g., "razorpay", "stripe", "manual"
        paymentType: v.optional(v.string()),     // e.g., "subscription_monthly"
        paymentMethod: v.optional(v.string()),   // e.g., "card", "upi", "netbanking"
        providerOrderId: v.optional(v.string()),
        providerPaymentId: v.optional(v.string()),
        providerSubscriptionId: v.optional(v.string()),
        invoiceNumber: v.optional(v.string()),
        receiptUrl: v.optional(v.string()),

        // Billing period covered by this payment
        billingPeriodStart: v.optional(v.number()),
        billingPeriodEnd: v.optional(v.number()),

        // Failure / refund tracking
        failureReason: v.optional(v.string()),
        refundedAt: v.optional(v.number()),

        // Timestamps
        paidAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_provider_order", ["providerOrderId"])
    .index("by_provider_payment", ["providerPaymentId"])
    .index("by_provider_subscription", ["providerSubscriptionId"]),

    // Evenza Pro Monthly Recurring Subscriptions Table
    subscriptions: defineTable({
        userId: v.id("users"),
        clerkUserId: v.string(),
        razorpaySubscriptionId: v.string(),
        razorpayPlanId: v.string(),
        razorpayCustomerId: v.optional(v.string()),
        billingCycle: v.literal("monthly"), // ONLY monthly subscriptions permitted
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
        cancelAtCycleEnd: v.boolean(),
        endedAt: v.optional(v.number()),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
    .index("by_user", ["userId"])
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_subscription_id", ["razorpaySubscriptionId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

    // Processed Webhooks Table for Idempotent Delivery
    processedWebhooks: defineTable({
        eventId: v.string(),
        eventType: v.string(),
        processedAt: v.number(),
        status: v.string(),
        summary: v.optional(v.string()),
    })
    .index("by_event_id", ["eventId"]),
})