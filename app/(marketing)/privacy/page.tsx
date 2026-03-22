import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

// 1. ПОЛНАЯ МЕТАДАТА ДЛЯ ЮРИДИЧЕСКОЙ СТРАНИЦЫ
export const metadata: Metadata = {
  title: "Политика конфиденциальности | Menorah Center",
  description:
    "Узнайте, как Menorah Center собирает, использует и защищает ваши персональные данные в соответствии с законодательством Израиля о защите конфиденциальности.",
  openGraph: {
    title: "Политика конфиденциальности | Menorah Center",
    description:
      "Официальная политика обработки персональных данных нашей общины.",
    type: "website",
  },
};

export default function PrivacyPage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://menorah-rishon.com";

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20 relative overflow-hidden">
      {/* 2. JSON-LD СХЕМА: Указываем Google, что это официальный документ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Политика конфиденциальности | Menorah Center",
            description:
              "Политика обработки и защиты персональных данных пользователей платформы Menorah Center.",
            url: `${baseUrl}/privacy`,
            publisher: {
              "@type": "Organization",
              name: "Menorah Center",
            },
          }),
        }}
      />

      {/* Фирменная фоновая сетка для визуального единства с остальным сайтом */}
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

        {/* Заголовок документа */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <ShieldCheck size={14} className="text-[#FFB800]" />
            Юридическая информация
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-neutral-900 dark:text-white mb-6 leading-tight">
            Политика <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              конфиденциальности
            </span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-bold tracking-widest uppercase text-sm">
            Последнее обновление: Март 2026 г.
          </p>
        </div>

        {/* Тело документа (Обернуто в "лист бумаги" для читаемости) */}
        <div className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl shadow-black/5">
          <div className="space-y-10 text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed prose-a:text-[#FFB800] prose-a:font-bold hover:prose-a:underline">
            <section>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight">
                1. Общие положения
              </h2>
              <p>
                Настоящая Политика конфиденциальности разработана в соответствии
                с Законом Израиля о защите конфиденциальности 1981 года (חוק
                הגנת הפרטיות, התשמ&quot;א-1981). Она описывает, как платформа
                Menorah Center собирает, использует, хранит и защищает ваши
                персональные данные при использовании нашего сайта и услуг.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight">
                2. Какие данные мы собираем
              </h2>
              <ul className="list-disc pl-5 space-y-3 marker:text-[#FFB800]">
                <li>
                  <strong className="text-neutral-800 dark:text-neutral-200">
                    Идентификационные данные:
                  </strong>{" "}
                  имя, фамилия.
                </li>
                <li>
                  <strong className="text-neutral-800 dark:text-neutral-200">
                    Контактные данные:
                  </strong>{" "}
                  адрес электронной почты, номер телефона (если предоставлен).
                </li>
                <li>
                  <strong className="text-neutral-800 dark:text-neutral-200">
                    Технические данные:
                  </strong>{" "}
                  IP-адрес, тип браузера, данные файлов cookie (для обеспечения
                  безопасности и сессий).
                </li>
                <li>
                  <strong className="text-neutral-800 dark:text-neutral-200">
                    Данные активности:
                  </strong>{" "}
                  история записей на мероприятия, обращения за услугами общины.
                </li>
              </ul>
              <p className="mt-4">
                Вы не обязаны предоставлять эти данные по закону, однако без них
                мы не сможем создать для вас личный кабинет и предоставлять
                доступ к записям на мероприятия.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight">
                3. Цели сбора данных
              </h2>
              <p className="mb-3">
                Собранные данные используются исключительно для:
              </p>
              <ul className="list-disc pl-5 space-y-3 marker:text-[#FFB800]">
                <li>
                  Идентификации резидентов и предоставления доступа к личному
                  кабинету.
                </li>
                <li>Обработки заявок на мероприятия и услуги центра.</li>
                <li>
                  Отправки важных уведомлений, подтверждений бронирований и
                  анонсов (через Email или Telegram).
                </li>
                <li>
                  Обеспечения безопасности платформы и предотвращения
                  мошенничества.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight">
                4. Передача данных третьим лицам
              </h2>
              <p>
                Menorah Center{" "}
                <strong className="text-neutral-800 dark:text-neutral-200">
                  не продает
                </strong>{" "}
                и не передает ваши персональные данные третьим лицам в
                маркетинговых целях. Ваши данные могут обрабатываться
                техническими партнерами (провайдерами облачной инфраструктуры,
                систем авторизации, такими как Clerk и Supabase), которые
                связаны строгими соглашениями о конфиденциальности и
                соответствуют международным стандартам безопасности (GDPR).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight">
                5. Ваши права
              </h2>
              <p className="mb-3">
                В соответствии с законодательством Израиля, вы имеете право:
              </p>
              <ul className="list-disc pl-5 space-y-3 marker:text-[#FFB800]">
                <li>
                  Запросить копию ваших персональных данных, хранящихся в нашей
                  системе.
                </li>
                <li>Потребовать исправления неточных данных.</li>
                <li>
                  Потребовать полного удаления вашего аккаунта и связанных с ним
                  персональных данных (право быть забытым).
                </li>
              </ul>
              <p className="mt-4">
                Для реализации этих прав свяжитесь с нами через личный кабинет
                или по официальным контактам общины.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-4 tracking-tight">
                6. Безопасность
              </h2>
              <p>
                Мы принимаем все разумные организационные и технические меры для
                защиты ваших данных от несанкционированного доступа, изменения,
                раскрытия или уничтожения, используя современные методы
                шифрования и защищенные базы данных.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
