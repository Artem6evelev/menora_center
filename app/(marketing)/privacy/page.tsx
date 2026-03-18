import React from "react";

export const metadata = {
  title: "Политика конфиденциальности | Menora Center",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-neutral-900 dark:text-white mb-4">
            Политика конфиденциальности
          </h1>
          <p className="text-neutral-500 font-medium">
            Последнее обновление: Март 2026 г.
          </p>
        </div>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              1. Общие положения
            </h2>
            <p>
              Настоящая Политика конфиденциальности разработана в соответствии с
              Законом Израиля о защите конфиденциальности 1981 года (חוק הגנת
              הפרטיות, התשמ&quot;א-1981). Она описывает, как платформа Menora
              Center собирает, использует, хранит и защищает ваши персональные
              данные при использовании нашего сайта и услуг.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              2. Какие данные мы собираем
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Идентификационные данные:</strong> имя, фамилия.
              </li>
              <li>
                <strong>Контактные данные:</strong> адрес электронной почты,
                номер телефона (если предоставлен).
              </li>
              <li>
                <strong>Технические данные:</strong> IP-адрес, тип браузера,
                данные файлов cookie (для обеспечения безопасности и сессий).
              </li>
              <li>
                <strong>Данные активности:</strong> история записей на
                мероприятия, обращения за услугами общины.
              </li>
            </ul>
            <p className="mt-3">
              Вы не обязаны предоставлять эти данные по закону, однако без них
              мы не сможем создать для вас личный кабинет и предоставлять доступ
              к записям на мероприятия.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              3. Цели сбора данных
            </h2>
            <p>Собранные данные используются исключительно для:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
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
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              4. Передача данных третьим лицам
            </h2>
            <p>
              Menora Center <strong>не продает</strong> и не передает ваши
              персональные данные третьим лицам в маркетинговых целях. Ваши
              данные могут обрабатываться техническими партнерами (провайдерами
              облачной инфраструктуры, систем авторизации, такими как Clerk и
              Supabase), которые связаны строгими соглашениями о
              конфиденциальности и соответствуют международным стандартам
              безопасности (GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              5. Ваши права
            </h2>
            <p>В соответствии с законодательством Израиля, вы имеете право:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
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
            <p className="mt-3">
              Для реализации этих прав свяжитесь с нами через личный кабинет или
              по официальным контактам общины.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              6. Безопасность
            </h2>
            <p>
              Мы принимаем все разумные организационные и технические меры для
              защиты ваших данных от несанкционированного доступа, изменения,
              раскрытия или уничтожения, используя современные методы шифрования
              и защищенные базы данных.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
