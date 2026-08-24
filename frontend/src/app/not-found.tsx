import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flag, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-4">
      <div className="space-y-8 max-w-md animate-in fade-in zoom-in duration-500">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 text-red-500 shadow-inner">
          <Flag className="size-10 animate-pulse" />
        </div>
        <div className="space-y-3">
          <h1 className="text-5xl font-display font-extrabold text-foreground tracking-tighter">
            Sector <span className="text-red-500">404</span>
          </h1>
          <h2 className="text-xl font-medium text-muted-foreground uppercase tracking-wider">
            Red Flag Deployed
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed pt-2">
            The page you are looking for is off-track. It might have been moved or the URL might be incorrect. Please return to the racing line to continue.
          </p>
        </div>
        <Link href="/" className="inline-block mt-4">
          <Button size="lg" className="bg-primary text-primary-foreground font-bold shadow-lg hover:shadow-xl transition-all">
            <ArrowLeft className="mr-2 size-4" /> Return to Pits
          </Button>
        </Link>
      </div>
    </div>
  );
}
