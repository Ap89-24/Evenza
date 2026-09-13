"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import {
  ArrowLeft,
  Award,
  Bot,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Crown,
  Download,
  Eye,
  Globe,
  Loader2,
  Lock,
  MapPin,
  Megaphone,
  Palette,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { getCategoryIcon, getCategoryLabel } from "@/lib/data";
import { toast } from "sonner";
import AttendeeCard from "./_components/AttendeeCard";
import QRScannerModel from "./_components/QRScannerModel";
import UpgradeModal from "@/components/UpgradeModal";
import CertificateModal from "@/components/CertificateModal";
import AnalyticsReportModal from "@/components/AnalyticsReportModal";
import ProFeatureLock from "@/components/ProFeatureLock";

const MARKETING_FORMATS = [
  { id: "instagram_post", label: "Instagram Post", icon: "📸", isFree: true },
  { id: "linkedin_post", label: "LinkedIn Post", icon: "💼", isFree: true },
  { id: "whatsapp_message", label: "WhatsApp Invite", icon: "💬", isFree: true },
  { id: "instagram_caption", label: "Instagram Caption", icon: "📝", isFree: false },
  { id: "instagram_reel", label: "Reel Script", icon: "🎬", isFree: false },
  { id: "email_announcement", label: "Email Announcement", icon: "✉️", isFree: false },
  { id: "event_reminder", label: "Event Reminder", icon: "⏰", isFree: false },
  { id: "last_seats", label: "Last Seats Alert", icon: "🔥", isFree: false },
  { id: "early_bird", label: "Early Bird Campaign", icon: "🏷️", isFree: false },
  { id: "thank_you", label: "Thank You Note", icon: "🎉", isFree: false },
];

