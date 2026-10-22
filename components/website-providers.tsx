"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { ruRU } from "@clerk/localizations";
import { ViewTransitions } from "next-view-transitions";
import { ThemeProvider } from "@/context/theme-provider";
import NextTopLoader from "nextjs-toploader";
import { Analytics } from "@vercel/analytics/next";

/** Website-only providers, code-split away from Telegram Mini App. */
export default function WebsiteProviders({ children }: { children: React.ReactNode }) {
  return <ClerkProvider localization={ruRU}><ViewTransitions>
    <ThemeProvider attribute="class" enableSystem disableTransitionOnChange defaultTheme="light">
      <NextTopLoader color="#FFB800" initialPosition={0.08} crawlSpeed={200} height={3} crawl showSpinner={false}
        easing="ease" speed={200} shadow="0 0 10px #FFB800,0 0 5px #FFB800" />
      {children}<Analytics />
    </ThemeProvider>
  </ViewTransitions></ClerkProvider>;
}
