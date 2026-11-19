import { v } from "convex/values";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";

export const getEventDashboard = query({
  args: {
    eventId: v.id("events"),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = null;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
    }

    if (!user && args.clerkUserId) {
      const users = await ctx.db.query("users").collect();
      user = users.find(
        (u) =>
          u.tokenIdentifier.endsWith(args.clerkUserId) ||
          u.tokenIdentifier === args.clerkUserId
      );
    }

    if (!user) {
      return null;
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return null;
    }

    //* Check if the user is the organizer or authorized team member of the event...
    const organizer = await ctx.db.get(event.organizerId);
    const isOwner = event.organizerId.toString() === user._id.toString();
    const isTeamMember = organizer?.teamMembers?.some(
      (m) => m.email.toLowerCase() === user.email.toLowerCase()
    );

    if (!isOwner && !isTeamMember) {
      return null;
    }

    //? Get total registrations for the event...
    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    //? Calculate stats....

    const totalRegistrations = registrations.filter(
      (reg) => reg.status === "registered",
    ).length;

    const checkedInCount = registrations.filter(
      (reg) => reg.checkedIn && reg.status === "registered",
    ).length;

    const pendingCount = totalRegistrations - checkedInCount;

    //! Calculate the offline revenue collected at venue....
    let totalRevenue = 0;
    let paidAtVenueCount = 0;
    let unpaidCount = 0;

    registrations.forEach((reg) => {
      if (reg.status === "registered") {
        if (reg.paymentStatus === "paid_at_venue") {
          paidAtVenueCount++;
          totalRevenue += (reg.amountPaid || reg.amountDue || event.ticketPrice || 0);
        } else if (reg.paymentStatus === "pay_at_venue" || reg.paymentStatus === "unpaid") {
          unpaidCount++;
        }
      }
    });

    if (totalRevenue === 0 && event.ticketType === "paid" && event.ticketPrice) {
      // Fallback for legacy events
      totalRevenue = checkedInCount * event.ticketPrice;
    }

    //! Calculate the check-in rate....
    const checkedInRate =
      totalRegistrations > 0
        ? Math.round((checkedInCount / totalRegistrations) * 100)
        : 0;

    const now = Date.now();
    const timeUntilEvent = event.startDate - now;
    const hoursUntilEvent = Math.max(
      0,
      Math.floor(timeUntilEvent / (1000 * 60 * 60)),
    );

    const today = new Date().setHours(0, 0, 0, 0);
    const startDay = new Date(event.startDate).setHours(0, 0, 0, 0);
    const endDay = new Date(event.endDate).setHours(0, 0, 0, 0);
    const isEventToday = today >= startDay && today <= endDay;
    const isEventPast = event.endDate < now;

    return {
      event,
      stats: {
        totalRegistrations,
        checkedInCount,
        pendingCount,
        paidAtVenueCount,
        unpaidCount,
        capacity: event.capacity,
        checkedInRate,
        totalRevenue,
        hoursUntilEvent,
        isEventToday,
        isEventPast,
      },
    };
  },
});
