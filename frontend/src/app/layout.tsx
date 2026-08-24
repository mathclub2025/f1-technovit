import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from "nextjs-toploader";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "F1 Apex Race Sim | 50-Lap Grand Prix Engine",
  description: "High-precision Formula 1 motorsport telemetry and 50-lap race simulator.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9F9F7" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground font-body select-none" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <NextTopLoader
            color="var(--primary)"
            showSpinner={false}
            height={2}
            shadow={false}
            easing="ease"
            speed={300}
          />
          {children}
          <Toaster
            richColors
            closeButton
            position="bottom-right"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
