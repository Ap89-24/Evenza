import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {  internal } from "./_generated/api";


const generateQRCode = () => {
    return `EVT-${Date.now()}-${Math.random().toString(36).substr(2,9).toUpperCase()}`;
}

export const registerForEvent = mutation({
    args: {
        eventId: v.id("events"),
        attendeeName: v.string(),
        attendeeEmail: v.string(),
        ticketTypeId: v.optional(v.string()),
        ticketTypeName: v.optional(v.string()),
        ticketQuantity: v.optional(v.number()),
    },

    handler: async(ctx , args) => {
        const user = await ctx.runQuery(internal.users.getCurrentUser);
        if (!user) {
            throw new Error("Authentication required to register for an event");
        }

        const event = await ctx.db.get(args.eventId);
        if(!event){
            throw new Error("Event not found...");
        }

        // Fetch organizer to check plan entitlement limit
        const organizer = await ctx.db.get(event.organizerId);
        const organizerPlan = organizer?.plan || "free";
        const maxAttendeeLimit = organizerPlan === "pro" ? 1000 : 50;

        // Check if event capacity or plan attendee limit is reached
        if (event.registrationCount >= event.capacity || event.registrationCount >= maxAttendeeLimit) {
            throw new Error("This event has reached its attendee limit. Upgrade to Pro for up to 1,000 attendees per event.");
        }
  
        // Check for existing user in the event
        const existingUser = await ctx.db
            .query("registrations")
            .withIndex("by_event_user" , (q) =>
                q.eq("eventId" , args.eventId).eq("userId" , user._id)
            )
            .unique();

        if(existingUser && existingUser.status === "registered"){
            throw new Error("You are already registered for this event...");
        };

        // Determine price & offline payment expectations (Zero Razorpay for Tickets)
        let unitPrice = 0;
        if (event.ticketType === "paid") {
            if (args.ticketTypeId && event.tickets) {
                const foundTier = event.tickets.find((t) => t.id === args.ticketTypeId);
                unitPrice = foundTier ? foundTier.price : (event.ticketPrice || 0);
            } else {
                unitPrice = event.ticketPrice || 0;
            }
        }

        const quantity = args.ticketQuantity || 1;
        const amountDue = unitPrice * quantity;
        const initialPaymentStatus = event.ticketType === "paid" ? "pay_at_venue" : "paid_at_venue";
        
        const qrCode = generateQRCode();
        const registrationId = await ctx.db.insert("registrations" , {
            eventId: args.eventId,
            userId: user._id,
            attendeeName: args.attendeeName,
            attendeeEmail: args.attendeeEmail,
            qrCode: qrCode,
            checkedIn: false,
            status: "registered",
            registeredAt: Date.now(),
            ticketTypeId: args.ticketTypeId,
            ticketTypeName: args.ticketTypeName,
            ticketQuantity: quantity,
            bookingStatus: "confirmed",
            paymentStatus: initialPaymentStatus,
            amountDue: amountDue,
            amountPaid: 0,
            paymentHistory: [
                {
                    status: initialPaymentStatus,
                    timestamp: Date.now(),
                    recordedBy: "Evenza Booking System (Pay-At-Venue Policy)",
                    amount: 0,
                    note: event.ticketType === "paid"
                        ? `Booking confirmed for ${quantity} ticket(s). ₹${amountDue} due offline directly to organizer at venue.`
                        : "Free event ticket confirmed.",
                }
            ],
        })

        // Update the event Registration count
        await ctx.db.patch(args.eventId , {
            registrationCount: event.registrationCount + 1,
        });

        return registrationId;
    },
})

export const joinWaitlist = mutation({
    args: {
        eventId: v.id("events"),
        name: v.string(),
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");

        const currentWaitlist = event.waitlist || [];
        if (currentWaitlist.some(w => w.email.toLowerCase() === args.email.toLowerCase())) {
            return { success: true, message: "You are already on the waitlist for this event." };
        }

        const updatedWaitlist = [
            ...currentWaitlist,
            { name: args.name, email: args.email, joinedAt: Date.now() },
        ];

        await ctx.db.patch(args.eventId, { waitlist: updatedWaitlist });
        return { success: true, message: "Successfully joined waitlist! We will notify you if a slot opens." };
    },
});

