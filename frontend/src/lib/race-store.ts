import { create } from "zustand";

interface StandingsRow {
  position: number;
  team_id: string;
  driver: string;
  total_race_time: number;
  gap_to_leader: number;
  gap_to_ahead: number;
  pit_stops: number;
  compound: string;
  status: string;
}

interface CarState {
  team_id: string;
  driver: string;
  compound: string;
  tire_age: number;
  total_race_time: number;
  last_lap_time: number;
  action: string;
  pit_lap: number | null;
  next_compound: string | null;
  pit_stop_count: number;
  status: string;
  has_submitted: boolean;
  has_used_power: boolean;
  active_power?: string | null;
  is_hammertime?: boolean;
  is_pit_blocked?: boolean;
  is_blitzkrieg?: boolean;
  is_rainmaster?: boolean;
  is_plan_e?: boolean;
}

interface PowerAssignment {
  team_id: string;
  power: string;
  target_team_id: string | null;
  plan_e_penalty: number | null;
}

interface RaceState {
  currentBlock: number;
  currentLap: number;
  trackState: string;
  windowOpen: boolean;
  windowExpiresAt: number | null;
  standings: StandingsRow[];
  cars: Record<string, CarState>;
  socket: WebSocket | null;
  isConnected: boolean;
  token: string | null;
  queuedPowers: PowerAssignment[];

  connectRace: (token?: string) => void;
  connectTeam: (teamId: string, token?: string) => void;
  disconnect: () => void;
  setToken: (token: string) => void;
  addPower: (power: PowerAssignment) => void;
  clearPowers: () => void;
}

export const useRaceStore = create<RaceState>((set, get) => ({
  currentBlock: 1,
  currentLap: 0,
  trackState: "DRY",
  windowOpen: false,
  windowExpiresAt: null,
  standings: [],
  cars: {},
  socket: null,
  isConnected: false,
  token: null,
  queuedPowers: [],

  setToken: (token: string) => set({ token }),
  addPower: (power: PowerAssignment) => set((state) => ({ queuedPowers: [...state.queuedPowers, power] })),
  clearPowers: () => set({ queuedPowers: [] }),

  connectRace: (token?: string) => {
    // 1. Instant REST sync on load
    fetch("/api/standings")
      .then((res) => res.json())
      .then((data) => {
        if (data.current_block !== undefined) set({ currentBlock: data.current_block });
        if (data.current_lap !== undefined) set({ currentLap: data.current_lap });
        if (data.track_state !== undefined) set({ trackState: data.track_state });
        if (data.window_open !== undefined) set({ windowOpen: data.window_open });
        if (data.window_expires_at !== undefined) set({ windowExpiresAt: data.window_expires_at });
        if (data.standings !== undefined) set({ standings: data.standings });
        if (data.cars !== undefined) set({ cars: data.cars });
      })
      .catch(() => {});

    // 2. Open live WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000";
    const socket = new WebSocket(`${wsUrl}/ws/race${token ? `?token=${token}` : ""}`);

    socket.onopen = () => set({ isConnected: true, socket });
    socket.onclose = () => set({ isConnected: false, socket: null });
    
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "INITIAL_STATE" || msg.type === "LAP_UPDATE" || msg.type === "WINDOW_LOCKED" || msg.type === "WINDOW_START" || msg.type === "BLOCK_COMPLETED" || msg.type === "GRID_INITIALIZED") {
          if (msg.data.current_block !== undefined) set({ currentBlock: msg.data.current_block });
          if (msg.data.current_lap !== undefined) set({ currentLap: msg.data.current_lap });
          if (msg.data.track_state !== undefined) set({ trackState: msg.data.track_state });
          if (msg.data.window_open !== undefined) set({ windowOpen: msg.data.window_open });
          if (msg.data.expires_at !== undefined) set({ windowExpiresAt: msg.data.expires_at });
          if (msg.data.window_expires_at !== undefined) set({ windowExpiresAt: msg.data.window_expires_at });
          if (msg.data.standings !== undefined) set({ standings: msg.data.standings });
          if (msg.data.cars !== undefined) set({ cars: msg.data.cars });
        }
      } catch (e) {}
    };
  },

  connectTeam: (teamId: string, token?: string) => {
    // 1. Instant REST sync on load
    fetch("/api/standings")
      .then((res) => res.json())
      .then((data) => {
        if (data.current_block !== undefined) set({ currentBlock: data.current_block });
        if (data.current_lap !== undefined) set({ currentLap: data.current_lap });
        if (data.track_state !== undefined) set({ trackState: data.track_state });
        if (data.window_open !== undefined) set({ windowOpen: data.window_open });
        if (data.window_expires_at !== undefined) set({ windowExpiresAt: data.window_expires_at });
        if (data.standings !== undefined) set({ standings: data.standings });
        if (data.cars !== undefined) set({ cars: data.cars });
      })
      .catch(() => {});

    // 2. Open live team WebSocket
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000";
    const socket = new WebSocket(`${wsUrl}/ws/team/${teamId}${token ? `?token=${token}` : ""}`);

    socket.onopen = () => set({ isConnected: true, socket });
    socket.onclose = () => set({ isConnected: false, socket: null });
    
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "INITIAL_TEAM_STATE") {
          set({
            currentBlock: msg.data.current_block,
            currentLap: msg.data.current_lap,
            trackState: msg.data.track_state,
            windowOpen: msg.data.window_open,
            windowExpiresAt: msg.data.window_expires_at,
            standings: msg.data.standings,
          });
          if (msg.data.car) {
            set((state) => ({ cars: { ...state.cars, [teamId]: msg.data.car } }));
          }
        } else if (msg.type === "LAP_UPDATE") {
          set({
            currentLap: msg.data.lap_number,
            standings: msg.data.standings,
          });
          if (msg.data.car) {
            set((state) => ({ cars: { ...state.cars, [teamId]: msg.data.car } }));
          }
        } else if (msg.type === "WINDOW_START" || msg.type === "WINDOW_LOCKED" || msg.type === "BLOCK_COMPLETED" || msg.type === "GRID_INITIALIZED") {
          if (msg.data.current_block !== undefined) set({ currentBlock: msg.data.current_block });
          if (msg.data.current_lap !== undefined) set({ currentLap: msg.data.current_lap });
          if (msg.data.track_state !== undefined) set({ trackState: msg.data.track_state });
          if (msg.data.window_open !== undefined) set({ windowOpen: msg.data.window_open });
          if (msg.data.expires_at !== undefined) set({ windowExpiresAt: msg.data.expires_at });
          if (msg.data.window_expires_at !== undefined) set({ windowExpiresAt: msg.data.window_expires_at });
          if (msg.data.standings !== undefined) set({ standings: msg.data.standings });
          if (msg.data.cars !== undefined) set({ cars: msg.data.cars });
        }
      } catch (e) {}
    };
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({ socket: null, isConnected: false });
  },
}));
