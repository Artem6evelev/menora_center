import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ruRU } from "@clerk/localizations";
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";
import { ViewTransitions } from "next-view-transitions";
import { ThemeProvider } from "@/context/theme-provider";
import NextTopLoader from "nextjs-toploader"; // <-- 1. Импортируем

export const metadata: Metadata = {
  title: "Everything AI",
  description:
    "Everything AI is a platform that provides a wide range of AI tools and services to help you stay on top of your business. Generate images, text and everything else that you need to get your business off the ground.",
  openGraph: {
    images: ["https://ai-saas-template-aceternity.vercel.app/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ruRU}>
      <ViewTransitions>
        <html lang="en" suppressHydrationWarning>
          <body
            className={cn(
              GeistSans.className,
              "bg-white dark:bg-black antialiased h-full w-full",
            )}
          >
            <ThemeProvider
              attribute="class"
              enableSystem
              disableTransitionOnChange
              defaultTheme="light"
            >
              <NextTopLoader
                color="#FFB800" // Фирменный золотой/желтый цвет
                initialPosition={0.08}
                crawlSpeed={200}
                height={3} // Можно сделать 4, если хочешь, чтобы золото было заметнее
                crawl={true}
                showSpinner={false}
                easing="ease"
                speed={200}
                shadow="0 0 10px #FFB800,0 0 5px #FFB800" // Золотое свечение
              />
              {children}
            </ThemeProvider>
          </body>
        </html>
      </ViewTransitions>
    </ClerkProvider>
  );
}
