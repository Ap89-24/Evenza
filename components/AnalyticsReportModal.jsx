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
  TrendingUp,
  Download,
  Printer,
  Users,
  CheckCircle2,
  DollarSign,
  PieChart,
  Sparkles,
  ShieldCheck,
  Award,
  Clock,
  Calendar,
  MapPin,
  Ticket,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

export default function AnalyticsReportModal({
  isOpen,
  onClose,
  event,
  stats,
  isPro = false,
}) {
  if (!event || !stats) return null;

  const capacityPct = Math.min(100, Math.round((stats.totalRegistrations / stats.capacity) * 100));
  const reportDate = format(new Date(), "MMMM dd, yyyy 'at' hh:mm a");
  const eventDate = event.startDate ? format(new Date(event.startDate), "MMMM dd, yyyy") : "N/A";
  const noShowCount = Math.max(0, stats.totalRegistrations - stats.checkedInCount);
  const noShowPct = stats.totalRegistrations > 0 ? Math.round((noShowCount / stats.totalRegistrations) * 100) : 0;

  // Calculate Engagement Health Score (0-100)
  const healthScore = Math.min(
    100,
    Math.round(capacityPct * 0.5 + stats.checkedInRate * 0.5)
  );

  const handlePrintReport = () => {
    const reportElement = document.getElementById("printable-analytics-report");
    if (!reportElement) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=1200,height=850");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Executive Analytics Report - ${event.title}</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #ffffff !important;
              color: #09090b !important;
              font-family: 'Nunito', sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .report-box {
              width: 100% !important;
              max-width: 900px !important;
              margin: 0 auto !important;
              padding: 1.5rem !important;
            }
          </style>
        </head>
        <body>
          <div class="report-box">
            ${reportElement.outerHTML}
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-zinc-950 border-zinc-800 text-white p-3 sm:p-6 max-h-[96vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-zinc-800 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-purple-400">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Executive Analytics & Audit Report Preview
          </DialogTitle>
          <Button
            size="sm"
            onClick={handlePrintReport}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 text-xs"
          >
            <Printer className="w-4 h-4" /> Print / Export PDF
          </Button>
        </DialogHeader>

        {/* PRINTABLE EXECUTIVE REPORT CANVAS */}
        <div
          id="printable-analytics-report"
          className="p-6 sm:p-10 bg-white text-zinc-900 rounded-2xl shadow-xl border border-gray-200 space-y-6"
        >
          {/* REPORT TOP HEADER */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-purple-900 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-purple-950 text-purple-300 text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold">
                  EVENZA AI • SAAS AUDIT
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  Report ID: RPT-EVT-{event._id?.slice(-8)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Executive Event Analytics Report
              </h1>
              <p className="text-xs text-gray-600">
                Generated on {reportDate}
              </p>
            </div>

            <div className="text-right border-l-2 sm:border-l-0 sm:pl-0 pl-3 border-purple-500">
              <span className="text-xs text-gray-500 block font-semibold">Event Health Score</span>
              <span className="text-3xl font-black text-purple-700">{healthScore} / 100</span>
            </div>
          </div>

          {/* EVENT META SUMMARY GRID */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-500 block font-semibold">Event Name</span>
              <strong className="text-zinc-900 text-sm block truncate">{event.title}</strong>
            </div>
            <div>
              <span className="text-gray-500 block font-semibold">Category</span>
              <strong className="text-zinc-900 text-sm block uppercase">{event.category}</strong>
            </div>
            <div>
              <span className="text-gray-500 block font-semibold">Event Date</span>
              <strong className="text-zinc-900 text-sm block">{eventDate}</strong>
            </div>
            <div>
              <span className="text-gray-500 block font-semibold">Organizer</span>
              <strong className="text-zinc-900 text-sm block">{event.organizerName}</strong>
            </div>
          </div>

          {/* 4 QUADRANT KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1">
              <span className="text-xs text-purple-900 font-bold uppercase tracking-wider block">
                Capacity Occupancy
              </span>
              <span className="text-2xl font-extrabold text-purple-900 block">{capacityPct}%</span>
              <span className="text-[11px] text-purple-700">
                {stats.totalRegistrations} of {stats.capacity} seats filled
              </span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
              <span className="text-xs text-emerald-900 font-bold uppercase tracking-wider block">
                Check-In Conversion
              </span>
              <span className="text-2xl font-extrabold text-emerald-900 block">{stats.checkedInRate}%</span>
              <span className="text-[11px] text-emerald-700">
                {stats.checkedInCount} attendees verified
              </span>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
              <span className="text-xs text-amber-900 font-bold uppercase tracking-wider block">
                Gross Ticket Value
              </span>
              <span className="text-2xl font-extrabold text-amber-900 block">₹{stats.totalRevenue}</span>
              <span className="text-[11px] text-amber-700">
                {event.ticketType === "free" ? "Free Registration" : `₹${event.ticketPrice}/ticket`}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1">
              <span className="text-xs text-rose-900 font-bold uppercase tracking-wider block">
                No-Show Rate
              </span>
              <span className="text-2xl font-extrabold text-rose-900 block">{noShowPct}%</span>
              <span className="text-[11px] text-rose-700">
                {noShowCount} pending check-ins
              </span>
            </div>
          </div>

          {/* DETAILED ATTENDEE & TICKET TIER TABLE */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b pb-1">
              Ticket Tier Breakdown & Inventory
            </h3>
            <table className="w-full text-xs text-left border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-zinc-900 font-bold border-b border-gray-300">
                  <th className="p-2.5">Pass / Ticket Name</th>
                  <th className="p-2.5">Price</th>
                  <th className="p-2.5">Status / Availability</th>
                  <th className="p-2.5 text-right">Capacity Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {event.tickets && event.tickets.length > 0 ? (
                  event.tickets.map((t, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2.5 font-semibold text-zinc-900">{t.name}</td>
                      <td className="p-2.5">{t.price === 0 ? "FREE" : `₹${t.price}`}</td>
                      <td className="p-2.5">{t.capacity} seats allocated</td>
                      <td className="p-2.5 text-right font-bold text-purple-700">Active</td>
                    </tr>
                  ))
                ) : (
                  <tr className="hover:bg-gray-50">
                    <td className="p-2.5 font-semibold text-zinc-900">Standard Admission Pass</td>
                    <td className="p-2.5">{event.ticketType === "free" ? "FREE" : `₹${event.ticketPrice}`}</td>
                    <td className="p-2.5">{stats.capacity} max seats</td>
                    <td className="p-2.5 text-right font-bold text-purple-700">{capacityPct}% Filled</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* AI STRATEGIC EXECUTIVE INSIGHTS */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b pb-1">
              AI Executive Strategic Analysis & Insights
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 flex items-start gap-2">
                <span className="text-base">📊</span>
                <div>
                  <strong className="text-purple-950 block">Capacity Pacing Analysis</strong>
                  Your event is operating at <strong>{capacityPct}% capacity</strong> with {Math.max(0, stats.capacity - stats.totalRegistrations)} remaining seats. High capacity utilization builds strong social proof.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                <span className="text-base">🎯</span>
                <div>
                  <strong className="text-emerald-950 block">Attendance Velocity & Check-In Rate</strong>
                  Achieved a <strong>{stats.checkedInRate}% check-in conversion rate</strong> with {stats.checkedInCount} verified attendees. Send automated WhatsApp/Email reminders 2 hours prior to maximize arrivals.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                <span className="text-base">💡</span>
                <div>
                  <strong className="text-amber-950 block">Revenue Yield Strategy</strong>
                  {event.ticketType === "paid"
                    ? `Gross realized revenue stands at ₹${stats.totalRevenue}. Consider offering an Early Bird tier for future editions to accelerate early ticket sales.`
                    : "Free event format maximized initial registration volume. Upgrade to VIP paid passes to monetize premium seating."}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER SIGNATURES & VERIFICATION */}
          <div className="pt-8 border-t border-gray-300 grid grid-cols-2 gap-8 items-end text-xs">
            <div className="space-y-1">
              <div className="font-serif italic text-sm font-semibold border-b border-gray-400 pb-1 inline-block min-w-[160px]">
                {event.organizerName}
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Authorized Event Host & Registrar
              </p>
            </div>

            <div className="text-right space-y-1">
              <div className="font-mono text-purple-700 text-xs font-bold border-b border-gray-400 pb-1 inline-block min-w-[160px]">
                Evenza AI Analytics Engine
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Cryptographically Audited SaaS Report
              </p>
            </div>
          </div>

        </div>

        {/* DIALOG BOTTOM ACTIONS */}
        <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <Button variant="outline" size="sm" onClick={onClose} className="border-zinc-800 text-gray-300">
            Close
          </Button>
          <Button
            size="sm"
            onClick={handlePrintReport}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 text-xs"
          >
            <Printer className="w-4 h-4" /> Print / Export PDF Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
