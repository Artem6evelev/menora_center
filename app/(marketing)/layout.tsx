import type { Metadata } from "next";
import "../globals.css";
import { GeistSans } from "geist/font/sans";
import { NavBar } from "@/components/navbar";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/footer";

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
    // ДОБАВЛЯЕМ КАРТИНКУ ДЛЯ ШЕРИНГА (TELEGRAM / WHATSAPP)
    images: [
      {
        url: "/public/seo/main.webp", // Ссылка на картинку в папке public
        width: 1200,
        height: 630,
        alt: "Menorah Center - Еврейский общинный центр",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    // ДОБАВЛЯЕМ КАРТИНКУ ДЛЯ X (TWITTER) И ДРУГИХ ПЛАТФОРМ
    images: ["/public/seo/main.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <NavBar />
      {children}
      <Footer />
    </main>
  );
}
