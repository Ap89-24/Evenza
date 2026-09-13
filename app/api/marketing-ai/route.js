import { NextResponse } from "next/server";
import { generateTextWithAI } from "@/lib/ai-provider";

const MARKETING_FORMATS = {
  instagram_post: "Instagram Post (Engaging, eye-catching text with emojis and hashtags)",
  instagram_caption: "Instagram Caption (Compelling caption with call to action)",
  instagram_reel: "Instagram Reel Script (Scene-by-scene script with visual cues)",
  linkedin_post: "LinkedIn Post (Professional tone highlighting value and networking)",
  whatsapp_message: "WhatsApp Invitation Message (Direct, friendly invitation with details)",
  email_announcement: "Email Announcement (Subject line + body with registration CTA)",
  event_reminder: "Event Reminder Message (Urgent reminder for upcoming event)",
  last_seats: "Last Seats Urgency Post (Highlighting scarcity and remaining seats)",
  early_bird: "Early Bird Campaign (Promotional message emphasizing special pricing)",
  thank_you: "Thank You Message (Post-event appreciation for attendees)",
};

const FREE_ALLOWED_FORMATS = ["instagram_post", "linkedin_post", "whatsapp_message"];

function generateFallbackMarketing({ formatType, title, description, category, formattedDate, city, venue, ticketType, ticketPrice, remainingCapacity, capacity }) {
  const priceText = ticketType === "free" ? "FREE Entry" : `₹${ticketPrice}`;
  const locationText = `${city}${venue ? `, ${venue}` : ""}`;
  const hashtags = `#${category.replace(/\s+/g, '')} #${city.replace(/\s+/g, '')} #EvenzaAI #LiveEvents #${title.replace(/[^a-zA-Z0-0]/g, '')}`;

  switch (formatType) {
    case "instagram_post":
      return `✨ EXCLUSIVE EVENT ANNOUNCEMENT ✨\n\nGet ready for "${title}" – an extraordinary ${category.toLowerCase()} event coming up in ${city}!\n\n💡 ABOUT THE EVENT:\n${description}\n\n📍 EVENT HIGHLIGHTS:\n📅 Date & Time: ${formattedDate}\n📍 Venue: ${locationText}\n🎟️ Ticket Price: ${priceText}\n🔥 Limited Seats: ${remainingCapacity} remaining out of ${capacity}\n\nDon't miss out on this incredible experience! Click the link in bio to reserve your official spot now. 👇\n\n${hashtags}`;

    case "linkedin_post":
      return `🚀 Announcing "${title}" – ${category} Experience in ${city}\n\nI am thrilled to host this event dedicated to ${category.toLowerCase()} enthusiasts and professionals.\n\n📖 Overview:\n${description}\n\n📌 Key Details:\n• Date & Time: ${formattedDate}\n• Location: ${locationText}\n• Category: ${category}\n• Admission: ${priceText}\n• Status: ${remainingCapacity} seats remaining (${capacity} max capacity)\n\nWhether you're looking to connect, learn, or experience something unique, this event offers immense value.\n\n👇 Register today to secure your pass:`;

    case "whatsapp_message":
      return `👋 *Hi friends! You are warmly invited!* 🎉\n\nWe are hosting *${title}* in ${city}!\n\n✨ *About the Event:*\n${description}\n\n📅 *When:* ${formattedDate}\n📍 *Where:* ${locationText}\n🎟️ *Pass:* ${priceText}\n⚡ *Availability:* Only ${remainingCapacity} seats remaining!\n\n👉 *Claim your QR ticket here:* ${process.env.NEXT_PUBLIC_APP_URL || "https://evenza.app"}\n\nLooking forward to seeing you there! 🙌`;

    case "instagram_caption":
      return `Mark your calendars! 🗓️ "${title}" is officially happening in ${city}.\n\n"${description}"\n\n📅 ${formattedDate}\n📍 ${locationText}\n🎟️ ${priceText}\n\nLimited seats available (${remainingCapacity} left)! Tag your friends who should join you and grab your tickets via the link in our bio! 🔗✨\n\n${hashtags}`;

    case "instagram_reel":
      return `🎬 INSTAGRAM REEL SCRIPT: "${title}"\n\n[SCENE 1 - 0:00-0:03 | HOOK]\nVisual: Fast montage of ${city} skyline and event venue.\nAudio: "Are you ready for the biggest ${category.toLowerCase()} event in ${city}?"\n\n[SCENE 2 - 0:03-0:10 | VALUE]\nVisual: On-screen text displaying "${title}" with highlights.\nAudio: "${description}"\n\n[SCENE 3 - 0:10-0:15 | CALL TO ACTION]\nVisual: Presenter showing the event pass and pointing down to caption.\nAudio: "Seats are strictly capped at ${capacity} attendees. Tap the link in bio to grab your pass before it sells out!"`;

    case "email_announcement":
      return `Subject: You're Invited: ${title} in ${city} 🎟️\n\nDear Attendee,\n\nWe are delighted to announce our upcoming event, "${title}", taking place on ${formattedDate}.\n\nAbout the Event:\n${description}\n\nEvent Summary:\n• Venue: ${locationText}\n• Category: ${category}\n• Admission: ${priceText}\n• Capacity: ${capacity} seats (${remainingCapacity} remaining)\n\nReserve your pass today to receive your instant digital QR ticket.\n\nWarm regards,\nEvent Operations Team`;

    case "event_reminder":
      return `⏰ QUICK REMINDER: "${title}" is coming up soon!\n\nDon't forget to lock in your plans for ${formattedDate} at ${locationText}.\n\n${description}\n\n⚡ ${remainingCapacity} seats remain. Secure your spot now!`;

    case "last_seats":
      return `🔥 LAST CHANCE ALERT for "${title}"!\n\nWe are reaching maximum capacity! Only ${remainingCapacity} seats are left out of ${capacity}.\n\n📅 ${formattedDate}\n📍 ${locationText}\n🎟️ ${priceText}\n\nGrab your ticket now before registrations close! 🏃‍♂️💨`;

    case "early_bird":
      return `🏷️ EARLY ACCESS PASS: "${title}"\n\nBe among the first to secure your registration for ${title}!\n\n📅 Date: ${formattedDate}\n📍 Location: ${locationText}\n🎟️ Price: ${priceText}\n\n${description}\n\nLock in your pass early and join us for an unmissable experience!`;

    case "thank_you":
      return `🎉 THANK YOU for making "${title}" a resounding success!\n\nWe appreciate every attendee who registered and joined us in ${city}. Stay tuned for our next event!`;

    default:
      return `🎉 "${title}"\n📅 ${formattedDate}\n📍 ${locationText}\n${description}`;
  }
}

