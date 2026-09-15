"use client";

import React, { useState } from "react";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Globe, Loader2, Plus, Sparkles, Trash2, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import UpgradeModal from "@/components/UpgradeModal";
import ProFeatureLock from "@/components/ProFeatureLock";

export default function BillingPage() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState("");

  const { data: currentUser, isLoading } = useConvexQuery(api.users.getCurrentUser);
  const { mutate: updateSubscription } = useConvexMutation(api.users.updateSubscription);
  const { mutate: addTeamMember } = useConvexMutation(api.users.addTeamMember);
  const { mutate: removeTeamMember } = useConvexMutation(api.users.removeTeamMember);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  const isPro = currentUser?.plan === "pro";
  const teamMembers = currentUser?.teamMembers || [];
  const teamLimit = isPro ? 3 : 1;

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail) {
      toast.error("Please enter an email address");
      return;
    }
    try {
      setAddingMember(true);
      await addTeamMember({
        email: newMemberEmail,
        name: newMemberName || undefined,
      });
      toast.success("Team member added successfully!");
      setNewMemberEmail("");
      setNewMemberName("");
    } catch (error) {
      toast.error(error.message || "Failed to add team member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (email) => {
    try {
      await removeTeamMember({ email });
      toast.success("Team member removed");
    } catch (error) {
      toast.error(error.message || "Failed to remove team member");
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to downgrade to Free? You will lose Pro access at the end of the billing period.")) {
      return;
    }
    try {
      await updateSubscription({
        plan: "free",
        subscriptionStatus: "cancelled",
      });
      toast.success("Subscription updated to Free plan");
    } catch (error) {
      toast.error(error.message || "Failed to cancel subscription");
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Billing & Plan</h1>
          <p className="text-muted-foreground">
            Manage your subscription, team members, and Pro settings.
          </p>
        </div>

        {/* Current Plan Overview Card */}
        <Card className="border-purple-500/30 bg-gradient-to-r from-zinc-900 via-zinc-950 to-purple-950/20">
          <CardContent className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge
                  className={
                    isPro
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm px-3 py-1 gap-1"
                      : "bg-zinc-800 text-gray-300 text-sm px-3 py-1"
                  }
                >
                  {isPro && <Crown className="w-4 h-4" />}
                  {isPro ? "PRO PLAN" : "FREE PLAN"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Status: <strong className="text-emerald-400">Active</strong>
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-white">
                {isPro ? "₹399 / month" : "₹0 / month"}
              </h2>
              <p className="text-sm text-gray-400">
                {isPro
                  ? "Unlimited events, 1,000 attendees/event, AI Event Copilot & Full Marketing AI enabled."
                  : "Includes 1 event limit and up to 50 attendees per event."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {!isPro ? (
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-500 hover:to-orange-400 text-white font-bold py-6 px-8 rounded-xl shadow-lg shadow-purple-500/25"
                >
                  <Sparkles className="w-5 h-5 mr-2" /> Upgrade to Pro — ₹399/mo
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleCancelSubscription}
                  className="border-zinc-700 text-gray-300 hover:text-white"
                >
                  Downgrade to Free
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison Table */}
        <Card className="border-zinc-800">
          <CardHeader>
            <CardTitle>Plan Features & Limits</CardTitle>
            <CardDescription>Comparison of Free vs Pro entitlements</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-gray-400">
                  <th className="pb-3 font-semibold">Feature</th>
                  <th className="pb-3 font-semibold">Free (₹0)</th>
                  <th className="pb-3 font-semibold text-purple-400">Pro (₹399/mo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                <tr>
                  <td className="py-3 font-medium">Events Limit</td>
                  <td className="py-3 text-gray-400">1 Event</td>
                  <td className="py-3 font-bold text-emerald-400">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Attendees Limit</td>
                  <td className="py-3 text-gray-400">50 / event</td>
                  <td className="py-3 font-bold text-emerald-400">1,000 / event</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">AI Event Creator</td>
                  <td className="py-3 text-emerald-400">✓ Included</td>
                  <td className="py-3 text-emerald-400">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">AI Event Copilot</td>
                  <td className="py-3 text-gray-500">✕ Locked</td>
                  <td className="py-3 font-bold text-purple-400">✓ Full Access</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Marketing AI</td>
                  <td className="py-3 text-gray-400">Limited (3 templates)</td>
                  <td className="py-3 font-bold text-purple-400">Full Toolkit (10 templates)</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Custom Branding & Colors</td>
                  <td className="py-3 text-gray-500">✕ Locked</td>
                  <td className="py-3 text-emerald-400">✓ Included</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Remove Platform Branding</td>
                  <td className="py-3 text-gray-500">✕ Required</td>
                  <td className="py-3 text-emerald-400">✓ Removable</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Certificates & Tickets</td>
                  <td className="py-3 text-gray-400">Single Ticket Type</td>
                  <td className="py-3 font-bold text-purple-400">Multiple Tiers & Certificates</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Team Members</td>
                  <td className="py-3 text-gray-400">1 Member</td>
                  <td className="py-3 font-bold text-emerald-400">Up to 3 Members</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Team Members Section */}
        <Card className="border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" /> Team Members
                </CardTitle>
                <CardDescription>
                  {isPro
                    ? "Add up to 3 team members to help organize events."
                    : "Free plan includes 1 team member. Upgrade to Pro for up to 3."}
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-zinc-700">
                {teamMembers.length} / {teamLimit} Members
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {teamMembers.length < teamLimit && (
              <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Team member email"
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Name (optional)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="sm:w-48"
                />
                <Button type="submit" disabled={addingMember} className="gap-2">
                  {addingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Member
                </Button>
              </form>
            )}

            {teamMembers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-zinc-800 rounded-xl">
                No team members added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.email}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800"
                  >
                    <div>
                      <p className="font-semibold text-sm">{member.name || "Team Member"}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.email)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="header"
      />
    </div>
  );
}
