"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, CloudRain, CloudDrizzle } from "lucide-react";
import { useRaceStore } from "@/lib/race-store";
import { toast } from "sonner";

export default function WeatherPage() {
  const { trackState } = useRaceStore();

  const handleSetWeather = async (state: "DRY" | "WET" | "DRYING") => {
    const token = localStorage.getItem("race_token");
    try {
      const res = await fetch("/api/admin/track-state", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ track_state: state })
      });
      if (res.ok) {
        toast.success(`Track Weather Set to ${state}`, { description: `Global track condition updated to ${state}.` });
      } else {
        toast.error("Failed to update weather");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="TRACK CONDITIONS"
        title="Weather Controls"
        description="Toggle the global track state between Dry and Wet phases."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {trackState === "DRY" ? (
                <Sun className="h-8 w-8 text-amber-500" />
              ) : (
                <CloudRain className="h-8 w-8 text-blue-500" />
              )}
              <div className="text-3xl font-bold font-display">{trackState === "DRY" ? "Dry" : "Wet"}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {trackState === "DRY" ? "Phase A formulas active. Standard tire degradation." : "Phase B formulas active. Wet-on-slicks penalty enforced."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Compounds</CardTitle>
          </CardHeader>
          <CardContent>
            {trackState === "DRY" ? (
              <div className="space-y-2">
                {[
                  { name: "Soft", color: "bg-red-500" },
                  { name: "Medium", color: "bg-yellow-400" },
                  { name: "Hard", color: "bg-white border border-border" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-2.5 text-sm">
                    <span className={`size-2.5 rounded-full ${c.color}`}></span>
                    <span className="font-medium">{c.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  { name: "Intermediate", color: "bg-green-500" },
                  { name: "Full Wet", color: "bg-blue-600" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-2.5 text-sm">
                    <span className={`size-2.5 rounded-full ${c.color}`}></span>
                    <span className="font-medium">{c.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CloudDrizzle className="h-4 w-4" /> Toggle Weather
          </CardTitle>
          <CardDescription>
            Switching to Wet activates Phase B formulas and enforces the +12.00s slicks penalty for teams on dry tires.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant={trackState === "DRY" ? "default" : "outline"}
              onClick={() => handleSetWeather("DRY")}
              className="gap-1.5"
            >
              <Sun className="h-4 w-4" /> Set Dry
            </Button>
            <Button
              variant={trackState === "WET" ? "default" : "outline"}
              onClick={() => handleSetWeather("WET")}
              className="gap-1.5"
            >
              <CloudRain className="h-4 w-4" /> Set Wet
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Note: Weather change will take effect from the next block.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
