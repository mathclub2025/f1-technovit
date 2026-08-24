"use client";

import React, { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRaceStore } from "@/lib/race-store";
import { AppSidebar, NavTab } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { RoundInputDialog } from "@/components/race/round-input-dialog";
import { TOTAL_ROUNDS, TOTAL_LAPS } from "@/lib/race-store";
import { soundManager } from "@/lib/sound";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    teams,
    status,
    currentRound,
    speedMultiplier,
    roundHistory,
    inputModalOpen,
    setInputModalOpen,
    setSpeedMultiplier,
    startRace,
    startRound,
    togglePlayPause,
    skipRound,
    proceedToNextRound,
    resetRace,
    tick,
    getLiveStats,
  } = useRaceStore();

  const animRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const speedRef = useRef(speedMultiplier);

  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  useEffect(() => {
    if (status !== "RUNNING") {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      lastTimestampRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      const deltaMs = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      const deltaSec = (deltaMs / 1000) * speedRef.current;
      tick(deltaSec);

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [status, tick]);

  const getActiveTab = (): NavTab => {
    if (pathname.includes("straight") || pathname.includes("oval") || pathname === "/") return "simulation";
    if (pathname.includes("grid")) return "grid";
    if (pathname.includes("timing")) return "matrix";
    if (pathname.includes("standings")) return "standings";
    if (pathname.includes("regulations")) return "settings";
    return "simulation";
  };

  const handleTabChange = (tab: NavTab) => {
    switch (tab) {
      case "simulation":
        router.push("/straight-track");
        break;
      case "grid":
        router.push("/grid");
        break;
      case "matrix":
        router.push("/timing");
        break;
      case "standings":
        router.push("/standings");
        break;
      case "settings":
        router.push("/regulations");
        break;
    }
  };

  const liveStats = getLiveStats();
  const leader = liveStats[0] || null;
  const overallLap = leader ? leader.currentLap : Math.min(TOTAL_LAPS, (currentRound - 1) * 5 + 1);

  const trackMode = pathname.includes("oval") ? "oval" : "straight";
  const handleTrackModeChange = (mode: "straight" | "oval") => {
    if (mode === "oval") {
      router.push("/oval-circuit");
    } else {
      router.push("/straight-track");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "1") {
        router.push("/straight-track");
      } else if (e.key === "2") {
        router.push("/oval-circuit");
      } else if (e.key.toLowerCase() === "m") {
        soundManager.toggleMute();
      } else if (e.key.toLowerCase() === "r" && (e.ctrlKey || e.metaKey)) {
        // let refresh
      } else if (e.key.toLowerCase() === "r" && status !== "SETUP") {
        resetRace();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayPause, resetRace, router, status]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Workspace-style Left Sidebar */}
      <AppSidebar
        activeTab={getActiveTab()}
        onTabChange={handleTabChange}
        status={status}
        currentRound={currentRound}
        totalRounds={TOTAL_ROUNDS}
        onStartRace={() => {
          startRace();
          router.push("/straight-track");
        }}
        onResetRace={() => {
          resetRace();
          router.push("/grid");
        }}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Sticky Topbar */}
        <AppTopbar
          status={status}
          currentRound={currentRound}
          totalRounds={TOTAL_ROUNDS}
          currentLap={overallLap}
          totalLaps={TOTAL_LAPS}
          trackMode={trackMode}
          onTrackModeChange={handleTrackModeChange}
          speedMultiplier={speedMultiplier}
          onSpeedMultiplierChange={setSpeedMultiplier}
          onResetRace={() => {
            resetRace();
            router.push("/grid");
          }}
          onTogglePlayPause={togglePlayPause}
          onSkipRound={skipRound}
          onOpenInputModal={() => {
            if (status === "ROUND_COMPLETE") {
              proceedToNextRound();
            } else {
              setInputModalOpen(true);
            }
          }}
        />

        {/* Scrollable Dashboard Workspace Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>

      {/* Round Timing Input Modal */}
      <RoundInputDialog
        open={inputModalOpen}
        onOpenChange={setInputModalOpen}
        currentRound={currentRound}
        totalRounds={TOTAL_ROUNDS}
        teams={teams}
        onStartRound={(timings) => {
          startRound(timings);
          if (pathname === "/grid") {
            router.push("/straight-track");
          }
        }}
        previousRoundTimings={
          roundHistory[roundHistory.length - 1]?.times
        }
      />
    </div>
  );
}
