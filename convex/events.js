import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";


// TODO:Create event function arr not working with free ticketType only works with paid one only.I need to fix them later...


//Create events.....
export const createEvent = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        category: v.string(),
        tags: v.array(v.string()),

        startDate: v.number(),
        endDate: v.number(),
        timezone: v.string(),

        locationtype: v.union(v.literal("physical") , v.literal("online")),
        venue: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.string(),
        state: v.optional(v.string()),
        country: v.string(),

        capacity: v.number(),
        ticketType: v.union(v.literal("free") , v.literal("paid")),
        ticketPrice: v.optional(v.number()),
        coverImage: v.optional(v.string()),
        themeColor: v.optional(v.string()),

        // Pro Features
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
        customBranding: v.optional(
          v.object({
            logoUrl: v.optional(v.string()),
            brandColor: v.optional(v.string()),
            removePlatformBranding: v.optional(v.boolean()),
          })
        ),
        customDomain: v.optional(v.string()),
    },

    handler: async (ctx , args) => {
        try {
            const user = await ctx.runQuery(internal.users.getCurrentUser);
            if (!user) {
                throw new Error("Authentication required to create an event");
            }

            const isPro = user.plan === "pro";

            // SERVER-SIDE CHECK: Event creation limit for Free users (1 event limit)
            if (!isPro) {
                const userEvents = await ctx.db
                    .query("events")
                    .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
                    .collect();

                if (userEvents.length >= 1 || user.freeEventsCreated >= 1) {
                    throw new Error(
                        "You've reached your Free plan limit. Free includes 1 event. Upgrade to Pro to create unlimited events."
                    );
                }

                // Enforce 50 attendee limit for Free organizers
                if (args.capacity > 50) {
                    throw new Error(
                        "Free plan supports up to 50 attendees per event. Upgrade to Pro for up to 1,000 attendees."
                    );
                }

                // Enforce single ticket type for Free organizers
                if (args.tickets && args.tickets.length > 1) {
                    throw new Error(
                        "Multiple ticket types are available with Pro. Upgrade to Pro to create custom ticket tiers."
                    );
                }

                // Enforce default theme color and platform branding for Free organizers
                const defaultColor = "#1e3a8a";
                if (args.themeColor && args.themeColor !== defaultColor) {
                    throw new Error(
                        "Custom theme colors are available with Pro. Upgrade to Pro to customize event branding."
                    );
                }
            }

            // Generate slug from title
            const slug = args.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");

            const eventId = await ctx.db.insert("events" , {
                ...args,
                capacity: !isPro ? Math.min(args.capacity, 50) : Math.min(args.capacity, 1000),
                themeColor: !isPro ? "#1e3a8a" : args.themeColor || "#1e3a8a",
                slug: `${slug}-${Date.now()}`,
                organizerId: user._id,
                organizerName: user.name,
                registrationCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),    
            });

             // Update user free event count if free user
             if (!isPro) {
                 await ctx.db.patch(user._id , {
                    freeEventsCreated: user.freeEventsCreated + 1,
                 });
             }

             return eventId;
        } catch (error) {
            throw new Error(error.message || "Failed to create new event");
        }
    }
})


//Get event by slug...
export const getEventBySlug = query({
    args: { slug: v.string() },
    handler: async(ctx,args) => {
        const  event = await ctx.db
           .query("events")
           .withIndex("by_slug" , (q) => q.eq("slug" , args.slug))
           .unique();

        return event;
    },
})


//Get events by organizer or team membership...
export const getEventsByOrg = query({
    handler: async(ctx) => {
        const user = await ctx.runQuery(internal.users.getCurrentUser);
        if (!user) return [];

        const ownedEvents = await ctx.db
            .query("events")
            .withIndex("by_organizer" , (q) => q.eq("organizerId" , user._id))
            .order("desc")
            .collect();

        const ownedWithRole = ownedEvents.map(e => ({ ...e, role: "owner", isTeamEvent: false }));

        // Check for events where user is an authorized team member
        const allEvents = await ctx.db.query("events").order("desc").collect();
        const teamEvents = [];

        for (const e of allEvents) {
            if (e.organizerId.toString() !== user._id.toString()) {
                const organizer = await ctx.db.get(e.organizerId);
                const isMember = organizer?.teamMembers?.some(
                    (m) => m.email.toLowerCase() === user.email.toLowerCase()
                );
                if (isMember) {
                    teamEvents.push({ ...e, role: "team_member", isTeamEvent: true });
                }
            }
        }

        return [...ownedWithRole, ...teamEvents];    
    }
})


//Delete event....
export const deleteEvent = mutation({
    args: {eventId: v.id("events")},
    handler: async (ctx,args) => {
       const user = await ctx.runQuery(internal.users.getCurrentUser);
       
       const event = await ctx.db.get(args.eventId);
       if(!event){
        throw new Error("Event not found🚫🚫🚫🚫")
       }

       const organizer = await ctx.db.get(event.organizerId);
       const isOwner = event.organizerId.toString() === user._id.toString();
       const isTeamMember = organizer?.teamMembers?.some(
           (m) => m.email.toLowerCase() === user.email.toLowerCase()
       );

       //Check if user is the organizer or team member...
       if(!isOwner && !isTeamMember){
        throw new Error("🔒 Only the event organizer or authorized team members can delete this event.")
       }

       //Delete all registration for this event...
       const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event" , (q) => q.eq("eventId" , args.eventId))
            .collect();

        for(const registration of registrations){
            await ctx.db.delete(registration._id);
        }

        //Delete an event...
        await ctx.db.delete(args.eventId);

        //For Pro members subscription...
        if(isOwner && user.freeEventsCreated > 0){
            await ctx.db.patch(user._id , {
                freeEventsCreated: user.freeEventsCreated - 1,
            });
        }

        return {success: true};
    }
})