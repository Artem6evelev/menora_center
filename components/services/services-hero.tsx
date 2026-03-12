"use client";

import { motion } from "framer-motion";
import Balancer from "react-wrap-balancer";

export const ServicesHero = () => {
  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden max-w-4xl mx-auto px-4 sm:px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 mb-8 transform-gpu"
      >
        <span className="text-sm font-semibold text-amber-800 tracking-wide uppercase">
          Еврейский жизненный цикл
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-900 mb-6 transform-gpu will-change-transform"
      >
        <Balancer>
          Сопровождаем вас в{" "}
          <span className="text-blue-600">самые важные моменты</span> жизни
        </Balancer>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="text-lg md:text-xl text-neutral-500 font-medium leading-relaxed transform-gpu will-change-transform"
      >
        <Balancer>
          От рождения до 120 лет. Наша община и раввин помогут организовать
          любое еврейское событие по всем правилам Галахи, красиво и с душой.
        </Balancer>
      </motion.p>
    </section>
  );
};
