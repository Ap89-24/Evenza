"use client";

import React from "react";
import Link from "next/link";
import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BrandSymbol({ hasPro = false }) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 select-none transition-transform duration-200 hover:scale-[1.02]"
    >
      {/* Official Evenza Iconic Brand Emblem */}
      <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(147,51,234,0.3)] transition-transform duration-300 group-hover:rotate-3"
        >
          <defs>
            <linearGradient id="evenzaBg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9333ea" />
              <stop offset="0.5" stopColor="#6366f1" />
              <stop offset="1" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="evenzaSymbol" x1="10" y1="10" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ffffff" />
              <stop offset="1" stopColor="#e0e7ff" />
            </linearGradient>
          </defs>

          {/* Squircle Base */}
          <rect width="40" height="40" rx="11" fill="url(#evenzaBg)" />

          {/* Custom Interlocking 'E' Event Monogram */}
          {/* Top Bar with Starburst Notch */}
          <path
            d="M12 11H27C27.5523 11 28 11.4477 28 12V14.5C28 15.0523 27.5523 15.5 27 15.5H16.5V18.5H24.5C25.0523 18.5 25.5 18.9477 25.5 19.5V22C25.5 22.5523 25.0523 23 24.5 23H16.5V26H27C27.5523 26 28 26.4477 28 27V29.5C28 30.0523 27.5523 30.5 27 30.5H12C11.4477 30.5 11 30.0523 11 29.5V12.5C11 11.9477 11.4477 11.5 12 11.5Z"
            fill="url(#evenzaSymbol)"
          />

          {/* Event Starburst Spark Node */}
          <path
            d="M27 9.5L28.2 11.8L30.5 13L28.2 14.2L27 16.5L25.8 14.2L23.5 13L25.8 11.8L27 9.5Z"
            fill="#38bdf8"
          />
        </svg>
      </div>

      {/* Clean Brand Typography */}
      <div className="flex items-center gap-2">
        <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-white group-hover:text-purple-200 transition-colors">
          Evenza
        </span>

        {/* Pro Subscription Badge */}
        {hasPro && (
          <Badge className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white text-[11px] px-2 py-0.5 rounded-md font-bold tracking-wide flex items-center gap-1 shadow-sm border border-white/20">
            <Crown className="w-3 h-3 fill-amber-300 text-amber-300" />
            PRO
          </Badge>
        )}
      </div>
    </Link>
  );
}
