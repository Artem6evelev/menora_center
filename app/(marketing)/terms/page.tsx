import React from "react";

export const metadata = {
  title: "Пользовательское соглашение | Menora Center",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-neutral-900 dark:text-white mb-4">
            Пользовательское соглашение
          </h1>
          <p className="text-neutral-500 font-medium">
            Последнее обновление: Март 2026 г.
          </p>
        </div>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              1. Принятие условий
            </h2>
            <p>
              Используя сайт и систему Menora Center (далее «Платформа»), вы
              подтверждаете, что прочитали, поняли и согласны с настоящим
              Пользовательским соглашением. Если вы не согласны с какими-либо
              условиями, пожалуйста, прекратите использование Платформы.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              2. Регистрация и Аккаунт
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                При регистрации вы обязуетесь предоставлять точную и актуальную
                информацию.
              </li>
              <li>
                Вы несете ответственность за сохранность своих учетных данных и
                безопасность своего аккаунта.
              </li>
              <li>
                Администрация оставляет за собой право приостановить или удалить
                аккаунт в случае выявления нарушений правил общины или
                предоставления заведомо ложных данных.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              3. Использование сервисов и Бронирование
            </h2>
            <p>
              Платформа предоставляет функционал для записи на мероприятия и
              получения услуг общины. Количество мест на мероприятия может быть
              ограничено. Бронирование считается успешным только после появления
              электронного билета в Личном кабинете. Пользователь обязуется
              своевременно отменять бронирование, если не сможет присутствовать,
              чтобы освободить место для других участников.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              4. Ограничение ответственности
            </h2>
            <p>
              Платформа предоставляется по принципу &quot;как есть&quot; (as
              is). Администрация не гарантирует бесперебойную работу сайта в
              случае технических сбоев, форс-мажорных обстоятельств или проблем
              на стороне интернет-провайдеров.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              5. Изменение условий
            </h2>
            <p>
              Мы оставляем за собой право обновлять данные Условия в любое
              время. Изменения вступают в силу с момента их публикации на этой
              странице. Продолжение использования Платформы после публикации
              изменений означает ваше согласие с новыми Условиями.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
