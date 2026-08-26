"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRaceStore } from "@/lib/race-store";
import { Formula1CarSVG } from "@/components/race/formula1-car-svg";
import { AlertTriangle, CloudRain, Sun, Zap, Shield, Hammer, CloudDrizzle, Settings } from "lucide-react";

export default function ProjectorRacePage() {
  const { currentLap, currentBlock, trackState, standings, cars, connectRace, disconnect } = useRaceStore();
  const [congested, setCongested] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("race_token") || undefined;
    connectRace(token);
    return () => disconnect();
  }, [connectRace, disconnect]);

  // Congestion detection
  useEffect(() => {
    const pittingCount = standings.filter((s) => s.status === "IN_PITLANE").length;
    if (pittingCount >= 4) {
      setCongested(true);
      const timer = setTimeout(() => setCongested(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [standings]);

  // Rain Canvas Animation (for WET or DRYING track)
  useEffect(() => {
    if (trackState !== "WET" && trackState !== "DRYING") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const dropCount = trackState === "WET" ? 140 : 50;
    const drops = Array.from({ length: dropCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 20 + 10,
      speed: Math.random() * 10 + 15,
      opacity: Math.random() * 0.4 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = trackState === "WET" ? "rgba(180, 210, 255, 0.4)" : "rgba(200, 220, 240, 0.2)";
      ctx.lineWidth = 1.5;

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.length);
        ctx.stroke();

        d.y += d.speed;
        d.x -= 1;
        if (d.y > height) {
          d.y = -20;
          d.x = Math.random() * width;
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [trackState]);

  // Find fastest lap among current standings
  const fastestLapTime =
    standings.length > 0
      ? Math.min(
          ...standings
            .map((s) => cars[s.team_id]?.last_lap_time)
            .filter((t): t is number => typeof t === "number" && t > 0)
        )
      : null;

  // Calculate authentic car coordinates (Staggered Grid on Lap 0, Oval Loop during race)
  const getCarCoordinates = (position: number, gapToLeader: number, isPitting: boolean) => {
    if (currentLap === 0) {
      const slot = Math.max(0, position - 1);
      const x = 46 - slot * 5.5;
      const y = slot % 2 === 0 ? 8 : 14;
      return { x: Math.max(8, x), y };
    }

    const progress = ((gapToLeader ?? 0) % 80) / 80;
    const angle = progress * Math.PI * 2 - Math.PI / 2;

    const radiusX = isPitting ? 36 : 44;
    const radiusY = isPitting ? 26 : 38;

    const x = 50 + Math.cos(angle) * radiusX;
    const y = 50 + Math.sin(angle) * radiusY;
    return { x, y };
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white flex flex-col font-sans overflow-hidden select-none">
      {/* Rain Canvas Overlay */}
      {(trackState === "WET" || trackState === "DRYING") && (
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-30 w-full h-full" />
      )}

      {/* Global Weather Alert Banner */}
      {trackState === "WET" && (
        <div className="w-full bg-blue-600 text-white font-black tracking-wider py-2.5 px-4 flex items-center justify-center gap-2 animate-pulse text-sm uppercase shadow-lg shadow-blue-900/50">
          <CloudRain className="h-5 w-5" /> Track Condition: WET — Rain Protocol Active (+12.00s Wet Penalty on Slicks)
        </div>
      )}
      {trackState === "DRYING" && (
        <div className="w-full bg-amber-600 text-white font-black tracking-wider py-2 px-4 flex items-center justify-center gap-2 text-sm uppercase shadow-md">
          <CloudDrizzle className="h-5 w-5" /> Track Condition: DRYING — Intermediate/Wet Degradation Multiplied 3x
        </div>
      )}
      {congested && (
        <div className="w-full bg-red-600 text-white font-black tracking-wider py-2.5 px-4 flex items-center justify-center gap-2 animate-bounce text-sm uppercase shadow-lg shadow-red-950">
          <AlertTriangle className="h-5 w-5" /> PITLANE CONGESTION: 4+ CARS PITTED ON LAP {currentLap} — +6.00s TRAFFIC PENALTY APPLIED
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 border-b border-white/10 bg-black/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-black tracking-tight text-white uppercase flex items-center gap-2">
              F1 <span className="text-red-600">Grand Prix</span>
            </h1>
            <p className="text-zinc-400 font-mono text-xs mt-0.5 tracking-wider">
              BLOCK {currentBlock} &bull; LAP {currentLap} / 50
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/90 rounded-lg border border-white/10 text-xs font-mono font-bold">
            {trackState === "DRY" ? (
              <Sun className="text-amber-500 h-4 w-4" />
            ) : trackState === "WET" ? (
              <CloudRain className="text-blue-400 h-4 w-4 animate-bounce" />
            ) : (
              <CloudDrizzle className="text-amber-400 h-4 w-4" />
            )}
            <span>{trackState} TRACK</span>
          </div>

          {/* Discrete Admin Return Button */}
          <Link
            href="/admin"
            className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-white px-2 py-1 rounded bg-zinc-900 border border-white/5 hover:border-white/20 transition-colors"
            title="Return to Admin Panel"
          >
            <Settings className="h-3 w-3" /> Admin
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden z-10">
        {/* Left Panel - 40% - Dynamic Timing Tower */}
        <div className="w-[40%] border-r border-white/10 bg-black/75 backdrop-blur-md flex flex-col">
          <div className="px-6 py-3 border-b border-white/10 bg-zinc-900/80 flex items-center justify-between">
            <h2 className="font-mono font-bold text-xs tracking-widest text-zinc-400 uppercase">Live Timing Tower</h2>
            <span className="text-[10px] font-mono text-zinc-500">LAP INTERVALS</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {standings.map((s, idx) => {
              const car = cars[s.team_id];
              const isPitting = s.status === "IN_PITLANE";
              const isHammertime = car?.is_hammertime || car?.active_power === "HAMMERTIME";
              const isFastest = fastestLapTime && car?.last_lap_time && car.last_lap_time === fastestLapTime && car.last_lap_time > 0;

              const defaultColors = ["#dc0000", "#1e41ff", "#00d2be", "#ff8700", "#006f62", "#0090ff", "#005aff", "#f0f0f0"];
              const color = defaultColors[idx % defaultColors.length];

              const compoundColors: Record<string, string> = {
                SOFT: "bg-red-500",
                MEDIUM: "bg-yellow-400",
                HARD: "bg-white",
                INTER: "bg-green-500",
                INTERMEDIATE: "bg-green-500",
                WET: "bg-blue-600",
              };

              return (
                <div
                  key={s.team_id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                    isHammertime
                      ? "border-purple-500 bg-purple-950/40 shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse"
                      : isPitting
                      ? "border-amber-500 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                      : "border-white/10 bg-zinc-900/60 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 text-center font-bold font-mono text-base">{s.position}</div>
                    <div className="w-1.5 h-9 rounded-full" style={{ backgroundColor: color }}></div>
                    <div>
                      <div className="font-bold text-base leading-tight flex items-center gap-1.5">
                        {s.driver}
                        {isHammertime && (
                          <span className="text-[9px] bg-purple-600 text-white font-mono px-1.5 py-0.5 rounded font-black tracking-wider flex items-center gap-0.5">
                            <Hammer className="h-2.5 w-2.5" /> HAMMER
                          </span>
                        )}
                        {car?.active_power && car.active_power !== "NONE" && !isHammertime && (
                          <span className="text-[9px] bg-zinc-700 text-white font-mono px-1.5 py-0.5 rounded font-bold uppercase">
                            {car.active_power}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${compoundColors[s.compound] || "bg-gray-500"}`}></span>
                        <span className="font-mono text-[11px]">
                          {s.compound.charAt(0)} &bull; {car?.tire_age || 0} Laps
                        </span>
                        {isPitting && <span className="text-amber-400 font-bold font-mono text-[11px] ml-1">PIT LANE</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-base">
                      {idx === 0 ? (s.total_race_time ?? 0).toFixed(3) : `+${(s.gap_to_leader ?? 0).toFixed(3)}s`}
                    </div>
                    <div className="font-mono text-xs text-zinc-400 flex items-center justify-end gap-1 mt-0.5">
                      <span className={isHammertime ? "text-purple-400 font-bold" : isFastest ? "text-emerald-400 font-bold" : ""}>
                        {(car?.last_lap_time ?? 0).toFixed(3)}s
                      </span>
                      {isFastest && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Fastest Sector/Lap"></span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {standings.length === 0 && (
              <div className="p-8 text-center text-zinc-500 font-mono text-xs">Waiting for race grid setup...</div>
            )}
          </div>
        </div>

        {/* Right Panel - 60% - 2D Track Visualizer */}
        <div className="w-[60%] relative flex items-center justify-center bg-[#09090b] p-8 overflow-hidden">
          {/* Circuit Visualizer */}
          <div className="relative w-full max-w-[850px] aspect-[2/1] rounded-[110px] border-[45px] border-zinc-800 shadow-[inset_0_0_0_10px_#141416,0_0_60px_rgba(0,0,0,0.9)] flex items-center justify-center">
            {/* Pit Lane Zone Line */}
            <div className="absolute inset-[30px] rounded-[75px] border-2 border-dashed border-amber-500/30 pointer-events-none" />

            {/* Finish Line */}
            <div className="absolute top-0 right-1/2 -translate-y-1/2 w-4 h-12 bg-white/30 border-l border-r border-white/60 finish-line-pattern" />

            {/* Center HUD */}
            <div className="text-center z-10 pointer-events-none">
              <div className="text-6xl font-black font-display tracking-tight text-white/15">LAP {currentLap}</div>
              <div className="text-xs font-mono text-zinc-500 tracking-widest uppercase mt-1">GRAND PRIX LIVE STREAM</div>
            </div>

            {/* Cars along track loop */}
            {standings.map((s, idx) => {
              const car = cars[s.team_id];
              const isPitting = s.status === "IN_PITLANE";
              const isHammertime = car?.is_hammertime || car?.active_power === "HAMMERTIME";
              const { x, y } = getCarCoordinates(s.position, s.gap_to_leader, isPitting);

              const defaultColors = ["#dc0000", "#1e41ff", "#00d2be", "#ff8700", "#006f62", "#0090ff", "#005aff", "#f0f0f0"];
              const color = defaultColors[idx % defaultColors.length];

              return (
                <div
                  key={s.team_id}
                  className="absolute z-20 transition-all duration-700 ease-linear"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="relative flex flex-col items-center">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border mb-1 whitespace-nowrap ${
                        isHammertime
                          ? "bg-purple-900/90 text-purple-200 border-purple-400"
                          : isPitting
                          ? "bg-amber-950/90 text-amber-300 border-amber-500"
                          : "bg-black/85 text-white border-white/20"
                      }`}
                    >
                      P{s.position} {s.driver.split(" ")[1] || s.driver}
                      {isPitting && " [PIT]"}
                    </span>
                    <Formula1CarSVG
                      color={color}
                      carNumber={s.position}
                      facing="right"
                      className="w-16 h-5"
                      glow={!isPitting || isHammertime}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

