import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateTextWithAI } from "@/lib/ai-provider";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCached, setCached, generateHash } from "@/lib/cache";
import { getUserPlanServer } from "@/lib/user-subscription";

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
  const cleanCategory = (category || "event").replace(/[^a-zA-Z0-9]/g, '');
  const cleanCity = (city || "city").replace(/[^a-zA-Z0-9]/g, '');
  const cleanTitle = (title || "title").replace(/[^a-zA-Z0-9]/g, '');
  const hashtags = `#${cleanCategory} #${cleanCity} #EvenzaAI #LiveEvents #${cleanTitle}`;

  const templates = {
    instagram_post: [
      `✨ EXCLUSIVE EVENT ANNOUNCEMENT ✨\n\nGet ready for "${title}" – an extraordinary ${(category || "event").toLowerCase()} experience coming up in ${city}!\n\n💡 ABOUT THE EVENT:\n${description}\n\n📍 EVENT HIGHLIGHTS:\n📅 Date & Time: ${formattedDate}\n📍 Venue: ${locationText}\n🎟️ Ticket Price: ${priceText}\n🔥 Limited Seats: ${remainingCapacity} remaining out of ${capacity}\n\nDon't miss out on this incredible experience! Click the link in bio to reserve your official spot now. 👇\n\n${hashtags}`,
      `🚀 BIG NEWS FOR ${city.toUpperCase()}! 🔥\n\n"${title}" is officially happening! Join us for an unforgettable ${(category || "event").toLowerCase()} gathering.\n\n🌟 WHY YOU SHOULD ATTEND:\n• ${description}\n\n📌 EVENT DETAILS:\n🗓️ ${formattedDate}\n📍 ${locationText}\n⚡ Entry: ${priceText}\n🎯 Availability: ${remainingCapacity} spots left!\n\nTag a friend who needs to be here with you! Link in bio to register 📲\n\n${hashtags}`,
      `🎉 MARK YOUR CALENDARS: "${title}" is arriving soon! 🚨\n\n${description}\n\nKey Event Breakdown:\n🗓️ Date: ${formattedDate}\n📍 Location: ${locationText}\n🎟️ Pass: ${priceText}\n⚡ Remaining Seats: ${remainingCapacity}/${capacity}\n\nSecure your QR pass before tickets sell out! 🔗 Check bio link!\n\n${hashtags}`
    ],
    linkedin_post: [
      `🚀 Announcing "${title}" – ${category} Experience in ${city}\n\nI am thrilled to host this event dedicated to ${(category || "event").toLowerCase()} enthusiasts and professionals.\n\n📖 Overview:\n${description}\n\n📌 Key Details:\n• Date & Time: ${formattedDate}\n• Location: ${locationText}\n• Category: ${category}\n• Admission: ${priceText}\n• Status: ${remainingCapacity} seats remaining (${capacity} max capacity)\n\nWhether you're looking to connect, learn, or experience something unique, this event offers immense value.\n\n👇 Register today to secure your pass:`,
      `💡 Connecting Leaders & Professionals at "${title}" in ${city}\n\nWe are organizing a high-impact ${(category || "event").toLowerCase()} event aimed at fostering innovation and networking.\n\nSummary:\n📍 Location: ${locationText}\n📅 Date: ${formattedDate}\n🎟️ Access: ${priceText}\n\nKey Highlights:\n- ${description}\n- Exclusive networking with industry peers\n- Real-time digital check-in and QR ticket access\n\nSeats are limited to ${capacity} participants (${remainingCapacity} remaining). Reserve your pass here:`
    ],
    whatsapp_message: [
      `👋 *Hi friends! You are warmly invited!* 🎉\n\nWe are hosting *${title}* in ${city}!\n\n✨ *About the Event:*\n${description}\n\n📅 *When:* ${formattedDate}\n📍 *Where:* ${locationText}\n🎟️ *Pass:* ${priceText}\n⚡ *Availability:* Only ${remainingCapacity} seats remaining!\n\n👉 *Claim your QR ticket here:* ${process.env.NEXT_PUBLIC_APP_URL || "https://evenza.app"}\n\nLooking forward to seeing you there! 🙌`,
      `🔥 *Exclusive Invite: ${title}* 🔥\n\nHey! Don't miss out on this upcoming ${(category || "event").toLowerCase()} event in ${city}.\n\n📅 *Date:* ${formattedDate}\n📍 *Venue:* ${locationText}\n💰 *Ticket:* ${priceText}\n⏰ *Status:* ${remainingCapacity} seats left\n\nTap here to lock in your pass instantly: ${process.env.NEXT_PUBLIC_APP_URL || "https://evenza.app"}`
    ],
    instagram_caption: [
      `Mark your calendars! 🗓️ "${title}" is officially happening in ${city}.\n\n"${description}"\n\n📅 ${formattedDate}\n📍 ${locationText}\n🎟️ ${priceText}\n\nLimited seats available (${remainingCapacity} left)! Tag your friends who should join you and grab your tickets via the link in our bio! 🔗✨\n\n${hashtags}`,
    ],
    instagram_reel: [
      `🎬 INSTAGRAM REEL SCRIPT: "${title}"\n\n[SCENE 1 - 0:00-0:03 | HOOK]\nVisual: Fast montage of ${city} skyline and event venue.\nAudio: "Are you ready for the biggest ${(category || "event").toLowerCase()} event in ${city}?"\n\n[SCENE 2 - 0:03-0:10 | VALUE]\nVisual: On-screen text displaying "${title}" with highlights.\nAudio: "${description}"\n\n[SCENE 3 - 0:10-0:15 | CALL TO ACTION]\nVisual: Presenter showing the event pass and pointing down to caption.\nAudio: "Seats are strictly capped at ${capacity} attendees. Tap the link in bio to grab your pass before it sells out!"`
    ],
    email_announcement: [
      `Subject: You're Invited: ${title} in ${city} 🎟️\n\nDear Attendee,\n\nWe are delighted to announce our upcoming event, "${title}", taking place on ${formattedDate}.\n\nAbout the Event:\n${description}\n\nEvent Summary:\n• Venue: ${locationText}\n• Category: ${category}\n• Admission: ${priceText}\n• Capacity: ${capacity} seats (${remainingCapacity} remaining)\n\nReserve your pass today to receive your instant digital QR ticket.\n\nWarm regards,\nEvent Operations Team`
    ],
    event_reminder: [
      `⏰ QUICK REMINDER: "${title}" is coming up soon!\n\nDon't forget to lock in your plans for ${formattedDate} at ${locationText}.\n\n${description}\n\n⚡ ${remainingCapacity} seats remain. Secure your spot now!`
    ],
    last_seats: [
      `🔥 LAST CHANCE ALERT for "${title}"!\n\nWe are reaching maximum capacity! Only ${remainingCapacity} seats are left out of ${capacity}.\n\n📅 ${formattedDate}\n📍 ${locationText}\n🎟️ ${priceText}\n\nGrab your ticket now before registrations close! 🏃‍♂️💨`
    ],
    early_bird: [
      `🏷️ EARLY ACCESS PASS: "${title}"\n\nBe among the first to secure your registration for ${title}!\n\n📅 Date: ${formattedDate}\n📍 Location: ${locationText}\n🎟️ Price: ${priceText}\n\n${description}\n\nLock in your pass early and join us for an unmissable experience!`
    ],
    thank_you: [
      `🎉 THANK YOU for making "${title}" a resounding success!\n\nWe appreciate every attendee who registered and joined us in ${city}. Stay tuned for our next event!`
    ]
  };

  const list = templates[formatType] || [`🎉 "${title}"\n📅 ${formattedDate}\n📍 ${locationText}\n${description}`];
  const selectedIndex = Math.floor(Math.random() * list.length);
  return list[selectedIndex];
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { formatType, eventContext } = await req.json();

    if (!formatType || !MARKETING_FORMATS[formatType]) {
      return NextResponse.json(
        { error: "Invalid marketing format requested" },
        { status: 400 }
      );
    }

    if (!eventContext) {
      return NextResponse.json(
        { error: "Event context is required for marketing generation" },
        { status: 400 }
      );
    }

    // 1. Server-side subscription plan check from Convex DB
    const userPlan = await getUserPlanServer(userId);
    const isPro = userPlan === "pro";

    if (!isPro && !FREE_ALLOWED_FORMATS.includes(formatType)) {
      return NextResponse.json(
        { error: "This marketing format is exclusive to Pro users." },
        { status: 403 }
      );
    }

    // 2. Redis Rate Limiting check
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

    const {
      _id: eventId,
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

    // 3. Normalize & Hash for Redis Cache Key (User + Event Isolated for Privacy)
    const contextStr = `${formatType}|${title}|${description}|${category}|${startDate}|${city}|${venue}|${ticketType}|${ticketPrice}|${capacity}`;
    const hash = generateHash(contextStr);
    const eventIdentifier = eventId || title.replace(/\s+/g, '-').toLowerCase();
    const cacheKey = `ai:event:${userId}:${eventIdentifier}:${formatType}:${hash}`;

    // 4. Check Redis cache (10-minute TTL)
    const cachedContent = await getCached(cacheKey);
    if (cachedContent) {
      return NextResponse.json(cachedContent);
    }

    const formattedDate = startDate ? new Date(startDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) : "Date TBA";

    const remainingCapacity = Math.max(0, (capacity || 50) - (registrationCount || 0));

    const systemPrompt = `You are an elite, world-class AI Event Marketing Strategist & Viral Copywriter.
Your goal is to generate high-converting, attention-grabbing, and market-engaging promotional copy for an event in the requested format.

REQUESTED FORMAT: ${MARKETING_FORMATS[formatType]}

STRICT REAL EVENT DATA:
- Event Title: "${title}"
- Category: ${category}
- Description: ${description}
- Date & Time: ${formattedDate}
- Location: ${city}${venue ? `, ${venue}` : ""}
- Price: ${ticketType === "free" ? "Free Registration" : `₹${ticketPrice}`}
- Remaining Seats: ${remainingCapacity} of ${capacity}

VIRAL COPYWRITING RULES:
1. ATTENTION-GRABBING HOOK: Hook the reader immediately with an exciting, viral opening line or headline.
2. RICH FORMATTING: Use structured Markdown headers, bullet points, clean line breaks, and highlighted key info.
3. HIGH-IMPACT EMOJIS: Use vivid, high-converting emojis (✨, 🎟️, 🚀, 📍, 🔥, 📅, 🎬, 💡, 🏷️, 🎉, ⚡) naturally to drive visual engagement.
4. MARKET-ENGAGING CTA & URGENCY: Drive action by highlighting limited capacity (${remainingCapacity} seats left) and clear Call-To-Action (CTA).
5. NO META-INTRODUCTIONS: Return ONLY the ready-to-publish copy directly without any intro phrases like "Here is your post:".`;

    const userPrompt = `Generate a fresh, unique, high-energy, and distinct marketing post for "${title}". Make sure this version has a creative new hook, high-converting copy structure, and engaging emojis. [Variation Ref: ${Date.now()}_${Math.random()}]`;

    const { text: generatedText } = await generateTextWithAI({ 
      systemPrompt, 
      userPrompt, 
      temperature: 0.9 
    });

    let finalContent = generatedText;
    if (!finalContent) {
      finalContent = generateFallbackMarketing({
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
    }

    const responsePayload = { content: finalContent };

    // 5. Store in Redis cache (10-minute TTL = 600s)
    await setCached(cacheKey, responsePayload, 600);

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Marketing AI Error:", error);
    return NextResponse.json(
      { error: "Failed to generate marketing copy: " + error.message },
      { status: 500 }
    );
  }
}
