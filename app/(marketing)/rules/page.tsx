import React from "react";

export const metadata = {
  title: "Правила посещения | Menorah Center",
};

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-neutral-900 dark:text-white mb-4">
            Правила посещения
          </h1>
          <p className="text-neutral-500 font-medium">
            Для резидентов и гостей Menorah Center
          </p>
        </div>

        <div className="space-y-8 text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
          <section>
            <p className="text-lg">
              Мы стремимся создать безопасную, уважительную и комфортную среду
              для каждого участника нашей общины. Посещая мероприятия Menorah
              Center, вы соглашаетесь соблюдать следующие правила.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              1. Безопасность
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                По соображениям безопасности при входе в центр может
                потребоваться предъявить электронный билет из Личного кабинета и
                удостоверение личности (Теудат Зеут / Паспорт).
              </li>
              <li>
                Запрещается проносить на территорию центра оружие (без
                соответствующего разрешения и согласования со службой охраны),
                легковоспламеняющиеся и опасные вещества.
              </li>
              <li>
                Просим с пониманием относиться к возможным проверкам со стороны
                службы безопасности — это делается для вашей защиты.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              2. Поведение и уважение
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                На территории центра принято уважительное отношение к традициям,
                сотрудникам и другим посетителям.
              </li>
              <li>
                Использование ненормативной лексики, агрессивное поведение и
                любые формы дискриминации строго запрещены.
              </li>
              <li>
                Во время проведения лекций, уроков Торы и молитв просим
                переводить мобильные телефоны в беззвучный режим.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              3. Дресс-код
            </h2>
            <p>
              В Menorah Center приветствуется скромный и опрятный стиль одежды,
              соответствующий духу и традициям общины. При посещении синагоги
              или религиозных мероприятий для мужчин обязательно наличие
              головного убора (кипы).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">
              4. Ответственность за имущество
            </h2>
            <p>
              Администрация центра не несет ответственности за оставленные без
              присмотра личные вещи посетителей. Пожалуйста, будьте внимательны
              к своему имуществу.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
