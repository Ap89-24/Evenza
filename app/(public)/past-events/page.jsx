"use client";

import React, { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import EventCard from "@/components/EventCard";
import { CATEGORIES } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { History, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PastEventsPage = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: pastEvents, isLoading } = useConvexQuery(
    api.event.getPastEvents,
    { category: selectedCategory }
  );

  const handleEventClick = (slug) => {
    router.push(`/events/${slug}`);
  };

  return (
    <div className="min-h-screen pb-20 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Top Header Banner */}
      <div className="relative p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-950 to-purple-950/40 shadow-2xl overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Explore
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-purple-950/80 text-purple-300 border border-purple-800 px-3 py-1 text-xs font-semibold rounded-full gap-1.5 shadow-md">
              <History className="w-3.5 h-3.5" /> Archive
            </Badge>
            <Badge className="bg-zinc-800/80 text-zinc-300 border border-zinc-700 px-3 py-1 text-xs font-semibold rounded-full">
              Concluded Events Only
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Finished Events
          </h1>

          <p className="text-sm sm:text-base text-gray-400 max-w-2xl font-normal leading-relaxed">
            Browse past events, check out event summaries, look up previous organizer hosts, and explore memories from completed experiences.
          </p>
        </div>
      </div>

      {/* Category Filter Pills (Mobile Responsive Scrollable Bar) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Filter by Category
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className={`rounded-full text-xs shrink-0 snap-start transition-all ${
              selectedCategory === "all"
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20"
                : "border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            All Categories
          </Button>

          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full text-xs shrink-0 snap-start transition-all gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20"
                  : "border-zinc-800 text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Grid or Loading/Empty State */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
          <p className="text-xs text-muted-foreground">Loading concluded events...</p>
        </div>
      ) : pastEvents && pastEvents.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing {pastEvents.length} finished event{pastEvents.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pastEvents.map((event) => (
              <div key={event._id} className="relative group">
                <EventCard
                  event={event}
                  onClick={() => handleEventClick(event.slug)}
                  variant="grid"
                  className="h-full border-zinc-800/80 bg-zinc-900/50 hover:border-purple-500/50 transition-all"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-8 sm:p-12 text-center border-zinc-800 bg-zinc-900/30">
          <CardContent className="p-0 max-w-md mx-auto space-y-4">
            <div className="text-6xl mb-2">⏳</div>
            <h2 className="text-2xl font-bold text-white">No Finished Events Found</h2>
            <p className="text-sm text-muted-foreground">
              {selectedCategory !== "all"
                ? "There are no concluded events in this category yet."
                : "No past events are archived in the system currently."}
            </p>
            {selectedCategory !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="border-zinc-700 text-xs"
              >
                Clear Category Filter
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PastEventsPage;