//Check if user is registered for a event or not.....
export const checkRegistration = query({
    args: {
        eventId: v.id("events"),
    },
    handler: async(ctx , args) => {
       const user = await ctx.runQuery(internal.users.getCurrentUser);
       if (!user) return null;
       
       const registration = await ctx.db
       .query("registrations")
       .withIndex("by_event_user" , (q) => 
            q.eq("eventId" , args.eventId).eq("userId" , user._id)
       )
       .unique();

       if (!registration || registration.status !== "registered") {
           return null;
       }

       return registration;
    },
});

export  const getMyRegistrations = query({
    handler: async(ctx) => {
        const user = await ctx.runQuery(internal.users.getCurrentUser);

        if (!user) {
            return [];
        }
        const registrations = await ctx.db
          .query("registrations")
          .withIndex("by_user" , (q) => q.eq("userId" , user._id))
          .order("desc")
          .collect();

        const activeRegistrations = registrations.filter(reg => reg.status === "registered");

        const registrationWithEvent = await Promise.all(
            activeRegistrations.map(async (reg) => {
                const event = await ctx.db.get(reg.eventId);
                return {...reg , event};
            })
        );
        
        return  registrationWithEvent.filter(item => item.event !== null);
    },
});

export const deleteRegistration = mutation({
    args: {
        registrationId: v.id("registrations")
    },

    handler: async(ctx , args) => {
        const user = await ctx.runQuery(internal.users.getCurrentUser);

        const registration = await ctx.db.get(args.registrationId);
        if (!registration) {
            throw new Error("Registration not found");
        };

        if(registration.userId !== user?._id){
            throw new Error("You can only cancel your own registration");
        };

        const event = await ctx.db.get(registration.eventId);
        if (!event) {
            throw new Error("Event not found");
        };

        //Update registration status
        await ctx.db.patch(args.registrationId , {
            status: "cancelled",
        });
        
        //Decrement in registration count....
        if(event.registrationCount > 0){
            await ctx.db.patch(registration.eventId , {
                registrationCount: event.registrationCount - 1,
            });
        };

        return {success: true};
    },
})

export const checkInAttendee = mutation({
    args: {
        qrCode: v.string(),
        eventId: v.optional(v.id("events")),
        clerkUserId: v.optional(v.string()),
        markAsPaid: v.optional(v.boolean()),
        amountPaid: v.optional(v.number()),
        paymentMethod: v.optional(v.union(v.literal("cash"), v.literal("upi"), v.literal("other"))),
        paymentNotes: v.optional(v.string()),
    },
    handler: async(ctx , args) => {
        let user = await ctx.runQuery(
            internal.users.getCurrentUser,
            args.clerkUserId ? { clerkUserId: args.clerkUserId } : {}
        );
        if (!user && args.clerkUserId) {
            user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
                .unique();
        }
        if (!user) {
            throw new Error("Authentication required to check in attendees.");
        }

        const registration = await ctx.db
           .query("registrations")
           .withIndex("by_qrCode" , (q) => q.eq("qrCode" , args.qrCode.trim()))
           .unique();

        if(!registration){
            throw new Error(`Invalid QR code / Ticket ID: "${args.qrCode}". No registration found.`);
        }

        const event = await ctx.db.get(registration.eventId);
        if(!event){
            throw new Error("Event not found for this ticket.");
        }

        if (args.eventId && registration.eventId.toString() !== args.eventId.toString()) {
            throw new Error(`This ticket is for a different event ("${event.title}"). Cannot check in here.`);
        }

        //* Check if the user is the organizer or authorized team member of the event...
        const organizer = await ctx.db.get(event.organizerId);
        const isOwner = event.organizerId.toString() === user._id.toString();
        const isTeamMember = organizer?.teamMembers?.some(
            (m) => m.email.toLowerCase() === user.email.toLowerCase()
        );

        if (!isOwner && !isTeamMember) {
            throw new Error("You are not authorized to check in attendees for this event.");
        }

        if (registration.status === "cancelled" || registration.bookingStatus === "cancelled") {
            return {
                success: false,
                isCancelled: true,
                message: `This registration was cancelled and cannot be admitted.`,
                registration,
                event: { title: event.title },
            };
        }
         
        if(registration.checkedIn){
            return {
                success: false,
                alreadyCheckedIn: true,
                checkedInAt: registration.checkedInAt,
                message: `Attendee ${registration.attendeeName} was ALREADY checked in!`,
                registration,
                event: { title: event.title, startDate: event.startDate },
            };
        }

        const patchData = {
            checkedIn: true,
            checkedInAt: Date.now(),
            bookingStatus: "attended",
        };

        let paymentRecorded = false;
        if (args.markAsPaid) {
            const amount = typeof args.amountPaid === "number" ? args.amountPaid : (registration.amountDue || 0);
            const method = args.paymentMethod || "cash";
            const currentHistory = registration.paymentHistory || [];

            patchData.paymentStatus = "paid_at_venue";
            patchData.amountPaid = amount;
            patchData.paidAtVenueTime = Date.now();
            patchData.paymentMethodOffline = method;
            patchData.collectedByUserId = user._id;
            patchData.collectedByName = user.name || "Organizer";
            patchData.paymentNotes = args.paymentNotes || "Offline payment received at venue gate during check-in.";
            patchData.paymentHistory = [
                ...currentHistory,
                {
                    status: "paid_at_venue",
                    timestamp: Date.now(),
                    recordedBy: user.name || "Organizer",
                    amount: amount,
                    method: method,
                    note: args.paymentNotes || "Offline payment collected at venue gate via QR check-in.",
                },
            ];
            paymentRecorded = true;
        }

        await ctx.db.patch(registration._id , patchData);

        return {
            success: true,
            message: `${registration.attendeeName} checked in successfully!`,
            paymentRecorded,
            registration: {...registration , ...patchData },
            event: { title: event.title, startDate: event.startDate },
        };
    }
})

