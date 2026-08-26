"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Shield, Flag } from "lucide-react";

export default function TeamDetailsPage() {
  const [teamName, setTeamName] = useState("Loading...");
  const [members, setMembers] = useState<{name: string, email: string}[]>([]);

  useEffect(() => {
    // Read from localStorage (Mock DB integration until backend is fixed)
    const storedMembers = localStorage.getItem("team_members");
    if (storedMembers) {
      setMembers(JSON.parse(storedMembers));
    } else {
      setMembers([{ name: "Team Captain", email: "captain@f1.com" }]);
    }

    const token = localStorage.getItem("race_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Format team_id back to Team Name (e.g., scuderia_ferrari -> Scuderia Ferrari)
        const name = payload.teamId 
          ? payload.teamId.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
          : "Unknown Team";
        setTeamName(name);
      } catch (e) {
        setTeamName("Error loading team");
      }
    }
  }, []);
  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="CONSTRUCTOR"
        title="Team Details"
        description="View your constructor profile and registered squad members."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Team Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-4 w-4" /> Constructor Identity
            </CardTitle>
            <CardDescription>Your registered team name and status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider text-[10px]">Team Name</div>
              <div className="text-2xl font-bold font-display">{teamName}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1.5 uppercase tracking-wider text-[10px]">Current Status</div>
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white border-transparent">
                Active & Verified
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Squad Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Squad Roster
            </CardTitle>
            <CardDescription>The 3 members registered to this team.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Members */}
              {members.map((member, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 border border-border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2 rounded-full ${idx === 0 ? 'bg-primary/10' : 'bg-muted'}`}>
                      {idx === 0 ? <Shield className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {member.name} {idx === 0 && <Badge variant="secondary" className="text-[9px] h-4 px-1.5">Captain</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Mail className="h-3 w-3" /> {member.email}
                      </div>
                    </div>
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