export async function POST(req) {
  try {
    const { formatType, eventContext, isPro } = await req.json();

    if (!formatType || !MARKETING_FORMATS[formatType]) {
      return NextResponse.json(
        { error: "Invalid marketing format requested" },
        { status: 400 }
      );
    }

    if (!isPro && !FREE_ALLOWED_FORMATS.includes(formatType)) {
      return NextResponse.json(
        { error: "This marketing format is exclusive to Pro users." },
        { status: 403 }
      );
    }

    if (!eventContext) {
      return NextResponse.json(
        { error: "Event context is required for marketing generation" },
        { status: 400 }
      );
    }

    const {
      title = "Upcoming Event",
      description = "Join us for an exciting event experience.",
      category = "General",
      startDate,
      city = "India",
      venue = "",
      ticketType = "free",
      ticketPrice = 0,
      capacity = 50,
      registrationCount = 0,
    } = eventContext;

    const formattedDate = startDate ? new Date(startDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) : "Date TBA";

    const remainingCapacity = Math.max(0, (capacity || 50) - (registrationCount || 0));

    const systemPrompt = `You are a world-class AI Event Marketer.
Generate high-converting marketing copy for an event in the requested format.

REQUESTED FORMAT: ${MARKETING_FORMATS[formatType]}

STRICT EVENT DATA (DO NOT FABRICATE DATA):
- Event Title: "${title}"
- Category: ${category}
- Description: ${description}
- Date & Time: ${formattedDate}
- Location: ${city}${venue ? `, ${venue}` : ""}
- Price: ${ticketType === "free" ? "Free Registration" : `₹${ticketPrice}`}
- Remaining Seats: ${remainingCapacity} of ${capacity}

RULES:
1. Include actual event details (Title, Date, Venue, Price) naturally.
2. DO NOT invent fake speakers, dates, or prices.
3. Make the copy engaging, high-converting, and tailored to the platform.
4. Include appropriate emojis and hashtags.
5. Return ONLY the copy text directly, without meta-introductions like "Here is your post:".`;

    const { text: generatedText } = await generateTextWithAI({ systemPrompt });

    if (generatedText) {
      return NextResponse.json({ content: generatedText });
    }

    // Fallback if AI call returns empty or fails
    const fallbackContent = generateFallbackMarketing({
      formatType,
      title,
      description,
      category,
      formattedDate,
      city,
      venue,
      ticketType,
      ticketPrice,
      remainingCapacity,
      capacity,
    });

    return NextResponse.json({ content: fallbackContent });
  } catch (error) {
    console.error("Marketing AI Error:", error);
    return NextResponse.json(
      { error: "Failed to generate marketing copy: " + error.message },
      { status: 500 }
    );
  }
}
