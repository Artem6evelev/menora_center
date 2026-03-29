"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";
import {
  Star,
  Sparkles,
  HeartHandshake,
  X,
  BookHeart,
  Users,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- ДАННЫЕ КОМАНДЫ ---
const team = [
  {
    name: "Рав Александр Пручанский и Рабанит Ента Пручанская",
    role: "Официальные шлухим Любавичского Ребе",
    description: `Рав Александр Пручанский и Рабанит Ента Пручанская — это не просто семья посланников. Это официальные шлухим Любавичского Ребе в городе Ришон ле-Цион, несущие свет Торы и иудаизма каждому еврею.

С полной самоотдачей и любовью к каждому человеку, они уже на протяжении многих лет строят не просто общину — а настоящий еврейский дом, в котором чувствуется тепло, поддержка и единство.

Это те люди, на которых хочется равняться. Люди, которые живут своей миссией 24/7.

Благодаря их труду, заботе и бесконечной вере в каждого — многие сделали шаги в соблюдении заповедей, укрепились в Торе, создали семьи и нашли свой путь в иудаизме.

Menorah Center — это не просто место. Это большая, живая семья, созданная их сердцем и душой.

С Б-жьей помощью, их свет продолжает расти и зажигать всё больше еврейских душ.`,
    icon: Star,
    image: "",
  },
  {
    name: "Рав Гай Маркус и Рабанит Марина-Хана Маркус",
    role: "Коэн общины и шлухим",
    description: `Рав Гай Маркус и Рабанит Марина-Хана Маркус — это особенная семья шлухим Menorah Center, которые с Б-жьей помощью несут свет Торы и живой пример еврейской жизни в общине.

Рав Гай регулярно проводит уроки в Menorah Center, делясь знаниями, глубиной и теплом, помогая каждому приблизиться к Торе и мицвот в понятной и живой форме.

Это не просто раввин — это дорогой Коэн нашей общины, который с заботой и вниманием сопровождает людей в важных мицвот: раздача шабатних свечей, наложение тфилин, установка мезузот, проведение ханукат байт.

Это семья, которая удивительным образом умеет совмещать повседневную работу с великой миссией шлихут — с полной отдачей, искренностью и настоящей ахават Исраэль.

Люди, к которым можно обратиться в любой момент. Позвонить — и быть уверенным, что тебе ответят, поддержат и придут на помощь.

Своим примером они показывают, что шлихут — это не только слова, а образ жизни: забота, участие, тепло и ответственность за каждого еврея.

С Б-жьей помощью, их вклад укрепляет общину, наполняет её жизнью и помогает ещё большему числу людей найти своё место, связь и свет 🤍`,
    icon: Sparkles,
    image: "/markus.jpeg",
  },
  {
    name: "Бася Ходорковская",
    role: "Шадханит и руководитель проектов",
    description: `Шадханит Menorah Center, руководитель, мотиватор и движущая сила множества проектов, с Б-жьей помощью помогающая людям находить друг друга, строить еврейские семьи и делать важные шаги в жизни.

Её деятельность — это не просто организация мероприятий, а руководство, поддержка и внимание к деталям, тонкое чувствование людей и умение увидеть глубину каждого, чтобы соединить именно те души, которые предназначены друг для друга.

Бася создаёт не просто встречи — своей энергией, радостью и искренностью, в сочетании с ответственностью и конфиденциальностью, она создаёт атмосферу, в которой происходят настоящие изменения.

Шидухи, тёплые вечера и общинные проекты — всё это наполнено заботой, смыслом и искренним желанием помочь.

С Б-жьей помощью, через её деятельность в общине создаются новые семьи, укрепляются связи и становится больше света и радости.`,
    icon: HeartHandshake,
    image: "/basya.jpeg",
  },
  {
    name: "Рав Элиягу Киржнер",
    role: "Преподаватель Тании",
    description: `Рав Элиягу Киржнер — человек особой преданности своему делу.

Несмотря на все трудности, он каждую неделю приезжает в Menorah Center, чтобы делиться светом хасидута и глубиной учения Тании.

Его уроки — это не просто знания, а настоящее наполнение души, которое даёт силы, ясность и внутреннюю опору.

С искренностью и теплом, он помогает каждому, кто приходит, глубже понять себя, свою душу и свою связь с Всевышним.

Такие люди — это настоящий пример внутренней силы и постоянства.`,
    icon: BookHeart,
    image: "/eliyagu.jpeg",
  },
];

// --- АНИМАЦИИ СЕТКИ ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

export const TeamGrid = () => {
  const [selectedPerson, setSelectedPerson] = useState<(typeof team)[0] | null>(
    null,
  );

  const visibleTeam = team.filter(
    (person) => person.name && person.description,
  );

  useEffect(() => {
    if (selectedPerson) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedPerson]);

  if (visibleTeam.length === 0) return null;

  return (
    <>
      {/* СЕТКА КАРТОЧЕК */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {visibleTeam.map((person, idx) => {
          const RoleIcon = person.icon;
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="group bg-white dark:bg-neutral-900 rounded-[32px] p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 relative flex flex-col h-full cursor-pointer"
              onClick={() => setSelectedPerson(person)}
            >
              <div className="w-full h-80 rounded-2xl overflow-hidden mb-6 relative bg-neutral-100 dark:bg-neutral-800 shrink-0 flex items-center justify-center">
                {person.image ? (
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover object-top filter grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-800">
                    <Users
                      size={48}
                      className="text-neutral-300 dark:text-neutral-700"
                      strokeWidth={1}
                    />
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-600 font-bold uppercase tracking-widest">
                      Фото отсутствует
                    </span>
                  </div>
                )}

                <div className="absolute top-4 right-4 w-10 h-10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md rounded-xl flex items-center justify-center text-[#FFB800] shadow-lg">
                  <RoleIcon size={20} strokeWidth={2} />
                </div>
              </div>

              <div className="px-4 pb-2 flex flex-col flex-grow relative">
                <div className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] mb-2">
                  {person.role}
                </div>
                <h3 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight group-hover:text-[#FFB800] transition-colors leading-tight">
                  {person.name}
                </h3>

                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed line-clamp-4 mb-4">
                  {person.description}
                </p>

                <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-[#FFB800] text-sm font-bold uppercase tracking-wider flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                    Читать полностью &rarr;
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* АДАПТИВНОЕ МОДАЛЬНОЕ ОКНО */}
      <AnimatePresence>
        {selectedPerson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPerson(null)}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 w-full max-w-3xl mt-24 sm:mt-0 max-h-[calc(100vh-8rem)] sm:max-h-[90vh] rounded-2xl sm:rounded-[32px] lg:rounded-[48px] overflow-hidden shadow-2xl flex flex-col relative"
            >
              <button
                onClick={() => setSelectedPerson(null)}
                className="absolute top-3 right-3 sm:top-6 sm:right-6 z-30 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>

              <div className="overflow-y-auto w-full h-full flex flex-col bg-white dark:bg-neutral-900">
                {/* --- НОВОЕ ЧИСТОЕ РЕШЕНИЕ: Чистый фон + Закругление фото --- */}
                {/* ИЗМЕНЕНИЕ: Заменен фон контейнера на чистый белый/темный и добавлены сильные отступы для парящего эффекта */}
                <div className="w-full h-[320px] sm:h-[400px] relative shrink-0 flex items-center justify-center bg-white dark:bg-neutral-900 px-6 pt-12 sm:px-10 sm:pt-16 pointer-events-none">
                  {selectedPerson.image ? (
                    // ИЗМЕНЕНИЕ: Самой картинке добавлены rounded, border и тень, чтобы она выглядела как парящий портрет
                    <Image
                      src={selectedPerson.image}
                      alt={selectedPerson.name}
                      fill
                      className="object-contain rounded-2xl sm:rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800"
                    />
                  ) : (
                    // ЗАГЛУШКА ДЛЯ МОДАЛЬНОГО ОКНА
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <Users
                        size={64}
                        className="text-neutral-300 dark:text-neutral-700 sm:w-20 sm:h-20"
                        strokeWidth={1}
                      />
                      <span className="text-xs sm:text-sm text-neutral-400 dark:text-neutral-600 font-bold uppercase tracking-widest">
                        Фото отсутствует
                      </span>
                    </div>
                  )}
                </div>

                {/* Текстовый блок: отступы и фон сохранены, убраны отрицательные mt и градиент */}
                {/* ИЗМЕНЕНИЕ: Скролл текста теперь чисто начинается под фотографией без наплывов */}
                <div className="px-5 sm:px-8 lg:px-12 pb-10 pt-8 relative z-30 flex flex-col flex-grow bg-white dark:bg-neutral-900">
                  <div className="inline-flex self-start items-center gap-1.5 sm:gap-2 px-3 py-1 sm:py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#FFB800] mb-3 sm:mb-4 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50">
                    <selectedPerson.icon
                      size={12}
                      className="sm:w-3.5 sm:h-3.5"
                    />
                    <span className="line-clamp-1">{selectedPerson.role}</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-900 dark:text-white tracking-tight leading-[1.1] mb-4 sm:mb-6 text-balance">
                    {selectedPerson.name}
                  </h2>

                  <div className="text-sm sm:text-base lg:text-lg text-neutral-700 dark:text-neutral-300 font-medium leading-relaxed whitespace-pre-line overflow-wrap-break-word">
                    {selectedPerson.description}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
