"use client";

import React, { useEffect, useState } from "react";

export default function AppSplashLoader() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show splash screen for 1.3s then trigger smooth fade out
    const timer = setTimeout(() => {
      setFadeOut(true);
      const removeTimer = setTimeout(() => {
        setLoading(false);
      }, 600); // match CSS fade-out duration
      return () => clearTimeout(removeTimer);
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 h-screen h-[100dvh] w-screen z-[9999] bg-slate-950 flex flex-col items-center justify-center select-none touch-none overflow-hidden transition-all duration-600 px-4 ${
        fadeOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Background Ambient Glow Orbs for Mobile & Desktop */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-purple-600/25 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 bg-blue-600/20 rounded-full blur-[90px] sm:blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-5 sm:gap-6 text-center">
        {/* Glowing Pulsing Evenza Icon Emblem */}
        <div className="relative flex items-center justify-center">
          {/* Outer Ring Pulse */}
          <div className="absolute -inset-3 sm:-inset-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 opacity-40 blur-lg sm:blur-xl animate-pulse" />
          
          <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl p-1 bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 shadow-[0_0_30px_rgba(147,51,234,0.5)] animate-bounce-subtle">
            <div className="w-full h-full bg-slate-950/90 rounded-[12px] sm:rounded-[14px] flex items-center justify-center p-2.5 sm:p-3 backdrop-blur-md">
              <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-[0_4px_16px_rgba(147,51,234,0.6)]"
              >
                <defs>
                  <linearGradient id="splashBg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9333ea" />
                    <stop offset="0.5" stopColor="#6366f1" />
                    <stop offset="1" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="splashSymbol" x1="10" y1="10" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffffff" />
                    <stop offset="1" stopColor="#e0e7ff" />
                  </linearGradient>
                </defs>

                <rect width="40" height="40" rx="11" fill="url(#splashBg)" />
                <path
                  d="M12 11H27C27.5523 11 28 11.4477 28 12V14.5C28 15.0523 27.5523 15.5 27 15.5H16.5V18.5H24.5C25.0523 18.5 25.5 18.9477 25.5 19.5V22C25.5 22.5523 25.0523 23 24.5 23H16.5V26H27C27.5523 26 28 26.4477 28 27V29.5C28 30.0523 27.5523 30.5 27 30.5H12C11.4477 30.5 11 30.0523 11 29.5V12.5C11 11.9477 11.4477 11.5 12 11.5Z"
                  fill="url(#splashSymbol)"
                />
                <path
                  d="M27 9.5L28.2 11.8L30.5 13L28.2 14.2L27 16.5L25.8 14.2L23.5 13L25.8 11.8L27 9.5Z"
                  fill="#38bdf8"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Brand Name Typography */}
        <div className="flex flex-col items-center gap-1.5 sm:gap-2">
          <span className="font-extrabold text-2xl sm:text-4xl tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-300 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(255,255,255,0.2)]">
            Evenza
          </span>
          <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-indigo-300/80 font-semibold whitespace-nowrap">
            Event Management Platform
          </span>
        </div>

        {/* Animated Loading Bar for Mobile & Desktop */}
        <div className="w-28 sm:w-36 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/10 relative mt-1 sm:mt-2 shadow-inner">
          <div className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full animate-loader-progress shadow-[0_0_12px_#9333ea]" />
        </div>
      </div>
    </div>
  );
}
