/* eslint-disable react-hooks/purity */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Share2,
  Ticket,
  CheckCircle,
  ExternalLink,
  Loader2,
  Sparkles,
  ShieldCheck,
  Award,
  Navigation,
  UserPlus,
  Zap,
  Check,
  CheckCircle2,
  Palette,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { getCategoryIcon, getCategoryLabel } from "@/lib/data";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import RegisterModal from "./_components/Register-modal";

const EventPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();

  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [following, setFollowing] = useState(false);

  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const { data: event, isLoading } = useConvexQuery(
    api.events.getEventBySlug,
    slug ? { slug } : "skip"
  );

  const { data: registration } = useConvexQuery(
    api.registrations.checkRegistration,
    event?._id ? { eventId: event._id } : "skip"
  );

  // Live Countdown State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    if (!event?.startDate) return;

    const calculateTimeLeft = () => {
      const diff = Math.max(0, new Date(event.startDate).getTime() - Date.now());
      if (diff === 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [event?.startDate]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description.slice(0, 100) + "...",
          url: url,
        });
        return;
      } catch (error) {
        // User cancelled share dialog
      }
    }
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Event link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRegister = () => {
    if (!user) {
      toast.error("Please sign in to register for events");
      return;
    }
    setShowRegistrationModal(true);
  };

  const getGoogleCalendarUrl = () => {
    if (!event) return "#";
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description || "");
    const location = encodeURIComponent(`${event.city || ""}, ${event.venue || ""}`);
    const startDate = new Date(event.startDate).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(event.endDate || event.startDate + 7200000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startDate}/${endDate}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <p className="text-sm text-gray-400 font-medium">Loading event details...</p>
      </div>
    );
  }

  if (event === undefined) return null;
  if (event === null) notFound();

  const isEventFull = event.registrationCount >= event.capacity;
  const isEventPast = event.endDate < Date.now();
  const isOrganizer = user?.id === event.organizerId;
  const remainingCapacity = Math.max(0, event.capacity - event.registrationCount);
  const capacityPct = Math.min(100, Math.round((event.registrationCount / event.capacity) * 100));

  // Dynamic Theme Color Calculation from Organizer Subscription Customization
  const activeThemeColor = event?.customBranding?.brandColor || event?.themeColor || "#9333ea";
  const isGradient = activeThemeColor.includes("gradient");

  const themeStyle = isGradient
    ? { background: activeThemeColor }
    : { backgroundColor: activeThemeColor };

  const themeGlowStyle = {
    boxShadow: `0 0 60px ${isGradient ? "#a855f7" : activeThemeColor}40`,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-purple-500 selection:text-white relative overflow-hidden pb-32 lg:pb-16">
      
      {/* High-Impact Ambient Theme Lighting Backlight */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-full sm:w-[1200px] h-[350px] sm:h-[650px] blur-[100px] sm:blur-[160px] rounded-full pointer-events-none -z-10 opacity-70 transition-all duration-700"
        style={themeStyle}
      />

      {/* TOP EVENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-10 space-y-6 sm:space-y-8">
        
        {/* VIBRANT HERO TITLE & BRANDING BANNER */}
        <div className="relative p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/15 bg-zinc-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden space-y-4">
          
          {/* Color Accent Strip */}
          <div className="absolute top-0 left-0 w-full h-1.5 sm:h-2" style={themeStyle} />

          <div className="flex flex-wrap items-center gap-2 relative z-10">
            {/* Theme Badge */}
            <Badge
              style={themeStyle}
              className="text-white border-none px-3 py-1 text-xs font-extrabold rounded-full gap-1 shadow-xl uppercase tracking-wider"
            >
              <span>{getCategoryIcon(event.category)}</span>
              <span>{getCategoryLabel(event.category)}</span>
            </Badge>

            {remainingCapacity < 10 && remainingCapacity > 0 && (
              <Badge className="bg-amber-950/80 text-amber-300 border border-amber-700/50 px-2.5 py-0.5 text-xs font-semibold rounded-full gap-1 animate-pulse">
                🔥 {remainingCapacity} Left!
              </Badge>
            )}

            {isEventPast ? (
              <Badge className="bg-zinc-800 text-gray-400 border border-zinc-700 px-2.5 py-0.5 text-xs font-semibold rounded-full">
                Concluded
              </Badge>
            ) : (
              <Badge className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 px-2.5 py-0.5 text-xs font-semibold rounded-full gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Registration
              </Badge>
            )}

            {/* Subscribed Theme Badge */}
            {event.customBranding?.brandColor && (
              <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-500/40 bg-amber-950/40 gap-1 font-mono">
                <Palette className="w-3 h-3" /> Custom Theme
              </Badge>
            )}
          </div>

          {/* Main Event Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] relative z-10">
            {event.title}
          </h1>

          {/* Meta Information Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-300 pt-1 relative z-10">
            <div className="flex items-center gap-1.5 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800 backdrop-blur-md">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold">{format(new Date(event.startDate), "EEE, MMM dd, yyyy")}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800 backdrop-blur-md">
              <Clock className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span className="font-semibold">
                {format(new Date(event.startDate), "h:mm a")} - {format(new Date(event.endDate), "h:mm a")}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800 backdrop-blur-md">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold truncate max-w-[200px]">
                {event.city}{event.venue && !event.venue.startsWith("http") ? `, ${event.venue}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* HERO COVER ART - DUAL LAYER AMBIENT BLUR WITH THEME GLOW */}
        {event.coverImage && (
          <div
            className="relative w-full h-[260px] sm:h-[420px] md:h-[520px] lg:h-[600px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/20 group transition-all duration-500"
            style={themeGlowStyle}
          >
            {/* Background Layer: Scaled & Heavy Blur for Color Harmony */}
            <Image
              src={event.coverImage}
              alt=""
              fill
              className="object-cover object-center scale-125 blur-3xl opacity-60 brightness-75 transition-all duration-700"
              priority
            />

            {/* Gradient Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30 z-10" />

            {/* Foreground Layer: Crisp Centered Cover Image */}
            <div className="relative z-20 w-full h-full flex items-center justify-center p-2 sm:p-6">
              <div className="relative w-full h-full max-w-4xl rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                <Image
                  src={event.coverImage}
                  alt={event.title}
                  fill
                  className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
                  priority
                />
              </div>
            </div>

            {/* Floating Category Badge */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 bg-black/70 backdrop-blur-xl border border-white/20 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-gray-100 flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Official Pass</span>
            </div>
          </div>
        )}

        {/* VIBRANT LIVE COUNTDOWN TIMER CARD (Mobile Optimized Grid) */}
        {!timeLeft.isPast && (
          <div
            className="p-4 sm:p-6 rounded-2xl border border-white/20 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-2xl relative overflow-hidden text-white"
            style={themeStyle}
          >
            {/* Inner Dark Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">Event Starts In</h4>
                <p className="text-[11px] sm:text-xs text-white/80">Get your ticket pass early!</p>
              </div>
            </div>

            {/* Responsive 4-Column Digit Grid */}
            <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-3 text-center relative z-10 w-full sm:w-auto">
              {[
                { label: "DAYS", val: timeLeft.days },
                { label: "HOURS", val: timeLeft.hours },
                { label: "MINS", val: timeLeft.minutes },
                { label: "SECS", val: timeLeft.seconds },
              ].map((item, idx) => (
                <div key={idx} className="bg-black/70 border border-white/25 px-2 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-xl backdrop-blur-md flex flex-col items-center justify-center">
                  <span className="text-lg sm:text-2xl font-mono font-extrabold text-white block leading-none">
                    {String(item.val).padStart(2, "0")}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-white/80 font-bold tracking-widest mt-1">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TWO COLUMN CONTENT LAYOUT */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 sm:gap-8 pt-2">
          
          {/* LEFT COLUMN: MAIN EVENT DETAILS */}
          <div className="space-y-6 sm:space-y-8">
            
            {/* ABOUT THIS EVENT CARD */}
            <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden py-0">
              <CardContent className="p-4 sm:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    About This Event
                  </h2>
                  <div className="h-1.5 w-12 sm:w-16 rounded-full" style={themeStyle} />
                </div>
                <Separator className="bg-zinc-800" />
                <p className="text-gray-300 text-xs sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* TICKET OPTIONS SHOWCASE */}
            <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden py-0">
              <CardContent className="p-4 sm:p-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                    <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    Available Ticket Passes
                  </h2>
                  <span className="text-[10px] text-gray-400 font-mono bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800 w-fit">
                    Instant QR Ticket Delivery
                  </span>
                </div>
                <Separator className="bg-zinc-800" />

                <div className="space-y-3 pt-1">
                  {event.tickets && event.tickets.length > 0 ? (
                    event.tickets.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 sm:p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 hover:border-amber-500/50 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm sm:text-base truncate">{t.name}</span>
                            <Badge className="bg-purple-950 text-purple-300 text-[9px] border-purple-800 shrink-0">
                              Pass
                            </Badge>
                          </div>
                          {t.description && <p className="text-[11px] text-gray-400 truncate">{t.description}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-lg sm:text-xl font-extrabold text-amber-400 block">
                            {t.price === 0 ? "FREE" : `₹${t.price}`}
                          </span>
                          <span className="text-[9px] text-gray-500">Per Pass</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <span className="font-bold text-white text-sm sm:text-base block truncate">Standard Admission Pass</span>
                        <p className="text-[11px] text-gray-400 truncate">Full access pass for all event activities</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xl sm:text-2xl font-extrabold text-amber-400 block">
                          {event.ticketType === "free" ? "FREE" : `₹${event.ticketPrice}`}
                        </span>
                        <span className="text-[9px] text-gray-500">Per Pass</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* VENUE & LOCATION DETAILS */}
            <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden py-0">
              <CardContent className="p-4 sm:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    Venue & Location
                  </h2>
                  <div className="h-1.5 w-12 sm:w-16 rounded-full" style={themeStyle} />
                </div>
                <Separator className="bg-zinc-800" />

                <div className="p-4 sm:p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm sm:text-base">
                        {event.city}, {event.state || event.country || "India"}
                      </h4>
                      {event.address && <p className="text-xs text-gray-400">{event.address}</p>}
                    </div>

                    {event.venue && (
                      <Button variant="outline" size="sm" asChild className="gap-2 text-xs border-zinc-800 text-purple-300 hover:text-white shrink-0 w-full sm:w-auto">
                        <a href={event.venue} target="_blank" rel="noopener noreferrer">
                          <Navigation className="w-3.5 h-3.5 text-purple-400" />
                          Directions <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ORGANIZER SHOWCASE CARD */}
            <Card className="bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden py-0">
              <CardContent className="p-4 sm:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    Hosted by
                  </h2>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!user) {
                        toast.error("Please sign in to follow hosts");
                        return;
                      }
                      setFollowing(!following);
                      if (!following) {
                        toast.success(`You are now following ${event.organizerName}! 🎉`);
                      } else {
                        toast.info(`Unfollowed ${event.organizerName}`);
                      }
                    }}
                    className={`text-xs gap-1.5 ${
                      following
                        ? "bg-purple-950/80 border-purple-600 text-purple-300"
                        : "border-purple-500/40 text-purple-300 hover:bg-purple-950/40"
                    }`}
                  >
                    {following ? <CheckCircle2 className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    {following ? "Following Host" : "+ Follow Host"}
                  </Button>
                </div>
                <Separator className="bg-zinc-800" />

                <div className="flex items-center gap-3.5 pt-1">
                  <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-amber-400/40 shadow-lg shrink-0">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-purple-900 font-extrabold text-base sm:text-lg text-white">
                      {event.organizerName?.charAt(0).toUpperCase() || "E"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white text-sm sm:text-base truncate">{event.organizerName}</p>
                      <Badge className="bg-amber-950 text-amber-300 border-amber-700/40 text-[9px] px-1.5 shrink-0">
                        Verified Host
                      </Badge>
                    </div>
                    <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 truncate">
                      Event Organizer • Creating experiences
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN: DESKTOP BOOKING CARD */}
          <div className="lg:sticky lg:top-24 h-fit space-y-4">
            
            <Card className="overflow-hidden py-0 bg-gradient-to-b from-zinc-900/95 via-zinc-900 to-zinc-950 border-zinc-800 backdrop-blur-2xl shadow-2xl rounded-2xl relative">
              
              {/* Dynamic Subscribed Theme Header Banner Bar */}
              <div className="h-3.5 w-full shadow-md" style={themeStyle} />

              <CardContent className="p-6 space-y-5">
                
                {/* Pricing & Ticket Status */}
                <div className="flex items-baseline justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <span className="text-xs text-gray-400 uppercase tracking-widest block font-semibold mb-1">
                      Ticket Price
                    </span>
                    <span className="text-3xl sm:text-4xl font-extrabold text-amber-400">
                      {event.ticketType === "free" ? "FREE" : `₹${event.ticketPrice}`}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800">
                    {event.ticketType === "free" ? "Free Registration" : "Pay At Venue"}
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-purple-400" /> Registrations
                    </span>
                    <span className="font-bold text-white">
                      {event.registrationCount} / {event.capacity} seats
                    </span>
                  </div>
                  <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-md"
                      style={{ ...themeStyle, width: `${capacityPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 text-right">
                    {remainingCapacity > 0 ? `${remainingCapacity} seats remaining` : "House Full"}
                  </p>
                </div>

                <Separator className="bg-zinc-800" />

                {/* Main Registration CTAs */}
                {registration ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 bg-emerald-950/50 border border-emerald-700/50 p-3 rounded-xl text-xs font-semibold text-center">
                      <CheckCircle className="w-4 h-4" />
                      <span>You are registered for this event!</span>
                    </div>
                    <Button
                      style={themeStyle}
                      className="w-full text-white font-extrabold gap-2 text-sm h-11 rounded-xl shadow-xl border-none"
                      onClick={() => router.push("/my-tickets")}
                    >
                      <Ticket className="w-4 h-4" /> View My Digital Ticket
                    </Button>
                  </div>
                ) : isEventPast ? (
                  <Button className="w-full h-11 bg-zinc-800 text-gray-400 font-bold rounded-xl" disabled>
                    Event Has Ended
                  </Button>
                ) : isEventFull ? (
                  <div className="space-y-2">
                    <Button className="w-full h-11 bg-zinc-800 text-gray-400 font-bold rounded-xl" disabled>
                      Capacity Reached
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-xs text-purple-300 border-purple-500/40 h-9"
                      onClick={() => {
                        toast.success("Joined waitlist! We will notify you if a seat opens up.");
                      }}
                    >
                      Join Waitlist
                    </Button>
                  </div>
                ) : isOrganizer ? (
                  <Button
                    style={themeStyle}
                    className="w-full h-11 text-white font-extrabold rounded-xl border-none shadow-xl"
                    onClick={() => router.push(`/my-events/${event._id}`)}
                  >
                    Manage Event Dashboard
                  </Button>
                ) : (
                  <Button
                    style={themeStyle}
                    className="w-full h-12 text-white font-extrabold gap-2 rounded-xl text-base shadow-2xl transition-all hover:scale-[1.03] border-none uppercase tracking-wide"
                    onClick={handleRegister}
                  >
                    <Ticket className="w-5 h-5" />
                    Register for Event
                  </Button>
                )}

                {/* Add to Calendar Link */}
                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Add to Google Calendar
                </a>

                {/* Social Share Button */}
                <Button
                  variant="outline"
                  className="w-full gap-2 text-xs border-zinc-800 text-gray-300 hover:text-white h-10"
                  onClick={handleShare}
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  {copiedLink ? "Link Copied!" : "Share Event with Friends"}
                </Button>

                <div className="pt-2 text-center text-[10px] text-gray-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Instant QR Ticket Generation • Guaranteed Entry
                </div>

              </CardContent>
            </Card>

            {/* Platform Branding Badge */}
            {!event.customBranding?.removePlatformBranding && (
              <div className="text-center py-2">
                <span className="text-xs text-gray-400 font-medium tracking-wide flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                  ⚡ Powered by <strong className="text-purple-400">Evenza AI</strong>
                </span>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* STICKY BOTTOM MOBILE ACTION BAR (Powered by Subscribed Theme Color) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-slate-950/95 border-t border-zinc-800/90 backdrop-blur-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.9)] flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-medium">Ticket</span>
          <span className="text-xl font-extrabold text-amber-400">
            {event.ticketType === "free" ? "FREE" : `₹${event.ticketPrice}`}
          </span>
        </div>

        {registration ? (
          <Button
            style={themeStyle}
            size="sm"
            className="text-white font-bold gap-1.5 border-none shadow-lg text-xs h-10 px-4 rounded-xl"
            onClick={() => router.push("/my-tickets")}
          >
            <Ticket className="w-4 h-4" /> View Ticket
          </Button>
        ) : isEventPast ? (
          <Button size="sm" className="bg-zinc-800 text-gray-400 text-xs h-10 px-4 rounded-xl" disabled>
            Ended
          </Button>
        ) : isEventFull ? (
          <Button size="sm" className="bg-zinc-800 text-gray-400 text-xs h-10 px-4 rounded-xl" disabled>
            Full
          </Button>
        ) : isOrganizer ? (
          <Button
            style={themeStyle}
            size="sm"
            className="text-white font-bold text-xs h-10 px-4 rounded-xl border-none"
            onClick={() => router.push(`/my-events/${event._id}`)}
          >
            Dashboard
          </Button>
        ) : (
          <Button
            style={themeStyle}
            size="sm"
            className="text-white font-extrabold gap-1.5 text-xs h-10 px-5 rounded-xl shadow-xl border-none uppercase tracking-wide"
            onClick={handleRegister}
          >
            <Ticket className="w-4 h-4" /> Register Pass
          </Button>
        )}
      </div>

      {/* REGISTER MODAL */}
      {showRegistrationModal && (
        <RegisterModal
          event={event}
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
        />
      )}
    </div>
  );
};

export default EventPage;
