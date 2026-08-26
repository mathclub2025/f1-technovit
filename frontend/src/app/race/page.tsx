"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRaceStore } from "@/lib/race-store";
import { Formula1CarSVG } from "@/components/race/formula1-car-svg";
import { AlertTriangle, CloudRain, Sun, Zap, Shield, Hammer, CloudDrizzle, Settings } from "lucide-react";

export default function ProjectorRacePage() {
  const { currentLap, currentBlock, trackState, standings, cars, lastEvent, connectRace, disconnect } = useRaceStore();
  const [congested, setCongested] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isRacing, setIsRacing] = useState(false);
  const [simLapProgress, setSimLapProgress] = useState<number>(0);
  const [activeSimLap, setActiveSimLap] = useState<number>(currentLap);

  const simStartTimeRef = useRef<number | null>(null);
  const blockStartLapRef = useRef<number>(1);
  const currentLapRef = useRef<number>(currentLap);
  const lastExecutedLapRef = useRef<number>(currentLap);

  useEffect(() => {
    currentLapRef.current = currentLap;
  }, [currentLap]);

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

  // Trigger 5-lap block simulation whenever laps advance
  useEffect(() => {
    if (currentLap > lastExecutedLapRef.current) {
      lastExecutedLapRef.current = currentLap;
      blockStartLapRef.current = Math.max(1, currentLap - 4);
      simStartTimeRef.current = performance.now();
      setIsRacing(true);
      setSimLapProgress(0);
      setActiveSimLap(blockStartLapRef.current);
    }
  }, [currentLap]);

  // Rock-solid 60fps clock-based simulation loop (15s total for 5 laps, never freezes)
  useEffect(() => {
    let animId: number;
    const DURATION_MS = 15000; // 15 seconds to simulate 5 laps

    const loop = (now: number) => {
      if (simStartTimeRef.current !== null) {
        const elapsed = now - simStartTimeRef.current;
        if (elapsed < DURATION_MS) {
          const progress = (elapsed / DURATION_MS) * 5.0;
          setSimLapProgress(progress);
          const currentLapOffset = Math.min(4, Math.floor(progress));
          setActiveSimLap(blockStartLapRef.current + currentLapOffset);
        } else {
          // Block simulation complete: settle on starting grid!
          simStartTimeRef.current = null;
          setIsRacing(false);
          setSimLapProgress(5.0);
          setActiveSimLap(currentLapRef.current);
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Handle manual window or block reset
  useEffect(() => {
    if (lastEvent === "WINDOW_START" || lastEvent === "GRID_INITIALIZED") {
      simStartTimeRef.current = null;
      setIsRacing(false);
      setSimLapProgress(0);
      setActiveSimLap(currentLap);
    }
  }, [lastEvent, currentLap]);

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

  // Exact Stadium Circuit Parametric Trajectory with Tangent Heading Angle
  const getCarTrackTransform = (teamId: string, position: number) => {
    const car = cars[teamId];
    const blockStartLap = blockStartLapRef.current;
    const carCurrentLap = blockStartLap + Math.min(4, Math.floor(simLapProgress));
    
    // Determine if this car is actively in pitlane for the current simulated lap
    const isPitting = Boolean(
      isRacing && 
      car?.action === "PIT" && 
      car?.pit_lap === carCurrentLap
    );

    // When idle / between blocks / not actively racing: Staggered starting grid
    if (!isRacing) {
      const slot = Math.max(0, position - 1);
      const gridX = 47 - slot * 6.5; // Spaced 6.5% apart with zero overlap
      const gridY = slot % 2 === 0 ? 10 : 15;
      return { x: Math.max(6, gridX), y: gridY, angle: 0, isPitting: false };
    }

    // Dynamic pace & gradual distance separation
    const lapTime = car?.last_lap_time && car.last_lap_time > 0 ? car.last_lap_time : 80;
    const speedRatio = 80 / Math.max(65, lapTime);
    const gapOffset = (position - 1) * 0.04;
    const carLapDistance = Math.max(0, simLapProgress * speedRatio - gapOffset);
    const lapFraction = carLapDistance % 1; // 0.0 to 1.0 around circuit

    const straightLength = 38;
    const cornerRadiusX = isPitting ? 16 : 26;
    const cornerRadiusY = isPitting ? 26 : 38;
    const arcLength = Math.PI * 32;
    const totalPerimeter = straightLength + arcLength + straightLength + arcLength;

    const d = lapFraction * totalPerimeter;

    const topY = isPitting ? 22 : 10;
    const botY = isPitting ? 78 : 90;
    const rightCenter = 69;
    const leftCenter = 31;

    // Segment 1: Top Straight (Finish line 50% -> 69%)
    if (d < straightLength / 2) {
      const x = 50 + d;
      return { x, y: topY, angle: 0, isPitting };
    }

    // Segment 2: Right Turn (69% Top -> 69% Bottom)
    const seg2Start = straightLength / 2;
    if (d < seg2Start + arcLength) {
      const u = (d - seg2Start) / arcLength;
      const theta = -Math.PI / 2 + u * Math.PI;
      const x = rightCenter + cornerRadiusX * Math.cos(theta);
      const y = 50 + cornerRadiusY * Math.sin(theta);
      const heading = (u * 180);
      return { x, y, angle: heading, isPitting };
    }

    // Segment 3: Bottom Straight (69% -> 31%)
    const seg3Start = seg2Start + arcLength;
    if (d < seg3Start + straightLength) {
      const x = rightCenter - (d - seg3Start);
      return { x, y: botY, angle: 180, isPitting };
    }

    // Segment 4: Left Turn (31% Bottom -> 31% Top)
    const seg4Start = seg3Start + straightLength;
    if (d < seg4Start + arcLength) {
      const u = (d - seg4Start) / arcLength;
      const theta = Math.PI / 2 + u * Math.PI;
      const x = leftCenter + cornerRadiusX * Math.cos(theta);
      const y = 50 + cornerRadiusY * Math.sin(theta);
      const heading = 180 + (u * 180);
      return { x, y, angle: heading, isPitting };
    }

    // Segment 5: Top Straight (31% -> 50% Finish Line)
    const seg5Start = seg4Start + arcLength;
    const x = leftCenter + (d - seg5Start);
    return { x, y: topY, angle: 0, isPitting };
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
      <header className="flex justify-between items-center px-6 py-3 border-b border-white/10 bg-black/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-display font-black tracking-tight text-white uppercase flex items-center gap-2">
              F1 <span className="text-red-600">Grand Prix</span>
            </h1>
            <p className="text-zinc-400 font-mono text-xs mt-0.2 tracking-wider">
              BLOCK {currentBlock} &bull; LAP {isRacing ? activeSimLap : currentLap} / 50
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRacing ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500 rounded-lg text-red-400 text-xs font-mono font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              SIMULATING LAPS ({Math.floor(simLapProgress) + 1}/5)
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-white/10 rounded-lg text-zinc-400 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              START GRID LOCKED
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/90 rounded-lg border border-white/10 text-xs font-mono font-bold">
            {trackState === "DRY" ? (
              <Sun className="text-amber-500 h-3.5 w-3.5" />
            ) : trackState === "WET" ? (
              <CloudRain className="text-blue-400 h-3.5 w-3.5 animate-bounce" />
            ) : (
              <CloudDrizzle className="text-amber-400 h-3.5 w-3.5" />
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
        {/* Left Panel - 24% - Compact Sleek F1 Timing Tower without extra space */}
        <div className="w-[24%] border-r border-white/10 bg-black/75 backdrop-blur-md flex flex-col justify-start">
          <div className="px-4 py-2.5 border-b border-white/10 bg-zinc-900/80 flex items-center justify-between">
            <h2 className="font-mono font-bold text-xs tracking-widest text-zinc-400 uppercase">Timing Tower</h2>
            <span className="text-[10px] font-mono text-zinc-500">STANDINGS</span>
          </div>

          <div className="p-2 space-y-1 overflow-y-auto">
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
                  className={`flex items-center justify-between px-2.5 py-2 rounded border transition-all duration-300 ${
                    isHammertime
                      ? "border-purple-500 bg-purple-950/40 shadow-[0_0_12px_rgba(168,85,247,0.3)] animate-pulse"
                      : isPitting
                      ? "border-amber-500 bg-amber-500/10 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                      : "border-white/10 bg-zinc-900/70 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 text-center font-bold font-mono text-xs text-zinc-300">{s.position}</div>
                    <div className="w-1 h-7 rounded-full" style={{ backgroundColor: color }}></div>
                    <div>
                      <div className="font-bold text-xs leading-none flex items-center gap-1">
                        {s.driver}
                        {isHammertime && (
                          <span className="text-[7px] bg-purple-600 text-white font-mono px-1 py-0.2 rounded font-black tracking-wider flex items-center">
                            HAMMER
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${compoundColors[s.compound] || "bg-gray-500"}`}></span>
                        <span className="font-mono">
                          {s.compound.charAt(0)} &bull; {car?.tire_age || 0} Laps
                        </span>
                        {isPitting && <span className="text-amber-400 font-bold font-mono ml-0.5">[PIT]</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="font-mono font-bold text-xs">
                      {idx === 0 ? (
                        <span className="text-emerald-400 font-black">LEADER</span>
                      ) : (
                        <span className="text-white">+{Number(s.gap_to_leader ?? 0).toFixed(3)}s</span>
                      )}
                    </div>
                    <div className="font-mono text-[9px] text-zinc-400 flex items-center justify-end gap-1.5 mt-0.5">
                      <span className="text-zinc-400" title="Total Cumulative Race Time">
                        Tot: <strong className="text-zinc-200">{Number(s.total_race_time ?? 0).toFixed(1)}s</strong>
                      </span>
                      <span className="text-zinc-500">&bull;</span>
                      <span 
                        className={isFastest ? "text-purple-400 font-bold" : isHammertime ? "text-purple-400 font-bold" : "text-zinc-400"}
                        title="Last Lap Time"
                      >
                        Lap: {Number(car?.last_lap_time ?? 0).toFixed(1)}s{isFastest ? "⚡" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {standings.length === 0 && (
              <div className="p-4 text-center text-zinc-500 font-mono text-xs">Waiting for race grid setup...</div>
            )}
          </div>
        </div>

        {/* Right Panel - 76% - Massive High-Fidelity Stadium Circuit Visualizer */}
        <div className="w-[76%] relative flex items-center justify-center bg-[#070709] p-2 overflow-hidden">
          {/* Expanded Circuit Visualizer */}
          <div className="relative w-full max-w-[1350px] aspect-[2.25/1] rounded-[140px] border-[32px] border-zinc-800 shadow-[inset_0_0_0_6px_#121214,0_0_80px_rgba(0,0,0,0.95)] flex items-center justify-center">
            {/* Inner Pit Lane Box Route */}
            <div className="absolute inset-[20px] rounded-[110px] border-2 border-dashed border-amber-500/35 pointer-events-none" />

            {/* Finish Line (Top Straight at 50%) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-12 bg-white/40 border-l-2 border-r-2 border-white/70 finish-line-pattern z-10" />

            {/* Center HUD */}
            <div className="text-center z-10 pointer-events-none">
              <div className="text-8xl font-black font-display tracking-tight text-white/15">
                {currentLap > 0 ? `LAP ${isRacing ? activeSimLap : currentLap}` : "START GRID"}
              </div>
              <div className="text-xs font-mono text-zinc-500 tracking-widest uppercase mt-1">
                {isRacing ? "LIVE RACE SIMULATION" : "GRAND PRIX PIT WALL READY"}
              </div>
            </div>

            {/* Cars along track loop with smooth motion and rotation */}
            {standings.map((s, idx) => {
              const car = cars[s.team_id];
              const isHammertime = car?.is_hammertime || car?.active_power === "HAMMERTIME";
              const { x, y, angle, isPitting } = getCarTrackTransform(s.team_id, s.position);

              const defaultColors = ["#dc0000", "#1e41ff", "#00d2be", "#ff8700", "#006f62", "#0090ff", "#005aff", "#f0f0f0"];
              const color = defaultColors[idx % defaultColors.length];

              return (
                <div
                  key={s.team_id}
                  className="absolute z-20 transition-transform duration-75 ease-linear pointer-events-none"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  }}
                >
                  <div className="relative flex flex-col items-center">
                    {/* Badge (counter-rotated so text is upright) */}
                    <span
                      style={{ transform: `rotate(${-angle}deg)` }}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold border mb-1 whitespace-nowrap shadow-md transition-transform ${
                        isHammertime
                          ? "bg-purple-900/90 text-purple-200 border-purple-400"
                          : isPitting
                          ? "bg-amber-950/90 text-amber-300 border-amber-500 animate-bounce"
                          : "bg-black/85 text-white border-white/20"
                      }`}
                    >
                      P{s.position} {s.driver.split(" ")[1] || s.driver}
                      {isPitting && ` [PIT: ${car?.next_compound || "TIRES"}]`}
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

