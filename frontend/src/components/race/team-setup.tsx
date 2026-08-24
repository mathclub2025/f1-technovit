"use client";

import React, { useState } from "react";
import { Team, PresetTeam } from "@/types/race";
import {
  F1_PRESET_TEAMS,
  WEC_PRESET_TEAMS,
  DEFAULT_PRESET_COLORS,
} from "@/lib/presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Formula1CarSVG } from "@/components/race/formula1-car-svg";
import {
  Plus,
  Trash2,
  Sparkles,
  Users,
  Play,
} from "lucide-react";
import { toast } from "sonner";

interface TeamSetupProps {
  teams: Team[];
  onUpdateTeams: (teams: Team[]) => void;
  onStartRace: () => void;
}

export function TeamSetup({ teams, onUpdateTeams, onStartRace }: TeamSetupProps) {
  const [newTeamName, setNewTeamName] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#E10600");
  const [newCarNumber, setNewCarNumber] = useState<number>(() => {
    return Math.max(1, teams.length + 1);
  });

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast.error("Please enter a Team Name.");
      return;
    }

    const newTeam: Team = {
      id: `team-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newTeamName.trim(),
      driverName: newDriverName.trim() || undefined,
      color: newTeamColor,
      carNumber: Number(newCarNumber) || teams.length + 1,
    };

    const updated = [...teams, newTeam];
    onUpdateTeams(updated);
    setNewTeamName("");
    setNewDriverName("");
    setNewCarNumber(updated.length + 1);
    const nextColor = DEFAULT_PRESET_COLORS[updated.length % DEFAULT_PRESET_COLORS.length];
    setNewTeamColor(nextColor);
    toast.success(`Team "${newTeam.name}" registered!`);
  };

  const handleRemoveTeam = (teamId: string) => {
    if (teams.length <= 2) {
      toast.warning("A Grand Prix requires at least 2 Teams.");
      return;
    }
    const updated = teams.filter((t) => t.id !== teamId);
    onUpdateTeams(updated);
  };

  const handleApplyPreset = (presetList: PresetTeam[]) => {
    const newTeams: Team[] = presetList.map((pt, idx) => ({
      id: `team-${Date.now()}-${idx}`,
      name: pt.name,
      driverName: pt.driverName,
      color: pt.color,
      carNumber: pt.carNumber,
    }));
    onUpdateTeams(newTeams);
    toast.success(`Applied ${newTeams.length}-team grid preset!`);
  };

  const handleStart = () => {
    if (teams.length < 2) {
      toast.error("Please add at least 2 Teams to begin.");
      return;
    }
    onStartRace();
  };

  return (
    <div className="space-y-6">
      {/* Workspace-style Page Header */}
      <PageHeader
        eyebrow="FIA TeamS CHAMPIONSHIP"
        title="Grid & Team Management"
        description="Register racing Teams, customize vehicle liveries, or select standard championship grid presets for the 50-lap race."
        actions={
          <Button
            size="sm"
            onClick={handleStart}
            className="bg-primary text-primary-foreground font-bold text-xs h-9 px-4 gap-1.5 shadow-sm"
          >
            <Play className="size-3.5 fill-current" />
            Launch Grand Prix ({teams.length} Teams)
          </Button>
        }
      />

      {/* Grid Presets Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          <span className="font-display font-bold text-xs">Championship Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleApplyPreset(F1_PRESET_TEAMS)}
            className="text-xs h-7 gap-1.5"
          >
            🏁 Formula 1 (10 Teams)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleApplyPreset(WEC_PRESET_TEAMS)}
            className="text-xs h-7 gap-1.5"
          >
            🏎️ WEC Hypercar (6 Teams)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleApplyPreset(F1_PRESET_TEAMS.slice(0, 4))}
            className="text-xs h-7 gap-1.5"
          >
            ⚡ Top 4 Sprint (4 Teams)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Add Team */}
        <Card className="lg:col-span-1 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display font-bold flex items-center gap-2">
              <Plus className="size-4 text-primary" />
              Register Team
            </CardTitle>
            <CardDescription className="text-xs">
              Add a custom team to the active starting grid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTeam} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Team Name</label>
                <Input
                  placeholder="e.g. Scuderia Ferrari"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Lead Driver (Optional)</label>
                <Input
                  placeholder="e.g. Charles Leclerc"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Car #</label>
                  <Input
                    type="number"
                    min="1"
                    max="999"
                    value={newCarNumber}
                    onChange={(e) => setNewCarNumber(parseInt(e.target.value) || 1)}
                    className="font-mono text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Color Hex</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newTeamColor}
                      onChange={(e) => setNewTeamColor(e.target.value)}
                      className="size-8 rounded cursor-pointer border border-border p-0.5 bg-transparent"
                    />
                    <span className="text-xs font-mono text-muted-foreground uppercase">{newTeamColor}</span>
                  </div>
                </div>
              </div>

              {/* Live Preview of the F1 Car with selected color */}
              <div className="p-3 rounded-lg bg-black/40 border border-border flex flex-col items-center justify-center gap-3">
                <div className="text-[11px] font-mono text-muted-foreground w-full text-left">Livery Preview:</div>
                <Formula1CarSVG
                  color={newTeamColor}
                  carNumber={newCarNumber}
                  className="w-48 h-12"
                />
              </div>

              {/* Color Swatches */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground">Preset Swatches</label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewTeamColor(c)}
                      className={`size-5 rounded-full transition-transform ${
                        newTeamColor === c ? "scale-125 ring-2 ring-foreground" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full font-bold text-xs bg-primary text-primary-foreground gap-1 mt-2 h-8"
              >
                <Plus className="size-3.5" /> Add Team to Grid
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right: Active Grid List */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-display font-bold flex items-center gap-2">
                <Users className="size-4 text-primary" />
                Active Starting Grid ({teams.length} Teams)
              </CardTitle>
              <CardDescription className="text-xs">
                Minimum 2 Teams required to launch a Grand Prix.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={handleStart}
              className="bg-primary text-primary-foreground font-bold text-xs gap-1.5 h-8"
            >
              <Play className="size-3 fill-current" /> Start Race
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60 max-h-[460px] overflow-y-auto pr-1">
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  className="py-2.5 px-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground w-4 text-right font-bold">
                      {index + 1}
                    </span>

                    {/* F1 Car Preview Icon */}
                    <div className="flex items-center shrink-0 mr-1">
                      <Formula1CarSVG
                        color={team.color}
                        carNumber={team.carNumber}
                        className="w-24 h-8"
                      />
                    </div>

                    <div className="truncate">
                      <div className="font-display font-bold text-xs text-foreground truncate">
                        {team.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5 font-mono">
                        {team.driverName ? team.driverName : `Car #${team.carNumber}`}
                        <span className="size-1 rounded-full bg-border" />
                        <span style={{ color: team.color }}>{team.color}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemoveTeam(team.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove Team"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
