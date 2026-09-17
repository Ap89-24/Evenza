import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCached, setCached } from "@/lib/cache";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
let convexClient = null;

if (convexUrl) {
  convexClient = new ConvexHttpClient(convexUrl);
}

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId search parameter is required" },
        { status: 400 }
      );
    }

    // Redis Cache Key format (User & Event isolated for privacy)
    const analyticsCacheKey = `event:${userId}:${eventId}:analytics`;
    const dashboardCacheKey = `dashboard:${userId}:${eventId}`;

    // 1. Check Redis cache first (60-second TTL)
    const cachedData = await getCached(analyticsCacheKey) || await getCached(dashboardCacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    if (!convexClient) {
      return NextResponse.json(
        { error: "Convex client not initialized" },
        { status: 500 }
      );
    }

    // 2. Fallback / Source of truth query to Convex DB
    const dashboardData = await convexClient.query(api.dashboard.getEventDashboard, {
      eventId,
    });

    if (!dashboardData) {
      return NextResponse.json(
        { error: "Event not found or unauthorized access" },
        { status: 404 }
      );
    }

    // 3. Store in Redis with 60s TTL
    await setCached(analyticsCacheKey, dashboardData, 60);
    await setCached(dashboardCacheKey, dashboardData, 60);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard API Error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch dashboard analytics: " + error.message },
      { status: 500 }
    );
  }
}
