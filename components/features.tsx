"use client";

import React from "react";
import { Heading } from "./heading";
import { Subheading } from "./subheading";
import { cn } from "@/lib/utils";
import { GridLineHorizontal, GridLineVertical } from "./grid-lines";
import { SkeletonOne } from "./skeletons/first";
import { SkeletonTwo } from "./skeletons/second";
import { SkeletonFour } from "./skeletons/fourth";
import Link from "next/link";
import { motion } from "framer-motion";
// 🔥 Добавили новые иконки BookOpen и Home
import {
  Star,
  FileCheck,
  MessageCircle,
  HeartHandshake,
  BookOpen,
  Home,
} from "lucide-react";

export const Features = () => {
  const features = [
    {
      title: "Мероприятия и праздники",
      description:
        "Участвуйте в фарбренгенах, отмечайте праздники в кругу общины и не пропускайте важные уроки.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 lg:col-span-4 border-b lg:border-r dark:border-neutral-800",
      link: "/events",
    },
    {
      title: "Menorah Kids",
      description:
        "Развивающие программы и инклюзивная среда. От мини-сада до сенсорной интеграции и тьюторинга.",
      skeleton: <SkeletonKids />,
      className:
        "col-span-1 lg:col-span-2 border-b dark:border-neutral-800 bg-gradient-to-br from-transparent to-amber-50/30 dark:to-amber-900/10",
      link: "/kids",
    },
    {
      title: "Услуги центра",
      description:
        "Проверка мезуз, консультации раввина, организация Хупы и другие духовные услуги общины.",
      skeleton: <SkeletonServices />,
      className:
        "col-span-1 lg:col-span-2 border-b lg:border-b-0 lg:border-r dark:border-neutral-800",
      link: "/services",
    },
    {
      title: "Новости общины",
      description:
        "Будьте в курсе всех обновлений, новых проектов, расписания молитв и важных объявлений.",
      skeleton: <SkeletonFour />,
      className:
        "col-span-1 lg:col-span-2 border-b lg:border-b-0 lg:border-r dark:border-neutral-800",
      link: "/news",
    },
    {
      title: "Хасидут с кофе ☕",
      description:
        "Ежедневные утренние эфиры в нашем Telegram. Заряжайтесь мудростью Торы на весь день.",
      skeleton: <SkeletonTwo />,
      className: "col-span-1 lg:col-span-2 dark:border-neutral-800",
      link: "https://t.me/menorah_rishon",
    },
  ];

  return (
    <div className="relative z-20 py-10 overflow-hidden">
      <Heading as="h2">Всё для резидентов общины</Heading>
      <Subheading className="text-center">
        От ежедневных уроков Торы до заказа духовных услуг — вся жизнь Menorah
        Center в одном удобном пространстве.
      </Subheading>

      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-6 mt-12">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              className={feature.className}
              link={feature.link}
            >
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
        <GridLineHorizontal style={{ top: 0, left: "-10%", width: "120%" }} />
        <GridLineHorizontal
          style={{ bottom: 0, left: "-10%", width: "120%" }}
        />
        <GridLineVertical style={{ top: "-10%", right: 0, height: "120%" }} />
        <GridLineVertical style={{ top: "-10%", left: 0, height: "120%" }} />
      </div>
    </div>
  );
};

const FeatureCard = ({
  children,
  className,
  link,
}: {
  children?: React.ReactNode;
  className?: string;
  link: string;
}) => {
  return (
    <Link
      href={link}
      className={cn(
        `p-4 sm:p-8 relative overflow-hidden group hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors block`,
        className,
      )}
    >
      {children}
    </Link>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Heading
      as="h3"
      size="sm"
      className="text-left group-hover:text-[#FFB800] transition-colors relative z-10"
    >
      {children}
    </Heading>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Subheading className="text-left max-w-sm mx-0 lg:text-sm my-2 relative z-10">
      {children}
    </Subheading>
  );
};

// 🔥 РАСШИРЕННЫЙ СПИСОК УСЛУГ (Теперь 5 пунктов для заполнения высоты)
const SkeletonServices = () => {
  const servicesList = [
    { text: "Проверка тфилина и мезуз", icon: FileCheck },
    { text: "Консультация раввина", icon: MessageCircle },
    { text: "Бар-мицва и Бат-мицва", icon: BookOpen },
    { text: "Освящение нового дома", icon: Home },
    { text: "Организация Хупы", icon: HeartHandshake },
  ];

  return (
    <div className="h-full w-full min-h-[160px] flex flex-col justify-center relative mt-6 rounded-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 to-neutral-100/50 dark:from-neutral-900 dark:to-neutral-950/50 rounded-2xl border border-neutral-100 dark:border-neutral-800/80" />

      <div className="relative z-10 w-full px-4 sm:px-6 flex flex-col gap-2.5 py-4">
        {servicesList.map((service, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm transition-colors group-hover:border-neutral-200 dark:group-hover:border-neutral-700"
          >
            <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-500 shrink-0">
              <service.icon size={14} />
            </div>
            <span className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {service.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Эффектный компонент для Menorah Kids
const SkeletonKids = () => {
  // 🔥 ДОБАВИЛИ СОСТОЯНИЕ МОНТИРОВАНИЯ
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="h-full w-full min-h-[160px] flex items-center justify-center relative mt-6 rounded-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500 bg-neutral-50/50 dark:bg-neutral-900/20">
      {/* 🔥 АНИМАЦИИ ЗАПУСКАЮТСЯ ТОЛЬКО ПОСЛЕ ПОЛНОЙ ЗАГРУЗКИ */}
      {isMounted && (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl"
          />

          <div className="relative z-10 flex items-center justify-center gap-4 sm:gap-6">
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-300 shadow-[0_10px_20px_rgba(59,130,246,0.3)] border-t border-l border-white/40 flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute top-1 left-2 w-4 h-4 bg-white/60 rounded-full blur-[2px]" />
            </motion.div>

            <motion.div
              animate={{ y: [0, 15, 0], rotate: [0, 15, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-[#FFB800] to-orange-400 shadow-[0_10px_25px_rgba(255,184,0,0.4)] border-t border-l border-white/50 flex items-center justify-center relative overflow-hidden z-10"
              style={{ borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%" }}
            >
              <div className="absolute top-2 left-3 w-6 h-6 bg-white/70 rounded-full blur-[3px]" />
              <Star
                className="text-white/80 w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md"
                fill="currentColor"
              />
            </motion.div>

            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, -20, 0] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-pink-500 to-purple-400 shadow-[0_10px_20px_rgba(236,72,153,0.3)] border-t border-l border-white/40 rounded-xl flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute top-1 left-1.5 w-3 h-3 bg-white/60 rounded-full blur-[2px]" />
            </motion.div>
          </div>

          <motion.div
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
            className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_3px_rgba(255,184,0,0.8)]"
          />
          <motion.div
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
            className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-white rounded-full shadow-[0_0_12px_4px_rgba(59,130,246,0.6)]"
          />
          <motion.div
            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
            className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_2px_rgba(236,72,153,0.6)]"
          />
        </>
      )}
    </div>
  );
};
