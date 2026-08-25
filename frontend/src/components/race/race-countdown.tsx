"use client";

import React, { useEffect, useState } from "react";

interface RaceCountdownProps {
  active: boolean;
}

export function RaceCountdown({ active }: RaceCountdownProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (!active) {
      setCount(3);
      return;
    }

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [active]);

  if (!active || count === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
      <div className="text-center">
        <div className="text-sm font-mono font-bold tracking-[0.4em] text-zinc-400 mb-3">
          RACE STARTING
        </div>

        <div className="text-8xl font-black font-mono text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
          {count}
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {[3, 2, 1].map((number) => (
            <div
              key={number}
              className={`h-2 w-10 rounded-full ${
                number >= count ? "bg-red-500" : "bg-zinc-700"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}