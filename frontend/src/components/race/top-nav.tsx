"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { TrackMode, RaceStatus } from "@/types/race";
import { soundManager } from "@/lib/sound";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Gauge,
  Flag,
  Sparkles,
  HelpCircle,
  Play,
  Pause,
  SkipForward,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TopNavProps {
  status: RaceStatus;
  currentRound: number;
  totalRounds: number;
  currentLap: number;
  totalLaps: number;
  trackMode: TrackMode;
  onTrackModeChange: (mode: TrackMode) => void;
  speedMultiplier: number;
  onSpeedMultiplierChange: (speed: number) => void;
  onResetRace: () => void;
  onTogglePlayPause: () => void;
  onSkipRound: () => void;
  onOpenInputModal: () => void;
}

export function TopNav({
  status,
  currentRound,
  totalRounds,
  currentLap,
  totalLaps,
  trackMode,
  onTrackModeChange,
  speedMultiplier,
  onSpeedMultiplierChange,
  onResetRace,
  onTogglePlayPause,
  onSkipRound,
  onOpenInputModal,
}: TopNavProps) {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [showHelp, setShowHelp] = useState(false);

  const toggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  const getStatusBadge = () => {
    switch (status) {
      case "SETUP":
        return <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">TEAM SETUP</Badge>;
      case "INPUT":
        return <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10 animate-pulse">AWAITING TIMES (R{currentRound})</Badge>;
      case "RUNNING":
        return <Badge variant="default" className="bg-emerald-500 text-black font-bold animate-pulse">LIVE ON TRACK</Badge>;
      case "PAUSED":
        return <Badge variant="secondary" className="text-amber-500">PAUSED</Badge>;
      case "ROUND_COMPLETE":
        return <Badge variant="default" className="bg-blue-600 text-white font-semibold">ROUND {currentRound} FINISHED</Badge>;
      case "FINISHED":
        return <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-extrabold">CHEQUERED FLAG 🏁</Badge>;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md px-4 py-2.5 transition-all">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Race Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-lg bg-primary text-primary-foreground font-black tracking-tighter shadow-md">
              <Flag className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-base tracking-tight text-foreground">
                  F1 APEX RACE SIM
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  50 LAPS
                </span>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Local Multi-Team 10-Round Grand Prix Simulator
              </p>
            </div>
          </div>

          {/* Center Info: Round & Lap Indicator */}
          {status !== "SETUP" && (
            <div className="flex items-center gap-3 bg-muted/60 dark:bg-muted/30 px-3.5 py-1.5 rounded-lg border border-border">
              <div className="text-center">
                <div className="text-[10px] font-mono uppercase text-muted-foreground">ROUND</div>
                <div className="font-display font-bold text-sm leading-tight text-foreground">
                  {currentRound} <span className="text-xs text-muted-foreground font-normal">/ {totalRounds}</span>
                </div>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="text-center">
                <div className="text-[10px] font-mono uppercase text-muted-foreground">LAP</div>
                <div className="font-display font-bold text-sm leading-tight text-primary">
                  {currentLap} <span className="text-xs text-muted-foreground font-normal">/ {totalLaps}</span>
                </div>
              </div>
            </div>
          )}

          {/* Controls & Tools */}
          <div className="flex items-center gap-2">
            {/* Track Mode Switcher */}
            {status !== "SETUP" && (
              <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40 text-xs">
                <button
                  onClick={() => onTrackModeChange("straight")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    trackMode === "straight"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Straight Sprint Track (Drag style)"
                >
                  Straight
                </button>
                <button
                  onClick={() => onTrackModeChange("oval")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    trackMode === "oval"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Oval Circuit Track (Continuous looping)"
                >
                  Oval Circuit
                </button>
              </div>
            )}

            {/* Play/Pause & Actions for Active Race */}
            {status === "RUNNING" && (
              <Button
                variant="outline"
                size="sm"
                onClick={onTogglePlayPause}
                className="font-semibold text-xs gap-1.5"
              >
                <Pause className="size-3.5" /> Pause
              </Button>
            )}

            {status === "PAUSED" && (
              <Button
                variant="default"
                size="sm"
                onClick={onTogglePlayPause}
                className="font-semibold text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play className="size-3.5" /> Resume
              </Button>
            )}

            {(status === "RUNNING" || status === "PAUSED") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkipRound}
                title="Skip immediately to end of current round"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="size-3.5" />
              </Button>
            )}

            {status === "INPUT" && (
              <Button
                variant="default"
                size="sm"
                onClick={onOpenInputModal}
                className="font-semibold text-xs gap-1.5 bg-primary text-primary-foreground animate-pulse"
              >
                <Play className="size-3.5" /> Enter Times & Start R{currentRound}
              </Button>
            )}

            {status === "ROUND_COMPLETE" && (
              <Button
                variant="default"
                size="sm"
                onClick={onOpenInputModal}
                className="font-semibold text-xs gap-1.5 bg-primary text-primary-foreground"
              >
                <Play className="size-3.5" /> Proceed to Round {currentRound + 1}
              </Button>
            )}

            {/* Sim Speed Multiplier Selector */}
            {status !== "SETUP" && status !== "FINISHED" && (
              <div className="hidden sm:flex items-center gap-1 border border-border rounded-lg p-0.5 bg-muted/20 text-xs">
                <span className="text-[10px] text-muted-foreground px-1.5 font-mono flex items-center gap-1">
                  <Gauge className="size-3" /> SPEED
                </span>
                {[1, 2, 5, 10].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => onSpeedMultiplierChange(spd)}
                    className={`px-1.5 py-0.5 rounded font-mono text-[11px] transition-all ${
                      speedMultiplier === spd
                        ? "bg-foreground text-background font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            )}

            {/* Sound Toggle */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleSound}
              title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
            >
              {isMuted ? <VolumeX className="size-3.5 text-muted-foreground" /> : <Volume2 className="size-3.5 text-primary" />}
            </Button>

            {/* Help / Shortcuts */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setShowHelp(true)}
              title="Keyboard shortcuts & rules"
            >
              <HelpCircle className="size-3.5" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Reset Button */}
            {status !== "SETUP" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onResetRace}
                className="text-xs gap-1 ml-1"
                title="Reset simulation and return to team setup"
              >
                <RotateCcw className="size-3" /> Reset
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Help Modal */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-500" />
              50-Lap Grand Prix Simulator Guide
            </DialogTitle>
            <DialogDescription>
              Operate the multi-team race simulation and timing engine.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
              <div className="font-semibold text-foreground">Race Architecture:</div>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>Total 50 laps broken down into 10 rounds of 5 laps each.</li>
                <li>Enter the 5-lap duration (in seconds) for each team prior to each round.</li>
                <li>Teams with lower round times move faster and reach the checkpoint sooner.</li>
                <li>Cumulative timing updates dynamically after each round. Leader is updated in real-time.</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
              <div className="font-semibold text-foreground">Track Visualization:</div>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li><strong>Straight Track:</strong> Multi-lane drag strip with telemetry speeds & distance markers.</li>
                <li><strong>Oval Circuit:</strong> Physics-based continuous angular track navigation.</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
              <div className="font-semibold text-foreground">Keyboard Shortcuts:</div>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div><kbd className="px-1.5 py-0.5 bg-background border rounded font-mono text-[10px]">Space</kbd> Play / Pause</div>
                <div><kbd className="px-1.5 py-0.5 bg-background border rounded font-mono text-[10px]">1</kbd> / <kbd className="px-1.5 py-0.5 bg-background border rounded font-mono text-[10px]">2</kbd> Track Mode</div>
                <div><kbd className="px-1.5 py-0.5 bg-background border rounded font-mono text-[10px]">M</kbd> Toggle Audio</div>
                <div><kbd className="px-1.5 py-0.5 bg-background border rounded font-mono text-[10px]">R</kbd> Reset Race</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
