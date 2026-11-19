import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const store = mutation({
  args: {
    clerkUserId: v.optional(v.string()),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let identity = await ctx.auth.getUserIdentity();
    let tokenIdentifier = identity?.tokenIdentifier;

    if (!tokenIdentifier && args.clerkUserId) {
      tokenIdentifier = `https://quiet-walleye-29.clerk.accounts.dev|${args.clerkUserId}`;
    }

    if (!tokenIdentifier) {
      return null;
    }

    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .unique();

    if (!user && args.clerkUserId) {
      const allUsers = await ctx.db.query("users").collect();
      user = allUsers.find(
        (u) =>
          u.tokenIdentifier.endsWith(args.clerkUserId) ||
          u.tokenIdentifier === args.clerkUserId
      ) || null;
    }

    const name = identity?.name ?? args.name ?? "Anonymous";
    const email = identity?.email ?? args.email ?? "";
    const profileImageUrl = identity?.pictureUrl ?? args.profileImageUrl;

    if (user !== null) {
      const updates = {};
      if (user.name !== name && name !== "Anonymous") {
        updates.name = name;
      }
      if (user.email !== email && email !== "") {
        updates.email = email;
      }
      if (user.profileImageUrl !== profileImageUrl && profileImageUrl) {
        updates.profileImageUrl = profileImageUrl;
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = Date.now();
        await ctx.db.patch(user._id, updates);
      }

      return user._id;
    }

    return await ctx.db.insert("users", {
      name,
      tokenIdentifier,
      email,
      profileImageUrl,
      hasCompletedOnboarding: false,
      freeEventsCreated: 0,
      plan: "free",
      subscriptionStatus: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Check if user is logged in and return user data (supports Clerk user ID fallback)
export const getCurrentUser = query({
  args: { clerkUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();

      if (user) return user;
    }

    if (args?.clerkUserId) {
      const users = await ctx.db.query("users").collect();
      const user = users.find(
        (u) =>
          u.tokenIdentifier.endsWith(args.clerkUserId) ||
          u.tokenIdentifier === args.clerkUserId
      );
      if (user) return user;
    }

    return null;
  },
});

// Auto-provision or update dev user when Clerk authentication is in development
export const storeOrUpdateDevUser = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const existing = users.find(
      (u) =>
        u.tokenIdentifier.endsWith(args.clerkUserId) ||
        u.tokenIdentifier === args.clerkUserId
    );
    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      name: args.name || "Evenza User",
      tokenIdentifier: `https://quiet-walleye-29.clerk.accounts.dev|${args.clerkUserId}`,
      email: args.email || "",
      profileImageUrl: undefined,
      hasCompletedOnboarding: true,
      freeEventsCreated: 0,
      plan: "free",
      subscriptionStatus: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});


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

// Immediately downgrade user to Free plan upon cancellation
export const downgradeToFreePlan = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      plan: "free",
      subscriptionStatus: "cancelled",
      updatedAt: Date.now(),
    });
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