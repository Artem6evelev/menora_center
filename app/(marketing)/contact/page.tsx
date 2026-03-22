import { Metadata } from "next";
import { Background } from "@/components/background";
import { HorizontalGradient } from "@/components/horizontal-gradient";
import { ContactForm } from "@/components/contact";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Контакты | Menorah Center",
  description:
    "Свяжитесь с нами. Адрес, телефон и часы работы еврейского общинного центра Menorah Center в Ришон ле-Ционе.",
  openGraph: {
    title: "Контакты | Menorah Center",
    description:
      "Будем рады видеть вас в нашем центре. Узнайте, как с нами связаться.",
    images: ["/og-default.jpg"], // Замени на красивое фото центра
  },
};

export default function ContactPage() {
  // Замените эти данные на реальные
  const contactInfo = {
    address: "ул. Ротшильд 1, Ришон ле-Цион, Израиль",
    phone: "+972 50 123 4567",
    email: "shalom@menorahcenter.com",
    hours: "Вс-Чт: 09:00 - 19:00, Пт: до захода Шаббата",
  };

  return (
    <div className="relative overflow-hidden py-20 md:py-0 px-4 md:px-0 bg-white dark:bg-neutral-950 min-h-screen pt-24 md:pt-0">
      {/* JSON-LD Schema для локального бизнеса (Google Maps & Rich Snippets) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Menorah Center",
            image: "https://menorahcenter.com/logo.png",
            "@id": "https://menorahcenter.com",
            url: "https://menorahcenter.com/contact",
            telephone: contactInfo.phone,
            email: contactInfo.email,
            address: {
              "@type": "PostalAddress",
              streetAddress: "ул. Ротшильд 1",
              addressLocality: "Ришон ле-Цион",
              addressCountry: "IL",
            },
            openingHoursSpecification: [
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                ],
                opens: "09:00",
                closes: "19:00",
              },
              {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: "Friday",
                opens: "09:00",
                closes: "15:00",
              },
            ],
          }),
        }}
      />

      <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 relative overflow-hidden max-w-[1440px] mx-auto">
        <Background />

        {/* Левая колонка: Форма связи (Твой компонент) */}
        <div className="relative z-20 flex items-center justify-center p-4 md:p-12 h-full pt-10 md:pt-32 pb-20">
          <div className="w-full max-w-md">
            <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white mb-4 tracking-tighter">
              Напишите нам
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mb-8 font-medium">
              Есть вопросы о мероприятиях, нужна духовная поддержка или хотите
              стать резидентом? Мы всегда готовы помочь.
            </p>
            {/* Клиентский компонент формы */}
            <ContactForm />
          </div>
        </div>

        {/* Правая колонка: Информация и контакты */}
        <div className="relative w-full z-20 hidden md:flex border-l border-neutral-100 dark:border-neutral-900 overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/50 backdrop-blur-sm items-center justify-center p-12 lg:p-20">
          <div className="max-w-md mx-auto w-full relative z-30">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#FFB800] animate-pulse" />
              Ждем вас в гости
            </div>

            <h2 className="text-3xl font-black text-neutral-900 dark:text-white mb-8 tracking-tight leading-tight">
              Двери Menorah Center <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
                всегда открыты для вас
              </span>
            </h2>

            {/* Карточки с контактами */}
            <div className="space-y-6">
              {[
                { icon: MapPin, title: "Адрес", value: contactInfo.address },
                { icon: Phone, title: "Телефон", value: contactInfo.phone },
                { icon: Mail, title: "Email", value: contactInfo.email },
                { icon: Clock, title: "Часы работы", value: contactInfo.hours },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="bg-[#FFB800]/10 p-3 rounded-xl text-[#FFB800] shrink-0 mt-0.5">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                      {item.title}
                    </p>
                    <p className="text-sm md:text-base font-bold text-neutral-800 dark:text-neutral-200">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопка перехода в Telegram */}
            <a
              href="https://t.me/menorah_center"
              target="_blank"
              rel="noreferrer"
              className="mt-10 group flex items-center justify-center gap-3 w-full bg-[#229ED9] hover:bg-[#1E8CC0] text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-[#229ED9]/20"
            >
              <Send
                size={18}
                className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"
              />
              Написать в Telegram
            </a>
          </div>

          {/* Декоративные градиенты из оригинального шаблона */}
          <HorizontalGradient className="top-20 opacity-50" />
          <HorizontalGradient className="bottom-20 opacity-50" />
          <HorizontalGradient className="-right-80 transform rotate-90 inset-y-0 h-full scale-x-150 opacity-30" />
          <HorizontalGradient className="-left-80 transform rotate-90 inset-y-0 h-full scale-x-150 opacity-30" />
        </div>
      </div>
    </div>
  );
}
