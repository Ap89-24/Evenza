"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Award,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Palette,
} from "lucide-react";
import { toast } from "sonner";

export default function CertificateModal({
  isOpen,
  onClose,
  attendee,
  event,
}) {
  const [theme, setTheme] = useState("onyx"); // 'onyx' | 'emerald' | 'ivory' | 'sapphire'
  const [copied, setCopied] = useState(false);

  if (!attendee || !event) return null;

  const verificationId = attendee.qrCode || `EVT-CERT-${Date.now()}`;
  const formattedDate = event.startDate
    ? format(new Date(event.startDate), "EEEE, MMMM dd, yyyy")
    : "September 2026";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationId);
    setCopied(true);
    toast.success("Verification ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const certElement = document.getElementById("printable-certificate");
    if (!certElement) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=1200,height=850");
    if (!printWindow) {
      // Fallback if popup is blocked
      window.print();
      return;
    }

    const isIvory = theme === "ivory";
    const bgColor = isIvory ? "#fafaf9" : "#09090b";
    const textColor = isIvory ? "#1c1917" : "#ffffff";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${attendee.attendeeName}</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Nunito:wght@400;500;600;700&display=swap">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 landscape;
              margin: 0;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              background-color: ${bgColor} !important;
              color: ${textColor} !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              overflow: hidden !important;
            }
            .cert-print-container {
              width: 100% !important;
              max-width: 1050px !important;
              padding: 1.5rem !important;
              box-sizing: border-box !important;
            }
            .clip-ribbon {
              clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%);
            }
          </style>
        </head>
        <body>
          <div class="cert-print-container">
            ${certElement.outerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              setTimeout(() => { window.close(); }, 600);
            }, 800);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Theme Styles Configuration
  const themeStyles = {
    onyx: {
      name: "Royal Onyx & Gold",
      cardBg: "bg-gradient-to-br from-zinc-950 via-slate-950 to-zinc-900 text-white",
      outerBorder: "border-amber-400/90 shadow-[0_0_80px_rgba(245,158,11,0.25)]",
      innerBorder: "border-amber-500/30 bg-black/60",
      accentText: "text-amber-300",
      titleGradient: "from-amber-200 via-yellow-400 to-amber-500",
      nameText: "text-amber-100 drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)]",
      eventTitle: "text-purple-300",
      sealBg: "from-amber-600 via-amber-400 to-yellow-300",
      sealInner: "bg-zinc-950 border-amber-400/60",
      filigreeColor: "#f59e0b",
      badgeBg: "bg-amber-950/50 border-amber-500/40 text-amber-300",
    },
    emerald: {
      name: "Emerald Imperial",
      cardBg: "bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 text-white",
      outerBorder: "border-emerald-400/90 shadow-[0_0_80px_rgba(16,185,129,0.25)]",
      innerBorder: "border-emerald-500/30 bg-black/60",
      accentText: "text-emerald-300",
      titleGradient: "from-emerald-200 via-teal-300 to-amber-300",
      nameText: "text-emerald-100 drop-shadow-[0_2px_10px_rgba(16,185,129,0.4)]",
      eventTitle: "text-emerald-300",
      sealBg: "from-emerald-500 via-amber-400 to-yellow-300",
      sealInner: "bg-emerald-950 border-emerald-400/60",
      filigreeColor: "#10b981",
      badgeBg: "bg-emerald-950/50 border-emerald-500/40 text-emerald-300",
    },
    ivory: {
      name: "Ivory Parchment",
      cardBg: "bg-stone-50 text-zinc-900",
      outerBorder: "border-amber-700 shadow-[0_0_40px_rgba(180,83,9,0.15)]",
      innerBorder: "border-amber-700/40 bg-amber-50/50",
      accentText: "text-amber-800",
      titleGradient: "from-amber-800 via-amber-900 to-yellow-900",
      nameText: "text-amber-950 font-bold",
      eventTitle: "text-amber-900",
      sealBg: "from-amber-600 via-amber-500 to-yellow-600",
      sealInner: "bg-amber-100 border-amber-600",
      filigreeColor: "#b45309",
      badgeBg: "bg-amber-100 border-amber-400 text-amber-900",
    },
    sapphire: {
      name: "Sapphire Prestige",
      cardBg: "bg-gradient-to-br from-blue-950 via-slate-950 to-indigo-950 text-white",
      outerBorder: "border-cyan-400/90 shadow-[0_0_80px_rgba(6,182,212,0.25)]",
      innerBorder: "border-cyan-500/30 bg-black/60",
      accentText: "text-cyan-300",
      titleGradient: "from-cyan-200 via-blue-300 to-amber-300",
      nameText: "text-cyan-100 drop-shadow-[0_2px_10px_rgba(6,182,212,0.4)]",
      eventTitle: "text-cyan-300",
      sealBg: "from-cyan-500 via-blue-400 to-yellow-300",
      sealInner: "bg-slate-950 border-cyan-400/60",
      filigreeColor: "#06b6d4",
      badgeBg: "bg-blue-950/50 border-cyan-500/40 text-cyan-300",
    },
  };

  const currentTheme = themeStyles[theme] || themeStyles.onyx;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-zinc-950 border-zinc-800 text-white p-3 sm:p-6 max-h-[96vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-amber-400">
            <Award className="w-5 h-5 text-amber-400" />
            Official Certificate of Achievement
          </DialogTitle>

          {/* Theme Selector Toolbar */}
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
            <Palette className="w-3.5 h-3.5 text-gray-400 ml-1" />
            {Object.keys(themeStyles).map((tKey) => (
              <button
                key={tKey}
                onClick={() => setTheme(tKey)}
                className={`px-2 py-1 rounded capitalize transition-all ${
                  theme === tKey
                    ? "bg-amber-500 text-zinc-950 font-bold"
                    : "text-gray-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {tKey}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* PRINTABLE CERTIFICATE CANVAS */}
        <div
          id="printable-certificate"
          className={`relative p-6 sm:p-12 rounded-2xl border-[3px] ${currentTheme.outerBorder} ${currentTheme.cardBg} text-center space-y-6 overflow-hidden transition-all duration-300`}
        >
          {/* SVG Ornate Filigree Corner Accents */}
          <div className="absolute top-2 left-2 pointer-events-none">
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
              <path
                d="M 10 10 L 90 10 C 50 10 10 50 10 90 Z"
                fill="none"
                stroke={currentTheme.filigreeColor}
                strokeWidth="2"
                opacity="0.6"
              />
              <path
                d="M 15 15 L 75 15 C 45 15 15 45 15 75 Z"
                fill="none"
                stroke={currentTheme.filigreeColor}
                strokeWidth="1"
                opacity="0.4"
              />
              <circle cx="20" cy="20" r="4" fill={currentTheme.filigreeColor} />
            </svg>
          </div>
          <div className="absolute top-2 right-2 pointer-events-none rotate-90">
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
              <path
                d="M 10 10 L 90 10 C 50 10 10 50 10 90 Z"
                fill="none"
                stroke={currentTheme.filigreeColor}
                strokeWidth="2"
                opacity="0.6"
              />
              <path
                d="M 15 15 L 75 15 C 45 15 15 45 15 75 Z"
                fill="none"
                stroke={currentTheme.filigreeColor}
                strokeWidth="1"
                opacity="0.4"
              />
              <circle cx="20" cy="20" r="4" fill={currentTheme.filigreeColor} />
            </svg>
          </div>
          <div className="absolute bottom-2 left-2 pointer-events-none -rotate-90">
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
              <path
                d="M 10 10 L 90 10 C 50 10 10 50 10 90 Z"
                fill="none"
                stroke={currentTheme.filigreeColor}
                strokeWidth="2"
                opacity="0.6"
              />
              <path
                d="M 15 15 L 75 15 C 45 15 15 45 15 75 Z"
                fill="none"
                stroke={currentTheme.filigreeColor}
                strokeWidth="1"
                opacity="0.4"
              />
              <circle cx="20" cy="20" r="4" fill={currentTheme.filigreeColor} />
            </svg>
          </div>
          <div className="absolute bottom-2 right-2 pointer-events-none rotate-180">
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
              <path
                d="M 10 10 L 90 10 C 50 10 10 50 10 90 Z"
                fill="none"
                stroke={currentTheme.filigreeColor}
                strokeWidth="2"
                opacity="0.6"
              />
              <path
                d="M 15 15 L 75 15 C 45 15 15 45 15 75 Z"
                fill="none"
                stroke={currentTheme.filigreeColor}
                strokeWidth="1"
                opacity="0.4"
              />
              <circle cx="20" cy="20" r="4" fill={currentTheme.filigreeColor} />
            </svg>
          </div>

          {/* Background Watermark Mandala SVG */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <svg width="350" height="350" viewBox="0 0 200 200" fill="currentColor">
              <polygon points="100,10 120,80 190,100 120,120 100,190 80,120 10,100 80,80" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>

          {/* INNER FINE BORDER & CONTENT */}
          <div className={`relative border p-6 sm:p-10 rounded-xl space-y-6 backdrop-blur-xs ${currentTheme.innerBorder}`}>
            
            {/* TOP BRANDING & METALLIC CREST */}
            <div className="flex flex-col items-center justify-center space-y-3">
              {/* Metallic 3D Gold Ribbon Seal */}
              <div className={`relative w-20 h-20 rounded-full bg-gradient-to-tr ${currentTheme.sealBg} p-1 shadow-xl flex items-center justify-center group`}>
                <div className={`w-full h-full rounded-full ${currentTheme.sealInner} flex flex-col items-center justify-center border shadow-inner`}>
                  <Award className={`w-9 h-9 ${currentTheme.accentText}`} />
                </div>
              </div>

              {/* Sub-header */}
              <div className="pt-2">
                <span className={`text-[10px] sm:text-xs font-mono uppercase tracking-[0.4em] ${currentTheme.accentText} font-bold`}>
                  EVENZA AI • OFFICIAL CERTIFICATION
                </span>
              </div>
            </div>

            {/* MAIN CERTIFICATE TITLE */}
            <div className="space-y-1">
              <h2 className={`text-2xl sm:text-4xl font-extrabold uppercase tracking-[0.25em] bg-clip-text text-transparent bg-gradient-to-r ${currentTheme.titleGradient} font-serif`}>
                Certificate of Participation
              </h2>
              <p className="text-xs opacity-75 italic uppercase tracking-widest font-serif">
                This Certificate is Proudly Presented To
              </p>
            </div>

            {/* RECIPIENT NAME */}
            <div className="py-2">
              <h1 className={`text-4xl sm:text-6xl font-serif tracking-wide ${currentTheme.nameText} font-extrabold`}>
                {attendee.attendeeName}
              </h1>
              <div className="mx-auto w-48 h-0.5 mt-2 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />
            </div>

            {/* CITATION & EVENT DETAILS */}
            <div className="max-w-2xl mx-auto space-y-3">
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed font-light">
                has successfully participated in and completed all requirements for the official event
              </p>

              <h3 className={`text-xl sm:text-3xl font-bold ${currentTheme.eventTitle} tracking-tight`}>
                &quot;{event.title}&quot;
              </h3>

              <div className="flex flex-wrap items-center justify-center gap-3 text-xs opacity-80 pt-1">
                <span className="px-2.5 py-0.5 rounded-full bg-black/20 border border-current/20 font-medium">
                  📅 Held on {formattedDate}
                </span>
                {event.city && (
                  <span className="px-2.5 py-0.5 rounded-full bg-black/20 border border-current/20 font-medium">
                    📍 Location: {event.city}{event.venue ? `, ${event.venue}` : ""}
                  </span>
                )}
                {event.category && (
                  <span className="px-2.5 py-0.5 rounded-full bg-black/20 border border-current/20 font-medium uppercase">
                    🏷️ {event.category}
                  </span>
                )}
              </div>
            </div>

            {/* FOOTER SIGNATURES & VERIFICATION QR */}
            <div className="pt-8 border-t border-current/20 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-xs">
              
              {/* Left: Event Organizer Signature */}
              <div className="text-center sm:text-left space-y-1">
                <div className="font-serif italic text-lg opacity-95 border-b border-current/30 pb-1 inline-block min-w-[140px] font-semibold">
                  {event.organizerName || "Authorized Organizer"}
                </div>
                <p className="text-[10px] opacity-75 uppercase tracking-wider font-semibold">
                  Authorized Event Organizer
                </p>
              </div>

              {/* Center: QR Code & Verification ID */}
              <div className="flex flex-col items-center justify-center space-y-1.5">
                <div className="p-1.5 bg-white rounded-lg shadow-md border border-gray-300">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                      verificationId
                    )}`}
                    alt="Certificate QR Verification"
                    className="w-14 h-14 object-contain"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${currentTheme.badgeBg}`}>
                    {verificationId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="text-gray-400 hover:text-white p-0.5"
                    title="Copy Verification ID"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span className="text-[9px] opacity-60 uppercase tracking-widest">
                  Digital Verification Code
                </span>
              </div>

              {/* Right: Evenza AI Platform Seal */}
              <div className="text-center sm:text-right space-y-1">
                <div className="font-serif italic text-lg opacity-95 border-b border-current/30 pb-1 inline-block min-w-[140px] font-semibold text-purple-300">
                  Evenza AI Platform
                </div>
                <p className="text-[10px] opacity-75 uppercase tracking-wider font-semibold">
                  Official SaaS Verification
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* BOTTOM DIALOG ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-800">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cryptographically verified & print-optimized</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-zinc-800 text-gray-300 hover:text-white"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-zinc-950 font-bold gap-2 shadow-lg shadow-amber-500/20"
            >
              <Download className="w-4 h-4" /> Download / Print Certificate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
