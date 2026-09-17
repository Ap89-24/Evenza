import { v } from "convex/values";
import {  mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    // Check if we've already stored this identity before.
    // Note: If you don't want to define an index right away, you can use
    // ctx.db.query("users")
    //  .filter(q => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
    //  .unique();
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (user !== null) {
      // If we've seen this identity before but the name has changed, patch the value.
       // If we've seen this identity before but details changed, update them
      const updates = {};
      if (user.name !== identity.name) {
        updates.name = identity.name ?? "Anonymous";
      }
      if (user.email !== identity.email) {
        updates.email = identity.email ?? "";
      }
      if (user.profileImageUrl !== identity.profileImageUrl) {
        updates.profileImageUrl = identity.profileImageUrl;
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = Date.now();
        await ctx.db.patch(user._id, updates);
      }


      return user._id;
    }
    // If it's a new identity, create a new `User`.
    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? "",
      profileImageUrl: identity.pictureUrl,
      hasCompletedOnboarding: false,
      freeEventsCreated: 0,
      plan: "free",
      subscriptionStatus: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});


//Check if user is logged in and return user data
export const getCurrentUser = query({
  handler: async(ctx) =>{
    const identity = await ctx.auth.getUserIdentity();
    if(!identity){
      return null;
    }

   const user = await ctx.db
     .query("users")
     .withIndex("by_token" , (q) =>
       q.eq("tokenIdentifier" , identity.tokenIdentifier)
    )
    .unique();

    if(!user){
      return null;
    }
    return user;
  },
})


export const completeOnboarding = mutation({
  args: {
    location: v.object({
      city: v.string(),
      state: v.optional(v.string()),
      country: v.string(),
    }),
    interests: v.array(v.string()),   //Min 3 interests
  },

  handler: async(ctx,args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    await ctx.db.patch(user._id, {
      location: args.location,
      interests: args.interests,
      hasCompletedOnboarding: true,
      updatedAt: Date.now(),
    });

    return user._id;
  }
})

// Update user subscription plan (Server-Verified)
export const updateSubscription = mutation({
  args: {
    plan: v.union(v.literal("free"), v.literal("pro")),
    subscriptionStatus: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("cancelled"),
        v.literal("past_due")
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) {
      throw new Error("Authentication required to update subscription");
    }

    await ctx.db.patch(user._id, {
      plan: args.plan,
      subscriptionStatus: args.subscriptionStatus || "active",
      updatedAt: Date.now(),
    });

    return { success: true, plan: args.plan };
  },
});

// Manage Team Members (Free: 1 member max, Pro: 3 members max)
export const addTeamMember = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Authentication required");

    const currentMembers = user.teamMembers || [];
    const maxAllowed = user.plan === "pro" ? 3 : 1;

    if (currentMembers.length >= maxAllowed) {
      throw new Error(
        user.plan === "pro"
          ? "Pro plan limit reached (maximum 3 team members)."
          : "Free plan limit reached (maximum 1 team member). Upgrade to Pro for up to 3 team members."
      );
    }

    if (currentMembers.some((m) => m.email.toLowerCase() === args.email.toLowerCase())) {
      throw new Error("Member with this email is already added.");
    }

    const updated = [
      ...currentMembers,
      { email: args.email, name: args.name, addedAt: Date.now() },
    ];

    await ctx.db.patch(user._id, {
      teamMembers: updated,
      updatedAt: Date.now(),
    });

    return { success: true, teamMembers: updated };
  },
});

export const removeTeamMember = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Authentication required");

    const currentMembers = user.teamMembers || [];
    const updated = currentMembers.filter(
      (m) => m.email.toLowerCase() !== args.email.toLowerCase()
    );

    await ctx.db.patch(user._id, {
      teamMembers: updated,
      updatedAt: Date.now(),
    });

    return { success: true, teamMembers: updated };
  },
});

// Follow / Unfollow Organizer
export const followOrganizer = mutation({
  args: { organizerId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Please sign in to follow organizers");

    if (user._id.toString() === args.organizerId.toString()) {
      throw new Error("You cannot follow yourself");
    }

    const existing = await ctx.db
      .query("organizerFollowers")
      .withIndex("by_organizer_follower", (q) =>
        q.eq("organizerId", args.organizerId).eq("followerUserId", user._id)
      )
      .unique();

    if (existing) {
      return { success: true, message: "Already following" };
    }

    await ctx.db.insert("organizerFollowers", {
      organizerId: args.organizerId,
      followerUserId: user._id,
      createdAt: Date.now(),
    });

    return { success: true, message: "Followed organizer successfully" };
  },
});

export const unfollowOrganizer = mutation({
  args: { organizerId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) throw new Error("Authentication required");

    const existing = await ctx.db
      .query("organizerFollowers")
      .withIndex("by_organizer_follower", (q) =>
        q.eq("organizerId", args.organizerId).eq("followerUserId", user._id)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true, message: "Unfollowed organizer successfully" };
  },
});

export const isFollowingOrganizer = query({
  args: { organizerId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) return false;

    const existing = await ctx.db
      .query("organizerFollowers")
      .withIndex("by_organizer_follower", (q) =>
        q.eq("organizerId", args.organizerId).eq("followerUserId", user._id)
      )
      .unique();

    return !!existing;
  },
});

export const getOrganizerFollowersCount = query({
  args: { organizerId: v.id("users") },
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("organizerFollowers")
      .withIndex("by_organizer", (q) => q.eq("organizerId", args.organizerId))
      .collect();

    return followers.length;
  },
});

// Fetch user profile by Clerk User ID (for server-side rate-limiting and plan verification)
export const getUserByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    if (!args.clerkUserId) return null;
    const users = await ctx.db.query("users").collect();
    const user = users.find(
      (u) => u.tokenIdentifier.endsWith(args.clerkUserId) || u.tokenIdentifier === args.clerkUserId
    );
    return user || null;
  },
});