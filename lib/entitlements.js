// Centralized Entitlement & Feature Gating Layer

export const PLAN_PRICING = {
  FREE: {
    id: "free",
    name: "FREE",
    price: "₹0",
    priceAmount: 0,
    eventLimit: 1,
    attendeeLimit: 50,
    teamMemberLimit: 1,
  },
  PRO: {
    id: "pro",
    name: "PRO",
    price: "₹1999",
    priceAmount: 1999,
    period: "/month",
    eventLimit: Infinity,
    attendeeLimit: 1000,
    teamMemberLimit: 3,
  },
};

export function getUserPlan(user) {
  if (!user) return "free";
  return user.plan === "pro" ? "pro" : "free";
}

export function isProUser(user) {
  return getUserPlan(user) === "pro";
}

export function getPlanLimits(user) {
  const plan = getUserPlan(user);
  return plan === "pro" ? PLAN_PRICING.PRO : PLAN_PRICING.FREE;
}

export function canCreateEvent(user, existingEventsCount = 0) {
  if (isProUser(user)) return { allowed: true };
  const currentCount = user?.freeEventsCreated ?? existingEventsCount;
  if (currentCount >= 1) {
    return {
      allowed: false,
      reason: "limit_reached",
      message: "You've reached your Free plan limit. Free includes 1 event. Upgrade to Pro to create unlimited events, unlock AI Event Copilot, advanced analytics, custom branding and more.",
    };
  }
  return { allowed: true };
}

export function getAttendeeLimit(userOrOrganizerPlan) {
  const isPro = typeof userOrOrganizerPlan === "string" 
    ? userOrOrganizerPlan === "pro"
    : isProUser(userOrOrganizerPlan);
  return isPro ? 1000 : 50;
}

export function canRegisterAttendee(organizerUserOrPlan, currentRegistrationCount, eventCapacity) {
  const limit = getAttendeeLimit(organizerUserOrPlan);
  const effectiveCapacity = Math.min(eventCapacity || limit, limit);
  if (currentRegistrationCount >= effectiveCapacity) {
    return {
      allowed: false,
      isFull: true,
      message: `This event has reached its attendee limit. Upgrade to Pro for up to 1,000 attendees per event.`,
    };
  }
  return { allowed: true };
}

export function canUseAICopilot(user) {
  return isProUser(user);
}

export function canUseFullMarketingAI(user) {
  return isProUser(user);
}

export function canUseAdvancedAnalytics(user) {
  return isProUser(user);
}

export function canUseCustomBranding(user) {
  return isProUser(user);
}

export function canCreateMultipleTicketTypes(user) {
  return isProUser(user);
}

export function canGenerateCertificates(user) {
  return isProUser(user);
}

export function canUseCustomDomain(user) {
  return isProUser(user);
}

export function canRemovePlatformBranding(user) {
  return isProUser(user);
}

export function getTeamMemberLimit(user) {
  return isProUser(user) ? 3 : 1;
}
