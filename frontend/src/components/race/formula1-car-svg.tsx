"use client";

import React from "react";

interface Formula1CarSVGProps {
  color: string;
  carNumber?: number;
  facing?: "left" | "right";
  className?: string;
  glow?: boolean;
}

export function Formula1CarSVG({
  color,
  carNumber,
  facing = "right",
  className = "w-20 h-6",
  glow = false,
}: Formula1CarSVGProps) {
  // If facing right, flip horizontally since SVG raw path points left
  const transform = facing === "right" ? "scaleX(-1)" : undefined;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        filter: glow ? `drop-shadow(0 0 8px ${color}bb)` : undefined,
      }}
    >
      <svg
        viewBox="0 36 98.75 26"
        className="w-full h-full overflow-visible"
        style={{ transform, transformOrigin: "center" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          {/* Main Body Chassis */}
          <path
            d="M78.029,53.801c0-3.049,1.638-5.717,4.072-7.19l-16.177-7.166H55.775c-0.604,0-1.094,0.49-1.094,1.095v1.438 c0,0.604,0.489,1.095,1.094,1.095h0.72v0.997h-1.841c-0.579,0-1.096,0.371-1.277,0.921L53.23,45.43 c-3.351-0.271-4.945,2.294-6.62,2.294l-1.131-1.361c-0.674-0.813-1.706-1.241-2.758-1.144c-0.32,0.03-0.661,0.094-1.008,0.211 l-0.635,2.294c0,0-5.759-0.335-13.245-0.066c1.648,1.537,2.687,3.72,2.687,6.146c0,0.24,0.039,5.32,0.039,5.32h49.383 c-0.976-1.188-1.637-2.648-1.84-4.266C78.055,54.485,78.029,54.135,78.029,53.801z"
            fill={color}
            stroke="#ffffff"
            strokeWidth="0.5"
          />

          {/* Front Nose & Front Wing Aerodynamics */}
          <path
            d="M13.695,53.801c0-1.928,0.659-3.699,1.753-5.12C9.664,49.487,4.044,50.83,0,53.047c0,1.176,5.168,0.019,5.168,2.448H1.181 c-0.402,0-0.728,0.325-0.728,0.728v2.172c0,0.402,0.325,0.729,0.728,0.729h9.969c0.403,0,0.729-0.326,0.729-0.729v-3.354h1.922 c-0.009-0.062-0.024-0.121-0.032-0.185C13.72,54.485,13.695,54.135,13.695,53.801z"
            fill="#0f172a"
            stroke={color}
            strokeWidth="0.6"
          />

          {/* Rear Wing Assembly */}
          <path
            d="M96.938,38.084H86.284c-1.003,0-1.815,0.812-1.815,1.814v2.376c0,0.48,0.191,0.942,0.531,1.282l1.855,1.854 c4.446,0.218,8,3.893,8,8.391c0,0.111-0.012,0.224-0.017,0.334h3.912V39.899C98.752,38.896,97.939,38.084,96.938,38.084z"
            fill="#090d16"
            stroke={color}
            strokeWidth="0.8"
          />
          <rect x="86.5" y="38" width="10" height="2.5" rx="0.5" fill={color} />

          {/* Front Wheel Assembly */}
          <path
            d="M22.106,46.936c-3.79,0-6.866,3.071-6.866,6.866c0,0.293,0.024,0.58,0.062,0.862c0.426,3.386,3.307,6.003,6.805,6.003 c3.598,0,6.54-2.761,6.839-6.279c0.017-0.194,0.03-0.389,0.03-0.586C28.976,50.008,25.9,46.936,22.106,46.936z"
            fill="#111827"
            stroke="#64748b"
            strokeWidth="0.7"
          />
          <circle cx="22.1" cy="53.8" r="3" fill="#334155" />
          <circle cx="22.1" cy="53.8" r="1.2" fill={color} />

          {/* Rear Wheel Assembly */}
          <path
            d="M86.74,46.936c-3.79,0-6.866,3.071-6.866,6.866c0,0.293,0.024,0.58,0.062,0.862c0.426,3.386,3.308,6.003,6.806,6.003 c3.598,0,6.54-2.761,6.84-6.279c0.017-0.194,0.028-0.389,0.028-0.586C93.609,50.008,90.535,46.936,86.74,46.936z"
            fill="#111827"
            stroke="#64748b"
            strokeWidth="0.7"
          />
          <circle cx="86.7" cy="53.8" r="3" fill="#334155" />
          <circle cx="86.7" cy="53.8" r="1.2" fill={color} />
        </g>
      </svg>

      {/* Un-flipped Sharp Car Number on Engine Fin */}
      {carNumber !== undefined && (
        <span
          className="absolute top-[38%] left-[50%] -translate-x-1/2 -translate-y-1/2 font-mono font-black text-[9px] px-1 py-0.2 rounded bg-black/85 text-white shadow-sm border border-white/20 z-10 pointer-events-none"
        >
          #{carNumber}
        </span>
      )}
    </div>
  );
}

