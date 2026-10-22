import type { Metadata } from "next";
import "@/app/globals.css";
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";
import SiteProviders from "@/components/site-providers";

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
    images: [
      {
        url: "/seo/main.webp", // УБРАЛИ /public (это важно!)
        width: 1200,
        height: 630,
        alt: "Menorah Center - Еврейский общинный центр",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/seo/main.webp"], // УБРАЛИ /public
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={cn(GeistSans.className, "bg-white dark:bg-black antialiased h-full w-full")}>
        <SiteProviders>{children}</SiteProviders>
      </body>
    </html>
  );
}
