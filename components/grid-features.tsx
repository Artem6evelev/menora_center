"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  IconBuildingCommunity,
  IconHeartHandshake,
  IconBook,
  IconCandle,
  IconWoman,
  IconMoodKid,
  IconSoup,
  IconMessageChatbot,
} from "@tabler/icons-react";

export const GridFeatures = () => {
  const features = [
    {
      title: "Открыты для каждого",
      description:
        "Неважно, соблюдаете вы традиции или только начинаете свой путь. Двери нашего центра открыты для всех евреев.",
      icon: <IconBuildingCommunity className="text-blue-500 w-8 h-8" />,
    },
    {
      title: "Поддержка и Хесед",
      description:
        "Мы не оставляем своих в беде. Продуктовая помощь, волонтеры и просто доброе слово в трудную минуту.",
      icon: <IconHeartHandshake className="text-red-500 w-8 h-8" />,
    },
    {
      title: "Образование для всех",
      description:
        "Уроки Торы, лекции по истории, курсы иврита. Знания доступны мужчинам, женщинам и детям любого возраста.",
      icon: <IconBook className="text-indigo-500 w-8 h-8" />,
    },
    {
      title: "Яркие праздники",
      description:
        "Шаббаты, Ханука, Пурим, Песах. Мы умеем веселиться по-еврейски, сохраняя глубину и святость момента.",
      icon: <IconCandle className="text-amber-500 w-8 h-8" />,
    },
    {
      title: "Женский клуб",
      description:
        "Особое пространство для еврейских женщин. Встречи, мастер-классы, общение и вдохновение.",
      icon: <IconWoman className="text-pink-500 w-8 h-8" />,
    },
    {
      title: "Будущее поколения",
      description:
        "Детский сад, воскресная школа и молодежный клуб. Мы передаем традиции нашим детям с любовью.",
      icon: <IconMoodKid className="text-green-500 w-8 h-8" />,
    },
    {
      title: "Кошерная кухня",
      description:
        "Вкусные трапезы, доставка кошерной еды и помощь в организации кошерного быта у вас дома.",
      icon: <IconSoup className="text-orange-500 w-8 h-8" />,
    },
    {
      title: "Связь с Раввином",
      description:
        "Возможность задать личный вопрос, получить совет или благословение в любой жизненной ситуации.",
      icon: <IconMessageChatbot className="text-cyan-500 w-8 h-8" />,
    },
  ];

  return (
    <section className="relative z-10 py-16 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
        {features.map((feature, index) => (
          <Feature key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </section>
  );
};

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    // 🚀 PERFORMANCE: Framer Motion с whileInView.
    // delay вычисляется динамически (index * 0.05), создавая быструю волну.
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className={cn(
        "flex flex-col py-8 px-6 md:py-10 md:px-8 relative group transform-gpu will-change-transform",
        "border-neutral-200 bg-white",

        // --- Логика рамок (очищенная от dark mode) ---
        "border-b last:border-b-0", // Mobile

        // Tablet
        "md:border-r-0 md:even:border-r",
        "md:border-b md:[&:nth-child(n+7)]:border-b-0",

        // Desktop
        "lg:border-none",
        "lg:border-r lg:[&:nth-child(4n)]:border-r-0",
        (index === 0 || index === 4) && "lg:border-l-0", // Убрали левую рамку, так как есть общий контейнер
        index < 4 && "lg:border-b",
      )}
    >
      {/* 🚀 PERFORMANCE: Упрощенный градиент, transition-opacity (дешевая анимация) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute inset-0 h-full w-full bg-gradient-to-t from-blue-50/50 to-transparent pointer-events-none" />

      <div className="mb-4 relative z-10">{icon}</div>

      <div className="text-lg font-bold mb-2 relative z-10 flex items-center">
        {/* Боковая полоска-акцент */}
        <div className="absolute left-0 inset-y-0 h-5 w-1 rounded-r-full bg-neutral-200 group-hover:bg-blue-500 transition-colors duration-300" />

        {/* 🚀 PERFORMANCE: Добавлен transform-gpu, чтобы сдвиг текста не тормозил рендер */}
        <span className="group-hover:translate-x-2 transition-transform duration-300 transform-gpu will-change-transform inline-block text-neutral-900 pl-3">
          {title}
        </span>
      </div>

      <p className="text-sm text-neutral-500 max-w-xs relative z-10 leading-relaxed pl-3">
        {description}
      </p>
    </motion.div>
  );
};
