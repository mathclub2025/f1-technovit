"use client";

import React, { useRef, useEffect } from "react";
import { TeamLiveStats } from "@/types/race";
import { Zap, Flag } from "lucide-react";
import { getCarSvgDataUrl } from "@/components/race/formula1-car-svg";

interface OvalTrackProps {
  stats: TeamLiveStats[];
  currentRound: number;
  isRoundRunning: boolean;
}

export function OvalTrack({
  stats,
  currentRound,
  isRoundRunning,
}: OvalTrackProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const carImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Preload SVG car images for each team
  useEffect(() => {
    stats.forEach((team) => {
      const key = `${team.teamId}-${team.color}-${team.carNumber}`;
      if (!carImagesRef.current.has(key)) {
        const img = new Image();
        img.src = getCarSvgDataUrl(team.color, team.carNumber);
        carImagesRef.current.set(key, img);
      }
    });
  }, [stats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number | undefined;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Geometry
      const centerX = width / 2;
      const centerY = height / 2;
      const straightLength = Math.min(width * 0.44, 380);
      const radiusX = Math.min(width * 0.18, 120);
      const radiusY = Math.min(height * 0.32, 135);
      const trackWidth = 64;

      // Dark asphalt stadium background
      ctx.fillStyle = "#090a0d";
      ctx.fillRect(0, 0, width, height);

      const drawOvalPath = (offsetX: number, radX: number, radY: number) => {
        ctx.beginPath();
        ctx.moveTo(centerX + offsetX, centerY - radY);
        ctx.lineTo(centerX - offsetX, centerY - radY);
        ctx.arc(centerX - offsetX, centerY, radY, -Math.PI / 2, Math.PI / 2, true);
        ctx.lineTo(centerX + offsetX, centerY + radY);
        ctx.arc(centerX + offsetX, centerY, radY, Math.PI / 2, -Math.PI / 2, true);
        ctx.closePath();
      };

      // 1. Outer Runoff
      ctx.strokeStyle = "#161b26";
      ctx.lineWidth = trackWidth + 24;
      drawOvalPath(straightLength / 2, radiusX + trackWidth / 2 + 10, radiusY + 5);
      ctx.stroke();

      // 2. Outer Kerbs
      ctx.strokeStyle = "#e11d48";
      ctx.lineWidth = trackWidth + 6;
      ctx.setLineDash([14, 14]);
      drawOvalPath(straightLength / 2, radiusX + trackWidth / 2, radiusY + 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Asphalt Track Surface
      ctx.strokeStyle = "#14161d";
      ctx.lineWidth = trackWidth;
      drawOvalPath(straightLength / 2, radiusX + trackWidth / 2, radiusY);
      ctx.stroke();

      // 4. Staggered Lane Lines (3 dashed dividers for 4 distinct lanes)
      const numDividers = 3;
      for (let d = 1; d <= numDividers; d++) {
        const laneOffset = -trackWidth / 2 + (trackWidth / (numDividers + 1)) * d;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 12]);
        drawOvalPath(straightLength / 2, radiusX + trackWidth / 2, radiusY + laneOffset);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 5. Inner Kerbs
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3.5;
      ctx.setLineDash([10, 10]);
      drawOvalPath(straightLength / 2, radiusX + 6, radiusY - trackWidth / 2 + 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 6. Infield Branding Area
      ctx.fillStyle = "#0c0e14";
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, straightLength / 2 + radiusX * 0.45, radiusY - trackWidth / 2 - 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      ctx.font = "900 22px var(--font-jakarta), sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("APEX CIRCUIT · 50 LAPS", centerX, centerY - 10);
      ctx.font = "600 11px monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.fillText(`ROUND ${currentRound} · 5 LAPS/ROUND`, centerX, centerY + 14);

      // 7. Start / Finish Line
      const finishLineX = centerX;
      const finishLineY = centerY + radiusY;
      ctx.fillStyle = "#ffffff";
      ctx.save();
      ctx.translate(finishLineX, finishLineY);
      const sqSize = 5;
      for (let r = -trackWidth / 2; r < trackWidth / 2; r += sqSize) {
        for (let c = -4; c <= 4; c += sqSize) {
          const isBlack = (Math.floor(r / sqSize) + Math.floor(c / sqSize)) % 2 === 0;
          ctx.fillStyle = isBlack ? "#ffffff" : "#000000";
          ctx.fillRect(c, r, sqSize, sqSize);
        }
      }
      ctx.restore();

      // Coordinates along oval circuit
      const getOvalCoordinates = (progressT: number, laneOffset: number) => {
        const rY = radiusY + laneOffset;
        const halfL = straightLength / 2;
        const straightDist = straightLength;
        const curveDist = Math.PI * rY;
        const totalPerimeter = 2 * straightDist + 2 * curveDist;

        let d = (progressT % 1) * totalPerimeter;
        if (d < 0) d += totalPerimeter;

        if (d <= straightDist) {
          const t = d / straightDist;
          const x = centerX - halfL + t * straightDist;
          const y = centerY + rY;
          return { x, y, angle: 0 };
        }
        d -= straightDist;

        if (d <= curveDist) {
          const t = d / curveDist;
          const angleRad = Math.PI / 2 - t * Math.PI;
          const x = centerX + halfL + Math.cos(angleRad) * rY;
          const y = centerY + Math.sin(angleRad) * rY;
          return { x, y, angle: -t * Math.PI };
        }
        d -= curveDist;

        if (d <= straightDist) {
          const t = d / straightDist;
          const x = centerX + halfL - t * straightDist;
          const y = centerY - rY;
          return { x, y, angle: Math.PI };
        }
        d -= straightDist;

        const t = d / curveDist;
        const angleRad = -Math.PI / 2 - t * Math.PI;
        const x = centerX - halfL + Math.cos(angleRad) * rY;
        const y = centerY + Math.sin(angleRad) * rY;
        return { x, y, angle: Math.PI - t * Math.PI };
      };

      // 8. Draw each car without overlapping bulky labels
      stats.forEach((team, idx) => {
        // Distribute across 4 distinct lane offsets [-20, -7, +7, +20]
        const laneOffsets = [-20, -7, 7, 20];
        const laneOffset = laneOffsets[idx % laneOffsets.length];

        const roundLoops = team.progress * 5;
        const priorLaps = (currentRound - 1) * 5;
        const totalLapsProgress = priorLaps + roundLoops;

        const pos = getOvalCoordinates(totalLapsProgress, laneOffset);

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(pos.angle);

        // Motion blur glow when running
        if (isRoundRunning && !team.isRoundFinished) {
          const trailGrad = ctx.createLinearGradient(-26, 0, 0, 0);
          trailGrad.addColorStop(0, "transparent");
          trailGrad.addColorStop(1, team.color);
          ctx.fillStyle = trailGrad;
          ctx.fillRect(-26, -3.5, 26, 7);
        }

        // Draw Formula 1 SVG sprite
        const key = `${team.teamId}-${team.color}-${team.carNumber}`;
        const img = carImagesRef.current.get(key);

        if (img && img.complete) {
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(img, -17, -8, 34, 16);
          ctx.restore();
        } else {
          ctx.fillStyle = team.color;
          ctx.beginPath();
          ctx.roundRect(-10, -4, 20, 8, 2);
          ctx.fill();
        }

        ctx.restore();

        // High-contrast clean mini position pill (compact, no text collision)
        ctx.save();
        ctx.translate(pos.x, pos.y - 12);
        ctx.fillStyle = team.position === 1 ? "#eab308" : "rgba(0, 0, 0, 0.85)";
        ctx.strokeStyle = team.color;
        ctx.lineWidth = 1;
        const badgeText = `${team.position}`;
        ctx.font = "bold 8px monospace";
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = team.position === 1 ? "#000000" : "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(badgeText, 0, 0.5);
        ctx.restore();
      });
    };

    render();
    return () => {
      if (animationFrameId !== undefined) cancelAnimationFrame(animationFrameId);
    };
  }, [stats, currentRound, isRoundRunning]);

  return (
    <div className="flex flex-col w-full h-full bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Oval Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono font-bold tracking-wider text-foreground uppercase">
            OVAL GRAND PRIX CIRCUIT — ROUND {currentRound} (5 LAPS/ROUND)
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <Flag className="size-3 text-primary" />
          <span>START/FINISH LINE AT BOTTOM STRAIGHT</span>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 min-h-[380px] bg-[#090a0d] flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={880}
          height={460}
          className="w-full h-full max-h-[460px] object-contain rounded-lg"
        />
      </div>

      {/* Telemetry Legend */}
      <div className="px-4 py-2 bg-muted/40 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground font-mono">
        <div>
          4-Lane aerodynamic trajectory · Continuous angular looping
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Zap className="size-3 text-amber-400" /> Real-time relative velocity
          </span>
        </div>
      </div>
    </div>
  );
}
