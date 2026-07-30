import { Metadata } from "next";
import KidsProgramsClient from "./KidsProgramsClient";

// Метаданные для Google, Яндекса и соцсетей
export const metadata: Metadata = {
  title: "Menorah Kids | Еврейский детский центр и программы развития",
  description:
    "Развивающие программы, творческие мастерские, изучение иврита и Торы, а также бережные занятия для нейроотличных детей. Запишитесь на пробное занятие!",
  keywords: [
    "еврейский детский центр",
    "кружки для детей",
    "нейроотличные дети",
    "разговорный клуб иврита",
    "изучение традиций",
    "Menorah Kids",
    "творческие мастерские для детей",
    "детский центр развития",
  ].join(", "),
  openGraph: {
    title: "Детские программы в Menorah Kids",
    description:
      "Развивающие программы для детей от 3 до 17 лет в комфортной и безопасной среде.",
    type: "website",
    locale: "ru_RU",
    siteName: "Menorah Kids",
    // images: [
    //   {
    //     url: "https://yourdomain.com/og-image.jpg", // Ссылка на красивый баннер
    //     width: 1200,
    //     height: 630,
    //     alt: "Menorah Kids - Детский центр",
    //   },
    // ],
  },
  alternates: {
    canonical: "https://yourdomain.com/programs", // Укажите реальный URL страницы
  },
};

export default function KidsProgramsPage() {
  return (
    <>
      {/* Микроразметка Schema.org для поисковых систем */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name: "Menorah Kids",
            description: "Еврейский детский центр и программы развития",
            // url: "https://yourdomain.com",
            // logo: "https://yourdomain.com/logo.png",
            offers: [
              {
                "@type": "Offer",
                category: "Educational programs for children",
                name: "Программы для детей с нейроотличиями",
              },
              {
                "@type": "Offer",
                category: "Language Club",
                name: "Разговорный клуб иврита",
              },
              {
                "@type": "Offer",
                category: "Arts and Crafts",
                name: "Творческие мастерские",
              },
            ],
          }),
        }}
      />
      {/* Рендеринг клиентского компонента с UI */}
      <KidsProgramsClient />
    </>
  );
}
