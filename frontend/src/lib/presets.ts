import { PresetTeam } from "@/types/race";

export const F1_PRESET_TEAMS: PresetTeam[] = [
  { name: "Scuderia Ferrari", color: "#E10600", driverName: "Charles Leclerc", carNumber: 16 },
  { name: "McLaren F1 Team", color: "#FF8000", driverName: "Lando Norris", carNumber: 4 },
  { name: "Mercedes-AMG Petronas", color: "#00D2BE", driverName: "George Russell", carNumber: 63 },
  { name: "Red Bull Racing", color: "#3671C6", driverName: "Max Verstappen", carNumber: 1 },
  { name: "Aston Martin Aramco", color: "#229971", driverName: "Fernando Alonso", carNumber: 14 },
  { name: "Williams Racing", color: "#64C4FF", driverName: "Carlos Sainz", carNumber: 55 },
  { name: "Alpine F1 Team", color: "#FF87BC", driverName: "Pierre Gasly", carNumber: 10 },
  { name: "Audi Revolut F1", color: "#00E700", driverName: "Nico Hulkenberg", carNumber: 27 },
  { name: "Visa Cash App RB", color: "#6692FF", driverName: "Liam Lawson", carNumber: 30 },
  { name: "Haas F1 Team", color: "#B6BABD", driverName: "Esteban Ocon", carNumber: 31 },
];

export const WEC_PRESET_TEAMS: PresetTeam[] = [
  { name: "Porsche Penske Motorsport", color: "#D50000", driverName: "Kevin Estre", carNumber: 6 },
  { name: "Toyota Gazoo Racing", color: "#FFFFFF", driverName: "Sebastien Buemi", carNumber: 8 },
  { name: "Ferrari AF Corse", color: "#E80020", driverName: "Antonio Giovinazzi", carNumber: 51 },
  { name: "Cadillac Racing", color: "#E5A93C", driverName: "Earl Bamber", carNumber: 2 },
  { name: "BMW M Team WRT", color: "#0066B1", driverName: "Dries Vanthoor", carNumber: 15 },
  { name: "Alpine Endurance Team", color: "#0055A5", driverName: "Mick Schumacher", carNumber: 36 },
];

export const DEFAULT_PRESET_COLORS = [
  "#E10600", // Red
  "#FF8000", // Orange
  "#00D2BE", // Teal
  "#3671C6", // Blue
  "#229971", // Green
  "#FFD700", // Yellow / Gold
  "#A855F7", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Cyan
  "#F43F5E", // Rose
  "#64748B", // Slate
  "#E2E8F0", // White
];

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00.000";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const formattedMins = mins.toString().padStart(2, "0");
  const formattedSecs = secs.toString().padStart(2, "0");
  const formattedMs = ms.toString().padStart(3, "0");

  if (mins > 0) {
    return `${formattedMins}:${formattedSecs}.${formattedMs}`;
  }
  return `${formattedSecs}.${formattedMs}s`;
}

export function formatGap(gapSeconds: number): string {
  if (gapSeconds <= 0.001) return "LEADER";
  return `+${gapSeconds.toFixed(3)}s`;
}
