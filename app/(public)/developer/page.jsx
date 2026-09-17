"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Sparkles,
  Rocket,
  Brain,
  Globe,
  Mail,
  Linkedin,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  Award,
  Terminal,
  Heart,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function DeveloperPage() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const developerName = "Aman Patel";
  const email = "aman082199@gmail.com";
  const linkedinUrl = "https://www.linkedin.com/in/aman-patel-7098b8282";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const techStack = [
    { name: "Next.js 16", desc: "App Router & React Server Components", icon: Globe, color: "from-blue-500 to-cyan-500" },
    { name: "React 19", desc: "Latest Concurrent & Actions Engine", icon: Code2, color: "from-cyan-400 to-teal-400" },
    { name: "Convex DB", desc: "Real-time Reactive Cloud Database", icon: Cpu, color: "from-orange-500 to-amber-500" },
    { name: "Clerk Auth", desc: "Enterprise Auth & User Entitlements", icon: Layers, color: "from-purple-500 to-indigo-500" },
    { name: "Google Gemini AI", desc: "AI Copilot & Generative Engine", icon: Brain, color: "from-pink-500 to-rose-500" },
    { name: "Tailwind CSS", desc: "Sleek Dark Mode & Glassmorphism UI", icon: Sparkles, color: "from-emerald-400 to-teal-500" },
  ];

  const highlights = [
    {
      title: "AI Event Generator & Copilot",
      desc: "Designed and implemented an intelligent prompt engine that drafts complete event listings, agendas, and marketing content automatically.",
      tag: "AI Engineering"
    },
    {
      title: "Real-time QR Ticket Verification",
      desc: "Built a zero-latency digital ticket scanner supporting camera QR code reading, offline fallbacks, and instantaneous check-in syncing.",
      tag: "Full-Stack Logic"
    },
    {
      title: "Multi-Format Marketing AI",
      desc: "Engineered a content engine generating tailored posts for Instagram, WhatsApp, LinkedIn, and email invitations in seconds.",
      tag: "Generative AI"
    },
    {
      title: "Tiered Entitlement Architecture",
      desc: "Architected a scalable plan & limit gating layer managing Free vs. Pro feature restrictions seamlessly across backend and frontend.",
      tag: "System Design"
    }
  ];

  return (
    <div className="min-h-screen pb-20 px-3 sm:px-6 overflow-x-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-72 sm:h-96 bg-gradient-to-r from-purple-600/15 via-pink-500/10 to-blue-600/15 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16">
        
        {/* HERO SECTION */}
        <section className="text-center pt-4 sm:pt-8 md:pt-12 space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/30 backdrop-blur-md text-purple-300 text-xs sm:text-sm font-medium shadow-lg shadow-purple-900/20 max-w-full truncate">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse shrink-0" />
            <span className="truncate">Meet {developerName} — The Creator of Evenza</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight">
            Designed & Built By <br className="hidden xs:inline" />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              {developerName}
            </span>
          </h1>

          <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-2">
            Evenza was envisioned, architected, and built from scratch by {developerName} to revolutionize how event organizers create, market, and manage live & digital events with AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-xs sm:max-w-none mx-auto">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl px-6 py-4 sm:py-5 shadow-lg shadow-purple-500/25 text-sm">
                Explore Evenza Platform <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                className="w-full sm:w-auto border-blue-500/40 bg-zinc-900/80 hover:bg-blue-950/40 text-blue-400 hover:text-blue-300 font-semibold rounded-xl px-5 py-4 sm:py-5 text-sm"
              >
                <Linkedin className="w-4 h-4 mr-2 text-blue-400 shrink-0" />
                <span>LinkedIn</span>
              </Button>
            </a>
            <Button
              variant="outline"
              onClick={handleCopyEmail}
              className="w-full sm:w-auto border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-gray-200 rounded-xl px-5 py-4 sm:py-5 text-sm break-all"
            >
              {copiedEmail ? <Check className="w-4 h-4 mr-2 text-emerald-400 shrink-0" /> : <Mail className="w-4 h-4 mr-2 text-purple-400 shrink-0" />}
              <span className="truncate">{copiedEmail ? "Email Copied!" : email}</span>
            </Button>
          </div>
        </section>

        {/* DEVELOPER PROFILE CARD */}
        <Card className="border-purple-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-purple-950/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <CardContent className="p-5 sm:p-8 md:p-12 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            
            {/* Avatar Visual with Developer Photo */}
            <div className="relative shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 p-1 shadow-2xl shadow-purple-500/30 group">
                <div className="w-full h-full rounded-[22px] bg-zinc-950 flex items-center justify-center relative overflow-hidden border border-zinc-800">
                  <img
                    src="/api/developer-photo"
                    alt="Aman Patel - Lead Developer of Evenza"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback if image path changes
                      e.currentTarget.src = "/aman-patel.jpg";
                    }}
                  />
                </div>
              </div>
              <Badge className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 font-extrabold text-[10px] sm:text-[11px] px-3 py-0.5 rounded-full shadow-md whitespace-nowrap border border-emerald-400/50">
                ● PLATFORM ARCHITECT
              </Badge>
            </div>

            {/* Developer Bio & Direct Contact Details */}
            <div className="space-y-4 text-center md:text-left flex-1 w-full">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{developerName}</h2>
                  <Badge variant="outline" className="border-purple-500/50 text-purple-300 text-xs">
                    Lead Developer
                  </Badge>
                </div>
                <p className="text-purple-400 text-xs sm:text-sm font-medium">Full-Stack Engineer & AI System Architect</p>
              </div>

              <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed">
                Hi! I&apos;m <strong>{developerName}</strong>, the creator and developer of Evenza. I designed this platform to merge modern full-stack web engineering with applied AI intelligence — offering event organizers seamless ticket generation, real-time QR attendance check-ins, AI copilot insights, and automated social marketing tools.
              </p>

              {/* Direct Contact Badges */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center md:justify-start gap-2.5 w-full">
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-blue-300 bg-zinc-900 hover:bg-blue-950/60 px-3.5 py-2.5 rounded-xl border border-blue-500/30 hover:border-blue-400 transition-all text-center sm:text-left"
                >
                  <Linkedin className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>LinkedIn Profile</span>
                </a>
                <a
                  href={`mailto:${email}`}
                  className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-gray-200 bg-zinc-900 hover:bg-purple-950/60 px-3.5 py-2.5 rounded-xl border border-zinc-800 hover:border-purple-500/50 transition-all text-center sm:text-left break-all"
                >
                  <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="truncate">{email}</span>
                </a>
              </div>

              <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-400 bg-zinc-900/90 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Full-Stack & AI Specialist</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-400 bg-zinc-900/90 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                  <Rocket className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>Production Ready Engineering</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WHY EVENZA WAS BUILT */}
        <div className="space-y-6 sm:space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-3xl font-bold text-white">Engineering Achievements</h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto px-2">
              Key platform capabilities engineered by {developerName} to simplify event management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {highlights.map((item, idx) => (
              <Card key={idx} className="border-zinc-800 bg-zinc-900/60 hover:border-purple-500/40 transition-all duration-300 group">
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-purple-950/60 text-purple-300 text-[11px] sm:text-xs border border-purple-500/30">
                      {item.tag}
                    </Badge>
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* TECH STACK GRID */}
        <div className="space-y-6 sm:space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-3xl font-bold text-white">Technology Stack</h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto px-2">
              Leveraging modern technologies chosen by {developerName} for scale & real-time responsiveness.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {techStack.map((tech, i) => {
              const Icon = tech.icon;
              return (
                <div
                  key={i}
                  className="p-4 sm:p-5 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950/80 hover:border-purple-500/50 transition-all duration-300 flex flex-row sm:flex-col items-center sm:items-start gap-3.5 sm:gap-3 group"
                >
                  <div className={`p-2.5 rounded-xl bg-gradient-to-r ${tech.color} text-zinc-950 font-bold shadow-md shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                      {tech.name}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                      {tech.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER CTA & DIRECT CONTACT CARD */}
        <Card className="border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-pink-950/30 text-center p-6 sm:p-10 md:p-12 space-y-6">
          <div className="max-w-xl mx-auto space-y-2 sm:space-y-3">
            <h3 className="text-xl sm:text-3xl font-extrabold text-white">
              Connect directly with {developerName}
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed px-2">
              Have feedback, custom project inquiries, or technical opportunities? Feel free to connect on LinkedIn or drop an email anytime.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm sm:max-w-none mx-auto">
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                className="w-full sm:w-auto border-blue-500/40 bg-zinc-900/90 hover:bg-blue-950/50 text-blue-400 hover:text-blue-300 font-semibold rounded-xl px-5 py-4 sm:py-5 gap-2 text-xs sm:text-sm"
              >
                <Linkedin className="w-4 h-4 shrink-0" />
                <span>LinkedIn Profile</span>
              </Button>
            </a>

            <Button
              onClick={handleCopyEmail}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl px-5 py-4 sm:py-5 gap-2 shadow-lg shadow-purple-500/20 text-xs sm:text-sm"
            >
              {copiedEmail ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Mail className="w-4 h-4 shrink-0" />}
              <span className="truncate">{copiedEmail ? "Email Copied!" : email}</span>
            </Button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
            <span>Handcrafted with</span>
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
            <span>by {developerName}</span>
          </div>
        </Card>

      </div>
    </div>
  );
}
