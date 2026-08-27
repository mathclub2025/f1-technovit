"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Plus, Trash2, Users } from "lucide-react";

interface TeammateInput {
  name: string;
  reg_no: string;
}

export default function LoginPage() {
  const [view, setView] = useState<"LOGIN" | "ADMIN" | "SIGNUP">("LOGIN");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [password, setPassword] = useState("");
  
  // Registration state
  const [captainName, setCaptainName] = useState("");
  const [captainRegNo, setCaptainRegNo] = useState("");
  const [teammates, setTeammates] = useState<TeammateInput[]>([
    { name: "", reg_no: "" }
  ]);

  const router = useRouter();

  const handleAddTeammateField = () => {
    if (teammates.length >= 2) {
      toast("Squad Limit", { description: "A team can have a maximum of 3 members (1 Captain + 2 Teammates)." });
      return;
    }
    setTeammates([...teammates, { name: "", reg_no: "" }]);
  };

  const handleRemoveTeammateField = (idx: number) => {
    setTeammates(teammates.filter((_, i) => i !== idx));
  };

  const handleTeammateChange = (idx: number, field: "name" | "reg_no", value: string) => {
    const updated = [...teammates];
    updated[idx][field] = value;
    setTeammates(updated);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !password) return;

    const teamIdStr = selectedTeam.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const res = await fetch("/api/auth/mock-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: `${teamIdStr}@f1.com`, 
        role: "team", 
        teamId: teamIdStr,
        password: password.trim().toUpperCase()
      })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("race_token", data.token);
      router.push("/team");
    } else {
      toast("Authentication Failed", { description: data.error || "Please check your Team Name and Captain Reg. No." });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam.trim() || !captainName.trim() || !captainRegNo.trim()) {
      toast("Error", { description: "Team Name, Captain Name, and Captain Registration Number are required." });
      return;
    }

    const teamIdStr = selectedTeam.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanCaptainReg = captainRegNo.trim().toUpperCase();
    
    const members = [
      { name: captainName.trim(), reg_no: cleanCaptainReg }
    ];

    teammates.forEach((tm) => {
      if (tm.name.trim() && tm.reg_no.trim()) {
        members.push({ name: tm.name.trim(), reg_no: tm.reg_no.trim().toUpperCase() });
      }
    });

    if (members.length > 3) {
      toast("Squad Limit Exceeded", { description: "A constructor can have a maximum of 3 members (1 Captain + 2 Teammates)." });
      return;
    }

    try {
      // 1. Register team in database via backend API
      await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeam.trim(),
          captain_name: captainName.trim(),
          captain_reg_no: cleanCaptainReg,
          password: cleanCaptainReg,
          email: `${cleanCaptainReg.toLowerCase()}@technovit.vit.ac.in`,
          members: members
        })
      });
    } catch (e) {}

    // 2. Obtain authenticated session token
    const res = await fetch("/api/auth/mock-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: `${cleanCaptainReg.toLowerCase()}@technovit.vit.ac.in`, 
        role: "team", 
        teamId: teamIdStr,
        password: cleanCaptainReg,
        members: members
      })
    });
    
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("race_token", data.token);
      localStorage.setItem("team_members", JSON.stringify(members));
      router.push("/team");
    } else {
      toast("Error", { description: data.error || "Registration failed." });
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/auth/mock-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: "admin@technovit.com", 
        role: "admin", 
        password: password 
      })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("race_token", data.token);
      router.push("/admin");
    } else {
      toast("Error", { description: data.error || "Invalid director credentials." });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#111111] text-[#F9F9F7] flex flex-col items-center justify-center overflow-hidden py-10 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-[#111111] to-[#111111]" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />

      {/* Top Right Admin / Team Toggle */}
      <div className="absolute top-5 right-5 z-50">
        {view === "ADMIN" ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { setView("LOGIN"); setPassword(""); }} 
            className="bg-black/60 border-white/15 text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs font-mono backdrop-blur-md shadow-lg"
          >
            ← Team Pit Wall
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { setView("ADMIN"); setPassword(""); }} 
            className="bg-black/60 border-white/15 text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs font-mono backdrop-blur-md shadow-lg flex items-center gap-1.5"
          >
            <Shield className="h-3.5 w-3.5 text-red-500" />
            Sign in as Admin
          </Button>
        )}
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        <div className="mb-6 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative w-24 h-24 mb-3">
            <Image
              src="/image.png"
              alt="F1 Grand Prix Logo"
              fill
              sizes="96px"
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-white uppercase mb-1">
            F1 <span className="text-red-600">Grand Prix</span>
          </h1>
          <p className="text-gray-400 text-xs font-medium tracking-widest uppercase">
            TECHNOVIT STRATEGY SIMULATION
          </p>
        </div>

        <div className="w-full bg-[#1a1a1a]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          {view === "LOGIN" ? (
            <div className="space-y-6">
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-bold tracking-tight text-white">Pit Wall Login</h2>
                <p className="text-xs text-gray-400">Enter your constructor credentials to access telemetry.</p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-300 text-xs">Team Name</Label>
                  <Input 
                    type="text" 
                    required 
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    placeholder="e.g. Scuderia Ferrari" 
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-red-600 h-10 text-sm" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-300 text-xs">Captain Registration No. (Password)</Label>
                  <Input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. 22BCE1001" 
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-red-600 h-10 text-sm uppercase font-mono" 
                  />
                  <p className="text-[10px] text-zinc-500">Your password is your Captain's Registration Number.</p>
                </div>
                
                <Button type="submit" disabled={!selectedTeam || !password} className="w-full h-11 bg-white text-black hover:bg-gray-200 mt-2 font-bold transition-all shadow-md">
                  Connect to Pit Wall
                </Button>
                <div className="text-center pt-2">
                  <span className="text-gray-400 text-xs">New constructor?</span>
                  <Button variant="link" type="button" onClick={() => setView("SIGNUP")} className="text-red-500 font-bold ml-1 px-1 text-xs">
                    Register Team Here
                  </Button>
                </div>
              </form>
            </div>
          ) : view === "SIGNUP" ? (
            <div className="space-y-5">
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-bold tracking-tight text-white">Team Registration</h2>
                <p className="text-xs text-gray-400">Register your constructor, captain, and squad members.</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                <div className="space-y-1.5">
                  <Label className="text-gray-300 text-xs">Team Name *</Label>
                  <Input 
                    required 
                    value={selectedTeam} 
                    onChange={(e) => setSelectedTeam(e.target.value)} 
                    placeholder="e.g. Red Bull Racing" 
                    className="bg-black/50 border-white/10 text-white h-9 text-xs" 
                  />
                </div>

                {/* Captain Details */}
                <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-950/15 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-red-400 font-bold text-xs flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" /> Team Captain (Required)
                    </Label>
                    <span className="text-[9px] font-mono text-zinc-400">Serves as Team Password</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-[10px] text-zinc-400">Captain Full Name</Label>
                      <Input 
                        required 
                        value={captainName} 
                        onChange={(e) => setCaptainName(e.target.value)} 
                        placeholder="e.g. Alex Albon" 
                        className="bg-black/60 border-white/15 text-white h-8 text-xs mt-1" 
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-zinc-400">Captain Reg. No. (Password)</Label>
                      <Input 
                        required 
                        value={captainRegNo} 
                        onChange={(e) => setCaptainRegNo(e.target.value)} 
                        placeholder="e.g. 22BCE1001" 
                        className="bg-black/60 border-white/15 text-white h-8 text-xs uppercase font-mono mt-1" 
                      />
                    </div>
                  </div>
                </div>

                {/* Teammates Dynamic List */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300 font-semibold text-xs flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-zinc-400" /> Additional Teammates ({1 + teammates.length}/3 Max)
                    </Label>
                    {teammates.length < 2 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddTeammateField}
                        className="h-6 px-2 text-[10px] gap-1 border-white/15"
                      >
                        <Plus className="h-3 w-3" /> Add Member
                      </Button>
                    )}
                  </div>

                  {teammates.map((tm, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-white/10 bg-black/40 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>Member {idx + 2}</span>
                        {teammates.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTeammateField(idx)}
                            className="text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input 
                          value={tm.name} 
                          onChange={(e) => handleTeammateChange(idx, "name", e.target.value)} 
                          placeholder="Member Name" 
                          className="bg-black/60 border-white/10 text-white h-8 text-xs" 
                        />
                        <Input 
                          value={tm.reg_no} 
                          onChange={(e) => handleTeammateChange(idx, "reg_no", e.target.value)} 
                          placeholder="Reg. No (e.g. 23BCE2045)" 
                          className="bg-black/60 border-white/10 text-white h-8 text-xs uppercase font-mono" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button type="submit" disabled={!selectedTeam || !captainName || !captainRegNo} className="w-full h-11 bg-white text-black hover:bg-gray-200 mt-3 font-bold transition-all shadow-md">
                  Register & Enter Pit Wall
                </Button>
                <Button type="button" variant="ghost" onClick={() => setView("LOGIN")} className="w-full text-gray-400 hover:text-white mt-1 text-xs">
                  Back to Login
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-bold tracking-tight text-red-500">Race Control (Admin)</h2>
                <p className="text-xs text-gray-400">Restricted director access.</p>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-300 text-xs">Director Password</Label>
                  <Input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/50 border-red-500/30 text-white focus-visible:ring-red-600 h-10" 
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-red-600 text-white hover:bg-red-700 mt-2 font-bold transition-all shadow-md">
                  Access Race Control
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setView("LOGIN"); setPassword(""); }} className="w-full text-gray-400 hover:text-white mt-1 text-xs">
                  Back to Teams
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
