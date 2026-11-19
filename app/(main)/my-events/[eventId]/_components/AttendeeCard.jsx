"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { format } from "date-fns";
import {
  Award,
  CheckCircle,
  Circle,
  Clock,
  CreditCard,
  DollarSign,
  Edit2,
  History,
  IndianRupee,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

const AttendeeCard = ({ registration, onGenerateCertificate, isPro = false }) => {
  const { userId } = useAuth();
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState(
    registration.amountDue || registration.amountPaid || 0
  );
  const [notes, setNotes] = useState("");
  const [recordingPay, setRecordingPay] = useState(false);

  // Correction state
  const [correctStatus, setCorrectStatus] = useState("unpaid");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correcting, setCorrecting] = useState(false);

  const { mutate: checkInAttendee, isLoading: isCheckingIn } = useConvexMutation(
    api.registrations.checkInAttendee
  );
  const { mutate: markTicketAsPaid } = useConvexMutation(
    api.registrations.markTicketAsPaidAtVenue
  );
  const { mutate: correctPayment } = useConvexMutation(
    api.registrations.correctTicketPaymentStatus
  );

  const isPaid =
    registration.paymentStatus === "paid_at_venue" ||
    registration.amountDue === 0;

  const handleManualCheckIn = async () => {
    try {
      const result = await checkInAttendee({
        qrCode: registration.qrCode,
        clerkUserId: userId,
      });
      if (result.success) {
        toast.success("Attendee checked in successfully");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to check in");
    }
  };

  const handleRecordOfflinePayment = async (e) => {
    e.preventDefault();
    try {
      setRecordingPay(true);
      await markTicketAsPaid({
        registrationId: registration._id,
        amountPaid: Number(amountPaid),
        paymentMethod: paymentMethod,
        paymentNotes: notes || undefined,
        clerkUserId: userId,
      });
      toast.success("Payment recorded at venue!");
      setShowPayModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setRecordingPay(false);
    }
  };

  const handleApplyCorrection = async (e) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      toast.error("Please specify a reason for this payment correction.");
      return;
    }
    try {
      setCorrecting(true);
      await correctPayment({
        registrationId: registration._id,
        newStatus: correctStatus,
        reason: correctionReason,
        clerkUserId: userId,
      });
      toast.success("Payment status corrected.");
      setShowCorrectionModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to correct payment");
    } finally {
      setCorrecting(false);
    }
  };

  const renderPaymentBadge = () => {
    switch (registration.paymentStatus) {
      case "paid_at_venue":
        return (
          <Badge className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 text-[10px] uppercase font-mono">
            ✓ Paid at Venue
          </Badge>
        );
      case "pay_at_venue":
        return (
          <Badge className="bg-amber-950/60 text-amber-400 border border-amber-500/40 text-[10px] uppercase font-mono">
            ⏳ Pay at Venue
          </Badge>
        );
      case "unpaid":
        return (
          <Badge className="bg-red-950/60 text-red-400 border border-red-500/40 text-[10px] uppercase font-mono">
            ✕ Unpaid
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] uppercase font-mono">
            ↺ Refunded
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] uppercase font-mono">
            Standard Admission
          </Badge>
        );
    }
  };

  return (
    <>
      <Card className="py-0 border-zinc-800 bg-zinc-900/60">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={`mt-1 p-2 rounded-full ${
                registration.checkedIn ? "bg-green-500/20 text-green-400" : "bg-zinc-800 text-gray-500"
              }`}
            >
              {registration.checkedIn ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-white text-sm md:text-base">
                  {registration.attendeeName}
                </h3>
                {registration.ticketTypeName && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">
                    {registration.ticketTypeName}
                  </span>
                )}
                {registration.ticketQuantity && registration.ticketQuantity > 1 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-gray-300 border border-zinc-700">
                    Qty: {registration.ticketQuantity}
                  </span>
                )}
                {renderPaymentBadge()}
              </div>

              <p className="text-xs text-muted-foreground">{registration.attendeeEmail}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                <span>
                  {registration.checkedIn ? "⏰ Checked in" : "📅 Registered"}{" "}
                  {registration.checkedIn && registration.checkedInAt
                    ? format(registration.checkedInAt, "PPp")
                    : format(registration.registeredAt, "PPp")}
                </span>
                <span className="font-mono">QR: {registration.qrCode}</span>
                {registration.amountDue !== undefined && registration.amountDue > 0 && (
                  <span className="font-semibold text-zinc-300">
                    Amount: ₹{registration.amountDue}
                    {registration.paymentStatus === "paid_at_venue" && ` (Paid via ${registration.paymentMethodOffline || "cash"})`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Mark as Paid / Payment Management */}
            {registration.paymentStatus !== "paid_at_venue" && registration.amountDue > 0 && (
              <Button
                size="sm"
                onClick={() => setShowPayModal(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/30"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                Mark as Paid
              </Button>
            )}

            {/* Offline Correction Option */}
            {registration.paymentStatus === "paid_at_venue" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCorrectionModal(true)}
                className="text-xs text-zinc-400 hover:text-white gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                Correct Status
              </Button>
            )}

            {/* View Audit Trail */}
            {registration.paymentHistory && registration.paymentHistory.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHistoryModal(true)}
                className="text-xs text-zinc-400 hover:text-white p-2"
                title="View Payment Audit Trail"
              >
                <History className="w-4 h-4" />
              </Button>
            )}

            {/* Certificate Generation */}
            {registration.checkedIn && onGenerateCertificate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onGenerateCertificate(registration)}
                className="gap-1 text-purple-400 border-purple-500/30 hover:bg-purple-950/30 text-xs cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                Certificate
              </Button>
            )}

            {/* Check-In Button */}
            {!registration.checkedIn && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualCheckIn}
                disabled={isCheckingIn}
                className="gap-1.5 text-xs border-zinc-700 hover:bg-zinc-800 cursor-pointer"
              >
                {isCheckingIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Check In
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: RECORD OFFLINE PAYMENT AT VENUE */}
      <Dialog open={showPayModal} onOpenChange={setShowPayModal}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-emerald-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-400" /> Record Offline Payment
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Confirm offline ticket collection for {registration.attendeeName}. No online payment gateway is involved.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordOfflinePayment} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Amount Collected (₹)</Label>
              <Input
                type="number"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Offline Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                {["cash", "upi", "other"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 text-xs font-semibold rounded-lg uppercase border transition-all cursor-pointer ${
                      paymentMethod === method
                        ? "border-emerald-500 bg-emerald-950/40 text-emerald-300"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes / Receipt Reference (Optional)</Label>
              <Input
                placeholder="e.g. Received by Organizer desk, UPI Ref #..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPayModal(false)}
                className="flex-1 border-zinc-800 text-zinc-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={recordingPay}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                {recordingPay ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: AUTHORIZED PAYMENT STATUS CORRECTION */}
      <Dialog open={showCorrectionModal} onOpenChange={setShowCorrectionModal}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-amber-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <Edit2 className="w-5 h-5" /> Authorized Payment Correction
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Correct inaccurate offline payment statuses. An immutable audit record will be logged.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplyCorrection} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Select Corrected Status</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "unpaid", label: "Unpaid" },
                  { id: "pay_at_venue", label: "Pay at Venue" },
                  { id: "refunded", label: "Refunded" },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setCorrectStatus(st.id)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      correctStatus === st.id
                        ? "border-amber-500 bg-amber-950/40 text-amber-300"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Reason for Correction (Required)</Label>
              <Input
                placeholder="e.g. Marked in error, attendee cancelled, refunded..."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCorrectionModal(false)}
                className="flex-1 border-zinc-800 text-zinc-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={correcting}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold"
              >
                {correcting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply Correction"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: PAYMENT AUDIT TRAIL */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="sm:max-w-lg bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" /> Offline Payment Audit Trail
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Complete chronological audit trail for ticket: {registration.qrCode}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto">
            {registration.paymentHistory?.map((entry, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize text-[10px] border-zinc-700">
                    {entry.status.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-zinc-400 font-mono text-[10px]">
                    {format(entry.timestamp, "PPp")}
                  </span>
                </div>
                <div className="text-zinc-300">
                  Recorded By: <strong className="text-white">{entry.recordedBy}</strong>
                </div>
                {entry.amount !== undefined && entry.amount > 0 && (
                  <div className="text-emerald-400 font-semibold">
                    Amount: ₹{entry.amount} ({entry.method || "offline"})
                  </div>
                )}
                {entry.note && (
                  <div className="text-zinc-400 italic text-[11px] pt-0.5">
                    &quot;{entry.note}&quot;
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AttendeeCard;
