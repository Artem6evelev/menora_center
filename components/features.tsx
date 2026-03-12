"use client";

import React from "react";
import { Heading } from "./heading";
import { Subheading } from "./subheading";
import { cn } from "@/lib/utils";
import { GridLineHorizontal, GridLineVertical } from "./grid-lines";
import { SkeletonOne } from "./skeletons/first";
import { SkeletonTwo } from "./skeletons/second";
import { SkeletonFour } from "./skeletons/fourth";
import { SkeletonThree } from "./skeletons/third";
import { motion } from "framer-motion";

export const Features = () => {
  const features = [
    {
      title: "Праздники и традиции",
      description:
        "Мы создаем атмосферу настоящего праздника. От теплого семейного Шаббата до грандиозных событий на Хануку и Песах.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 lg:col-span-4 border-b border-r border-neutral-200",
    },
    {
      title: "Молодежный клуб",
      description:
        "Пространство для общения, знакомств и энергии. Встречи, поездки и еврейская гордость для студентов и подростков.",
      skeleton: <SkeletonTwo />,
      className: "col-span-1 lg:col-span-2 border-b border-neutral-200",
    },
    {
      title: "Академия знаний",
      description:
        "Ежедневные уроки Торы, женский клуб, курсы и лекции. Мудрость тысячелетий, доступная каждому.",
      skeleton: <SkeletonThree />,
      className:
        "col-span-1 lg:col-span-3 border-r border-neutral-200 lg:border-b-0 border-b",
    },
    {
      title: "Хесед и помощь",
      description:
        "Мы поддерживаем тех, кто нуждается. Продуктовые наборы, помощь пожилым и волонтерские программы.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3",
    },
  ];

  return (
    <section className="relative z-20 py-16 lg:py-32 overflow-hidden bg-white">
      {/* 🚀 PERFORMANCE: Анимация только при появлении на экране, один раз */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="transform-gpu will-change-transform"
      >
        <Heading as="h2">Больше, чем просто синагога</Heading>
        <Subheading className="text-center max-w-2xl mx-auto px-4">
          Menora Center — это экосистема еврейской жизни. Мы объединяем
          духовность, образование и социальную помощь в одном современном
          пространстве.
        </Subheading>
      </motion.div>

      <div className="relative max-w-7xl mx-auto mt-12 px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          {features.map((feature, index) => (
            // 🚀 Появление карточек по очереди
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "p-6 sm:p-8 relative overflow-hidden transform-gpu will-change-transform",
                feature.className,
              )}
            >
              <Heading
                as="h3"
                size="sm"
                className="text-left mb-2 text-neutral-900"
              >
                {feature.title}
              </Heading>
              <Subheading className="text-left max-w-sm mx-0 text-sm my-2 mb-8 text-neutral-500">
                {feature.description}
              </Subheading>
              <div className="h-full w-full">{feature.skeleton}</div>
            </motion.div>
          ))}
        </div>

        {/* Декоративная сетка (Облегченная) */}
        <GridLineHorizontal style={{ top: 0, left: "-10%", width: "120%" }} />
        <GridLineHorizontal
          style={{ bottom: 0, left: "-10%", width: "120%" }}
        />
        <GridLineVertical style={{ top: "-10%", right: 0, height: "120%" }} />
        <GridLineVertical style={{ top: "-10%", left: 0, height: "120%" }} />
      </div>
    </section>
  );
};