// Quick Lookup ticket details by QR code or Ticket ID
export const getTicketDetailsByQR = query({
    args: {
        qrCode: v.string(),
        eventId: v.optional(v.id("events")),
        clerkUserId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (!args.qrCode || !args.qrCode.trim()) return null;

        let user = await ctx.runQuery(
            internal.users.getCurrentUser,
            args.clerkUserId ? { clerkUserId: args.clerkUserId } : {}
        );
        if (!user && args.clerkUserId) {
            user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
                .unique();
        }

        const registration = await ctx.db
            .query("registrations")
            .withIndex("by_qrCode", (q) => q.eq("qrCode", args.qrCode.trim()))
            .unique();

        if (!registration) {
            return { found: false, message: `Ticket "${args.qrCode}" not found.` };
        }

        const event = await ctx.db.get(registration.eventId);
        if (!event) {
            return { found: false, message: "Associated event not found." };
        }

        const isEventMatch = !args.eventId || registration.eventId.toString() === args.eventId.toString();

        return {
            found: true,
            isEventMatch,
            registration,
            event: {
                _id: event._id,
                title: event.title,
                startDate: event.startDate,
                city: event.city,
            },
        };
    },
});

export const getEventRegistrations = query({
    args: { 
        eventId: v.id("events"),
        clerkUserId: v.optional(v.string()),
    },
    handler: async(ctx , args) => {
        let user = await ctx.runQuery(
            internal.users.getCurrentUser,
            args.clerkUserId ? { clerkUserId: args.clerkUserId } : {}
        );
        if (!user && args.clerkUserId) {
            user = await ctx.db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
                .unique();
        }

        if(!user) {
            return [];
        }

        const event = await ctx.db.get(args.eventId);

        if(!event){
            return [];
        }

        //* Check if the user is the organizer or authorized team member of the event...
        const organizer = await ctx.db.get(event.organizerId);
        const isOwner = event.organizerId.toString() === user._id.toString();
        const isTeamMember = organizer?.teamMembers?.some(
            (m) => m.email.toLowerCase() === user.email.toLowerCase()
        );

        if (!isOwner && !isTeamMember) {
            return [];
        }

        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event" , (q) => q.eq("eventId" , args.eventId))
            .collect();

        return registrations;
    }
})

