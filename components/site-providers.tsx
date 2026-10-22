"use client";
import { usePathname } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { ruRU } from "@clerk/localizations";
import { ViewTransitions } from "next-view-transitions";
import { ThemeProvider } from "@/context/theme-provider";
import NextTopLoader from "nextjs-toploader";
import { Analytics } from "@vercel/analytics/next";

/** The Mini App owns its auth, theme and loading; no Clerk/analytics mount there. */
export default function SiteProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/miniapp" || pathname.startsWith("/miniapp/")) return children;
  return <ClerkProvider localization={ruRU}><ViewTransitions>
    <ThemeProvider attribute="class" enableSystem disableTransitionOnChange defaultTheme="light">
      <NextTopLoader color="#FFB800" initialPosition={0.08} crawlSpeed={200} height={3} crawl showSpinner={false}
        easing="ease" speed={200} shadow="0 0 10px #FFB800,0 0 5px #FFB800" />
      {children}<Analytics />
    </ThemeProvider>
  </ViewTransitions></ClerkProvider>;
}
