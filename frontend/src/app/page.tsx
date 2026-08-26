"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const [view, setView] = useState<"LOGIN" | "ADMIN">("LOGIN");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [password, setPassword] = useState("");
  
  // Registration state
  const [m1Name, setM1Name] = useState("");
  const [m1Email, setM1Email] = useState("");
  const [m2Name, setM2Name] = useState("");
  const [m2Email, setM2Email] = useState("");
  const [m3Name, setM3Name] = useState("");
  const [m3Email, setM3Email] = useState("");

  const router = useRouter();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !password) return;

    // Since teams are formed on the day, we don't strictly validate the password against a DB.
    // They just "create" or "enter" it to access their pit wall.
    const teamIdStr = selectedTeam.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const res = await fetch("/api/auth/mock-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: `${teamIdStr}@f1.com`, 
        role: "team", 
        teamId: teamIdStr,
        password: password 
      })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("race_token", data.token);
      router.push("/team");
    } else {
      toast("Error", { description: data.error || "Authentication failed." });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !password || !m1Name || !m1Email) {
      toast("Error", { description: "Team Name, Password, and Captain details are required." });
      return;
    }

    const teamIdStr = selectedTeam.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Simulate hitting a Registration API (to be fully hooked up to backend DB)
    const members = [{ name: m1Name, email: m1Email }];
    if (m2Name && m2Email) members.push({ name: m2Name, email: m2Email });
    if (m3Name && m3Email) members.push({ name: m3Name, email: m3Email });

    // For now, we hit the mock-login to get the token so the UI proceeds.
    // The backend team will replace this with their actual DB registration endpoint.
    const res = await fetch("/api/auth/mock-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: `${teamIdStr}@f1.com`, 
        role: "team", 
        teamId: teamIdStr,
        password: password,
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
      toast("Error", { description: data.error || "Authentication failed." });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#111111] text-[#F9F9F7] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-[#111111] to-[#111111]" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />

      {/* Secret Admin Button Corner */}
      <div 
        className="absolute top-0 right-0 w-16 h-16 cursor-default z-50"
        onDoubleClick={() => setView("ADMIN")}
      ></div>

      <div className="relative z-10 w-full max-w-md p-8 flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative w-28 h-28 mb-4">
            <Image
              src="/image.png"
              alt="F1 Grand Prix Logo"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-white uppercase mb-2">
            F1 <span className="text-red-600">Grand Prix</span>
          </h1>
          <p className="text-gray-400 text-sm font-medium tracking-wide">
            TECHNOVIT STRATEGY SIMULATION
          </p>
        </div>

        <div className="w-full bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          {view === "LOGIN" ? (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-bold tracking-tight text-white">Pit Wall Access</h2>
                <p className="text-xs text-gray-400">Select your constructor to connect to telemetry.</p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Team Name</Label>
                  <Input 
                    type="text" 
                    required 
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    placeholder="e.g. Scuderia Ferrari" 
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-red-600" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Create / Enter Password</Label>
                  <Input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter team password" 
                    className="bg-black/50 border-white/10 text-white focus-visible:ring-red-600" 
                  />
                </div>
                
                <Button type="submit" disabled={!selectedTeam || !password} className="w-full h-11 bg-white text-black hover:bg-gray-200 mt-2 font-bold transition-all shadow-md">
                  Connect Telemetry
                </Button>
                <div className="text-center mt-4">
                  <span className="text-gray-400 text-sm">New team?</span>
                  <Button variant="link" type="button" onClick={() => setView("SIGNUP")} className="text-red-500 font-bold ml-1 px-1">
                    Register Here
                  </Button>
                </div>
              </form>
            </div>
          ) : view === "SIGNUP" ? (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-bold tracking-tight text-white">Team Registration</h2>
                <p className="text-xs text-gray-400">Register 1 to 3 members for your constructor.</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Team Name *</Label>
                    <Input required value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} placeholder="e.g. Scuderia Ferrari" className="bg-black/50 border-white/10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Password *</Label>
                    <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" className="bg-black/50 border-white/10 text-white" />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <Label className="text-red-500 font-bold mb-2 block">Captain (Required)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input required value={m1Name} onChange={(e) => setM1Name(e.target.value)} placeholder="Name" className="bg-black/50 border-white/10 text-white" />
                    <Input required type="email" value={m1Email} onChange={(e) => setM1Email(e.target.value)} placeholder="Email" className="bg-black/50 border-white/10 text-white" />
                  </div>
                </div>

                <div className="pt-2">
                  <Label className="text-gray-400 font-semibold mb-2 block">Teammate 2 (Optional)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input value={m2Name} onChange={(e) => setM2Name(e.target.value)} placeholder="Name" className="bg-black/50 border-white/10 text-white" />
                    <Input type="email" value={m2Email} onChange={(e) => setM2Email(e.target.value)} placeholder="Email" className="bg-black/50 border-white/10 text-white" />
                  </div>
                </div>

                <div className="pt-2">
                  <Label className="text-gray-400 font-semibold mb-2 block">Teammate 3 (Optional)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input value={m3Name} onChange={(e) => setM3Name(e.target.value)} placeholder="Name" className="bg-black/50 border-white/10 text-white" />
                    <Input type="email" value={m3Email} onChange={(e) => setM3Email(e.target.value)} placeholder="Email" className="bg-black/50 border-white/10 text-white" />
                  </div>
                </div>
                
                <Button type="submit" disabled={!selectedTeam || !password || !m1Name || !m1Email} className="w-full h-11 bg-white text-black hover:bg-gray-200 mt-4 font-bold transition-all shadow-md">
                  Register & Enter Pit Wall
                </Button>
                <Button type="button" variant="ghost" onClick={() => setView("LOGIN")} className="w-full text-gray-400 hover:text-white mt-1">
                  Back to Login
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-bold tracking-tight text-red-500">Race Control (Admin)</h2>
                <p className="text-xs text-gray-400">Restricted director access.</p>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Director Password</Label>
                  <Input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/50 border-red-500/30 text-white focus-visible:ring-red-600" 
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-red-600 text-white hover:bg-red-700 mt-2 font-bold transition-all shadow-md">
                  Access Race Control
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setView("LOGIN"); setPassword(""); }} className="w-full text-gray-400 hover:text-white mt-1">
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
