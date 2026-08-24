"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { TrackMode, RaceStatus } from "@/types/race";
import { soundManager } from "@/lib/sound";
import { useSidebar } from "@/hooks/use-sidebar";
import {
  Volume2,
  VolumeX,
  Gauge,
  Play,
  Pause,
  SkipForward,
  Search,
  BookOpen,
  Flag,
  Keyboard,
  Trophy,
  Menu,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AppTopbarProps {
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

export function AppTopbar({
  status,
  currentRound,
  totalRounds,
  currentLap,
  totalLaps,
  trackMode,
  onTrackModeChange,
  speedMultiplier,
  onSpeedMultiplierChange,
  onTogglePlayPause,
  onSkipRound,
  onOpenInputModal,
}: AppTopbarProps) {
  const { toggle } = useSidebar();
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [showRules, setShowRules] = useState(false);

  const toggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  const getStatusBadge = () => {
    switch (status) {
      case "SETUP":
        return <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 text-[10px]">GRID SETUP</Badge>;
      case "INPUT":
        return <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10 animate-pulse text-[10px]">INPUT ROUND {currentRound}</Badge>;
      case "RUNNING":
        return <Badge variant="default" className="bg-emerald-500 text-black font-bold animate-pulse text-[10px]">ON TRACK</Badge>;
      case "PAUSED":
        return <Badge variant="secondary" className="text-amber-500 text-[10px]">PAUSED</Badge>;
      case "ROUND_COMPLETE":
        return <Badge variant="default" className="bg-blue-600 text-white font-semibold text-[10px]">R{currentRound} DONE</Badge>;
      case "FINISHED":
        return <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-extrabold text-[10px]">CHEQUERED FLAG 🏁</Badge>;
    }
  };

  return (
    <>
      <header className="flex h-14 items-center justify-between gap-2 sm:gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-2 sm:px-4 lg:px-6 z-20 sticky top-0">
        {/* Left: Mobile Hamburger & Search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            className="md:hidden text-muted-foreground hover:text-foreground shrink-0 size-8"
            aria-label="Toggle Menu"
          >
            <Menu className="size-4" />
          </Button>
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center justify-between w-full h-8 px-2 sm:px-3 rounded-lg bg-muted/40 border border-border text-[10px] sm:text-xs text-muted-foreground hover:bg-muted/70 transition-colors"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <Search className="size-3.5 shrink-0" />
              <span className="truncate">Search Grand Prix...</span>
            </div>
            <kbd className="hidden sm:block px-1.5 py-0.2 rounded bg-background border border-border text-[10px] font-mono text-muted-foreground shrink-0 ml-2">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2">

          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSound}
            title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
            className="text-muted-foreground hover:text-foreground"
          >
            {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-foreground" />}
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Rules & Regulations Trigger (Replacing Bell) */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowRules(true)}
            title="Official Grand Prix Rules & Regulations"
            className="text-muted-foreground hover:text-foreground"
          >
            <BookOpen className="size-4" />
          </Button>
        </div>
      </header>

      {/* Official Grand Prix Rules & Regulations Dialog */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-base">
              <BookOpen className="size-4 text-primary" />
              Official FIA Grand Prix Regulations
            </DialogTitle>
            <DialogDescription className="text-xs">
              Rules, timing parameters, and operational protocols for the 50-Lap Grand Prix.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 text-xs">
            {/* Rule 1: Grand Prix Format */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Flag className="size-3.5 text-primary" /> 1. Race Structure & Distance
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                The Grand Prix consists of <strong>50 total laps</strong> organized into <strong>10 consecutive rounds of 5 laps each</strong>. No constructor may skip a round without registered timing data.
              </p>
            </div>

            {/* Rule 2: Manual Round Entry */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Trophy className="size-3.5 text-amber-500" /> 2. Round Duration Timing & Pace
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Prior to each round, enter the 5-lap duration (in seconds) for every constructor. Lower durations represent superior aerodynamic pace, higher top speed, and earlier round completion.
              </p>
            </div>

            {/* Rule 3: Classification & Leaderboard */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Gauge className="size-3.5 text-emerald-500" /> 3. Live Classification & Podium
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Rankings dynamically update based on cumulative race time. The constructor with the lowest total elapsed time upon completing Lap 50 is crowned Grand Prix Winner on the podium.
              </p>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Keyboard className="size-3.5 text-primary" /> Keyboard Shortcuts
              </div>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground text-[11px]">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono text-[10px]">Space</kbd> Play / Pause
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono text-[10px]">1</kbd> Straight Track
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono text-[10px]">2</kbd> Oval Circuit
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono text-[10px]">M</kbd> Mute Audio
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
