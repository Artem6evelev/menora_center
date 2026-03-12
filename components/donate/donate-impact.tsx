"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IconSoup, IconBook2, IconCandle } from "@tabler/icons-react";

const impacts = [
  {
    title: "Продуктовая помощь",
    description:
      "Еженедельные наборы базовых продуктов и горячие обеды для пожилых людей и многодетных семей Ришон ле-Циона.",
    icon: <IconSoup className="w-8 h-8 text-rose-500" />,
    color: "bg-rose-50 border-rose-100",
  },
  {
    title: "Еврейское образование",
    description:
      "Поддержка детского сада, воскресной школы и стипендии для студентов программы STARS. Будущее начинается сегодня.",
    icon: <IconBook2 className="w-8 h-8 text-blue-500" />,
    color: "bg-blue-50 border-blue-100",
  },
  {
    title: "Община и Праздники",
    description:
      "Аренда залов, покупка мацы на Песах, меноры на Хануку и проведение красивых общественных Шаббатов для всех желающих.",
    icon: <IconCandle className="w-8 h-8 text-amber-500" />,
    color: "bg-amber-50 border-amber-100",
  },
];

export const DonateImpact = () => {
  return (
    <section className="relative py-16 max-w-7xl mx-auto px-4 sm:px-6 border-t border-neutral-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 transform-gpu"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
          Во что вы инвестируете?
        </h2>
        <p className="text-neutral-500 max-w-2xl mx-auto">
          Община не финансируется государством. Все, что мы делаем, существует
          исключительно благодаря пожертвованиям таких небезразличных людей, как
          вы.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {impacts.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.5,
              delay: index * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-neutral-100 shadow-sm transform-gpu will-change-transform"
          >
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border",
                item.color,
              )}
            >
              {item.icon}
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-3">
              {item.title}
            </h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
