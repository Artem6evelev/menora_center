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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://menorah-rishon.com",
  ),
  title: {
    default: "Menorah Center | Ришон ле-Цион",
    template: "%s | Menorah Center", // Шаблон для внутренних страниц (например: "Услуги | Menorah Center")
  },
  description:
    "Еврейский общинный центр в Ришон ле-Ционе. Мероприятия, духовная поддержка, изучение Торы и услуги для всей семьи.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "Menorah Center",
  },
  twitter: {
    card: "summary_large_image",
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
