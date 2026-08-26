import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Sun, CloudRain } from "lucide-react";

export default function FormulasPage() {
  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="REFERENCE"
        title="Tire Degradation Formulas"
        description="Mathematical models for tire wear and pit stop penalties."
      />

      <div className="grid gap-6">
        {/* Dry Track */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sun className="h-4 w-4" /> Phase A: Dry Track (Laps 1–25)
            </CardTitle>
            <CardDescription>
              Baseline models. <code className="text-xs bg-muted px-1 py-0.5 rounded">x</code> = current tire age in completed laps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: "Soft Compound", color: "bg-red-500", formula: "T(x) = 78.00 + 0.15x²" },
              { name: "Medium Compound", color: "bg-yellow-400", formula: "T(x) = 80.00 + 1.80x" },
              { name: "Hard Compound", color: "bg-white border border-border", formula: "T(x) = 82.00 + 0.60x" },
            ].map((c) => (
              <div key={c.name} className="flex items-center justify-between px-3 py-2.5 rounded-md border text-sm">
                <span className="flex items-center gap-2.5 font-medium">
                  <span className={`size-2.5 rounded-full ${c.color}`}></span>
                  {c.name}
                </span>
                <code className="font-mono text-muted-foreground">{c.formula}</code>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Wet Track */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CloudRain className="h-4 w-4" /> Phase B: Wet Track (Laps 26–35)
            </CardTitle>
            <CardDescription>Active when Global State is set to Wet by the Race Director.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: "Intermediate Tire (Green)", color: "bg-green-500", formula: "T(x) = 84.00 + 0.80x" },
              { name: "Full Wet Tire (Blue)", color: "bg-blue-600", formula: "T(x) = 87.00 + 0.30x" },
            ].map((c) => (
              <div key={c.name} className="flex items-center justify-between px-3 py-2.5 rounded-md border text-sm">
                <span className="flex items-center gap-2.5 font-medium">
                  <span className={`size-2.5 rounded-full ${c.color}`}></span>
                  {c.name}
                </span>
                <code className="font-mono text-muted-foreground">{c.formula}</code>
              </div>
            ))}

            <div className="mt-4 p-3 rounded-md bg-muted/50 border space-y-1.5">
              <p className="text-sm font-medium">Dry Slicks on Wet Track</p>
              <p className="text-sm text-muted-foreground">
                If caught on Slicks (Soft/Med/Hard) during rain: <code className="text-xs bg-background border px-1 py-0.5 rounded">T(x) = T_dry(x) + 12.00s</code>
              </p>
              <p className="text-xs text-muted-foreground italic">
                * Exception: Schumacher Rainmaster power reduces penalty to +2.00s.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Drying Track */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sun className="h-4 w-4" /> Phase C: Drying Track (Laps 36–50)
            </CardTitle>
            <CardDescription>
              Overheating degradation coefficient multiplied by 3.0 for wet compounds in drying conditions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: "Dry Slicks (Soft / Med / Hard)", color: "bg-yellow-400", formula: "Standard Dry Formulas" },
              { name: "Intermediate Tire (Overheating)", color: "bg-green-500", formula: "T(x) = 84.00 + 2.40x" },
              { name: "Full Wet Tire (Overheating)", color: "bg-blue-600", formula: "T(x) = 87.00 + 0.90x" },
            ].map((c) => (
              <div key={c.name} className="flex items-center justify-between px-3 py-2.5 rounded-md border text-sm">
                <span className="flex items-center gap-2.5 font-medium">
                  <span className={`size-2.5 rounded-full ${c.color}`}></span>
                  {c.name}
                </span>
                <code className="font-mono text-muted-foreground">{c.formula}</code>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pit Stop Penalties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Pit Stop & Traffic Congestion
            </CardTitle>
            <CardDescription>Pit stop timing impact applied on the in-lap.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-md border text-sm">
              <span className="font-medium">Standard Pit Stop Penalty</span>
              <code className="font-mono text-muted-foreground">+20.00s</code>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-md border text-sm">
              <span className="font-medium">Traffic Congestion Penalty (&ge; 4 cars on same lap)</span>
              <code className="font-mono text-destructive-foreground">+26.00s (+6.00s traffic jam)</code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
