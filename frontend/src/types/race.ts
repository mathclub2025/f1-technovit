export interface Team {
  id: string;
  name: string;
  color: string;
  carNumber: number;
  driverName?: string;
}

export interface RoundTiming {
  round: number; // 1 to 10
  times: Record<string, number>; // teamId -> round duration in seconds
}

export type RaceStatus =
  | "SETUP"
  | "INPUT"
  | "RUNNING"
  | "PAUSED"
  | "ROUND_COMPLETE"
  | "FINISHED";

export type TrackMode = "straight" | "oval";

export interface TeamLiveStats {
  teamId: string;
  name: string;
  color: string;
  carNumber: number;
  driverName?: string;
  currentRoundTime: number; // target time for current round
  currentRoundElapsed: number; // elapsed time in current round
  progress: number; // 0 to 1 in current round
  currentLap: number; // 1 to 50
  cumulativeTime: number; // completed rounds total + current round elapsed
  completedCumulativeTime: number; // completed rounds only
  position: number; // 1-based current rank
  previousPosition: number;
  gapToLeader: number; // seconds behind leader
  gapToAhead: number; // seconds behind previous car
  isRoundFinished: boolean;
  bestRoundTime: number | null;
  speedKmh: number; // simulated telemetry speed
}

export interface PresetTeam {
  name: string;
  color: string;
  driverName: string;
  carNumber: number;
}
