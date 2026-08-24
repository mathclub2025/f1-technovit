import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Team, RaceStatus, RoundTiming, TeamLiveStats } from "@/types/race";
import { F1_PRESET_TEAMS } from "@/lib/presets";
import { soundManager } from "@/lib/sound";
import { toast } from "sonner";

export const TOTAL_ROUNDS = 10;
export const TOTAL_LAPS = 50;

interface RaceState {
  teams: Team[];
  status: RaceStatus;
  currentRound: number;
  speedMultiplier: number;
  roundElapsed: number;
  roundHistory: RoundTiming[];
  currentRoundTimings: Record<string, number>;
  completedCumulativeTimes: Record<string, number>;
  bestRoundTimes: Record<string, number>;
  previousPositions: Record<string, number>;
  inputModalOpen: boolean;

  // Actions
  setTeams: (teams: Team[]) => void;
  setInputModalOpen: (open: boolean) => void;
  setSpeedMultiplier: (speed: number) => void;
  startRace: () => void;
  startRound: (timings: Record<string, number>) => void;
  togglePlayPause: () => void;
  skipRound: () => void;
  proceedToNextRound: () => void;
  resetRace: () => void;
  tick: (deltaSec: number) => void;
  getLiveStats: () => TeamLiveStats[];
}

export const useRaceStore = create<RaceState>()(
  persist(
    (set, get) => ({
      teams: F1_PRESET_TEAMS.map((pt, idx) => ({
        id: `team-${idx + 1}`,
        name: pt.name,
        driverName: pt.driverName,
        color: pt.color,
        carNumber: pt.carNumber,
      })),
      status: "SETUP",
      currentRound: 1,
      speedMultiplier: 2,
      roundElapsed: 0,
      roundHistory: [],
      currentRoundTimings: {},
      completedCumulativeTimes: {},
      bestRoundTimes: {},
      previousPositions: {},
      inputModalOpen: false,

      setTeams: (teams) => set({ teams }),
      setInputModalOpen: (open) => set({ inputModalOpen: open }),
      setSpeedMultiplier: (speed) => set({ speedMultiplier: speed }),

      startRace: () => {
        set({
          currentRound: 1,
          roundHistory: [],
          roundElapsed: 0,
          completedCumulativeTimes: {},
          bestRoundTimes: {},
          previousPositions: {},
          status: "INPUT",
          inputModalOpen: true,
        });
        soundManager.playClick();
      },

      startRound: (timings) => {
        set({
          currentRoundTimings: timings,
          roundElapsed: 0,
          status: "RUNNING",
          inputModalOpen: false,
        });
        soundManager.playCountdownBeep(false);
        toast.success(`Round ${get().currentRound} started!`);
      },

      togglePlayPause: () => {
        const { status } = get();
        if (status === "RUNNING") {
          set({ status: "PAUSED" });
        } else if (status === "PAUSED") {
          set({ status: "RUNNING" });
        }
      },

      skipRound: () => {
        const { currentRoundTimings } = get();
        const maxTime = Math.max(...Object.values(currentRoundTimings), 45);
        set({ roundElapsed: maxTime + 0.1 });
        get().tick(0.01);
      },

      proceedToNextRound: () => {
        const nextRound = get().currentRound + 1;
        set({
          currentRound: nextRound,
          roundElapsed: 0,
          status: "INPUT",
          inputModalOpen: true,
        });
        soundManager.playClick();
      },

      resetRace: () => {
        set({
          status: "SETUP",
          currentRound: 1,
          roundElapsed: 0,
          roundHistory: [],
          currentRoundTimings: {},
          completedCumulativeTimes: {},
          bestRoundTimes: {},
          previousPositions: {},
          inputModalOpen: false,
        });
        toast.info("Race simulation reset to team setup.");
      },

      tick: (deltaSec) => {
        const {
          status,
          roundElapsed,
          currentRoundTimings,
          completedCumulativeTimes,
          bestRoundTimes,
          teams,
          currentRound,
        } = get();

        if (status !== "RUNNING") return;

        const newElapsed = roundElapsed + deltaSec;
        set({ roundElapsed: newElapsed });

        // Check if all finished
        const timings = Object.values(currentRoundTimings);
        const allFinished = timings.length > 0 && timings.every((target) => newElapsed >= target);

        if (allFinished) {
          const nextCompleted: Record<string, number> = { ...completedCumulativeTimes };
          const nextBest: Record<string, number> = { ...bestRoundTimes };
          const nextPrevPositions: Record<string, number> = {};

          teams.forEach((team) => {
            const rTime = currentRoundTimings[team.id] || 40.0;
            nextCompleted[team.id] = (nextCompleted[team.id] || 0) + rTime;

            if (!nextBest[team.id] || rTime < nextBest[team.id]) {
              nextBest[team.id] = rTime;
            }
          });

          const sorted = [...teams].sort(
            (a, b) => (nextCompleted[a.id] || 0) - (nextCompleted[b.id] || 0)
          );
          sorted.forEach((t, idx) => {
            nextPrevPositions[t.id] = idx + 1;
          });

          const newRoundHistory = [
            ...get().roundHistory,
            { round: currentRound, times: { ...currentRoundTimings } },
          ];

          soundManager.playCountdownBeep(true);

          if (currentRound >= TOTAL_ROUNDS) {
            set({
              status: "FINISHED",
              completedCumulativeTimes: nextCompleted,
              bestRoundTimes: nextBest,
              previousPositions: nextPrevPositions,
              roundHistory: newRoundHistory,
            });
            toast.success("Grand Prix Complete! 50 Laps Finished 🏁");
          } else {
            set({
              status: "ROUND_COMPLETE",
              completedCumulativeTimes: nextCompleted,
              bestRoundTimes: nextBest,
              previousPositions: nextPrevPositions,
              roundHistory: newRoundHistory,
            });
            toast.info(`Round ${currentRound} finished! Leader: ${sorted[0]?.name}`);
          }
        }
      },

      getLiveStats: () => {
        const {
          teams,
          currentRoundTimings,
          completedCumulativeTimes,
          roundElapsed,
          currentRound,
          previousPositions,
          bestRoundTimes,
          status,
        } = get();

        const rawList = teams.map((team) => {
          const targetRoundTime = currentRoundTimings[team.id] || 40.0;
          const completedTotal = completedCumulativeTimes[team.id] || 0;
          const elapsedInCurrent = Math.min(roundElapsed, targetRoundTime);
          const progress = targetRoundTime > 0 ? Math.min(1, roundElapsed / targetRoundTime) : 0;
          const isFinished = progress >= 1;

          const roundLaps = Math.min(5, Math.floor(progress * 5) + 1);
          const currentLap = Math.min(TOTAL_LAPS, (currentRound - 1) * 5 + (isFinished ? 5 : roundLaps));
          const cumulativeTime = completedTotal + elapsedInCurrent;

          const paceFactor = targetRoundTime > 0 ? 40.0 / targetRoundTime : 1.0;
          const speedKmh = isFinished ? 0 : 280 + Math.sin(progress * Math.PI * 5) * 20 + paceFactor * 30;

          return {
            teamId: team.id,
            name: team.name,
            color: team.color,
            carNumber: team.carNumber,
            driverName: team.driverName,
            currentRoundTime: targetRoundTime,
            currentRoundElapsed: elapsedInCurrent,
            progress,
            currentLap,
            cumulativeTime,
            completedCumulativeTime: completedTotal,
            position: 1,
            previousPosition: previousPositions[team.id] || 1,
            gapToLeader: 0,
            gapToAhead: 0,
            isRoundFinished: isFinished,
            bestRoundTime: bestRoundTimes[team.id] || null,
            speedKmh: status === "RUNNING" ? speedKmh : 0,
          } as TeamLiveStats;
        });

        // Sort by cumulative time
        const sorted = [...rawList].sort((a, b) => a.cumulativeTime - b.cumulativeTime);
        const leaderTime = sorted[0]?.cumulativeTime || 0;

        return sorted.map((st, idx) => {
          const prevCar = sorted[idx - 1];
          return {
            ...st,
            position: idx + 1,
            gapToLeader: Math.max(0, st.cumulativeTime - leaderTime),
            gapToAhead: Math.max(0, prevCar ? st.cumulativeTime - prevCar.cumulativeTime : 0),
          };
        });
      },
    }),
    {
      name: "f1-race-store",
      partialize: (state) => ({
        teams: state.teams,
        status: state.status,
        currentRound: state.currentRound,
        speedMultiplier: state.speedMultiplier,
        roundHistory: state.roundHistory,
        completedCumulativeTimes: state.completedCumulativeTimes,
        bestRoundTimes: state.bestRoundTimes,
        previousPositions: state.previousPositions,
      }),
    }
  )
);
