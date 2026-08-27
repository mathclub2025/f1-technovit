import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BookOpen, AlertTriangle, Clock, Timer, Disc } from "lucide-react";

export default function RulesPage() {
  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="REGULATIONS"
        title="Event Rulebook"
        description="Official guidelines for the 50-lap Grand Prix simulation."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pit Stop Penalty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">20.00s</div>
            <p className="text-xs text-muted-foreground mt-1">
              Flat penalty per pit stop. Resets tire age to 0.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Timer className="h-4 w-4" /> Submission Window
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">3 min</div>
            <p className="text-xs text-muted-foreground mt-1">
              Time to submit strategy per block. Defaults to "Stay Out".
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" /> Key Regulations
          </CardTitle>
          <CardDescription>Rules that affect strategy decisions during the race.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive-foreground shrink-0" />
              <span className="font-medium">The Traffic Jam Rule</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              If <span className="font-medium text-foreground">4 or more teams</span> pit on the same lap, all receive an additional <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">+6.00s</code> penalty (total = 26.00s).
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="font-medium">Weather Phase Transitions</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              Race Director can trigger weather changes. Teams caught on wrong compound receive a <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">+12.00s</code> per-lap penalty.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="font-medium">Mandatory Pit Stop</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              Each team must make at least one pit stop during the race, using a minimum of two different tire compounds.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tire Compound Strategy & Usage Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Disc className="h-4 w-4 text-zinc-400" /> Tire Compound Strategy & Usage Guide
          </CardTitle>
          <CardDescription>
            Detailed reasoning on which tire to select based on track state, degradation formulas, and stint strategy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Soft */}
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <h4 className="font-bold text-sm text-foreground">Soft Compound (S)</h4>
                </div>
                <span className="text-[10px] font-mono font-bold bg-red-900/60 text-red-300 px-2 py-0.5 rounded">High Grip / Sprint</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>When to Choose:</strong> Opening stints, rapid undercuts, or late-race charges when chasing positions or fastest lap.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li><strong>Base Pace:</strong> Fastest initial lap time (~78.00s).</li>
                <li><strong>Degradation:</strong> High wear rate (<code className="text-zinc-200">α = 0.08</code>). Peak lifespan: 10–15 laps.</li>
                <li><strong>Caution:</strong> Severe pace drop beyond Lap 16; do not over-extend.</li>
              </ul>
            </div>

            {/* Medium */}
            <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <h4 className="font-bold text-sm text-foreground">Medium Compound (M)</h4>
                </div>
                <span className="text-[10px] font-mono font-bold bg-yellow-900/60 text-yellow-300 px-2 py-0.5 rounded">Balanced Default</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>When to Choose:</strong> The optimal all-round baseline tire for standard 15–25 lap race stints and flexible strategy windows.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li><strong>Base Pace:</strong> Strong balanced pace (~79.50s).</li>
                <li><strong>Degradation:</strong> Linear, predictable wear (<code className="text-zinc-200">α = 0.04</code>). Lifespan: 20–25 laps.</li>
                <li><strong>Advantage:</strong> Keeps pit windows open without premature tire cliffs.</li>
              </ul>
            </div>

            {/* Hard */}
            <div className="p-4 rounded-xl border border-zinc-500/30 bg-zinc-900/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-white" />
                  <h4 className="font-bold text-sm text-foreground">Hard Compound (H)</h4>
                </div>
                <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">High Endurance / 1-Stop</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>When to Choose:</strong> 1-stop endurance strategies, marathon stints (25–35 laps), and avoiding pit congestion traffic.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li><strong>Base Pace:</strong> Slower warm-up (~81.00s).</li>
                <li><strong>Degradation:</strong> Minimal degradation (<code className="text-zinc-200">α = 0.015</code>). Rock-solid for 30+ laps.</li>
                <li><strong>Advantage:</strong> Never drops off cliff; saves you from having to pit twice!</li>
              </ul>
            </div>

            {/* Intermediate */}
            <div className="p-4 rounded-xl border border-green-500/30 bg-green-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <h4 className="font-bold text-sm text-foreground">Intermediate (I)</h4>
                </div>
                <span className="text-[10px] font-mono font-bold bg-green-900/60 text-green-300 px-2 py-0.5 rounded">Drying / Damp</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>When to Choose:</strong> When track conditions are declared <strong className="text-green-300">DRYING</strong> or light rain begins.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li><strong>Condition:</strong> Clears damp surface water while preserving tread on drying lines.</li>
                <li><strong>Formula:</strong> Runs without penalty during DRYING phase.</li>
                <li><strong>Caution:</strong> Severe overheating if driven on a bone-dry track.</li>
              </ul>
            </div>

            {/* Wet */}
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-2 md:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <h4 className="font-bold text-sm text-foreground">Full Wet (W)</h4>
                </div>
                <span className="text-[10px] font-mono font-bold bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded">Heavy Rain / Monsoon</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>When to Choose:</strong> Mandatory pit selection whenever Race Control declares <strong className="text-blue-300">WET</strong> track conditions.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li><strong>Disaster Prevention:</strong> Slicks on a WET track suffer a brutal <code className="text-red-400">+12.00s per lap penalty</code>! Full Wet eliminates this penalty.</li>
                <li><strong>Water Dispersion:</strong> Disperses up to 85 liters of standing water per second.</li>
                <li><strong>Exception:</strong> Michael Schumacher's <em>Rainmaster</em> power slashes slick penalty down to +2.00s.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
