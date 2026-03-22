"use client";

import { motion, Variants } from "framer-motion";
import Image from "next/image";
import {
  Star,
  BookHeart,
  Sparkles,
  ShieldCheck,
  Users,
  HeartHandshake,
} from "lucide-react";

// Массив вынесен сюда, чтобы не передавать иконки (функции) с сервера на клиент
const team = [
  {
    name: "Рав Алекс и Ента",
    role: "Раввин общины и ребецн",
    description:
      "Духовные лидеры нашей общины. Хранители традиций, к которым всегда можно обратиться за советом, поддержкой и мудростью.",
    icon: Star,
    image:
      "https://images.unsplash.com/photo-1544723795-3ca315cadc20?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Рав Гай и Марина",
    role: "Коэн общины и его супруга",
    description:
      "Несут в общину свет благословения коэнов. Помогают в организации духовной жизни и поддержании теплой семейной атмосферы.",
    icon: Sparkles,
    image:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Рав Элияу",
    role: "Преподаватель Тании",
    description:
      "Глубокий мыслитель и потрясающий учитель. На его уроках хасидизма и книги Тания раскрываются самые сокровенные тайны Торы.",
    icon: BookHeart,
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Хана Зельцер",
    role: "Блогер, лектор женских уроков",
    description:
      "Вдохновляющий спикер и автор. Ведет популярные женские программы, объединяя современный мир и вечные еврейские ценности.",
    icon: Users,
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Бася",
    role: "Администратор",
    description:
      "Сердце нашего центра. Человек, который знает ответы на все вопросы, координирует расписание и заботится о том, чтобы всем было комфортно.",
    icon: ShieldCheck,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Марк",
    role: "Координатор общины",
    description:
      "Следит за тем, чтобы все проекты, мероприятия и технические процессы в Menorah Center работали как швейцарские часы.",
    icon: HeartHandshake,
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80",
  },
];

// Настройки анимации для родительского контейнера (Stagger effect)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }, // Каждая карточка появляется с задержкой 0.1s
  },
};

// Настройки анимации для каждой карточки
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

export const TeamGrid = () => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      {team.map((person, idx) => {
        const Icon = person.icon;
        return (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="group bg-white dark:bg-neutral-900 rounded-[32px] p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 relative flex flex-col h-full"
          >
            {/* Фото (Используем next/image для перфоманса) */}
            <div className="w-full h-64 rounded-2xl overflow-hidden mb-6 relative bg-neutral-100 dark:bg-neutral-800 shrink-0">
              <Image
                src={person.image}
                alt={person.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover filter grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
              />
              {/* Иконка роли (поверх фото) */}
              <div className="absolute top-4 right-4 w-10 h-10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md rounded-xl flex items-center justify-center text-[#FFB800] shadow-lg">
                <Icon size={20} strokeWidth={2} />
              </div>
            </div>

            {/* Инфо */}
            <div className="px-4 pb-4 flex flex-col flex-grow">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] mb-2">
                {person.role}
              </div>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight group-hover:text-[#FFB800] transition-colors">
                {person.name}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                {person.description}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
