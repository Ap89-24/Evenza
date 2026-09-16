import React from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Crown, Lock, Sparkles } from "lucide-react";
import { Card, CardContent } from "./ui/card";

export const ProFeatureLock = ({
  title = "Pro Feature",
  description = "Upgrade to Pro to unlock this advanced feature.",
  onUpgrade,
  className = "",
  compact = false,
}) => {
  if (compact) {
    return (
      <div className={`p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-md flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{title}</span>
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-1.5 py-0">
                PRO
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onUpgrade}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white gap-1 text-xs"
        >
          <Sparkles className="w-3.5 h-3.5" /> Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className={`relative overflow-hidden border-purple-500/30 bg-gradient-to-b from-purple-950/20 via-zinc-900 to-zinc-950 ${className}`}>
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      <CardContent className="p-8 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
          <Crown className="w-7 h-7" />
        </div>
        <div className="space-y-2 max-w-md">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5">
              PRO ONLY
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Button
            size="lg"
            onClick={onUpgrade}
            className="w-full sm:w-auto px-8 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-500 hover:to-orange-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02]"
          >
            <Sparkles className="w-5 h-5 mr-2" /> Upgrade to Pro — ₹1999/mo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProFeatureLock;
