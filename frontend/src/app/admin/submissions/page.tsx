"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Users, Edit3, Send, CheckCircle2, AlertCircle, Database, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRaceStore } from "@/lib/race-store";
import { getApiUrl } from "@/lib/api-config";
import { toast } from "sonner";

export default function SubmissionsPage() {
  const { cars, currentBlock, currentLap } = useRaceStore();
  const carList = Object.values(cars);

  const [editingCar, setEditingCar] = useState<any | null>(null);
  const [overrideAction, setOverrideAction] = useState<"STAY_OUT" | "PIT">("STAY_OUT");
  const [overridePitLap, setOverridePitLap] = useState<string>("");
  const [overrideCompound, setOverrideCompound] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const openEditModal = (car: any) => {
    setEditingCar(car);
    setOverrideAction(car.action === "PIT" ? "PIT" : "STAY_OUT");
    setOverridePitLap(car.pit_lap ? car.pit_lap.toString() : (currentLap + 1).toString());
    setOverrideCompound(car.next_compound || "MEDIUM");
  };

  const handleSaveOverride = async () => {
    if (!editingCar) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("race_token");
      await fetch(getApiUrl("/api/admin/override-strategy"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          team_id: editingCar.team_id,
          action: overrideAction,
          pit_lap: overrideAction === "PIT" ? parseInt(overridePitLap) : null,
          new_compound: overrideAction === "PIT" ? overrideCompound : null,
        }),
      });
      toast("Strategy Overridden", {
        description: `Strategy updated for ${editingCar.driver} (${editingCar.team_id})`,
      });
      setEditingCar(null);
    } catch (err) {
      toast("Error", { description: "Failed to override strategy." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleForceSubmitTeam = async (teamId: string) => {
    try {
      const token = localStorage.getItem("race_token");
      await fetch(getApiUrl("/api/admin/force-submit"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ team_id: teamId }),
      });
      toast("Force Submitted", { description: `Team ${teamId} defaulted to STAY_OUT` });
    } catch (err) {
      toast("Error", { description: "Failed to force submit." });
    }
  };

  const handleForceSubmitAll = async () => {
    try {
      const token = localStorage.getItem("race_token");
      await fetch(getApiUrl("/api/admin/force-submit"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      toast("Force Submitted All", { description: "All unsubmitted teams defaulted to STAY_OUT" });
    } catch (err) {
      toast("Error", { description: "Failed to force submit all." });
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("race_token");
      const res = await fetch(getApiUrl("/api/admin/delete-team"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team_id: teamToDelete.team_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to delete team.");
      useRaceStore.setState((state) => {
        const cars = { ...state.cars };
        delete cars[teamToDelete.team_id];
        return { cars, standings: state.standings.filter((row) => row.team_id !== teamToDelete.team_id) };
      });
      toast.success("Team deleted", { description: `${teamToDelete.driver} was removed from the database.` });
      setTeamToDelete(null);
    } catch (err) {
      toast.error("Delete failed", { description: err instanceof Error ? err.message : "Could not delete team." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetDatabase = async () => {
    setIsResetting(true);
    try {
      const token = localStorage.getItem("race_token");
      const res = await fetch(getApiUrl("/api/admin/reset-database"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to clear database.");
      useRaceStore.setState({ cars: {}, standings: [], currentBlock: 1, currentLap: 0, windowOpen: false, windowExpiresAt: null });
      toast.success("Database cleared", { description: "All teams, race data, and submissions were deleted." });
    } catch (err) {
      toast.error("Reset failed", { description: err instanceof Error ? err.message : "Could not clear database." });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="BLOCK MANAGEMENT"
        title="Team Submissions & Radio Intercepts"
        description="Monitor locked strategies, execute verbal radio intercepts, and force unsubmitted teams."
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleForceSubmitAll} className="gap-1.5">
              <Send className="h-4 w-4 text-amber-500" /> Force Submit All Pending
            </Button>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" size="sm" className="gap-1.5" />}>
                <Database className="h-4 w-4" /> Clear Database
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear the entire database?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes every team, member, submission, power, and race result. The database schema stays in place, but this cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleResetDatabase} disabled={isResetting}>
                    {isResetting ? "Clearing..." : "Clear Everything"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Block {currentBlock} — Submissions
          </CardTitle>
          <CardDescription>Laps {currentLap + 1}–{currentLap + 5}. Live team strategy decisions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Team</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Action</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Target Lap</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">New Compound</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-right py-2.5 px-3 text-muted-foreground font-medium">Controls</th>
                </tr>
              </thead>
              <tbody>
                {carList.map((car) => (
                  <tr key={car.team_id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium">
                      {car.driver} <span className="text-muted-foreground text-xs">({car.team_id})</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={car.action === "PIT" ? "text-amber-400 font-bold" : "text-zinc-300"}>
                        {car.action === "PIT" ? "PIT STOP" : "STAY OUT"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs">{car.pit_lap ? `Lap ${car.pit_lap}` : "—"}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{car.next_compound || "—"}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={car.has_submitted ? "default" : "secondary"} className="gap-1">
                        {car.has_submitted ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Submitted
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 text-amber-400" /> Pending
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => openEditModal(car)}>
                          <Edit3 className="h-3.5 w-3.5" /> Edit / Intercept
                        </Button>
                        {!car.has_submitted && (
                          <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleForceSubmitTeam(car.team_id)}>
                            Force
                          </Button>
                        )}
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          title={`Delete ${car.driver}`}
                          aria-label={`Delete ${car.driver}`}
                          onClick={() => setTeamToDelete(car)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {carList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted-foreground">
                      No teams active on grid.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Manual Override / Espionage Modal */}
      {editingCar && (
        <Dialog open={Boolean(editingCar)} onOpenChange={(open) => !open && setEditingCar(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Manual Strategy Override</DialogTitle>
              <DialogDescription>
                Modify strategy for {editingCar.driver} ({editingCar.team_id})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={overrideAction === "STAY_OUT" ? "default" : "outline"}
                    onClick={() => setOverrideAction("STAY_OUT")}
                  >
                    Stay Out
                  </Button>
                  <Button
                    type="button"
                    variant={overrideAction === "PIT" ? "default" : "outline"}
                    onClick={() => setOverrideAction("PIT")}
                  >
                    Pit Stop
                  </Button>
                </div>
              </div>

              {overrideAction === "PIT" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pit Lap</label>
                    <Select value={overridePitLap} onValueChange={(v) => setOverridePitLap(v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Lap..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => currentLap + i + 1).map((lap) => (
                          <SelectItem key={lap} value={lap.toString()}>
                            Lap {lap}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Compound</label>
                    <Select value={overrideCompound} onValueChange={(v) => setOverrideCompound(v ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Compound..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOFT">Soft (Red)</SelectItem>
                        <SelectItem value="MEDIUM">Medium (Yellow)</SelectItem>
                        <SelectItem value="HARD">Hard (White)</SelectItem>
                        <SelectItem value="INTER">Intermediate (Green)</SelectItem>
                        <SelectItem value="WET">Full Wet (Blue)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingCar(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveOverride} disabled={isSaving}>
                {isSaving ? "Saving..." : "Apply Override"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={Boolean(teamToDelete)} onOpenChange={(open) => !open && setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {teamToDelete?.driver}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the team, its members, strategies, powers, and race results from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteTeam} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

