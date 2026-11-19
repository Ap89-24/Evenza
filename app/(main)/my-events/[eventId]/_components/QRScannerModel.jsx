"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle,
  CreditCard,
  FlipHorizontal,
  History,
  IndianRupee,
  Keyboard,
  Loader2,
  QrCode,
  RefreshCw,
  Search,
  User,
  UserCheck,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { format } from "date-fns";

// Web Audio API beep sound generator
const playScanAudio = (type = "success") => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      // High pitch crisp double beep
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "warning") {
      // Lower pitch alert beep
      osc.type = "square";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Audio context may be restricted before user gesture
  }
};

const triggerHaptic = (type = "success") => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (type === "success") {
        navigator.vibrate(100);
      } else {
        navigator.vibrate([150, 80, 150]);
      }
    }
  } catch {
    // ignore
  }
};

const QRScannerModel = ({ isOpen, onClose, eventId, eventTitle, userId }) => {
  // Navigation tabs: 'scan' | 'manual'
  const [activeTab, setActiveTab] = useState("scan");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState("environment"); // back camera

  // Camera state
  const [showScannerReady, setShowScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);

  // Manual entry state
  const [manualTicketCode, setManualTicketCode] = useState("");
  const [isSearchingManual, setIsSearchingManual] = useState(false);

  // Scanned / Loaded Attendee Data
  // step: 'idle' | 'scanned' | 'confirmed'
  const [scanStep, setScanStep] = useState("idle");
  const [scannedResult, setScannedResult] = useState(null);
  const [alreadyCheckedInInfo, setAlreadyCheckedInInfo] = useState(null);

  // Payment Collection State (for offline Pay-at-Venue tickets)
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountToCollect, setAmountToCollect] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isProcessingCheckIn, setIsProcessingCheckIn] = useState(false);

  // Mutations
  const { mutate: checkInAttendee } = useConvexMutation(
    api.registrations.checkInAttendee
  );

  // Reset to scanning next attendee
  const handleScanNext = () => {
    setScannedResult(null);
    setAlreadyCheckedInInfo(null);
    setManualTicketCode("");
    setScanStep("idle");
    setPaymentNotes("");
  };

  // Safe scanner cleanup
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.debug("Scanner stop/clear error:", err);
      }
      scannerRef.current = null;
    }
    setShowScannerReady(false);
  }, []);

  // Process a detected QR code string
  const processQRCode = useCallback(
    async (code, autoCheckInIfFree = true) => {
      if (!code || !code.trim()) return;
      const cleanCode = code.trim();

      // Temporarily pause camera scanning
      await stopScanner();

      try {
        setIsProcessingCheckIn(true);

        // Perform check-in attempt
        const response = await checkInAttendee({
          qrCode: cleanCode,
          eventId: eventId,
          clerkUserId: userId,
          markAsPaid: false, // Don't auto-mark paid until organizer specifies method if payment is due
        });

        if (response.alreadyCheckedIn) {
          if (soundEnabled) playScanAudio("warning");
          triggerHaptic("warning");
          setAlreadyCheckedInInfo({
            checkedInAt: response.checkedInAt,
            registration: response.registration,
            event: response.event,
          });
          setScannedResult(response.registration);
          setScanStep("scanned");
          toast.warning(`Attendee was ALREADY checked in!`);
          return;
        }

        if (response.isCancelled) {
          if (soundEnabled) playScanAudio("warning");
          triggerHaptic("warning");
          toast.error("This ticket was cancelled and is invalid.");
          setScanStep("idle");
          return;
        }

        if (response.success) {
          const reg = response.registration;
          setScannedResult(reg);
          setAmountToCollect(reg.amountDue || 0);

          // If ticket has offline payment pending, keep on screen to collect payment
          const isPendingOfflinePay =
            reg.paymentStatus === "pay_at_venue" || reg.paymentStatus === "unpaid";

          if (isPendingOfflinePay && (reg.amountDue || 0) > 0) {
            if (soundEnabled) playScanAudio("warning");
            triggerHaptic("warning");
            setScanStep("scanned");
            toast.info(`Attendee checked in! ₹${reg.amountDue} payment due at venue.`);
          } else {
            // Free or already paid
            if (soundEnabled) playScanAudio("success");
            triggerHaptic("success");
            setScanStep("confirmed");
            toast.success(`✓ ${reg.attendeeName} checked in successfully!`);
          }
        }
      } catch (err) {
        if (soundEnabled) playScanAudio("warning");
        triggerHaptic("warning");
        toast.error(err.message || "Failed to process ticket code.");
        setScanStep("idle");
      } finally {
        setIsProcessingCheckIn(false);
      }
    },
    [checkInAttendee, eventId, userId, soundEnabled, stopScanner]
  );

  // Confirm offline payment collected at venue gate
  const handleConfirmOfflinePayment = async () => {
    if (!scannedResult) return;
    try {
      setIsProcessingCheckIn(true);
      const res = await checkInAttendee({
        qrCode: scannedResult.qrCode,
        eventId: eventId,
        clerkUserId: userId,
        markAsPaid: true,
        amountPaid: Number(amountToCollect),
        paymentMethod: paymentMethod,
        paymentNotes: paymentNotes || `Collected at venue gate (${paymentMethod.toUpperCase()})`,
      });

      if (res.success) {
        if (soundEnabled) playScanAudio("success");
        triggerHaptic("success");
        setScannedResult(res.registration);
        setScanStep("confirmed");
        toast.success(`✓ Payment of ₹${amountToCollect} recorded and attendee admitted!`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to record payment.");
    } finally {
      setIsProcessingCheckIn(false);
    }
  };

  // Handle manual ticket ID submit
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualTicketCode.trim()) {
      toast.error("Please enter a ticket ID or QR code text.");
      return;
    }
    setIsSearchingManual(true);
    await processQRCode(manualTicketCode.trim());
    setIsSearchingManual(false);
  };

  // Switch camera between environment (back) and user (front)
  const handleToggleCamera = async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Camera initializer
  useEffect(() => {
    let isMounted = true;

    if (!isOpen || activeTab !== "scan" || scanStep !== "idle") {
      stopScanner();
      return;
    }

    const initScanner = async () => {
      try {
        setCameraError(null);
        setShowScannerReady(false);

        // Check camera permission
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: facingMode } },
            });
          }
        } catch (permErr) {
          console.error("Camera access failed:", permErr);
          if (isMounted) {
            setCameraError(
              "Camera permission denied. Please allow camera access in browser settings or use manual Ticket ID entry."
            );
          }
          return;
        }

        // Dynamically import html5-qrcode
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!isMounted) return;

        const container = document.getElementById("qr-reader-container");
        if (!container) return;

        // Cleanup any existing instance
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
            await scannerRef.current.clear();
          } catch {
            // ignore
          }
        }

        const html5QrCode = new Html5Qrcode("qr-reader-container");
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrEdge = Math.floor(minEdge * 0.72);
            return { width: Math.max(220, qrEdge), height: Math.max(220, qrEdge) };
          },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: { ideal: facingMode } },
          config,
          (decodedText) => {
            if (isMounted) {
              processQRCode(decodedText);
            }
          },
          (errorMessage) => {
            // Frame non-match, normal behavior during scanning
          }
        );

        if (isMounted) {
          setShowScannerReady(true);
          setCameraError(null);
        }
      } catch (err) {
        console.error("Scanner startup error:", err);
        if (isMounted) {
          setCameraError(`Camera error: ${err.message || "Failed to start camera."}`);
        }
      }
    };

    // Small delay to ensure modal DOM is mounted
    const timer = setTimeout(() => {
      initScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, activeTab, scanStep, facingMode, stopScanner, processQRCode]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          stopScanner();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto bg-zinc-950 border border-zinc-800 text-zinc-100 p-5 rounded-2xl shadow-2xl">
        {/* Header */}
        <DialogHeader className="space-y-1 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <span className="p-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <QrCode className="w-5 h-5" />
              </span>
              Event Gate Check-In
            </DialogTitle>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-white"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? "Mute scan sound" : "Enable scan sound"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          {eventTitle && (
            <DialogDescription className="text-xs text-zinc-400 truncate">
              Scanning for: <span className="font-semibold text-zinc-200">{eventTitle}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        {/* View Mode Switching Tabs (when idle) */}
        {scanStep === "idle" && (
          <div className="flex rounded-lg bg-zinc-900 p-1 border border-zinc-800 text-xs mt-1">
            <button
              onClick={() => setActiveTab("scan")}
              className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "scan"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Camera Scanner
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "manual"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" /> Manual Ticket ID
            </button>
          </div>
        )}

        {/* ===================== VIEW 1: ACTIVE CAMERA SCANNER ===================== */}
        {scanStep === "idle" && activeTab === "scan" && (
          <div className="space-y-3 py-1">
            {cameraError ? (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs space-y-3 text-center">
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
                <p>{cameraError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("manual")}
                  className="bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs"
                >
                  Switch to Manual Entry
                </Button>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl bg-black border border-zinc-800 min-h-[300px] flex items-center justify-center">
                {/* HTML5 QR code video inject container */}
                <div id="qr-reader-container" className="w-full aspect-square overflow-hidden" />

                {/* Laser animation and target box overlay when ready */}
                {showScannerReady && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-56 h-56 border-2 border-purple-500/60 rounded-2xl relative shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                      {/* Corner marks */}
                      <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-purple-400 rounded-tl-lg" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-purple-400 rounded-tr-lg" />
                      <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-purple-400 rounded-bl-lg" />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-purple-400 rounded-br-lg" />

                      {/* Scanning Laser Line */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-bounce" />
                    </div>
                  </div>
                )}

                {/* Loading indicator before camera fires */}
                {!showScannerReady && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    <span className="text-xs text-zinc-400 font-mono">Initializing gate camera...</span>
                  </div>
                )}

                {/* Camera Flip Button overlay */}
                {showScannerReady && (
                  <button
                    onClick={handleToggleCamera}
                    className="absolute bottom-3 right-3 p-2 rounded-full bg-zinc-900/80 border border-zinc-700/80 text-zinc-200 hover:text-white backdrop-blur shadow-md"
                    title="Flip camera"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div className="text-center text-xs text-zinc-400">
              Point camera at attendee's digital ticket or paper QR code.
            </div>
          </div>
        )}

        {/* ===================== VIEW 2: MANUAL TICKET ID INPUT ===================== */}
        {scanStep === "idle" && activeTab === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Enter Ticket ID or Code</label>
              <div className="relative">
                <Input
                  value={manualTicketCode}
                  onChange={(e) => setManualTicketCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EVT-173829..."
                  className="bg-zinc-900 border-zinc-700 text-white pl-9 font-mono uppercase text-sm"
                  autoFocus
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-zinc-500">
                Ticket code appears under the QR code on the attendee's ticket screen.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSearchingManual || !manualTicketCode.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-10 gap-2"
            >
              {isSearchingManual ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Ticket...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" /> Look Up & Check In
                </>
              )}
            </Button>
          </form>
        )}

        {/* ===================== VIEW 3: SCANNED ATTENDEE CARD / PAYMENT STEP ===================== */}
        {scanStep === "scanned" && scannedResult && (
          <div className="space-y-4 py-1">
            {/* Already Checked-in Warning Banner */}
            {alreadyCheckedInInfo && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-400">
                  <AlertTriangle className="w-4 h-4" /> ALREADY CHECKED IN
                </div>
                <p>
                  This attendee was already admitted at{" "}
                  <span className="font-semibold text-white">
                    {format(alreadyCheckedInInfo.checkedInAt || Date.now(), "p, MMM d")}
                  </span>
                  . Do not allow duplicate entry without verification.
                </p>
              </div>
            )}

            {/* Attendee Details Card */}
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{scannedResult.attendeeName}</h4>
                  <p className="text-zinc-400 text-[11px]">{scannedResult.attendeeEmail}</p>
                </div>
                <Badge className="bg-purple-950/60 text-purple-300 border border-purple-500/30 text-[10px] uppercase font-mono">
                  {scannedResult.ticketTypeName || "Standard Admission"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-[11px]">
                <div>
                  <span className="text-zinc-500 block">Quantity:</span>
                  <span className="font-semibold text-zinc-200">
                    {scannedResult.ticketQuantity || 1} Ticket(s)
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Ticket Code:</span>
                  <span className="font-mono text-zinc-300 truncate block">
                    {scannedResult.qrCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Offline Pay-at-Venue Collection Section */}
            {(scannedResult.paymentStatus === "pay_at_venue" ||
              scannedResult.paymentStatus === "unpaid") &&
            (scannedResult.amountDue || 0) > 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wide">
                    <IndianRupee className="w-4 h-4" /> Offline Payment Due
                  </div>
                  <span className="text-lg font-extrabold text-amber-300">
                    ₹{scannedResult.amountDue}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="text-zinc-300 font-medium">Payment Method Received:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["cash", "upi", "other"].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-1.5 rounded-lg border text-xs font-semibold uppercase transition-all ${
                          paymentMethod === method
                            ? "bg-amber-500 text-black border-amber-400 font-bold shadow-sm"
                            : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="text-zinc-400 text-[11px]">Amount Collected (₹):</label>
                  <Input
                    type="number"
                    value={amountToCollect}
                    onChange={(e) => setAmountToCollect(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="text-zinc-400 text-[11px]">Notes (Optional):</label>
                  <Input
                    type="text"
                    placeholder="e.g. Paid in cash at gate 1"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white h-8 text-xs"
                  />
                </div>

                <Button
                  onClick={handleConfirmOfflinePayment}
                  disabled={isProcessingCheckIn || Number(amountToCollect) <= 0}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold text-xs h-10 gap-2 shadow-lg"
                >
                  {isProcessingCheckIn ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-black" />
                  )}
                  Collect ₹{amountToCollect} & Confirm Admission
                </Button>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={handleScanNext}
                className="flex-1 bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs h-9"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Scan Next Attendee
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-zinc-400 hover:text-white text-xs h-9"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* ===================== VIEW 4: SUCCESS CONFIRMATION ===================== */}
        {scanStep === "confirmed" && scannedResult && (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-pulse">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Check-In Successful!</h3>
              <p className="text-sm font-semibold text-emerald-400">{scannedResult.attendeeName}</p>
              <p className="text-xs text-zinc-400">
                {scannedResult.ticketTypeName || "Standard Admission"} • {scannedResult.ticketQuantity || 1} Ticket(s)
              </p>
            </div>

            {scannedResult.paymentStatus === "paid_at_venue" && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-medium">
                ✓ Offline Payment Collected: ₹{scannedResult.amountPaid || scannedResult.amountDue} ({scannedResult.paymentMethodOffline?.toUpperCase() || "CASH"})
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <Button
                onClick={handleScanNext}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs h-11 gap-2 shadow-lg"
              >
                <Camera className="w-4 h-4" /> Scan Next Attendee
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs h-9"
              >
                Done / Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QRScannerModel;
