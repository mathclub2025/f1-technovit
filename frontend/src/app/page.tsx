import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
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
        <div className="mb-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative w-32 h-32 mb-6">
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

        {/* Login Card */}
        <div className="w-full bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-bold tracking-tight text-white">Registered Participants Only</h2>
              <p className="text-xs text-gray-400">Sign in with your registered email as in Event Hub to access the pit wall.</p>
            </div>

            <Button 
              className="w-full h-12 bg-white text-black hover:bg-gray-100 font-semibold text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1a1a1a] px-2 text-gray-500">Or</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-gray-500">
              Authentication is currently in mock mode for development. Use the bypass buttons in the top right to navigate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