export function getCarSvgDataUrl(color: string, carNumber: number): string {
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 36 98.75 26" width="60" height="18">
    <g>
      <path d="M96.938,38.084H86.284c-1.003,0-1.815,0.812-1.815,1.814v2.376c0,0.48,0.191,0.942,0.531,1.282l1.855,1.854 c4.446,0.218,8,3.893,8,8.391c0,0.111-0.012,0.224-0.017,0.334h3.912V39.899C98.752,38.896,97.939,38.084,96.938,38.084z" fill="#090d16" stroke="${color}" stroke-width="1"/>
      <path d="M78.029,53.801c0-3.049,1.638-5.717,4.072-7.19l-16.177-7.166H55.775c-0.604,0-1.094,0.49-1.094,1.095v1.438 c0,0.604,0.489,1.095,1.094,1.095h0.72v0.997h-1.841c-0.579,0-1.096,0.371-1.277,0.921L53.23,45.43 c-3.351-0.271-4.945,2.294-6.62,2.294l-1.131-1.361c-0.674-0.813-1.706-1.241-2.758-1.144c-0.32,0.03-0.661,0.094-1.008,0.211 l-0.635,2.294c0,0-5.759-0.335-13.245-0.066c1.648,1.537,2.687,3.72,2.687,6.146c0,0.24,0.039,5.32,0.039,5.32h49.383 c-0.976-1.188-1.637-2.648-1.84-4.266C78.055,54.485,78.029,54.135,78.029,53.801z" fill="${color}" stroke="#ffffff" stroke-width="0.8"/>
      <path d="M13.695,53.801c0-1.928,0.659-3.699,1.753-5.12C9.664,49.487,4.044,50.83,0,53.047c0,1.176,5.168,0.019,5.168,2.448H1.181 c-0.402,0-0.728,0.325-0.728,0.728v2.172c0,0.402,0.325,0.729,0.728,0.729h9.969c0.403,0,0.729-0.326,0.729-0.729v-3.354h1.922 c-0.009-0.062-0.024-0.121-0.032-0.185C13.72,54.485,13.695,54.135,13.695,53.801z" fill="#0f172a" stroke="${color}" stroke-width="0.7"/>
      <circle cx="22.1" cy="53.8" r="6" fill="#111827" stroke="#64748b" stroke-width="1"/>
      <circle cx="22.1" cy="53.8" r="2" fill="${color}"/>
      <circle cx="86.7" cy="53.8" r="6" fill="#111827" stroke="#64748b" stroke-width="1"/>
      <circle cx="86.7" cy="53.8" r="2" fill="${color}"/>
      <rect x="42" y="44" width="16" height="8" rx="2" fill="#000000" opacity="0.8" />
      <text x="50" y="50" font-family="monospace" font-weight="900" font-size="6" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${carNumber}</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}
