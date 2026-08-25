import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function TeamDetailsPage() {
  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="CONSTRUCTOR"
        title="Team Details"
        description="Manage your constructor profile and driver assignments."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Profile Management
          </CardTitle>
          <CardDescription>Team profile and member details will appear here once connected.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            This module is currently under construction.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
