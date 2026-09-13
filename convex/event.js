import { v } from "convex/values";
import { query } from "./_generated/server";



//Get featured events (combines recent and popular)...
export const getFeaturedEvents = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx,args) => {
        const events = await ctx.db.query("events")
        .order("desc")
        .collect();

        // Sort by recency and registration count so newly created events get featured
        const featured = events
        .sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, args.limit ?? 6);

        return featured;
    },
});

//Get recent events (newest created first across all users)...
export const getRecentEvents = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const events = await ctx.db
            .query("events")
            .order("desc")
            .collect();

        return events.slice(0, args.limit ?? 12);
    },
});

//Get all events (for global discovery)...
export const getAllEvents = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const events = await ctx.db
            .query("events")
            .order("desc")
            .collect();

        return events.slice(0, args.limit ?? 24);
    },
});

//Get events by location (city/state)...
export const getEventsByLocation = query({
    args: {
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        country: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx,args) => {
        let events = await ctx.db.query("events")
        .order("desc")
        .collect();

        //Filter by city or state if provided
        if(args.city){
             const cityEvents = events.filter(
                (e) => e.city.toLowerCase() === args.city.toLowerCase()
            );
            if (cityEvents.length > 0) return cityEvents.slice(0, args.limit ?? 4);
        }

        if(args.state){
             const stateEvents = events.filter(
                (e) => e.state?.toLowerCase() === args.state.toLowerCase()
            );
            if (stateEvents.length > 0) return stateEvents.slice(0, args.limit ?? 4);
        }
     
        // Fallback: return recent events if location filter matches nothing
        return events.slice(0, args.limit ?? 4);
    },
});

//Get popular events...
export const getPopularEvents = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx,args) => {
        const events = await ctx.db.query("events")
        .order("desc")
        .collect();

        return events.slice(0, args.limit ?? 8);
    },
});

//Get all events by Category...
export const getEventsByCategory = query({
    args: {
        category: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx,args) => {
        const events = await ctx.db.query("events")
        .withIndex("by_category" , (q)=> q.eq("category",args.category))
        .order("desc")
        .collect();

        return events.slice(0,args.limit ?? 12);
    },
});

//Get all category by count....
export const getCategoryCount = query({
    handler: async (ctx) => {
        const events = await ctx.db
        .query("events")
        .order("desc")
        .collect();

        //count events by category
        const counts = {};
        events.forEach((event) =>{
            counts[event.category] = (counts[event.category] || 0) + 1;
        })
        return counts;
    }
}) 