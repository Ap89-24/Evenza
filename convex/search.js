import { v } from "convex/values";
import { query } from "./_generated/server";



export const searchEvents = query({
    args: {
        query: v.string(),
        limit: v.optional(v.number()),
    },

    handler: async (ctx , args) => {
        if(!args.query || args.query.trim().length < 2){
            return [];
        }

        const now = Date.now();
        const searchResult = await ctx.db.query("events")
            .withSearchIndex("search_tittle" , (q) => q.search("title", args.query))
            .collect();

        // Filter upcoming events (endDate or startDate >= now)
        const upcoming = searchResult.filter((e) => (e.endDate || e.startDate) >= now);

        return upcoming.slice(0, args.limit ?? 5);
    }
})