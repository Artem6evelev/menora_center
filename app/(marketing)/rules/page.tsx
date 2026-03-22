import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Gavel,
  ShieldAlert,
  Heart,
  Shirt,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Правила посещения | Menorah Center",
  description:
    "Узнайте о правилах безопасности, этикете и дресс-коде в Menorah Center Ришон ле-Цион. Мы заботимся о комфорте каждого участника общины.",
};

export default function RulesPage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://menora-rishon.com";

  const rulesSections = [
    {
      title: "1. Безопасность",
      icon: ShieldAlert,
      content: [
        "По соображениям безопасности при входе в центр может потребоваться предъявить электронный билет из Личного кабинета и удостоверение личности (Теудат Зеут / Паспорт).",
        "Запрещается проносить на территорию центра оружие (без соответствующего разрешения и согласования со службой охраны), легковоспламеняющиеся и опасные вещества.",
        "Просим с пониманием относиться к возможным проверкам со стороны службы безопасности — это делается для вашей защиты.",
      ],
    },
    {
      title: "2. Поведение и уважение",
      icon: Heart,
      content: [
        "На территории центра принято уважительное отношение к традициям, сотрудникам и другим посетителям.",
        "Использование ненормативной лексики, агрессивное поведение и любые формы дискриминации строго запрещены.",
        "Во время проведения лекций, уроков Торы и молитв просим переводить мобильные телефоны в беззвучный режим.",
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20 relative overflow-hidden">
      {/* JSON-LD: Обозначаем страницу как официальный справочный документ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Правила посещения Menorah Center",
            description:
              "Свод правил и этикета для посетителей и резидентов Menorah Center в Ришон ле-Ционе.",
            url: `${baseUrl}/rules`,
            publisher: {
              "@type": "Organization",
              name: "Menorah Center",
            },
          }),
        }}
      />

      {/* Фоновая сетка */}
      <div className="absolute inset-0 h-full w-full bg-white dark:bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6">
        {/* Кнопка "Назад" */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-bold transition-colors mb-12 group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          На главную
        </Link>

        {/* Заголовок */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <Gavel size={14} className="text-[#FFB800]" />
            Кодекс общины
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-neutral-900 dark:text-white mb-6">
            Правила <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              посещения
            </span>
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
            Мы стремимся создать безопасную, уважительную и комфортную среду для
            каждого участника нашей общины.
          </p>
        </div>

        {/* Контент в карточке */}
        <div className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl shadow-black/5 space-y-12">
          {rulesSections.map((section, idx) => (
            <section key={idx}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#FFB800]/10 rounded-lg text-[#FFB800]">
                  <section.icon size={20} />
                </div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                  {section.title}
                </h2>
              </div>
              <ul className="list-disc pl-5 space-y-3 text-neutral-600 dark:text-neutral-400 font-medium marker:text-[#FFB800]">
                {section.content.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          ))}

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#FFB800]/10 rounded-lg text-[#FFB800]">
                <Shirt size={20} />
              </div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                3. Дресс-код
              </h2>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800">
              В Menorah Center приветствуется скромный и опрятный стиль одежды,
              соответствующий духу и традициям общины. При посещении синагоги
              или религиозных мероприятий для мужчин обязательно наличие
              головного убора (кипы).
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#FFB800]/10 rounded-lg text-[#FFB800]">
                <Package size={20} />
              </div>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                4. Ответственность за имущество
              </h2>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
              Администрация центра не несет ответственности за оставленные без
              присмотра личные вещи посетителей. Пожалуйста, будьте внимательны
              к своему имуществу.
            </p>
          </section>
        </div>

        <div className="mt-12 p-8 rounded-[32px] bg-gradient-to-br from-[#FFB800]/10 to-orange-500/10 border border-[#FFB800]/20 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-sm">
            <Heart className="text-[#FFB800]" size={32} />
          </div>
          <div>
            <h4 className="text-lg font-black text-neutral-900 dark:text-white mb-1">
              Спасибо за понимание
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              Соблюдение этих правил помогает нам оставаться местом, где каждый
              чувствует себя как дома.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
