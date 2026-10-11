import type { Metadata } from "next";
import WelcomeClient from "./WelcomeClient";

export const metadata: Metadata = {
  title: "Добро пожаловать в Menorah Center | Ришон ле-Цион",
  description:
    "Еврейский общинный центр в Ришон ле-Ционе. Узнайте о наших мероприятиях, детских программах, уроках Торы и присоединяйтесь к общине.",
  openGraph: {
    title: "Добро пожаловать в Menorah Center",
    description:
      "Навигация по нашему центру. Выберите интересующий вас раздел.",
    url: "https://menorah-rishon.com/welcome",
    images: [
      {
        url: "/seo/main.webp", // Используем существующую обложку
        width: 1200,
        height: 630,
        alt: "Menorah Center",
      },
    ],
  },
  alternates: {
    canonical: "/welcome",
  },
};

export default function WelcomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Добро пожаловать в Menorah Center",
            description:
              "Еврейский общинный центр в Ришон ле-Ционе. Быстрая навигация.",
            url: "https://menorah-rishon.com/welcome",
          }),
        }}
      />
      <WelcomeClient />
    </>
  );
}