// -------------------------------------------------------------
// Offline Ticket Payment Collection Mutations (Zero Razorpay for Tickets)
// -------------------------------------------------------------

export const markTicketAsPaidAtVenue = mutation({
  args: {
    registrationId: v.id("registrations"),
    amountPaid: v.number(),
    paymentMethod: v.union(v.literal("cash"), v.literal("upi"), v.literal("other")),
    paymentNotes: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await ctx.runQuery(
        internal.users.getCurrentUser,
        args.clerkUserId ? { clerkUserId: args.clerkUserId } : {}
    );
    if (!user && args.clerkUserId) {
        user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
            .unique();
    }
    if (!user) throw new Error("Authentication required.");

    const registration = await ctx.db.get(args.registrationId);
    if (!registration) throw new Error("Registration not found.");

    const event = await ctx.db.get(registration.eventId);
    if (!event) throw new Error("Event not found.");

    // Verify organizer or authorized team member
    const organizer = await ctx.db.get(event.organizerId);
    const isOwner = event.organizerId.toString() === user._id.toString();
    const isTeamMember = organizer?.teamMembers?.some(
      (m) => m.email.toLowerCase() === user.email.toLowerCase()
    );

    if (!isOwner && !isTeamMember) {
      throw new Error("Unauthorized: Only the event organizer or authorized team can collect ticket payments.");
    }

    const currentHistory = registration.paymentHistory || [];
    const updatedHistory = [
      ...currentHistory,
      {
        status: "paid_at_venue",
        timestamp: Date.now(),
        recordedBy: user.name || "Organizer",
        amount: args.amountPaid,
        method: args.paymentMethod,
        note: args.paymentNotes || "Offline ticket payment received at venue.",
      },
    ];

    await ctx.db.patch(registration._id, {
      paymentStatus: "paid_at_venue",
      amountPaid: args.amountPaid,
      paidAtVenueTime: Date.now(),
      paymentMethodOffline: args.paymentMethod,
      collectedByUserId: user._id,
      collectedByName: user.name || "Organizer",
      paymentNotes: args.paymentNotes,
      paymentHistory: updatedHistory,
    });

    return { success: true, message: "Offline ticket payment recorded successfully!" };
  },
});

export const correctTicketPaymentStatus = mutation({
  args: {
    registrationId: v.id("registrations"),
    newStatus: v.union(v.literal("unpaid"), v.literal("pay_at_venue"), v.literal("refunded")),
    reason: v.string(),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await ctx.runQuery(
        internal.users.getCurrentUser,
        args.clerkUserId ? { clerkUserId: args.clerkUserId } : {}
    );
    if (!user && args.clerkUserId) {
        user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", args.clerkUserId))
            .unique();
    }
    if (!user) throw new Error("Authentication required.");

    const registration = await ctx.db.get(args.registrationId);
    if (!registration) throw new Error("Registration not found.");

    const event = await ctx.db.get(registration.eventId);
    if (!event) throw new Error("Event not found.");

    // Verify organizer or team member
    const organizer = await ctx.db.get(event.organizerId);
    const isOwner = event.organizerId.toString() === user._id.toString();
    const isTeamMember = organizer?.teamMembers?.some(
      (m) => m.email.toLowerCase() === user.email.toLowerCase()
    );

    if (!isOwner && !isTeamMember) {
      throw new Error("Unauthorized: Only the event organizer can modify ticket payment records.");
    }

    const currentHistory = registration.paymentHistory || [];
    const updatedHistory = [
      ...currentHistory,
      {
        status: args.newStatus,
        timestamp: Date.now(),
        recordedBy: user.name || "Organizer",
        amount: args.newStatus === "refunded" ? registration.amountPaid : 0,
        note: `Payment Status Correction: ${args.reason}`,
      },
    ];

    await ctx.db.patch(registration._id, {
      paymentStatus: args.newStatus,
      amountPaid: args.newStatus === "paid_at_venue" ? registration.amountPaid : 0,
      paymentHistory: updatedHistory,
    });

    return { success: true, message: `Ticket payment status corrected to ${args.newStatus}.` };
  },
});

