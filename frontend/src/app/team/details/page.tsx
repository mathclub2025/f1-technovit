"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Flag, Plus, Trash2, IdCard } from "lucide-react";
import { toast } from "sonner";

interface Member {
  name: string;
  reg_no: string;
}

export default function TeamDetailsPage() {
  const [teamName, setTeamName] = useState("Loading...");
  const [teamId, setTeamId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState("");
  const [newRegNo, setNewRegNo] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const storedMembers = localStorage.getItem("team_members");
    if (storedMembers) {
      try {
        const parsed = JSON.parse(storedMembers);
        setMembers(parsed.map((m: any) => ({
          name: m.name || "Member",
          reg_no: m.reg_no || m.email?.split('@')[0] || "N/A"
        })));
      } catch (e) {}
    } else {
      setMembers([
        { name: "Team Captain", reg_no: "22BCE1001" }
      ]);
    }

    const token = localStorage.getItem("race_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const rawId = payload.teamId || "";
        setTeamId(rawId);
        const formatted = rawId
          ? rawId.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
          : "Unknown Team";
        setTeamName(formatted);
      } catch (e) {
        setTeamName("Error loading team");
      }
    }
  }, []);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (members.length >= 3) {
      toast("Squad Full", { description: "A constructor can have a maximum of 3 members (1 Captain + 2 Teammates)." });
      return;
    }
    if (!newName.trim() || !newRegNo.trim()) {
      toast("Input Error", { description: "Please provide both teammate name and registration number." });
      return;
    }

    const updated = [...members, { name: newName.trim(), reg_no: newRegNo.trim().toUpperCase() }];
    setMembers(updated);
    localStorage.setItem("team_members", JSON.stringify(updated));
    setNewName("");
    setNewRegNo("");
    setIsAdding(false);
    toast("Teammate Added", { description: `${newName.trim()} (${newRegNo.trim().toUpperCase()}) added to squad.` });
  };

  const handleRemoveMember = (indexToRemove: number) => {
    if (indexToRemove === 0) {
      toast("Action Denied", { description: "Team Captain cannot be removed." });
      return;
    }
    const updated = members.filter((_, idx) => idx !== indexToRemove);
    setMembers(updated);
    localStorage.setItem("team_members", JSON.stringify(updated));
    toast("Teammate Removed", { description: "Squad roster updated." });
  };

  return (
    <div className="flex flex-col gap-6 min-h-full pb-8">
      <PageHeader
        eyebrow="CONSTRUCTOR"
        title="Team Details"
        description="View your constructor profile, captain credentials, and manage squad members."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Team Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-4 w-4" /> Constructor Identity
            </CardTitle>
            <CardDescription>Your registered team details and status.</CardDescription>
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
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">
                Squad Capacity: <strong className="text-foreground">{members.length} / 3 Members Registered</strong>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Squad Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" /> Squad Roster ({members.length}/3)
              </CardTitle>
              <CardDescription>Registered teammates and registration numbers (Max 3).</CardDescription>
            </div>
            <Button
              size="sm"
              variant={isAdding ? "secondary" : "outline"}
              disabled={members.length >= 3 && !isAdding}
              onClick={() => setIsAdding(!isAdding)}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {members.length >= 3 ? "Squad Full (3/3)" : (isAdding ? "Cancel" : "Add Teammate")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Inline Add Teammate Form */}
            {isAdding && (
              <form onSubmit={handleAddMember} className="p-3.5 border border-primary/40 rounded-xl bg-primary/5 space-y-3 animate-in fade-in duration-200">
                <div className="text-xs font-semibold text-primary">Add New Teammate</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Full Name</label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="h-8 text-xs bg-background"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Registration No.</label>
                    <Input
                      placeholder="e.g. 23BCE1024"
                      value={newRegNo}
                      onChange={(e) => setNewRegNo(e.target.value)}
                      className="h-8 text-xs bg-background uppercase font-mono"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" className="w-full h-8 text-xs gap-1 font-bold">
                  <Plus className="h-3.5 w-3.5" /> Save Teammate
                </Button>
              </form>
            )}

            {/* Members List */}
            <div className="space-y-2.5">
              {members.map((member, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full shrink-0 ${idx === 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {idx === 0 ? <Shield className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {member.name} 
                        {idx === 0 ? (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-primary/20 text-primary border-primary/30">Captain</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-zinc-400">Member {idx + 1}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 font-mono">
                        <IdCard className="h-3 w-3 text-zinc-500" /> {member.reg_no}
                      </div>
                    </div>
                  </div>

                  {idx > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(idx)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-950/30"
                      title="Remove Teammate"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
