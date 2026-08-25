import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BookOpen, AlertTriangle, Clock, Timer } from "lucide-react";

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
    </div>
  );
}
