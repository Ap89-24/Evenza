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
    args: {qrCode: v.string()},
    handler: async(ctx , args) => {
        const user = await ctx.runQuery(internal.users.getCurrentUser);

        const registration = await ctx.db
           .query("registrations")
           .withIndex("by_qrCode" , (q) => q.eq("qrCode" , args.qrCode))
           .unique();

           if(!registration){
            throw new Error("Invalid QR Code...");
           };

           const event = await ctx.db.get(registration.eventId);

           if(!event){
            throw new Error("Event not found...");
           };

           //* Check if the user is the organizer or authorized team member of the event...
           const organizer = await ctx.db.get(event.organizerId);
           const isOwner = event.organizerId.toString() === user._id.toString();
           const isTeamMember = organizer?.teamMembers?.some(
               (m) => m.email.toLowerCase() === user.email.toLowerCase()
           );

           if (!isOwner && !isTeamMember) {
                throw new Error("You are not authorized to check in attendees for this event.");
           };
         
         if(registration.checkedIn){
            return {
                success: false,
                message: "Attendee already checked in",
                registration,
            }
         };

         await ctx.db.patch(registration._id , {
            checkedIn: true,
            checkedInAt: Date.now(),
         });

         return {
            success: true,
            message: "Attendee checked in successfully",
            registration: {...registration , checkedIn: true , checkedInAt: Date.now()},
         };
    }
})

export const getEventRegistrations = query({
    args: { eventId: v.id("events") },
    handler: async(ctx , args) => {
        const user = await ctx.runQuery(internal.users.getCurrentUser);

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

