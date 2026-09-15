import { NextResponse } from "next/server";
import { generateTextWithAI } from "@/lib/ai-provider";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
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

    // Clean the response (remove markdown code blocks if present)
    // 🔥 Improved JSON cleaning + parsing
    let cleanedText = text.trim();

    // Remove markdown (anywhere in response)
    cleanedText = cleanedText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Extract only JSON part
    const firstBrace = cleanedText.indexOf("{");
    const lastBrace = cleanedText.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("No JSON found in response");
    }

    const jsonString = cleanedText.slice(firstBrace, lastBrace + 1);

    const eventData = JSON.parse(jsonString);
    return NextResponse.json(eventData);
  } catch (error) {
    console.error("Error in generating event: ", error);
    return NextResponse.json(
      { error: "Failed to generate event" + error.message },
      { status: 500 },
    );
  }
}
