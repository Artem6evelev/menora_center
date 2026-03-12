"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import {
  IconRings,
  IconBabyCarriage,
  IconChefHat,
  IconCell,
  IconSchool,
  IconFlame,
} from "@tabler/icons-react"; // Убедись, что иконки импортируются корректно (можешь заменить на lucide-react, если таблёра нет)

const services = [
  {
    id: "chuppah",
    title: "Хупа и Кидушин",
    description:
      "Организация традиционной еврейской свадьбы. Подготовка жениха и невесты, проведение церемонии и оформление Ктубы.",
    icon: <IconRings className="w-8 h-8 text-rose-500" />,
    color: "group-hover:border-rose-200 group-hover:shadow-rose-100/50",
    link: "/contact?service=chuppah",
  },
  {
    id: "brit-milah",
    title: "Брит Мила и Пкуд а-Бен",
    description:
      "Помощь в поиске квалифицированного моэля, организация трапезы и проведение церемонии вступления в завет Авраама.",
    icon: <IconBabyCarriage className="w-8 h-8 text-blue-500" />,
    color: "group-hover:border-blue-200 group-hover:shadow-blue-100/50",
    link: "/contact?service=brit-milah",
  },
  {
    id: "bar-mitzvah",
    title: "Бар и Бат Мицва",
    description:
      "Индивидуальные занятия с мальчиками (надевание тфилина, чтение Торы) и девочками для подготовки к еврейскому совершеннолетию.",
    icon: <IconSchool className="w-8 h-8 text-indigo-500" />,
    color: "group-hover:border-indigo-200 group-hover:shadow-indigo-100/50",
    link: "/contact?service=bar-mitzvah",
  },
  {
    id: "mezuzah",
    title: "Мезузы и Тфилин",
    description:
      "Приобретение кошерных мезуз и тфилина, профессиональная проверка софером (переписчиком) и помощь в правильной установке.",
    icon: <IconCell className="w-8 h-8 text-amber-500" />,
    color: "group-hover:border-amber-200 group-hover:shadow-amber-100/50",
    link: "/contact?service=mezuzah",
  },
  {
    id: "kosher",
    title: "Кашерование кухни",
    description:
      "Практическая помощь в переходе на кошерное питание. Очистка и кашерование посуды, плит и духовок у вас дома.",
    icon: <IconChefHat className="w-8 h-8 text-emerald-500" />,
    color: "group-hover:border-emerald-200 group-hover:shadow-emerald-100/50",
    link: "/contact?service=kosher",
  },
  {
    id: "kadish",
    title: "Память и Кадиш",
    description:
      "Организация похорон по еврейскому закону (Хевра Кадиша), чтение Кадиша, проведение Йорцайта и установка памятника.",
    icon: <IconFlame className="w-8 h-8 text-neutral-600" />,
    color: "group-hover:border-neutral-300 group-hover:shadow-neutral-200/50",
    link: "/contact?service=kadish",
  },
];

export const ServicesGrid = () => {
  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {services.map((service, index) => (
          <ServiceCard key={service.id} {...service} index={index} />
        ))}
      </div>
    </section>
  );
};

const ServiceCard = ({
  title,
  description,
  icon,
  color,
  link,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  link: string;
  index: number;
}) => {
  return (
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
        "group relative flex flex-col p-8 rounded-3xl h-full",
        "bg-white border border-neutral-100 shadow-sm",
        "transition-all duration-300 transform-gpu will-change-transform hover:-translate-y-1",
        color,
      )}
    >
      <div className="mb-6 bg-neutral-50 w-16 h-16 rounded-2xl flex items-center justify-center border border-neutral-100 transition-colors duration-300 group-hover:bg-white">
        {icon}
      </div>

      <h3 className="text-xl font-bold text-neutral-900 mb-3">{title}</h3>

      <p className="text-neutral-500 leading-relaxed text-sm flex-grow mb-8">
        {description}
      </p>

      {/* 🚀 System Thinking: Кнопка-ссылка передает параметр ?service=... в контактную форму/бота */}
      <div className="mt-auto pt-4 border-t border-neutral-100">
        <Link
          href={link}
          className="inline-flex items-center text-sm font-semibold text-neutral-900 group/btn"
        >
          Оставить заявку
          <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1 text-blue-600" />
        </Link>
      </div>
    </motion.div>
  );
};
