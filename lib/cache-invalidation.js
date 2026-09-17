import { deleteCached } from "./cache";

/**
 * Invalidate Redis caches for a specific user and event when data changes
 * (e.g. event creation, deletion, registration, check-in, ticket changes).
 *
 * @param {string} userId - Authenticated Clerk userId
 * @param {string} [eventId] - Convex event ID (optional)
 */
export async function invalidateEventCache(userId, eventId = null) {
  if (!userId) return;

  try {
    // 1. Invalidate user dashboard cache
    await deleteCached(`dashboard:${userId}*`);

    // 2. Invalidate event analytics cache if eventId is provided
    if (eventId) {
      await deleteCached(`event:${userId}:${eventId}:analytics`);
      await deleteCached(`ai:event:${userId}:${eventId}:*`);
    }

    console.log(`🧹 Redis cache invalidated for user ${userId} ${eventId ? `and event ${eventId}` : ""}`);
  } catch (error) {
    console.error("Redis cache invalidation error:", error.message);
  }
}
