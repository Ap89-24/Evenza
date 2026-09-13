"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check, Crown, Loader2, Sparkles, Zap } from "lucide-react";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

const UpgradeModal = ({ isOpen, onClose, trigger = "limit" }) => {
  const [upgrading, setUpgrading] = useState(false);
  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const { mutate: updateSubscription } = useConvexMutation(api.users.updateSubscription);

  const isPro = currentUser?.plan === "pro";

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      await updateSubscription({
        plan: "pro",
        subscriptionStatus: "active",
      });
      toast.success("Welcome to Pro! 🎉 All premium features are unlocked.");
      if (onClose) onClose();
    } catch (error) {
      toast.error(error.message || "Upgrade failed. Please try again.");
    } finally {
      setUpgrading(false);
    }
  };

  const getTriggerText = () => {
    switch (trigger) {
      case "limit":
        return "You've reached your Free plan event limit.";
      case "attendee":
        return "You've reached the 50-attendee limit for Free events.";
      case "copilot":
        return "AI Event Copilot is available with Pro.";
      case "marketing":
        return "Unlock the full Marketing AI toolkit with Pro.";
      case "color":
      case "branding":
        return "Custom branding and colors are available with Pro.";
      case "analytics":
        return "Advanced Analytics & Insights are available with Pro.";
      case "tickets":
        return "Multiple ticket types are available with Pro.";
      case "certificate":
        return "Certificate generation is available with Pro.";
      case "domain":
        return "Custom domain configuration is available with Pro.";
      case "header":
      default:
        return "Upgrade to Pro to unlock unlimited power for your events!";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-zinc-950 border-purple-500/30 text-white max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-3xl font-extrabold text-white tracking-tight">
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-sm md:text-base max-w-md mx-auto">
            {getTriggerText()}
          </DialogDescription>
        </DialogHeader>

        {/* Pricing Cards Comparison */}
        <div className="grid md:grid-cols-2 gap-6 my-6">
          {/* FREE PLAN */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">FREE</h3>
                <Badge variant="outline" className="border-zinc-700 text-gray-400">
                  Current Tier
                </Badge>
              </div>
              <div>
                <span className="text-4xl font-extrabold text-white">₹0</span>
                <span className="text-gray-400 text-sm"> / month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 shrink-0" />
                  <span><strong>1</strong> event limit</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 shrink-0" />
                  <span>Up to <strong>50</strong> attendees/event</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 shrink-0" />
                  <span>AI Event Creator</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 shrink-0" />
                  <span>Limited Marketing AI (3 templates)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 shrink-0" />
                  <span>Basic Analytics & QR Check-in</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 shrink-0" />
                  <span>1 Team Member</span>
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <span className="w-4 h-4 text-center">✕</span>
                  <span>Platform Branding Required</span>
                </li>
              </ul>
            </div>
            <Button variant="outline" disabled className="w-full border-zinc-800 text-gray-400">
              {isPro ? "Free Plan" : "Current Plan"}
            </Button>
          </div>

          {/* PRO PLAN */}
          <div className="relative rounded-2xl border-2 border-purple-500 bg-gradient-to-b from-purple-950/40 via-zinc-900 to-zinc-950 p-6 flex flex-col justify-between space-y-6 shadow-xl shadow-purple-500/10">
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Zap className="w-3.5 h-3.5" /> RECOMMENDED
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  PRO <Crown className="w-5 h-5 text-amber-400" />
                </h3>
              </div>
              <div>
                <span className="text-4xl font-extrabold text-white">₹399</span>
                <span className="text-purple-300 text-sm"> / month</span>
              </div>
              <ul className="space-y-2.5 text-xs text-gray-200">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 font-bold shrink-0" />
                  <span><strong>Unlimited</strong> events</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 font-bold shrink-0" />
                  <span>Up to <strong>1,000</strong> attendees/event</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 font-bold shrink-0" />
                  <span><strong>AI Event Copilot</strong> & AI Insights</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 font-bold shrink-0" />
                  <span><strong>Full Marketing AI</strong> (10 formats)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 font-bold shrink-0" />
                  <span><strong>Custom Branding</strong> & Colors</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 font-bold shrink-0" />
                  <span>Remove Platform Branding</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 font-bold shrink-0" />
                  <span>Multiple Ticket Types & Certificates</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400 font-bold shrink-0" />
                  <span>Up to 3 Team Members & Custom Domain</span>
                </li>
              </ul>
            </div>

            {isPro ? (
              <Button disabled className="w-full bg-emerald-600 text-white font-semibold">
                ✓ You&apos;re on Pro
              </Button>
            ) : (
              <Button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full py-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-500 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300"
              >
                {upgrading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Activating Pro...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" /> Upgrade to Pro — ₹399/mo
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white text-xs">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
