"use client";

import { motion } from "framer-motion";
import Balancer from "react-wrap-balancer";
import Image from "next/image";

export const AboutHero = () => {
  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col items-center text-center">
        {/* Бейдж */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-8 transform-gpu"
        >
          <span className="text-sm font-semibold text-blue-800 tracking-wide uppercase">
            Наша история
          </span>
        </motion.div>

        {/* Заголовок */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 mb-6 transform-gpu will-change-transform"
        >
          <Balancer>
            Строим общину, где <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
              каждый чувствует себя дома
            </span>
          </Balancer>
        </motion.h1>

        {/* Описание */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto font-medium leading-relaxed mb-16 transform-gpu will-change-transform"
        >
          <Balancer>
            Menora Center открыл свои двери с простой, но мощной идеей:
            еврейство должно быть радостным, доступным и объединяющим. Мы не
            просто синагога, мы — большая семья.
          </Balancer>
        </motion.p>

        {/* Главное фото общины (LCP Оптимизация) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl aspect-video relative rounded-3xl overflow-hidden shadow-2xl border border-neutral-100 transform-gpu will-change-transform"
        >
          <Image
            src="/images/about-community.webp" // 🚀 Локальный WebP
            alt="Община Менора Центр"
            fill
            priority
            fetchPriority="high"
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1024px"
          />
          {/* Легкий градиент поверх фото для премиальности */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
};
