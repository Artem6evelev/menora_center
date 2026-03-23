import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ruRU } from "@clerk/localizations";
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";
import { ViewTransitions } from "next-view-transitions";
import { ThemeProvider } from "@/context/theme-provider";
import NextTopLoader from "nextjs-toploader";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://menorah-rishon.com",
  ),
  title: {
    default: "Menorah Center | Ришон ле-Цион",
    template: "%s | Menorah Center",
  },
  description:
    "Еврейский общинный центр в Ришон ле-Ционе. Мероприятия, духовная поддержка, изучение Торы и услуги для всей семьи.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "Menorah Center",
    // ДОБАВЛЕНА КАРТИНКА ДЛЯ ШЕРИНГА (ТЕЛЕГРАМ / WHATSAPP)
    images: [
      {
        url: "/public/seo/main.webp", // Ссылка на картинку
        width: 1200,
        height: 630,
        alt: "Menorah Center - Еврейский общинный центр",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/public/seo/main.webp"],
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
        {/* ИЗМЕНИЛИ lang="en" НА lang="ru" ДЛЯ SEO */}
        <html lang="ru" suppressHydrationWarning>
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
                color="#FFB800"
                initialPosition={0.08}
                crawlSpeed={200}
                height={3}
                crawl={true}
                showSpinner={false}
                easing="ease"
                speed={200}
                shadow="0 0 10px #FFB800,0 0 5px #FFB800"
              />
              {children}
            </ThemeProvider>
          </body>
        </html>
      </ViewTransitions>
    </ClerkProvider>
  );
}
