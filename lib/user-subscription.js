import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
let convexClient = null;

if (convexUrl) {
  convexClient = new ConvexHttpClient(convexUrl);
}

/**
 * Fetch the user's actual subscription plan from Convex DB on the server.
 * Never trust client-supplied plan parameters.
 *
 * @param {string} userId - Authenticated Clerk userId
 * @returns {Promise<"free" | "pro">}
 */
export async function getUserPlanServer(userId) {
  if (!userId || !convexClient) {
    return "free";
  }

  try {
    const user = await convexClient.query(api.users.getUserByClerkId, {
      clerkUserId: userId,
    });

    return user?.plan === "pro" ? "pro" : "free";
  } catch (err) {
    console.warn("⚠️ Failed to fetch user plan from Convex on server:", err.message);
    return "free"; // Default to free on failure
  }
}
