"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ticket, CheckCircle, Info, ShieldCheck, MapPin } from "lucide-react";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function RegisterModal({ event, isOpen, onClose }) {
  const router = useRouter();
  const { user } = useUser();
  const [name, setName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(
    user?.primaryEmailAddress?.emailAddress || ""
  );
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  const [selectedTicketId, setSelectedTicketId] = useState(
    event?.tickets && event.tickets.length > 0 ? event.tickets[0].id : "regular"
  );

  const { mutate: registerForEvent, isLoading } = useConvexMutation(
    api.registrations.registerForEvent
  );

  const selectedTier = event?.tickets?.find((t) => t.id === selectedTicketId);

  const unitPrice =
    event?.ticketType === "paid"
      ? selectedTier?.price ?? (event?.ticketPrice || 0)
      : 0;
  const totalPrice = unitPrice * ticketQuantity;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await registerForEvent({
        eventId: event._id,
        attendeeName: name,
        attendeeEmail: email,
        ticketTypeId: selectedTicketId,
        ticketTypeName: selectedTier?.name || (event.ticketType === "free" ? "Free Admission" : "General Ticket"),
        ticketQuantity: Number(ticketQuantity),
      });

      setIsSuccess(true);
      toast.success("Booking confirmed! 🎉");
    } catch (error) {
      toast.error(error.message || "Registration failed");
    }
  };

  const handleViewTicket = () => {
    router.push("/my-tickets");
    onClose();
  };

  // Success state with clear offline payment reminder
  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-purple-500/30 text-white">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/40">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <Badge className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 text-[10px] uppercase font-mono mb-1">
                Booking Confirmed
              </Badge>
              <h2 className="text-2xl font-extrabold text-white">You&apos;re Registered!</h2>
              <p className="text-xs text-zinc-400 max-w-sm">
                Your reservation for <strong className="text-white">{event.title}</strong> is secured.
              </p>
            </div>

            {/* Offline Ticket Details */}
            <div className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-zinc-300">
                <span>Tier:</span>
                <span className="font-semibold text-white">
                  {selectedTier?.name || (event.ticketType === "free" ? "Free Admission" : "General Admission")}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span>Quantity:</span>
                <span className="font-semibold text-white">{ticketQuantity} Ticket(s)</span>
              </div>
              <Separator className="bg-zinc-800" />
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Venue Payment Due:</span>
                <span className="font-extrabold text-sm text-emerald-400">
                  {totalPrice === 0 ? "Free" : `₹${totalPrice}`}
                </span>
              </div>
              {totalPrice > 0 && (
                <p className="text-[11px] text-amber-300/90 pt-1 leading-relaxed">
                  💡 <strong>Pay-At-Venue:</strong> Please pay the organizer directly at the entrance via Cash or UPI when you arrive. Evenza does not collect ticket payments.
                </p>
              )}
            </div>

            <div className="w-full space-y-2 pt-2">
              <Button className="w-full gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-semibold cursor-pointer" onClick={handleViewTicket}>
                <Ticket className="w-4 h-4" />
                View My Ticket & QR Code
              </Button>
              <Button variant="outline" className="w-full border-zinc-800 text-zinc-300 cursor-pointer" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Registration form
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-purple-500/30 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Reserve Tickets</DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Reserve your spot for <strong className="text-zinc-200">{event.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Ticket Tier Selection */}
          {event?.tickets && event.tickets.length > 1 ? (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-purple-400">Select Ticket Tier</Label>
              <div className="space-y-2">
                {event.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      selectedTicketId === ticket.id
                        ? "border-purple-500 bg-purple-950/30 text-white"
                        : "border-zinc-800 bg-zinc-900 text-gray-400 hover:border-zinc-700"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-sm text-white">{ticket.name}</p>
                      <p className="text-xs text-muted-foreground">{ticket.description || `${ticket.capacity} capacity`}</p>
                    </div>
                    <span className="font-bold text-sm text-purple-300">
                      {ticket.price === 0 ? "Free" : `₹${ticket.price}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 space-y-1">
              <p className="font-semibold text-sm text-white">{event.title}</p>
              <p className="text-xs text-zinc-400">
                {event.ticketType === "free" ? (
                  <span className="text-emerald-400 font-medium">Free Admission</span>
                ) : (
                  <span>
                    Price: <strong className="text-white">₹{event.ticketPrice}</strong> / ticket{" "}
                    <span className="text-amber-400 text-[11px] font-mono">(Pay at venue)</span>
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/60">
            <div>
              <Label className="text-xs font-semibold text-zinc-200">Ticket Quantity</Label>
              <p className="text-[11px] text-zinc-400">Select seats to reserve</p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setTicketQuantity(qty)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    ticketQuantity === qty
                      ? "bg-purple-600 text-white shadow-sm shadow-purple-600/40"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {qty}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
              className="bg-zinc-900 border-zinc-800"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="bg-zinc-900 border-zinc-800"
            />
          </div>

          {/* Clear Pay-at-Venue Policy Notice */}
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-950/20 flex items-start gap-2.5 text-xs text-amber-300/90 leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong className="text-amber-200">Pay-At-Venue Policy:</strong> Evenza does not process online payments for event tickets. Any ticket charges (₹{totalPrice}) are payable directly to the organizer at the event venue.
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-zinc-800 text-zinc-300"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Reserving...
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4" />
                  {totalPrice > 0 ? `Reserve (₹${totalPrice} at venue)` : "Reserve Free Ticket"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
