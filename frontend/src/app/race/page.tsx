"use client";

import React, { useEffect, useState } from "react";
import { useRaceStore } from "@/lib/race-store";
import { Formula1CarSVG } from "@/components/race/formula1-car-svg";
import { AlertTriangle, CloudRain, Sun } from "lucide-react";

export default function ProjectorRacePage() {
  const { currentLap, currentBlock, trackState, standings, cars, connectRace, disconnect } = useRaceStore();
  const [congested, setCongested] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("race_token");
    if (token) {
      connectRace(token);
    }
    return () => disconnect();
  }, [connectRace, disconnect]);

  // Determine if there's congestion (4+ cars pitting on the same lap)
  // The backend might send this in a special banner event, but we can also infer it if needed.
  // For now we'll just check if multiple cars are in PITLANE status.
  useEffect(() => {
    const pittingCount = standings.filter(s => s.status === "IN_PITLANE").length;
    if (pittingCount >= 4) {
      setCongested(true);
      const timer = setTimeout(() => setCongested(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [standings]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans overflow-hidden">
      {/* Global Alert Banner */}
      {trackState === "WET" && (
        <div className="w-full bg-blue-600 text-white font-bold py-2 px-4 flex items-center justify-center gap-2 animate-pulse">
          <CloudRain className="h-5 w-5" /> TRACK WET - RAIN PROTOCOL ACTIVE
        </div>
      )}
      {congested && (
        <div className="w-full bg-destructive text-white font-bold py-2 px-4 flex items-center justify-center gap-2 animate-pulse">
          <AlertTriangle className="h-5 w-5" /> CONGESTION: 4+ CARS PITTED ON LAP {currentLap} - +6.00s TRAFFIC PENALTY
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-white/10 bg-black/50">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-white uppercase">
            F1 <span className="text-red-600">Grand Prix</span>
          </h1>
          <p className="text-zinc-400 font-mono mt-1">BLOCK {currentBlock} | LAP {currentLap}/50</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg border border-white/10">
            {trackState === "DRY" ? <Sun className="text-amber-500 h-5 w-5" /> : <CloudRain className="text-blue-500 h-5 w-5" />}
            <span className="font-bold">{trackState}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - 40% - Timing Tower */}
        <div className="w-[40%] border-r border-white/10 bg-black/80 flex flex-col">
          <div className="p-4 border-b border-white/10 bg-zinc-900">
            <h2 className="font-bold text-lg">LIVE LEADERBOARD</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {standings.map((s, idx) => {
              const car = cars[s.team_id];
              const isPitting = s.status === "IN_PITLANE";
              
              // Team colors map
              const colorMap: Record<string, string> = {
                "team_redbull": "#1e41ff",
                "team_mercedes": "#00d2be",
                "team_ferrari": "#dc0000",
                "team_mclaren": "#ff8700",
                "team_aston": "#006f62",
                "team_alpine": "#0090ff",
                "team_williams": "#005aff",
                "team_haas": "#ffffff"
              };
              const color = colorMap[s.team_id] || "#aaaaaa";

              // Compound badges
              const compoundColors: Record<string, string> = {
                "SOFT": "bg-red-500",
                "MEDIUM": "bg-yellow-400",
                "HARD": "bg-white",
                "INTERMEDIATE": "bg-green-500",
                "WET": "bg-blue-600"
              };

              return (
                <div key={s.team_id} className={`flex items-center justify-between p-3 rounded-md border ${isPitting ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-zinc-900/50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center font-bold font-mono text-lg">{s.position}</div>
                    <div className="w-1 h-8 rounded-full" style={{ backgroundColor: color }}></div>
                    <div>
                      <div className="font-bold text-lg leading-none flex items-center gap-2">
                        {s.driver} 
                        {car?.active_power && car.active_power !== "NONE" && (
                          <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded uppercase">{car.active_power}</span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${compoundColors[s.compound] || "bg-gray-500"}`}></span>
                        {s.compound.charAt(0)} - {car?.tire_age || 0} Laps
                        {isPitting && <span className="text-amber-500 font-bold ml-2">IN PIT</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-lg">
                      {idx === 0 ? s.total_race_time.toFixed(3) : `+${s.gap_to_leader.toFixed(3)}s`}
                    </div>
                    <div className="font-mono text-xs text-zinc-400">
                      Lap: {car?.last_lap_time?.toFixed(3) || "0.000"}s
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - 60% - Track Visualizer */}
        <div className="w-[60%] relative flex items-center justify-center bg-[#0a0a0c] p-8 overflow-hidden">
          {/* Track Graphic */}
          <div className="relative w-full max-w-[800px] aspect-[2/1] rounded-[100px] border-[40px] border-zinc-800 shadow-[inset_0_0_0_8px_#18181b,0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center">
            
            {/* Center Info */}
            <div className="text-center z-10">
              <div className="text-5xl font-black tracking-tight text-white/20">LAP {currentLap}</div>
            </div>

            {/* Cars on Track */}
            {standings.map((s, idx) => {
              // Distribute cars around the track based on gap_to_leader. 
              // Leader is at 0 degrees. Max gap stretches around the track.
              // This is a simplified projection model.
              const leaderTime = standings[0]?.total_race_time || 1;
              const gap = s.gap_to_leader;
              
              // 1 lap is roughly 80 seconds. So a 80s gap = 1 full lap behind.
              const lapProportion = (gap % 80) / 80; 
              
              // Angle: Leader starts at top (Math.PI / 2). Others trail behind (counter-clockwise).
              const angle = (Math.PI / 2) + (lapProportion * Math.PI * 2);

              const isPitting = s.status === "IN_PITLANE";
              
              // If pitting, move them to the inner radius (pit lane)
              const radiusX = isPitting ? 38 : 46;
              const radiusY = isPitting ? 30 : 38;

              const x = 50 + Math.cos(angle) * radiusX;
              const y = 50 + Math.sin(angle) * radiusY;

              const colorMap: Record<string, string> = {
                "team_redbull": "#1e41ff",
                "team_mercedes": "#00d2be",
                "team_ferrari": "#dc0000",
                "team_mclaren": "#ff8700",
                "team_aston": "#006f62",
                "team_alpine": "#0090ff",
                "team_williams": "#005aff",
                "team_haas": "#ffffff"
              };

              return (
                <div 
                  key={s.team_id}
                  className="absolute z-20 transition-all duration-1000 ease-linear"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="relative flex flex-col items-center">
                    <span className="bg-black/80 px-1 py-0.5 rounded text-[10px] font-bold border border-white/20 mb-1 whitespace-nowrap">
                      P{s.position} {s.driver.split(' ')[1] || s.driver}
                    </span>
                    <Formula1CarSVG
                      color={colorMap[s.team_id] || "#aaaaaa"}
                      carNumber={s.position}
                      facing="right" // simplified
                      className="w-16 h-5"
                      glow={!isPitting}
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
