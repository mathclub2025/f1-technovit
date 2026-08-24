"use client";

import React, { useState } from "react";
import { Team } from "@/types/race";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface RoundInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRound: number;
  totalRounds: number;
  teams: Team[];
  onStartRound: (timings: Record<string, number>) => void;
  previousRoundTimings?: Record<string, number>;
}

function RoundFormContent({
  currentRound,
  totalRounds,
  teams,
  onStartRound,
  onCancel,
  previousRoundTimings,
}: {
  currentRound: number;
  totalRounds: number;
  teams: Team[];
  onStartRound: (timings: Record<string, number>) => void;
  onCancel: () => void;
  previousRoundTimings?: Record<string, number>;
}) {
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    teams.forEach((team) => {
      const prevVal = previousRoundTimings?.[team.id];
      initial[team.id] = prevVal ? prevVal.toFixed(2) : "";
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (teamId: string, val: string) => {
    setInputs((prev) => ({ ...prev, [teamId]: val }));
    if (errors[teamId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[teamId];
        return next;
      });
    }
  };

  const handleRandomize = () => {
    const randomized: Record<string, string> = {};
    const basePace = 40.0;
    teams.forEach((team) => {
      const variance = (Math.random() - 0.48) * 6;
      const time = Math.max(30.0, basePace + variance);
      randomized[team.id] = time.toFixed(2);
    });
    setInputs(randomized);
    setErrors({});
    toast.info("Generated realistic race pace timings for all teams!");
  };

  const handleClear = () => {
    const cleared: Record<string, string> = {};
    teams.forEach((t) => (cleared[t.id] = ""));
    setInputs(cleared);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    const parsedTimings: Record<string, number> = {};

    teams.forEach((team) => {
      const raw = inputs[team.id]?.trim();
      if (!raw) {
        newErrors[team.id] = "Timing required";
        return;
      }
      const num = parseFloat(raw);
      if (isNaN(num) || num <= 0) {
        newErrors[team.id] = "Must be > 0s";
        return;
      }
      if (num > 600) {
        newErrors[team.id] = "Max 600s";
        return;
      }
      parsedTimings[team.id] = num;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please enter valid positive timings for all teams.");
      return;
    }

    onStartRound(parsedTimings);
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="size-7 rounded bg-primary text-primary-foreground font-mono font-bold text-xs flex items-center justify-center">
            R{currentRound}
          </div>
          <DialogTitle className="font-display font-bold text-lg">
            Enter Timings for Round {currentRound} of {totalRounds}
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs">
          Enter the 5-lap total completion time (in seconds) for each team for Laps {(currentRound - 1) * 5 + 1}–{currentRound * 5}.
        </DialogDescription>
      </DialogHeader>

      {/* Quick actions bar */}
      <div className="flex items-center justify-between py-2 border-y border-border text-xs">
        <span className="text-muted-foreground font-mono">
          {teams.length} Teams Registered
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRandomize}
            className="text-xs gap-1 h-7"
          >
            <Sparkles className="size-3 text-amber-500" /> Auto-Fill Pace
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs gap-1 h-7 text-muted-foreground"
          >
            <RotateCcw className="size-3" /> Clear
          </Button>
        </div>
      </div>

      {/* Teams input form */}
      <form id="round-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-2 space-y-2.5 pr-1">
        {teams.map((team, idx) => {
          const hasErr = !!errors[team.id];
          return (
            <div
              key={team.id}
              className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/60 hover:bg-card transition-colors gap-3"
            >
              {/* Team Info */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className="size-7 rounded font-mono font-bold text-xs flex items-center justify-center text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: team.color }}
                >
                  {team.carNumber}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-foreground truncate">
                    {team.name}
                  </div>
                  {team.driverName && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {team.driverName}
                    </div>
                  )}
                </div>
              </div>

              {/* Input Field */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative w-28">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.1"
                    placeholder="e.g. 41.50"
                    value={inputs[team.id] || ""}
                    onChange={(e) => handleInputChange(team.id, e.target.value)}
                    autoFocus={idx === 0}
                    className={`h-8 font-mono text-xs text-right pr-6 ${
                      hasErr ? "border-destructive ring-destructive/30" : ""
                    }`}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground pointer-events-none">
                    s
                  </span>
                </div>
                {hasErr && (
                  <span className="text-[10px] text-destructive font-medium">
                    {errors[team.id]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </form>

      <DialogFooter className="mt-2 pt-3 border-t border-border flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="round-form"
          size="sm"
          className="bg-primary text-primary-foreground font-bold gap-1.5"
        >
          <Play className="size-3.5 fill-current" /> Start Round {currentRound} Animation
        </Button>
      </DialogFooter>
    </>
  );
}

export function RoundInputDialog({
  open,
  onOpenChange,
  currentRound,
  totalRounds,
  teams,
  onStartRound,
  previousRoundTimings,
}: RoundInputDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-6">
        {open && (
          <RoundFormContent
            key={`round-${currentRound}-${teams.length}`}
            currentRound={currentRound}
            totalRounds={totalRounds}
            teams={teams}
            onStartRound={(timings) => {
              onStartRound(timings);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
            previousRoundTimings={previousRoundTimings}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