const EventDashboard = () => {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.eventId;

  const [mainTab, setMainTab] = useState("overview");
  const [attendeeTab, setAttendeeTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState("header");

  // AI Copilot state
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotHistory, setCopilotHistory] = useState([]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Marketing AI state
  const [selectedFormat, setSelectedFormat] = useState("instagram_post");
  const [generatedMarketing, setGeneratedMarketing] = useState("");
  const [marketingLoading, setMarketingLoading] = useState(false);

  // Certificate Modal state
  const [selectedCertificateAttendee, setSelectedCertificateAttendee] = useState(null);

  // Analytics Report Modal state
  const [showAnalyticsReportModal, setShowAnalyticsReportModal] = useState(false);

  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const isPro = currentUser?.plan === "pro";

  const { data: DashboardData, isLoading } = useConvexQuery(
    api.dashboard.getEventDashboard,
    { eventId }
  );

  const { data: registrations, isLoading: registrationsLoading } =
    useConvexQuery(api.registrations.getEventRegistrations, { eventId });

  if (isLoading || registrationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!DashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        No Dashboard Data Found
      </div>
    );
  }

  const { event, stats } = DashboardData;

  // Filter registrations
  const filterRegistrations = (registrations || []).filter((reg) => {
    const matchesSearch =
      reg.attendeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.attendeeEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.qrCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (attendeeTab === "all") return matchesSearch && reg.status === "registered";
    if (attendeeTab === "checked-in") return matchesSearch && reg.checkedIn && reg.status === "registered";
    if (attendeeTab === "pending") return matchesSearch && !reg.checkedIn && reg.status === "registered";
    return matchesSearch;
  });

  const handleExportCSV = () => {
    if (!registrations || registrations.length === 0) {
      toast.error("No registrations to export");
      return;
    }

    const csvContent = [
      ["Name", "Email", "Registered At", "Checked In", "Checked In At", "QR Code"],
      ...registrations.map((reg) => [
        reg.attendeeName,
        reg.attendeeEmail,
        new Date(reg.registeredAt).toLocaleString(),
        reg.checkedIn ? "Yes" : "No",
        reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleString() : "-",
        reg.qrCode,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title || "event"}_registrations.csv`;
    a.click();
    toast.success("CSV exported successfully");
  };

  // AI Copilot Query Handler
  const handleCopilotSubmit = async (customPrompt) => {
    const promptToUse = customPrompt || copilotQuery;
    if (!promptToUse.trim()) return;

    if (!isPro) {
      setUpgradeTrigger("copilot");
      setShowUpgradeModal(true);
      return;
    }

    const newQuery = { role: "user", text: promptToUse };
    setCopilotHistory((prev) => [...prev, newQuery]);
    setCopilotQuery("");
    setCopilotLoading(true);

    try {
      const res = await fetch("/api/ai-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          eventContext: {
            title: event.title,
            category: event.category,
            startDate: event.startDate,
            endDate: event.endDate,
            city: event.city,
            venue: event.venue,
            capacity: event.capacity,
            ticketType: event.ticketType,
            ticketPrice: event.ticketPrice,
            totalRegistrations: stats.totalRegistrations,
            checkedInCount: stats.checkedInCount,
            pendingCount: stats.pendingCount,
            totalRevenue: stats.totalRevenue,
            checkedInRate: stats.checkedInRate,
            hoursUntilEvent: stats.hoursUntilEvent,
            isEventToday: stats.isEventToday,
            isEventPast: stats.isEventPast,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get AI answer");

      setCopilotHistory((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch (error) {
      toast.error(error.message);
      setCopilotHistory((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I encountered an error fetching AI insights." },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Marketing AI Generation Handler
  const handleGenerateMarketing = async (fmt) => {
    const formatToUse = fmt || selectedFormat;
    const formatConfig = MARKETING_FORMATS.find((f) => f.id === formatToUse);

    if (!isPro && !formatConfig?.isFree) {
      setUpgradeTrigger("marketing");
      setShowUpgradeModal(true);
      return;
    }

    setMarketingLoading(true);
    try {
      const res = await fetch("/api/marketing-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formatType: formatToUse,
          isPro,
          eventContext: {
            title: event.title,
            description: event.description,
            category: event.category,
            startDate: event.startDate,
            city: event.city,
            venue: event.venue,
            ticketType: event.ticketType,
            ticketPrice: event.ticketPrice,
            capacity: event.capacity,
            registrationCount: stats.totalRegistrations,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate marketing copy");

      setGeneratedMarketing(data.content);
      toast.success("Marketing copy generated!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setMarketingLoading(false);
    }
  };

  const handleCertificateClick = (attendee) => {
    if (!isPro) {
      setUpgradeTrigger("certificate");
      setShowUpgradeModal(true);
      return;
    }
    setSelectedCertificateAttendee(attendee);
  };

  return (
    <div className="min-h-screen pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/my-events")}
            className="gap-2 -ml-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to My Events
          </Button>
          {!isPro && (
            <Button
              onClick={() => {
                setUpgradeTrigger("header");
                setShowUpgradeModal(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white gap-2 font-semibold text-xs"
            >
              <Crown className="w-4 h-4" /> Upgrade to Pro
            </Button>
          )}
        </div>

        {/* Hero Cover Image */}
        {event.coverImage && (
          <div className="relative h-[250px] md:h-[320px] rounded-2xl overflow-hidden shadow-xl">
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {getCategoryIcon(event.category)} {getCategoryLabel(event.category)}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white">{event.title}</h1>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/events/${event.slug}`)}
                className="gap-2 shrink-0 hidden sm:flex"
              >
                <Eye className="w-4 h-4" /> View Public Page
              </Button>
            </div>
          </div>
        )}

        {/* Scan QR banner for event day */}
        {stats.isEventToday && !stats.isEventPast && (
          <Button
            size="lg"
            className="w-full gap-2 h-12 bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 text-white font-bold text-base shadow-lg hover:scale-[1.01] transition-transform"
            onClick={() => setShowQrScanner(true)}
          >
            <QrCode className="w-6 h-6" /> Scan QR Code to Check-In Attendee
          </Button>
        )}

        {/* Core Stats Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="py-0 border-zinc-800 bg-zinc-900/60">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats.totalRegistrations} / {stats.capacity}
                </p>
                <p className="text-xs text-muted-foreground">Capacity ({Math.round((stats.totalRegistrations / stats.capacity) * 100)}%)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 border-zinc-800 bg-zinc-900/60">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.checkedInCount}</p>
                <p className="text-xs text-muted-foreground">Checked In Attendees</p>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 border-zinc-800 bg-zinc-900/60">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {event.ticketType === "paid" ? `₹${stats.totalRevenue}` : `${stats.checkedInRate}%`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {event.ticketType === "paid" ? "Total Revenue" : "Check-in Rate"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 border-zinc-800 bg-zinc-900/60">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {stats.isEventPast
                    ? "Ended"
                    : stats.hoursUntilEvent > 24
                    ? `${Math.floor(stats.hoursUntilEvent / 24)}d`
                    : `${stats.hoursUntilEvent}h`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.isEventPast ? "Event Finished" : "Time Remaining"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Workspace Navigation */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 flex overflow-x-auto justify-start">
            <TabsTrigger value="overview" className="gap-2 text-xs sm:text-sm">
              <Users className="w-4 h-4" /> Attendees
            </TabsTrigger>
            <TabsTrigger value="copilot" className="gap-2 text-xs sm:text-sm">
              <Bot className="w-4 h-4 text-purple-400" /> AI Copilot {!isPro && "🔒"}
            </TabsTrigger>
            <TabsTrigger value="marketing" className="gap-2 text-xs sm:text-sm">
              <Megaphone className="w-4 h-4 text-pink-400" /> Marketing AI
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Analytics & Insights
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ATTENDEE MANAGEMENT */}
          <TabsContent value="overview" className="space-y-4">
            <Tabs value={attendeeTab} onValueChange={setAttendeeTab}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <TabsList className="bg-zinc-900/60">
                  <TabsTrigger value="all">All ({stats.totalRegistrations})</TabsTrigger>
                  <TabsTrigger value="checked-in">Checked In ({stats.checkedInCount})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({stats.pendingCount})</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search name, email or QR..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 h-9">
                    <Download className="w-4 h-4" /> Export CSV
                  </Button>
                </div>
              </div>

              <TabsContent value={attendeeTab} className="space-y-3">
                {filterRegistrations && filterRegistrations.length > 0 ? (
                  filterRegistrations.map((reg) => (
                    <AttendeeCard
                      key={reg._id}
                      registration={reg}
                      isPro={isPro}
                      onGenerateCertificate={handleCertificateClick}
                    />
                  ))
                ) : (
                  <Card className="p-12 text-center border-zinc-800 bg-zinc-900/40">
                    <p className="text-muted-foreground text-sm">No attendees found in this view 📭</p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* TAB 2: AI EVENT COPILOT */}
          <TabsContent value="copilot" className="space-y-6">
            {!isPro ? (
              <ProFeatureLock
                title="AI Event Copilot"
                description="Your personal AI co-pilot that answers queries on registration conversion, ticket sales, attendee engagement, and promotion strategies using real event data."
                onUpgrade={() => {
                  setUpgradeTrigger("copilot");
                  setShowUpgradeModal(true);
                }}
              />
            ) : (
              <Card className="border-purple-500/30 bg-zinc-900/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl text-white">
                    <Bot className="w-6 h-6 text-purple-400" /> AI Event Copilot
                  </CardTitle>
                  <CardDescription>
                    Ask questions about your live event data, attendee stats, and promotion tactics.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Predefined Prompt Chips */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      "How many people registered?",
                      "What is my event conversion rate?",
                      "How many seats are remaining?",
                      "Create an Instagram post for this event",
                      "Write a WhatsApp invitation",
                      "Summarize my event performance",
                      "What should I do to increase registrations?",
                    ].map((promptText) => (
                      <button
                        key={promptText}
                        onClick={() => handleCopilotSubmit(promptText)}
                        className="text-xs px-3 py-1.5 rounded-full bg-purple-950/40 border border-purple-800/40 text-purple-300 hover:bg-purple-900/60 transition-colors"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>

                  {/* Chat History Box */}
                  <div className="min-h-[250px] max-h-[400px] overflow-y-auto p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                    {copilotHistory.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        👋 Hi! I am your AI Copilot. Click a question above or type anything about your event.
                      </div>
                    ) : (
                      copilotHistory.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                              msg.role === "user"
                                ? "bg-purple-600 text-white rounded-br-none"
                                : "bg-zinc-900 border border-zinc-800 text-gray-200 rounded-bl-none whitespace-pre-wrap"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))
                    )}
                    {copilotLoading && (
                      <div className="flex justify-start">
                        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-purple-400 flex items-center gap-2 text-xs">
                          <Loader2 className="w-4 h-4 animate-spin" /> Copilot is analyzing real event data...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Query Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCopilotSubmit();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Ask AI Copilot anything about your event..."
                      value={copilotQuery}
                      onChange={(e) => setCopilotQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={copilotLoading} className="bg-purple-600 hover:bg-purple-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 3: MARKETING AI */}
          <TabsContent value="marketing" className="space-y-6">
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-pink-400" /> Marketing AI Toolkit
                </CardTitle>
                <CardDescription>
                  Generate targeted promotional content using actual event details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Format Selector Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {MARKETING_FORMATS.map((fmt) => {
                    const isLocked = !isPro && !fmt.isFree;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => {
                          setSelectedFormat(fmt.id);
                          handleGenerateMarketing(fmt.id);
                        }}
                        className={`p-3 rounded-xl text-left border transition-all text-xs flex flex-col justify-between h-20 ${
                          selectedFormat === fmt.id
                            ? "border-pink-500 bg-pink-950/20 text-white font-semibold"
                            : "border-zinc-800 bg-zinc-950 text-gray-400 hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-base">{fmt.icon}</span>
                        <div className="flex items-center justify-between w-full">
                          <span className="truncate">{fmt.label}</span>
                          {isLocked && <Lock className="w-3 h-3 text-purple-400 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Generated Content Box */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-300">Generated Marketing Copy:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={marketingLoading}
                        onClick={() => handleGenerateMarketing()}
                        className="gap-1 text-xs h-8"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${marketingLoading ? "animate-spin" : ""}`} /> Regenerate
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!generatedMarketing}
                        onClick={() => {
                          navigator.clipboard.writeText(generatedMarketing);
                          toast.success("Marketing copy copied to clipboard!");
                        }}
                        className="gap-1 text-xs h-8 bg-purple-600 text-white hover:bg-purple-700"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    rows={8}
                    readOnly
                    placeholder="Click any format above to generate marketing copy..."
                    value={
                      marketingLoading
                        ? "Generating marketing content using real event details..."
                        : generatedMarketing
                    }
                    className="font-mono text-xs leading-relaxed bg-zinc-950 border-zinc-800"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: ADVANCED ANALYTICS & AI INSIGHTS */}
          <TabsContent value="analytics" className="space-y-6">
            
            {/* Analytics Top Control Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/80 p-4 sm:p-6 rounded-2xl border border-zinc-800">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" /> Executive Analytics & Strategic AI Insights
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Real-time attendee pacing, financial yield, capacity utilization, and AI recommendations.
                </p>
              </div>

              <Button
                onClick={() => setShowAnalyticsReportModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold gap-2 text-xs shadow-lg shadow-purple-600/20 shrink-0"
              >
                <Download className="w-4 h-4" /> Print / Export Executive Analysis Report
              </Button>
            </div>

            {/* 4 KPI SUMMARY METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Capacity Utilization */}
              <Card className="border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                  <span>Capacity Utilization</span>
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-extrabold text-white">
                  {Math.round((stats.totalRegistrations / stats.capacity) * 100)}%
                </div>
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((stats.totalRegistrations / stats.capacity) * 100))}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  {stats.totalRegistrations} registered / {stats.capacity} max
                </p>
              </Card>

              {/* Card 2: Check-In Conversion */}
              <Card className="border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                  <span>Check-In Conversion</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-white">
                  {stats.checkedInRate}%
                </div>
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, stats.checkedInRate)}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  {stats.checkedInCount} verified check-ins
                </p>
              </Card>

              {/* Card 3: Gross Revenue */}
              <Card className="border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                  <span>Gross Realized Value</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-extrabold text-amber-400">
                  ₹{stats.totalRevenue}
                </div>
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (stats.totalRegistrations / stats.capacity) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  {event.ticketType === "free" ? "Free Registration" : `₹${event.ticketPrice}/ticket`}
                </p>
              </Card>

              {/* Card 4: Event Engagement Score */}
              <Card className="border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                  <span>Event Health Rating</span>
                  <Crown className="w-4 h-4 text-pink-400" />
                </div>
                <div className="text-2xl font-extrabold text-purple-300">
                  {Math.min(100, Math.round(Math.round((stats.totalRegistrations / stats.capacity) * 100) * 0.5 + stats.checkedInRate * 0.5))} / 100
                </div>
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round(Math.round((stats.totalRegistrations / stats.capacity) * 100) * 0.5 + stats.checkedInRate * 0.5))}%` }}
                  />
                </div>
                <p className="text-[11px] text-emerald-400 font-semibold">
                  ✓ High Attendee Satisfaction
                </p>
              </Card>
            </div>

            {/* DETAILED TICKET TIER INVENTORY BREAKDOWN */}
            <Card className="border-zinc-800 bg-zinc-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-purple-400" /> Ticket Tier & Pass Inventory Pacing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {event.tickets && event.tickets.length > 0 ? (
                  event.tickets.map((t, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{t.name}</span>
                        <span className="text-gray-400 text-[11px]">{t.description || "Official Ticket Pass"}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-amber-400 block">{t.price === 0 ? "FREE" : `₹${t.price}`}</span>
                        <span className="text-gray-500 text-[10px]">{t.capacity} Allocated Seats</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-white block">Standard Admission Pass</span>
                      <span className="text-gray-400 text-[11px]">General admission pass for all registered attendees</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-amber-400 block">{event.ticketType === "free" ? "FREE" : `₹${event.ticketPrice}`}</span>
                      <span className="text-gray-500 text-[10px]">{stats.capacity} Total Allocated Seats</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* DEEP-DIVE AI STRATEGIC INSIGHTS & RECOMMENDATIONS */}
            <Card className="border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-zinc-900 to-zinc-950">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <Sparkles className="w-5 h-5 text-purple-400" /> AI Executive Strategic Insights {!isPro && "(Basic)"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-gray-300">
                <div className="grid md:grid-cols-3 gap-4">
                  
                  {/* Insight 1 */}
                  <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/30 space-y-2">
                    <div className="flex items-center gap-2 text-purple-300 font-bold">
                      <span>📊</span> Capacity Utilization Strategy
                    </div>
                    <p className="leading-relaxed opacity-90">
                      Your event is currently <strong>{Math.round((stats.totalRegistrations / stats.capacity) * 100)}% full</strong> with {Math.max(0, stats.capacity - stats.totalRegistrations)} seats remaining.
                    </p>
                    <span className="text-[10px] text-purple-400 font-mono block">
                      💡 Tip: Share an urgency post ("Only {Math.max(0, stats.capacity - stats.totalRegistrations)} seats left!") on WhatsApp.
                    </span>
                  </div>

                  {/* Insight 2 */}
                  <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/30 space-y-2">
                    <div className="flex items-center gap-2 text-purple-300 font-bold">
                      <span>🎯</span> Attendance Conversion & No-Show Prevention
                    </div>
                    <p className="leading-relaxed opacity-90">
                      {stats.checkedInCount > 0
                        ? `${stats.checkedInCount} attendees have checked in (${stats.checkedInRate}% check-in rate).`
                        : "No attendees have checked in yet."}
                    </p>
                    <span className="text-[10px] text-purple-400 font-mono block">
                      💡 Tip: Send automated event reminder emails 2 hours prior to start time.
                    </span>
                  </div>

                  {/* Insight 3 */}
                  <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/30 space-y-2">
                    <div className="flex items-center gap-2 text-purple-300 font-bold">
                      <span>💰</span> Revenue & Monetization Yield
                    </div>
                    <p className="leading-relaxed opacity-90">
                      {event.ticketType === "paid"
                        ? `Gross revenue stands at ₹${stats.totalRevenue}. Consider offering an Early Bird discount tier for next event.`
                        : "Free event model maximized registration volume. You can introduce a VIP pass tier for extra revenue."}
                    </p>
                    <span className="text-[10px] text-purple-400 font-mono block">
                      💡 Tip: Use Marketing AI to launch an Early Bird Campaign.
                    </span>
                  </div>

                </div>

                {!isPro && (
                  <div className="pt-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setUpgradeTrigger("analytics");
                        setShowUpgradeModal(true);
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-xs h-10"
                    >
                      <Crown className="w-4 h-4 mr-1.5" /> Unlock Advanced AI Strategic Insights with Pro
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>
      </div>

      {/* QR Scanner Modal */}
      {showQrScanner && (
        <QRScannerModel
          isOpen={showQrScanner}
          onClose={() => setShowQrScanner(false)}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger={upgradeTrigger}
      />

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={!!selectedCertificateAttendee}
        onClose={() => setSelectedCertificateAttendee(null)}
        attendee={selectedCertificateAttendee}
        event={event}
      />

      {/* Analytics Executive Report Modal */}
      <AnalyticsReportModal
        isOpen={showAnalyticsReportModal}
        onClose={() => setShowAnalyticsReportModal(false)}
        event={event}
        stats={stats}
        isPro={isPro}
      />
    </div>
  );
};

export default EventDashboard;
