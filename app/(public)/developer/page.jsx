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
  Check,
  ShieldCheck,
  Zap,
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
    { name: "Next.js 16", desc: "App Router & Server Components", icon: Globe },
    { name: "React 19", desc: "Concurrent & Actions Engine", icon: Code2 },
    { name: "Convex DB", desc: "Real-time Reactive Cloud DB", icon: Cpu },
    { name: "Clerk Auth", desc: "Enterprise Identity & Security", icon: Layers },
    { name: "Google Gemini AI", desc: "AI Copilot & Generative Engine", icon: Brain },
    { name: "Tailwind CSS", desc: "Sleek Dark Minimal Design System", icon: Sparkles },
  ];

  const highlights = [
    {
      title: "AI Event Generator & Copilot",
      desc: "Architected an intelligent prompt engine that drafts complete event listings, agendas, and marketing content automatically.",
      tag: "AI Engineering",
    },
    {
      title: "Real-time QR Ticket Verification",
      desc: "Built a zero-latency digital ticket scanner supporting live camera QR reading, offline fallbacks, and instant attendance syncing.",
      tag: "Full-Stack System",
    },
    {
      title: "Multi-Format Marketing AI Engine",
      desc: "Engineered a content engine generating tailored posts for Instagram, WhatsApp, LinkedIn, and email invitations in seconds.",
      tag: "Generative Workflows",
    },
    {
      title: "Tiered Entitlement Architecture",
      desc: "Designed a scalable feature gating layer managing Free vs. Pro entitlement limits seamlessly across backend and frontend.",
      tag: "System Architecture",
    },
  ];

  return (
    <div className="min-h-screen pb-20 px-3 sm:px-6 overflow-x-hidden text-slate-100">
      {/* Subtle Background Backdrop Accent */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-72 sm:h-96 bg-purple-950/20 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16">
        
        {/* HERO SECTION */}
        <section className="text-center pt-6 sm:pt-10 md:pt-14 space-y-5 sm:space-y-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 backdrop-blur-md text-zinc-300 text-xs sm:text-sm font-medium shadow-lg max-w-full truncate">
            <Terminal className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">Meet {developerName} — Creator & Lead Developer</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight">
            Designed & Built By{" "}
            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              {developerName}
            </span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-2 font-normal">
            Evenza was envisioned, architected, and engineered from scratch by {developerName} to revolutionize how event organizers create, market, and manage live & digital events using applied AI intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-xs sm:max-w-none mx-auto">
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-xl px-6 py-5 text-sm shadow-xl transition-all">
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
                className="w-full sm:w-auto border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 font-medium rounded-xl px-5 py-5 text-sm transition-all"
              >
                <Linkedin className="w-4 h-4 mr-2 text-zinc-300 shrink-0" />
                <span>LinkedIn</span>
              </Button>
            </a>

            <Button
              variant="outline"
              onClick={handleCopyEmail}
              className="w-full sm:w-auto border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 font-medium rounded-xl px-5 py-5 text-sm break-all transition-all"
            >
              {copiedEmail ? (
                <Check className="w-4 h-4 mr-2 text-emerald-400 shrink-0" />
              ) : (
                <Mail className="w-4 h-4 mr-2 text-zinc-400 shrink-0" />
              )}
              <span className="truncate">{copiedEmail ? "Email Copied!" : email}</span>
            </Button>
          </div>
        </section>

        {/* DEVELOPER PROFILE CARD */}
        <Card className="border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-3xl">
          <CardContent className="p-5 sm:p-8 md:p-12 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            
            {/* Avatar Image with Professional Border */}
            <div className="relative shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-3xl border-2 border-zinc-800 p-1.5 bg-zinc-900 shadow-2xl group">
                <div className="w-full h-full rounded-[20px] bg-zinc-950 flex items-center justify-center relative overflow-hidden border border-zinc-800/80">
                  <img
                    src="/aman-patel.jpg"
                    alt="Aman Patel - Lead Developer of Evenza"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = "/logo.png";
                    }}
                  />
                </div>
              </div>
              <Badge className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-200 font-bold text-[10px] sm:text-[11px] px-3.5 py-1 rounded-full shadow-lg whitespace-nowrap border border-zinc-700/80">
                ● CREATOR & ARCHITECT
              </Badge>
            </div>

            {/* Developer Bio & Contact Info */}
            <div className="space-y-4 text-center md:text-left flex-1 w-full">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{developerName}</h2>
                  <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold px-3 py-0.5">
                    Lead Developer
                  </Badge>
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm font-medium">
                  Full-Stack Engineer & AI System Architect
                </p>
              </div>

              <p className="text-zinc-300 text-xs sm:text-sm md:text-base leading-relaxed font-normal">
                Hi! I&apos;m <strong>{developerName}</strong>, the creator and developer of Evenza. I engineered this platform to blend full-stack web architecture with intelligent AI automation — equipping event organizers with seamless QR ticket generation, real-time check-ins, AI copilot insights, and automated social marketing tools.
              </p>

              {/* Direct Contact Links */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center md:justify-start gap-2.5 w-full">
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-zinc-200 bg-zinc-950/80 hover:bg-zinc-800 px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all text-center sm:text-left"
                >
                  <Linkedin className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>LinkedIn Profile</span>
                </a>
                <a
                  href={`mailto:${email}`}
                  className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-zinc-300 bg-zinc-950/80 hover:bg-zinc-800 px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all text-center sm:text-left break-all"
                >
                  <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="truncate">{email}</span>
                </a>
              </div>

              {/* Specialization Pills */}
              <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400 bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-zinc-800/80">
                  <Award className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Full-Stack & AI Specialist</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-zinc-400 bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-zinc-800/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Production-Grade Systems</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ENGINEERING ACHIEVEMENTS */}
        <div className="space-y-6 sm:space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-3xl font-bold text-white">Engineering Highlights</h2>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto px-2">
              Key platform capabilities architected by {developerName} to streamline event management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {highlights.map((item, idx) => (
              <Card key={idx} className="border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 transition-all duration-300 group rounded-2xl">
                <CardContent className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-[11px] sm:text-xs border border-zinc-700/60 font-medium">
                      {item.tag}
                    </Badge>
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
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
            <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto px-2">
              Modern full-stack technologies selected by {developerName} for high performance and real-time reactivity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
            {techStack.map((tech, i) => {
              const Icon = tech.icon;
              return (
                <div
                  key={i}
                  className="p-4 sm:p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 transition-all duration-300 flex flex-row sm:flex-col items-center sm:items-start gap-3.5 sm:gap-3 group"
                >
                  <div className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700/60 text-purple-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                      {tech.name}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5 leading-snug font-normal">
                      {tech.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER DIRECT CONTACT CARD */}
        <Card className="border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl text-center p-6 sm:p-10 md:p-12 space-y-6 rounded-3xl">
          <div className="max-w-xl mx-auto space-y-2 sm:space-y-3">
            <h3 className="text-xl sm:text-3xl font-extrabold text-white">
              Connect Directly with {developerName}
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed px-2 font-normal">
              Have feedback, custom project inquiries, or technical opportunities? Feel free to connect on LinkedIn or reach out via email.
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
                className="w-full sm:w-auto border-zinc-800 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-200 font-medium rounded-xl px-6 py-5 gap-2 text-xs sm:text-sm transition-all"
              >
                <Linkedin className="w-4 h-4 text-purple-400 shrink-0" />
                <span>LinkedIn Profile</span>
              </Button>
            </a>

            <Button
              onClick={handleCopyEmail}
              className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-xl px-6 py-5 gap-2 text-xs sm:text-sm transition-all shadow-xl"
            >
              {copiedEmail ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Mail className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">{copiedEmail ? "Email Copied!" : email}</span>
            </Button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <span>Handcrafted by</span>
            <span className="font-semibold text-zinc-300">{developerName}</span>
          </div>
        </Card>

      </div>
    </div>
  );
}
