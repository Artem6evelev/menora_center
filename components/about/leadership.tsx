"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Mail } from "lucide-react";
import Balancer from "react-wrap-balancer";
import { cn } from "@/lib/utils";

// Моковые данные администрации (потом можно вынести в CMS/Supabase)
const administration = [
  {
    name: "Давид Коэн",
    role: "Исполнительный директор",
    description:
      "Координация работы центра, стратегическое развитие и партнерства.",
    image: "/images/admin-1.webp",
  },
  {
    name: "Сара Леви",
    role: "Координатор женских программ",
    description:
      "Организация мероприятий, мастер-классов и поддержка женского клуба.",
    image: "/images/admin-2.webp",
  },
  {
    name: "Михаэль Кац",
    role: "Директор молодежного клуба",
    description:
      "Программы для студентов, поездки, лагеря и образовательные проекты.",
    image: "/images/admin-3.webp",
  },
  {
    name: "Эстер Гольдман",
    role: "Руководитель Хеседа",
    description:
      "Организация волонтеров, благотворительные акции и помощь пожилым.",
    image: "/images/admin-4.webp",
  },
];

export const Leadership = () => {
  return (
    <section className="py-20 relative max-w-6xl mx-auto px-4 sm:px-6">
      {/* 1. ГЛАВНАЯ КАРТОЧКА: РАВВИН */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="bg-neutral-50 border border-neutral-100 rounded-[2rem] overflow-hidden transform-gpu will-change-transform mb-16"
      >
        <div className="grid md:grid-cols-2 gap-8 md:gap-0 items-center">
          {/* Фото Раввина (с заглушкой bg-neutral-200 на случай отсутствия фото) */}
          <div className="relative w-full aspect-square md:aspect-auto md:h-full min-h-[400px] bg-neutral-200">
            <Image
              src="/images/rabbi-profile.webp" // Положи фото в public/images/
              alt="Раввин общины"
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
            <span className="text-sm font-bold tracking-widest text-blue-600 uppercase mb-3">
              Духовный лидер
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-4">
              Раввин Имя Фамилия
            </h2>
            <div className="w-12 h-1 bg-amber-400 rounded-full mb-6" />

            <p className="text-neutral-600 text-base md:text-lg leading-relaxed mb-8">
              <Balancer>
                «Моя главная цель — сделать так, чтобы каждый еврей в Ришон
                ле-Ционе почувствовал красоту и глубину наших традиций. Тора —
                это не старая книга на полке, это инструкция к счастливой жизни
                в современном мире. Мои двери всегда открыты для вас».
              </Balancer>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact" className="w-full sm:w-auto">
                <button
                  className={cn(
                    "w-full sm:w-auto flex items-center justify-center gap-2",
                    "bg-blue-900 text-white font-semibold px-6 py-3.5 rounded-xl",
                    "shadow-lg shadow-blue-900/20",
                    "transition-all duration-300 hover:bg-blue-800 hover:-translate-y-0.5",
                    "transform-gpu will-change-transform",
                  )}
                >
                  <MessageCircle className="w-5 h-5" />
                  Написать сообщение
                </button>
              </Link>
            </div>

            <p className="text-xs text-neutral-400 mt-4 font-medium">
              * Ответ обычно приходит в течение 2-3 часов через наш Telegram-бот
              или личный кабинет.
            </p>
          </div>
        </div>
      </motion.div>

      {/* 2. СЕКЦИЯ: АДМИНИСТРАЦИЯ */}
      <div className="mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 transform-gpu"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Администрация общины
          </h3>
          <p className="text-neutral-500 mt-2">
            Команда, которая делает всё возможным
          </p>
        </motion.div>

        {/* Сетка: 1 колонка на моб, 2 на десктопе */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {administration.map((person, index) => (
            <AdminCard key={person.name} {...person} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Вспомогательный компонент карточки администратора ---
const AdminCard = ({
  name,
  role,
  description,
  image,
  index,
}: {
  name: string;
  role: string;
  description: string;
  image: string;
  index: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      // Каскадная задержка для плавного появления
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "flex flex-col sm:flex-row gap-5 p-5 md:p-6 rounded-2xl",
        "bg-white border border-neutral-100 shadow-sm",
        "transition-all duration-300 hover:shadow-md hover:border-neutral-200",
        "transform-gpu will-change-transform group",
      )}
    >
      {/* Аватар (квадратный со скруглением) */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-neutral-100">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="112px"
        />
      </div>

      {/* Информация */}
      <div className="flex flex-col justify-center flex-1">
        <span className="text-xs font-bold tracking-wide text-blue-600 uppercase mb-1">
          {role}
        </span>
        <h4 className="text-lg font-bold text-neutral-900 mb-2">{name}</h4>
        <p className="text-sm text-neutral-500 leading-relaxed mb-4">
          {description}
        </p>

        {/* Опциональная кнопка связи (mail to) */}
        <div className="mt-auto">
          <Link
            href="/contact"
            className="inline-flex items-center text-sm font-semibold text-neutral-400 hover:text-blue-600 transition-colors"
          >
            <Mail className="w-4 h-4 mr-2" />
            Связаться
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
