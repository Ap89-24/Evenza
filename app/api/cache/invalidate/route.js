import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { invalidateEventCache } from "@/lib/cache-invalidation";

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { eventId } = await req.json().catch(() => ({}));

    await invalidateEventCache(userId, eventId);

    return NextResponse.json({
      success: true,
      message: "Cache invalidated successfully",
    });
  } catch (error) {
    console.error("Cache Invalidation API Error:", error.message);
    return NextResponse.json(
      { error: "Failed to invalidate cache: " + error.message },
      { status: 500 }
    );
  }
}
