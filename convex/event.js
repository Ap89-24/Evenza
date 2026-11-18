import { v } from "convex/values";
import { query } from "./_generated/server";



// Helper to check if an event is active / upcoming
const isUpcoming = (e, now) => (e.endDate || e.startDate) >= now;
const isPast = (e, now) => (e.endDate || e.startDate) < now;

// Helper to paginate an array of events safely
const paginateList = (items, page = 1, pageSize = 9) => {
    const safePageSize = Math.max(1, Math.min(pageSize, 50));
    const totalCount = items.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
    const safePage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (safePage - 1) * safePageSize;

    return {
        events: items.slice(startIndex, startIndex + safePageSize),
        totalCount,
        page: safePage,
        pageSize: safePageSize,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
    };
};

//Get featured events (combines recent and popular, upcoming only)...
export const getFeaturedEvents = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db.query("events")
        .order("desc")
        .collect();

        const upcomingEvents = events.filter((e) => isUpcoming(e, now));

        // Sort by recency and registration count so newly created events get featured
        const featured = upcomingEvents
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, args.limit ?? 6);

        return featured;
    },
});

//Get recent events (newest created first across all users, upcoming only)...
export const getRecentEvents = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .order("desc")
            .collect();

        const upcomingEvents = events.filter((e) => isUpcoming(e, now));

        return upcomingEvents.slice(0, args.limit ?? 12);
    },
});

//Get all events (for global discovery, upcoming only)...
export const getAllEvents = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .order("desc")
            .collect();

        const upcomingEvents = events.filter((e) => isUpcoming(e, now));

        return upcomingEvents.slice(0, args.limit ?? 24);
    },
});

//Get events by location (city/state, upcoming only)...
export const getEventsByLocation = query({
    args: {
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        country: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        let events = await ctx.db.query("events")
        .order("desc")
        .collect();

        const upcomingEvents = events.filter((e) => isUpcoming(e, now));

        //Filter by city or state if provided
        if (args.city) {
            const cityEvents = upcomingEvents.filter(
                (e) => e.city.toLowerCase() === args.city.toLowerCase()
            );
            if (cityEvents.length > 0) return cityEvents.slice(0, args.limit ?? 4);
        }

        if (args.state) {
            const stateEvents = upcomingEvents.filter(
                (e) => e.state?.toLowerCase() === args.state.toLowerCase()
            );
            if (stateEvents.length > 0) return stateEvents.slice(0, args.limit ?? 4);
        }
     
        // Fallback: return recent upcoming events if location filter matches nothing
        return upcomingEvents.slice(0, args.limit ?? 4);
    },
});

//Get popular events (upcoming only)...
export const getPopularEvents = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db.query("events")
        .order("desc")
        .collect();

        const upcomingEvents = events.filter((e) => isUpcoming(e, now));

        return upcomingEvents.slice(0, args.limit ?? 8);
    },
});

//Get all events by Category (upcoming only)...
export const getEventsByCategory = query({
    args: {
        category: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db.query("events")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .order("desc")
        .collect();

        const upcomingEvents = events.filter((e) => isUpcoming(e, now));

        return upcomingEvents.slice(0, args.limit ?? 12);
    },
});

//Get category count for upcoming events...
export const getCategoryCount = query({
    handler: async (ctx) => {
        const now = Date.now();
        const events = await ctx.db
        .query("events")
        .order("desc")
        .collect();

        const counts = {};
        events.forEach((event) => {
            if (isUpcoming(event, now)) {
                counts[event.category] = (counts[event.category] || 0) + 1;
            }
        });
        return counts;
    }
});

//Get finished / past events only...
export const getPastEvents = query({
    args: {
        category: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .order("desc")
            .collect();

        let pastEventsList = events.filter((e) => isPast(e, now));

        if (args.category && args.category !== "all") {
            pastEventsList = pastEventsList.filter((e) => e.category === args.category);
        }

        return pastEventsList.slice(0, args.limit ?? 50);
    },
});

// Paginated recent upcoming events
export const getPaginatedRecentEvents = query({
    args: {
        page: v.optional(v.number()),
        pageSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .order("desc")
            .collect();

        const upcomingEvents = events.filter((e) => isUpcoming(e, now));
        return paginateList(upcomingEvents, args.page ?? 1, args.pageSize ?? 6);
    },
});

// Paginated upcoming events by category
export const getPaginatedEventsByCategory = query({
    args: {
        category: v.string(),
        page: v.optional(v.number()),
        pageSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .withIndex("by_category", (q) => q.eq("category", args.category))
            .order("desc")
            .collect();

        const upcomingEvents = events.filter((e) => isUpcoming(e, now));
        return paginateList(upcomingEvents, args.page ?? 1, args.pageSize ?? 9);
    },
});

// Paginated upcoming events by location (city/state)
export const getPaginatedEventsByLocation = query({
    args: {
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        country: v.optional(v.string()),
        page: v.optional(v.number()),
        pageSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .order("desc")
            .collect();

        const upcomingEvents = events.filter((e) => isUpcoming(e, now));

        if (args.city) {
            const cityEvents = upcomingEvents.filter(
                (e) => e.city.toLowerCase() === args.city.toLowerCase()
            );
            if (cityEvents.length > 0) {
                return paginateList(cityEvents, args.page ?? 1, args.pageSize ?? 9);
            }
        }

        if (args.state) {
            const stateEvents = upcomingEvents.filter(
                (e) => e.state?.toLowerCase() === args.state.toLowerCase()
            );
            if (stateEvents.length > 0) {
                return paginateList(stateEvents, args.page ?? 1, args.pageSize ?? 9);
            }
        }

        return paginateList(upcomingEvents, args.page ?? 1, args.pageSize ?? 9);
    },
});

// Paginated past / finished events
export const getPaginatedPastEvents = query({
    args: {
        category: v.optional(v.string()),
        page: v.optional(v.number()),
        pageSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .order("desc")
            .collect();

        let pastEventsList = events.filter((e) => isPast(e, now));

        if (args.category && args.category !== "all") {
            pastEventsList = pastEventsList.filter((e) => e.category === args.category);
        }

        return paginateList(pastEventsList, args.page ?? 1, args.pageSize ?? 9);
    },
});