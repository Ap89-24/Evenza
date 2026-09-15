"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from 'next/link';
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  QrCode,
  MapPin,
  Calendar,
  Palette,
  Users,
  Zap,
  ShieldCheck,
  Globe,
  ArrowRight,
  Ticket,
  Bot,
  Crown,
  CheckCircle2,
  History,
} from "lucide-react";

export default function Home() {
  const heroRef = useRef(null);

  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });

      tl.from(".hero-tag", {
        opacity: 0,
        y: 10,
        duration: 0.6,
      })
        .from(
          ".hero-title",
          {
            opacity: 0,
            y: 40,
            duration: 0.9,
          },
          "-=0.3"
        )
        .from(
          ".hero-desc",
          {
            opacity: 0,
            y: 20,
            duration: 0.6,
          },
          "-=0.4"
        )
        .fromTo(
          ".hero-btn",
          {
            opacity: 0,
            y: 25,
            scale: 0.85,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
          },
          "-=0.2"
        )
        .from(
          ".hero-img",
          {
            opacity: 0,
            scale: 0.9,
            duration: 1,
          },
          "-=0.8"
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen pb-20 space-y-20 sm:space-y-28">
      {/* HERO SECTION */}
      <section ref={heroRef} className="pt-4 pb-12 sm:pb-16 relative overflow-hidden">
        {/* Glow backlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/15 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Text Column */}
          <div className="text-center sm:text-left space-y-6">
            <div className="hero-tag inline-flex items-center gap-2 bg-purple-950/60 border border-purple-800/60 px-3.5 py-1.5 rounded-full text-xs font-semibold text-purple-300 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Next-Gen AI Powered Event Platform</span>
            </div>

            <h1 className="hero-title text-4xl sm:text-6xl md:text-7xl font-extrabold leading-[1.15] tracking-tight text-slate-100">
              Discover & <br />
              Create Amazing <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-orange-400 bg-clip-text text-transparent font-extrabold drop-shadow-[0_0_25px_rgba(168,85,247,0.45)]">
                Events Worldwide
              </span>
            </h1>

            <p className="hero-desc text-base sm:text-xl text-gray-300 max-w-lg font-normal leading-relaxed mx-auto sm:mx-0">
              Evenza connects organizers and attendees through AI-driven event creation, instant digital QR tickets, location discovery, and custom branding.
            </p>

            <div className="hero-btn flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
              <Link href="/explore">
                <Button
                  size="xl"
                  className="rounded-full cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base px-8 py-6 shadow-xl shadow-purple-500/25 border-none transition-all hover:scale-105 gap-2"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/past-events">
                <Button
                  variant="outline"
                  size="xl"
                  className="rounded-full border-zinc-800 text-gray-300 hover:text-white hover:bg-zinc-900 text-sm px-6 py-6"
                >
                  <History className="w-4 h-4 text-purple-400 mr-2" /> Past Events
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Hero Image Column */}
          <div className="hero-img relative flex justify-center">
            <Image
              src="/hero.gif"
              alt="hero-image"
              width={700}
              height={700}
              className="w-full h-auto max-w-lg lg:max-w-full drop-shadow-[0_20px_50px_rgba(168,85,247,0.3)]"
              priority
            />
          </div>
        </div>
      </section>

      {/* QUICK STATS BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-xl text-center">
          <div className="space-y-1">
            <span className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              100%
            </span>
            <p className="text-xs text-gray-400 font-medium">AI Copilot Creation</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Instant
            </span>
            <p className="text-xs text-gray-400 font-medium">QR Code Tickets</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              City-Wide
            </span>
            <p className="text-xs text-gray-400 font-medium">Smart Discovery</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Pro
            </span>
            <p className="text-xs text-gray-400 font-medium">Custom Branding</p>
          </div>
        </div>
      </section>

      {/* WHAT EVENZA DOES - KEY FEATURES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge className="bg-purple-950/80 text-purple-300 border-purple-800 px-3 py-1 text-xs font-semibold rounded-full">
            All-In-One Event Ecosystem
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Everything You Need to Host & Attend Events
          </h2>
          <p className="text-sm sm:text-base text-gray-400 font-normal">
            Whether you&apos;re organizing a major tech conference, hosting a local meetup, or finding your next weekend concert, Evenza makes it effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Feature 1 */}
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-purple-500/50 transition-all duration-300 group py-0 overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                AI Event Copilot
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Describe your event idea in plain text and let AI instantly generate compelling titles, detailed agendas, theme colors, and category tags.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-purple-500/50 transition-all duration-300 group py-0 overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                Instant Digital QR Passes
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Registered attendees receive unique digital QR code tickets instantly on mobile for fast, secure entry verification at event doors.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-purple-500/50 transition-all duration-300 group py-0 overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                Location & City Discovery
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Filter events by your city, state, or interest categories. Easily find nearby workshops, hackathons, concerts, and cultural meetups.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-purple-500/50 transition-all duration-300 group py-0 overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-950/80 border border-pink-800/80 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                Pro Custom Branding
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Customize event page colors, upload your organization logo, set custom ticket tiers, and remove platform watermarks for a professional look.
              </p>
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-purple-500/50 transition-all duration-300 group py-0 overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                Real-Time Attendee Tracking
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Monitor live registration progress, set seat capacity caps, manage waitlists, and interact directly with attendees from your dashboard.
              </p>
            </CardContent>
          </Card>

          {/* Feature 6 */}
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-purple-500/50 transition-all duration-300 group py-0 overflow-hidden">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                Active vs Past Events Archive
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Stay updated on upcoming events while preserving past event memories, host summaries, and history in our dedicated Past Events Archive.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* DUAL VALUE PROPOSITION - FOR ATTENDEES & ORGANIZERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* For Attendees */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-950 border border-blue-800 text-blue-400">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">For Attendees</h3>
                <p className="text-xs text-gray-400">Explore & Join Unforgettable Experiences</p>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>Personalized event recommendations matched to your city & interests</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>Instant digital ticket generation with high-res QR code for check-in</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>One-click Google Calendar sync so you never miss scheduled events</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <span>Follow verified hosts and get notified when new events are created</span>
              </li>
            </ul>

            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2">
              <Link href="/explore">
                Explore Events Near You <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* For Organizers */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-950 border border-purple-800 text-purple-400">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">For Event Organizers</h3>
                <p className="text-xs text-gray-400">Build, Brand & Grow Your Community</p>
              </div>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <span>Create events in minutes using AI text prompts & custom ticket tiers</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <span>Custom brand themes, logo uploads, and custom domain integrations</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <span>Live attendee registration dashboard & automated waitlist management</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <span>Organized event views separating active upcoming vs past events</span>
              </li>
            </ul>

            <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold gap-2 border-none">
              <Link href="/create-event">
                Create Event with AI <Sparkles className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION (CTA) BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative p-8 sm:p-14 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950 via-zinc-950 to-indigo-950 text-center space-y-6 overflow-hidden shadow-2xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-500/15 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to Experience Evenza?
            </h2>
            <p className="text-sm sm:text-base text-gray-300">
              Join thousands of attendees and organizers creating, discovering, and experiencing incredible events worldwide.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/explore">
                <Button size="lg" className="rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 gap-2">
                  Browse Events Now <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/create-event">
                <Button size="lg" variant="outline" className="rounded-full border-zinc-700 text-white hover:bg-zinc-900 px-8 gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Host an Event
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
