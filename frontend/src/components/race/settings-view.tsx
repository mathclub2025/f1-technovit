"use client";

import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sliders,
  Volume2,
  VolumeX,
  Keyboard,
  RotateCcw,
  Gauge,
} from "lucide-react";
import { soundManager } from "@/lib/sound";

interface SettingsViewProps {
  speedMultiplier: number;
  onSpeedMultiplierChange: (speed: number) => void;
  onResetRace: () => void;
}

export function SettingsView({
  speedMultiplier,
  onSpeedMultiplierChange,
  onResetRace,
}: SettingsViewProps) {
  const [isMuted, setIsMuted] = React.useState(soundManager.getMuted());

  const handleToggleMute = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        eyebrow="CONFIGURATION & RULES"
        title="Grand Prix Regulations"
        description="Configure simulation physics speed, audio synthesis parameters, and review race regulations."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Simulation Speed & Engine Settings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-display font-bold flex items-center gap-2">
              <Gauge className="size-4 text-primary" />
              Simulation Playback Velocity
            </CardTitle>
            <CardDescription className="text-xs">
              Scale real-time clock to simulate 5-lap rounds rapidly or in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {[1, 2, 5, 10, 20].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onSpeedMultiplierChange(spd)}
                  className={`flex-1 py-2 rounded-lg font-mono text-xs transition-all border ${
                    speedMultiplier === spd
                      ? "bg-foreground text-background font-bold border-foreground shadow-sm"
                      : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              At 2x speed, a 40-second 5-lap round animates in 20 real seconds.
            </p>
          </CardContent>
        </Card>

        {/* Web Audio Synthesizer */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-display font-bold flex items-center gap-2">
              <Sliders className="size-4 text-primary" />
              Audio Synthesizer Engine
            </CardTitle>
            <CardDescription className="text-xs">
              Client-side Web Audio API oscillator synthesis for race chimes and fanfares.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-foreground">Sound Effects</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {isMuted ? "Muted" : "Active (Countdown, Lap Pings, Finish)"}
                </div>
              </div>
              <Button
                variant={isMuted ? "outline" : "default"}
                size="sm"
                onClick={handleToggleMute}
                className="text-xs gap-1.5 h-8"
              >
                {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                {isMuted ? "Unmute" : "Mute"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts Reference */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-display font-bold flex items-center gap-2">
              <Keyboard className="size-4 text-primary" />
              Keyboard Shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-muted/30 font-mono">
                <span className="text-muted-foreground">Play / Pause Animation</span>
                <kbd className="px-2 py-0.5 rounded bg-background border border-border text-foreground font-bold">
                  Space
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/30 font-mono">
                <span className="text-muted-foreground">Straight Track Mode</span>
                <kbd className="px-2 py-0.5 rounded bg-background border border-border text-foreground font-bold">
                  1
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/30 font-mono">
                <span className="text-muted-foreground">Oval Circuit Mode</span>
                <kbd className="px-2 py-0.5 rounded bg-background border border-border text-foreground font-bold">
                  2
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/30 font-mono">
                <span className="text-muted-foreground">Toggle Sound Mute</span>
                <kbd className="px-2 py-0.5 rounded bg-background border border-border text-foreground font-bold">
                  M
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted/30 font-mono">
                <span className="text-muted-foreground">Reset Grand Prix</span>
                <kbd className="px-2 py-0.5 rounded bg-background border border-border text-foreground font-bold">
                  R
                </kbd>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reset / Clean State */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-display font-bold text-destructive flex items-center gap-2">
              <RotateCcw className="size-4" />
              Reset & Clear Simulation
            </CardTitle>
            <CardDescription className="text-xs">
              Clear all round timings, telemetry records, and reset the grid to initial state.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={onResetRace}
              className="w-full text-xs font-bold gap-1.5 h-9"
            >
              <RotateCcw className="size-3.5" /> Reset Grand Prix to Setup Mode
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
