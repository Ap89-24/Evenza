"use client";
import EventCard from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';
import { useConvexMutation, useConvexQuery } from '@/hooks/use-convex-query';
import { Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { toast } from 'sonner';

import UpgradeModal from '@/components/UpgradeModal';
import { Crown, Sparkles } from 'lucide-react';

const MyEventPage = () => {

    const router = useRouter();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
    const { data: events, isLoading } = useConvexQuery(api.events.getEventsByOrg);
    const { mutate: deleteEvent } = useConvexMutation(api.events.deleteEvent);

    const isPro = currentUser?.plan === "pro";
    const eventsCount = events?.length || 0;
    const isLimitReached = !isPro && eventsCount >= 1;

    const [tabFilter, setTabFilter] = useState("all");

    const now = Date.now();
    const ownedEvents = events?.filter((e) => !e.isTeamEvent) || [];
    const teamSharedEvents = events?.filter((e) => e.isTeamEvent) || [];
    const upcomingEvents = events?.filter((e) => (e.endDate || e.startDate) >= now) || [];
    const pastEvents = events?.filter((e) => (e.endDate || e.startDate) < now) || [];

    const displayedEvents =
      tabFilter === "owned"
        ? ownedEvents
        : tabFilter === "team"
        ? teamSharedEvents
        : tabFilter === "upcoming"
        ? upcomingEvents
        : tabFilter === "past"
        ? pastEvents
        : events || [];

    const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteEvent({ eventId });
      toast.success("Event deleted successfully");
    } catch (error) {
      toast.error(error.message || "Failed to delete event");
    }
  };

    if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  const handleEventClick = (eventId) => {
    router.push(`/my-events/${eventId}`);
  };

  const handleCreateClick = () => {
    if (isLimitReached) {
      setShowUpgradeModal(true);
      return;
    }
    router.push('/create-event');
  };

  return (
    <div className="min-h-screen pb-20 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-2">My Events</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Manage your created events, attendees, and marketing campaigns.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {!isPro && (
              <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-gray-300">
                Plan: <span className="font-semibold text-purple-400">Free</span> ({eventsCount}/1 event)
              </div>
            )}

            <Button onClick={handleCreateClick} className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-500/25 border-none">
              <Plus className="w-4 h-4 text-white" /> <span className="text-white">Create Event</span>
            </Button>
          </div>
        </div>

        {/* Free Plan Limit Alert Banner */}
        {isLimitReached && (
          <div className="p-4 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-sm text-white">
                <Crown className="w-4 h-4 text-purple-400" /> Free Plan Limit Reached (1/1 Event Created)
              </div>
              <p className="text-xs text-gray-400">
                Upgrade to Pro to create unlimited events, unlock AI Event Copilot, advanced analytics & custom branding!
              </p>
            </div>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs gap-1 shrink-0 w-full sm:w-auto"
            >
              <Sparkles className="w-3.5 h-3.5" /> Upgrade to Pro — ₹1999/mo
            </Button>
          </div>
        )}

        {/* Mobile Responsive Filter Tabs */}
        {events && events.length > 0 && (
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto scrollbar-none">
            <Button
              variant={tabFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTabFilter("all")}
              className={`rounded-lg text-xs gap-1.5 shrink-0 ${
                tabFilter === "all" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              All Events ({events.length})
            </Button>
            {teamSharedEvents.length > 0 && (
              <Button
                variant={tabFilter === "team" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTabFilter("team")}
                className={`rounded-lg text-xs gap-1.5 shrink-0 ${
                  tabFilter === "team" ? "bg-purple-600 text-white" : "text-purple-400 hover:text-white"
                }`}
              >
                👥 Team Shared ({teamSharedEvents.length})
              </Button>
            )}
            <Button
              variant={tabFilter === "upcoming" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTabFilter("upcoming")}
              className={`rounded-lg text-xs gap-1.5 shrink-0 ${
                tabFilter === "upcoming" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Upcoming ({upcomingEvents.length})
            </Button>
            <Button
              variant={tabFilter === "past" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTabFilter("past")}
              className={`rounded-lg text-xs gap-1.5 shrink-0 ${
                tabFilter === "past" ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              Past / Concluded ({pastEvents.length})
            </Button>
          </div>
        )}

        {events?.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center border-zinc-800 bg-zinc-900/40">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-5xl sm:text-6xl mb-2">🎟️</div>
              <h2 className="text-xl sm:text-2xl font-bold">No Events Yet</h2>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Create your first event with AI and start organizing unforgettable experiences for your attendees!
              </p>
              <Button onClick={handleCreateClick} className="gap-2 text-xs sm:text-sm">
                <Plus className="w-4 h-4" /> Create Your First Event
              </Button>
            </div>
          </Card>
        ) : displayedEvents.length === 0 ? (
          <Card className="p-8 text-center border-zinc-800 bg-zinc-900/40">
            <p className="text-sm text-muted-foreground">
              No {tabFilter === "upcoming" ? "upcoming" : "past"} events found.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayedEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                action="event"
                onClick={() => handleEventClick(event._id)}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="limit"
      />
    </div>
  );
};

export default MyEventPage;
