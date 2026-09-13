import { NextResponse } from "next/server";
import { generateTextWithAI } from "@/lib/ai-provider";

function generateFallbackCopilotAnswer(prompt, context) {
  const lower = prompt.toLowerCase();
  const {
    title = "Event",
    totalRegistrations = 0,
    capacity = 50,
    checkedInCount = 0,
    pendingCount = 0,
    totalRevenue = 0,
    checkedInRate = 0,
    ticketType = "free",
    ticketPrice = 0,
    hoursUntilEvent = 24,
    isEventPast = false,
  } = context;

  const remaining = Math.max(0, capacity - totalRegistrations);
  const conversionPct = Math.round((totalRegistrations / capacity) * 100);

  if (lower.includes("registered") || lower.includes("registration")) {
    return `📊 **Registration Overview for "${title}"**\n\n• **Total Registrations:** ${totalRegistrations} of ${capacity} capacity (${conversionPct}% full)\n• **Remaining Seats:** ${remaining} seats available\n\n💡 *Tip:* Share your event link on WhatsApp and LinkedIn to quickly fill the remaining ${remaining} seats!`;
  }

  if (lower.includes("ticket") || lower.includes("revenue") || lower.includes("price") || lower.includes("sold")) {
    return `🎟️ **Ticket & Revenue Breakdown**\n\n• **Ticket Type:** ${ticketType === "paid" ? `Paid (₹${ticketPrice}/ticket)` : "Free Event"}\n• **Tickets Claimed:** ${totalRegistrations}\n• **Checked-In Ticket Value:** ₹${totalRevenue}\n• **Total Potential Value:** ₹${totalRegistrations * ticketPrice}`;
  }

  if (lower.includes("seat") || lower.includes("remaining") || lower.includes("capacity")) {
    return `🪑 **Capacity & Seat Allocation**\n\n• **Event Capacity:** ${capacity} attendees\n• **Seats Claimed:** ${totalRegistrations}\n• **Seats Remaining:** ${remaining} seats (${100 - conversionPct}% available)\n\n${remaining < 10 ? "⚠️ Urgency Alert: Your event is almost full!" : "You still have healthy capacity remaining for last-minute attendees."}`;
  }

  if (lower.includes("conversion") || lower.includes("rate") || lower.includes("check-in")) {
    return `📈 **Check-in & Conversion Rate**\n\n• **Capacity Utilization Rate:** ${conversionPct}%\n• **Attendee Check-in Rate:** ${checkedInRate}%\n• **Checked-In Attendees:** ${checkedInCount}\n• **Pending Attendees:** ${pendingCount}`;
  }

  if (lower.includes("instagram") || lower.includes("post") || lower.includes("social")) {
    return `📸 **Instagram Promo Post**\n\nDon't miss "${title}"! 🔥\n\n📅 ${hoursUntilEvent > 0 ? `In ${Math.floor(hoursUntilEvent / 24)} days` : "Happening Today"}\n🎟️ ${ticketType === "free" ? "Free Admission" : `₹${ticketPrice}`}\n🔥 ${remaining} seats remaining!\n\nTap the link in bio to secure your ticket now! 👇\n\n#Events #Evenza #LiveEvent`;
  }

  if (lower.includes("whatsapp") || lower.includes("invite")) {
    return `💬 **WhatsApp Invitation**\n\nHey! You're invited to *${title}*! 🎉\n\n📅 Date: ${isEventPast ? "Event Ended" : "Upcoming"}\n🎟️ Price: ${ticketType === "free" ? "Free" : `₹${ticketPrice}`}\n\nOnly ${remaining} spots left! Claim your QR ticket here.`;
  }

  return `🤖 **AI Copilot Summary for "${title}"**\n\n• **Registrations:** ${totalRegistrations} / ${capacity} (${conversionPct}% full)\n• **Checked-In:** ${checkedInCount} (${checkedInRate}% check-in rate)\n• **Pending:** ${pendingCount}\n• **Revenue:** ₹${totalRevenue}\n• **Status:** ${isEventPast ? "Ended" : `${remaining} seats left`}\n\nAsk me anything specific about registrations, marketing posts, or performance metrics!`;
}

export async function POST(req) {
  try {
    const { prompt, eventContext } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!eventContext) {
      return NextResponse.json(
        { error: "Event context is required for Copilot" },
        { status: 400 }
      );
    }

    const {
      title,
      category,
      startDate,
      endDate,
      city,
      venue,
      capacity,
      ticketType,
      ticketPrice,
      totalRegistrations,
      checkedInCount,
      pendingCount,
      totalRevenue,
      checkedInRate,
      hoursUntilEvent,
      isEventToday,
      isEventPast,
    } = eventContext;

    const formattedStartDate = startDate ? new Date(startDate).toLocaleString() : "TBD";
    const formattedEndDate = endDate ? new Date(endDate).toLocaleString() : "TBD";

    const systemPrompt = `You are the AI Event Copilot, an expert assistant embedded in an event dashboard.
You help event organizers grow, promote, and manage their events.

STRICT RULE:
Base all your answers STRICTLY on the actual event data provided below.
DO NOT fabricate registration numbers, revenue, attendee names, dates, or prices.
If requested data is not present in the provided event details, state clearly that the data is currently unavailable.

REAL EVENT CONTEXT:
- Event Title: "${title || "Untitled"}"
- Category: ${category || "General"}
- Location: ${city || "Online / Unspecified"}${venue ? `, Venue: ${venue}` : ""}
- Event Dates: ${formattedStartDate} to ${formattedEndDate}
- Ticket Type: ${ticketType === "paid" ? `Paid (₹${ticketPrice || 0})` : "Free"}
- Event Capacity: ${capacity} attendees
- Total Registrations: ${totalRegistrations}
- Checked In: ${checkedInCount}
- Pending Check-in: ${pendingCount}
- Total Revenue: ₹${totalRevenue || 0}
- Check-in Rate: ${checkedInRate}%
- Remaining Capacity: ${Math.max(0, capacity - totalRegistrations)} seats
- Status: ${isEventPast ? "Event Ended" : isEventToday ? "Happening Today" : `${Math.floor(hoursUntilEvent / 24)} days / ${hoursUntilEvent} hours remaining`}

USER QUESTION:
"${prompt}"

INSTRUCTIONS:
1. Provide a direct, professional, and actionable answer.
2. Highlight key data points relevant to the question.
3. If asked for social posts or messages (Instagram, LinkedIn, WhatsApp, email), format them ready to copy with relevant hashtags.
4. Format with clean markdown headers and bullet points.`;

    const { text: responseText } = await generateTextWithAI({ systemPrompt });

    if (responseText) {
      return NextResponse.json({ answer: responseText });
    }

    const fallbackAnswer = generateFallbackCopilotAnswer(prompt, eventContext);
    return NextResponse.json({ answer: fallbackAnswer });
  } catch (error) {
    console.error("AI Copilot Error:", error);
    return NextResponse.json(
      { error: "Failed to query AI Copilot: " + error.message },
      { status: 500 }
    );
  }
}
