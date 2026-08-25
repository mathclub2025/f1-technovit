"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [view, setView] = useState<"LOGIN" | "SIGNUP" | "ONBOARDING">("LOGIN");
  const router = useRouter();

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (view === "LOGIN") {
      router.push("/team");
    } else {
      setView("ONBOARDING");
    }
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/team");
  };

  return (
    <div className="relative min-h-screen bg-[#111111] text-[#F9F9F7] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-[#111111] to-[#111111]" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
      
      {/* Debug/Bypass Links in Corner */}
      <div className="absolute top-4 right-4 flex flex-col sm:flex-row gap-2 z-50">
        <Link href="/admin">
          <Button variant="outline" size="sm" className="text-xs border-dashed text-gray-400 border-gray-700 bg-transparent hover:text-white hover:bg-gray-800">
            Bypass to Admin
          </Button>
        </Link>
        <Link href="/team">
          <Button variant="outline" size="sm" className="text-xs border-dashed text-gray-400 border-gray-700 bg-transparent hover:text-white hover:bg-gray-800">
            Bypass to Team
          </Button>
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 flex flex-col items-center">
        {/* Logo and Branding */}
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

        {/* Auth / Onboarding Card */}
        <div className="w-full bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          
          {view === "LOGIN" || view === "SIGNUP" ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {view === "LOGIN" ? "Captain Login" : "Captain Registration"}
                </h2>
                <p className="text-xs text-gray-400">
                  {view === "LOGIN" 
                    ? "Enter your credentials to access the pit wall." 
                    : "Create a new account for your team."}
                </p>
              </div>

              <form key="auth-form" onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-gray-300">Email Address</Label>
                  <Input id="login-email" name="email" type="email" required placeholder="e.g. captain@gmail.com" className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-red-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-pass" className="text-gray-300">Password</Label>
                  <Input id="login-pass" name="password" type="password" required className="bg-black/50 border-white/10 text-white focus-visible:ring-red-600" />
                </div>
                
                <Button type="submit" className="w-full h-11 bg-white text-black hover:bg-gray-200 mt-2 font-bold transition-all shadow-md">
                  {view === "LOGIN" ? "Log In" : "Continue to Onboarding"}
                </Button>
              </form>

              <div className="text-center text-sm text-gray-400">
                {view === "LOGIN" ? (
                  <>Don't have an account? <button type="button" onClick={() => setView("SIGNUP")} className="text-white font-semibold hover:underline ml-1">Sign Up</button></>
                ) : (
                  <>Already have an account? <button type="button" onClick={() => setView("LOGIN")} className="text-white font-semibold hover:underline ml-1">Log In</button></>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div className="space-y-2 text-center">
                <h2 className="text-xl font-bold tracking-tight text-white">Team Onboarding</h2>
                <p className="text-xs text-gray-400">Register your constructor details and squad members to finalize setup.</p>
              </div>

              <form key="onboard-form" onSubmit={handleOnboardingSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name" className="text-gray-300">Team Name</Label>
                  <Input id="team-name" name="teamName" required placeholder="e.g. Scuderia Ferrari" className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-red-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t2-email" className="text-gray-300">Teammate 2 Email</Label>
                  <Input id="t2-email" name="t2Email" type="email" required placeholder="e.g. teammate2@gmail.com" className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-red-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t3-email" className="text-gray-300">Teammate 3 Email</Label>
                  <Input id="t3-email" name="t3Email" type="email" required placeholder="e.g. teammate3@gmail.com" className="bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-red-600" />
                </div>
                
                <Button type="submit" className="w-full h-11 bg-white text-black hover:bg-gray-200 mt-4 font-bold transition-all shadow-md">
                  Complete Setup & Enter Pit Wall
                </Button>
                <Button type="button" variant="ghost" onClick={() => setView("SIGNUP")} className="w-full text-gray-400 hover:text-white mt-1">
                  Back
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
