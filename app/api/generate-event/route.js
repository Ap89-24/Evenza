import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateTextWithAI } from "@/lib/ai-provider";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCached, setCached, generateHash } from "@/lib/cache";
import { getUserPlanServer } from "@/lib/user-subscription";

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // 1. Determine user subscription plan from Convex backend
    const userPlan = await getUserPlanServer(userId);
    const isPro = userPlan === "pro";

    // 2. Enforce Redis Rate Limiting
    const rateLimit = await checkRateLimit(userId, isPro);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "AI usage limit reached. Please try again later.",
        },
        { status: 429 }
      );
    }

    // 3. Normalize input & generate Redis Cache Key (isolated by userId for privacy)
    const normalizedPrompt = prompt.trim().toLowerCase();
    const promptHash = generateHash(normalizedPrompt);
    const cacheKey = `ai:user:${userId}:${promptHash}`;

    // 4. Check Redis cache
    const cachedResponse = await getCached(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    const systemPrompt = `You are an event planning assistant. Generate event details based on the user's description.

CRITICAL: Return ONLY valid JSON with properly escaped strings. No newlines in string values - use spaces instead.

Return this exact JSON structure:
{
  "title": "Event title (catchy and professional, single line)",
  "description": "Detailed event description in a single paragraph. Use spaces instead of line breaks. Make it 2-3 sentences describing what attendees will learn and experience.",
  "category": "One of: tech, music, sports, art, food, business, health, education, gaming, networking, outdoor, community",
  "suggestedCapacity": 50,
  "suggestedTicketType": "free"
}

User's event idea: ${prompt}

Rules:
- Return ONLY the JSON object, no markdown, no explanation
- All string values must be on a single line with no line breaks
- Use spaces instead of \\n or line breaks in description
- Make title catchy and under 80 characters
- Description should be 2-3 sentences, informative, single paragraph
- Choose the most relevant category from:
  tech, music, sports, art, food, business, health, education, gaming, networking, outdoor, community
- Set realistic capacity:
  - small events: 20-50
  - medium events: 50-150
  - large events: 150-500
`;

    const { text } = await generateTextWithAI({ systemPrompt, userPrompt: prompt, temperature: 0.8 });
    console.log("🧠 AI RAW RESPONSE:", text);
    if (!text) {
      throw new Error("Empty response from AI engine");
    }

    let cleanedText = text.trim();

    cleanedText = cleanedText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const firstBrace = cleanedText.indexOf("{");
    const lastBrace = cleanedText.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON found in response");
    }

    const jsonString = cleanedText.slice(firstBrace, lastBrace + 1);
    const eventData = JSON.parse(jsonString);

    // 5. Store generated response in Redis cache (TTL: 10 minutes = 600s)
    await setCached(cacheKey, eventData, 600);

    return NextResponse.json(eventData);
  } catch (error) {
    console.error("Error in generating event: ", error);
    return NextResponse.json(
      { error: "Failed to generate event: " + error.message },
      { status: 500 }
    );
  }
}
