
import Link from "next/link";
import { Sparkles } from "lucide-react";
import Header from "@/components/Header";
import BrandSymbol from "@/components/BrandSymbol";
import AppSplashLoader from "@/components/AppSplashLoader";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { shadesOfPurple } from "@clerk/themes";
import { Toaster } from "@/components/ui/sonner";
import AdvancedPageTransition from "@/components/AdvancedPageTransition";

export const metadata = {
  title: "AI-Events-Organizer",
  description: "Discover and create AI-powered amazing events with ease.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`bg-linear-to-br from-gray-950 via-zinc-900 to-stone-900 text-white`}
      >
        <AppSplashLoader />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider
            appearance={{
              theme: shadesOfPurple,
            }}
          >
            <ConvexClientProvider>
              <SmoothScroll>
                <Header />

                <AdvancedPageTransition>
                  <main className="relative min-h-screen container mx-auto pt-40 md:pt-32">
                    {/* {glow} */}
                    <div className="pointer-events-none">
                      <div className="absolute top-1.5 left-1/4 h-80 w-80 bg-pink-600/40 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-1.5 right-1/4 h-80 w-80 bg-stone-200/30 rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative z-10 min-h-[70vh]">{children}</div>

                    {/* {footer} */}
                    <footer className="border-t border-gray-800/80 max-w-7xl py-8 px-6 mx-auto flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden">
                      <div className="flex items-center gap-3">
                        <BrandSymbol />
                      </div>
                      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                        <span>All Rights Reserved &copy; Evenza 2026 • AI-Powered Event Management Platform</span>
                        <span className="hidden sm:inline text-gray-700">•</span>
                        <Link
                          href="/developer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/40 text-purple-300 hover:text-white hover:bg-purple-900/60 hover:border-purple-400 transition-all font-medium text-xs shadow-xs"
                        >
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>Know about Evenza Developer</span>
                          <span className="text-purple-400 font-bold">→</span>
                        </Link>
                      </div>
                    </footer>
                    <Toaster richColors />
                  </main>
                </AdvancedPageTransition>
              </SmoothScroll>
            </ConvexClientProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
