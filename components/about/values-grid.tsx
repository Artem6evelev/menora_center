"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  IconHeart,
  IconBook2,
  IconHomeHeart,
  IconDoor,
} from "@tabler/icons-react";

const values = [
  {
    title: "Аават Исраэль",
    description:
      "Безусловная любовь к каждому еврею. Мы не делим людей на «религиозных» и «светских». Каждый для нас — часть одной большой семьи.",
    icon: <IconHeart className="w-7 h-7 text-rose-500" />,
    iconBg: "bg-rose-100/50 text-rose-600",
  },
  {
    title: "Сила семьи",
    description:
      "Еврейский дом — это фундамент. Мы помогаем укреплять семейные ценности, воспитывать детей в радости и сохранять тепло традиций (Шлом Байт).",
    icon: <IconHomeHeart className="w-7 h-7 text-amber-500" />,
    iconBg: "bg-amber-100/50 text-amber-600",
  },
  {
    title: "Непрерывное развитие",
    description:
      "Изучение Торы актуально всегда. Мы делаем древнюю мудрость понятной и применимой в современных реалиях бизнеса, отношений и психологии.",
    icon: <IconBook2 className="w-7 h-7 text-blue-500" />,
    iconBg: "bg-blue-100/50 text-blue-600",
  },
  {
    title: "Открытые двери",
    description:
      "Вам не нужно ничего «уметь», чтобы прийти к нам. Не знаете иврит? Не помните молитвы? Мы всему научим, подскажем и примем с открытым сердцем.",
    icon: <IconDoor className="w-7 h-7 text-emerald-500" />,
    iconBg: "bg-emerald-100/50 text-emerald-600",
  },
];

export const ValuesGrid = () => {
  return (
    <section className="relative z-10 py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Заголовок секции */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center mb-16 transform-gpu will-change-transform"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 tracking-tight">
          Наши фундаментальные ценности
        </h2>
        <p className="text-neutral-500 max-w-2xl mx-auto text-base md:text-lg">
          На этих четырех столпах строится жизнь Менора Центра. Это то, во что
          мы верим и что практикуем каждый день.
        </p>
      </motion.div>

      {/* Сетка карточек (2x2 на десктопе, 1 колонка на мобильных) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {values.map((value, index) => (
          <ValueCard key={value.title} {...value} index={index} />
        ))}
      </div>
    </section>
  );
};

const ValueCard = ({
  title,
  description,
  icon,
  iconBg,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  index: number;
}) => {
  return (
    // 🚀 PERFORMANCE: Каскадное появление (delay: index * 0.1)
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn(
        "group relative flex flex-col sm:flex-row gap-6 p-6 md:p-8 rounded-3xl",
        "bg-white border border-neutral-100 shadow-sm",
        "transition-all duration-300 hover:shadow-md hover:border-neutral-200",
        "transform-gpu will-change-transform",
      )}
    >
      {/* Иконка */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 transform-gpu group-hover:scale-110",
            iconBg,
          )}
        >
          {icon}
        </div>
      </div>

      {/* Текст */}
      <div className="flex flex-col">
        <h3 className="text-xl font-bold text-neutral-900 mb-2">{title}</h3>
        <p className="text-neutral-500 leading-relaxed text-sm md:text-base">
          {description}
        </p>
      </div>
    </motion.div>
  );
};
