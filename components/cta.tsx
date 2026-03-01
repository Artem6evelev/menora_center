"use client";
import React from "react";
import Balancer from "react-wrap-balancer";
import Link from "next/link";
import { Button } from "./button";

export const CTA = () => {
  return (
    <section className="py-12 md:py-20 lg:py-32 w-full overflow-hidden relative z-30">
      <div className="bg-white dark:bg-black px-4 md:px-8">
        <div className="mx-auto w-full relative z-20 max-w-5xl bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="relative px-6 py-12 md:py-20 lg:px-20 text-center">
            {/* Текстура шума */}
            <div
              className="absolute inset-0 w-full h-full opacity-10 bg-noise fade-vignette"
              style={{
                backgroundImage: "url(/noise.webp)",
                backgroundSize: "30%",
                maskImage: "radial-gradient(#fff,transparent,75%)",
                WebkitMaskImage: "radial-gradient(#fff,transparent,75%)",
              }}
            ></div>

            {/* Золотое свечение */}
            <div
              className="pointer-events-none absolute inset-y-0 right-0 select-none overflow-hidden rounded-2xl"
              style={{
                background:
                  "radial-gradient(circle at 100% 0%, rgba(251, 191, 36, 0.3) 0%, transparent 60%)",
              }}
            ></div>

            {/* Дополнительное свечение для мобильных снизу */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/20 blur-[80px] md:hidden" />

            <div className="relative z-10">
              <h2 className="text-center text-balance mx-auto text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                Станьте частью нашей <br className="hidden sm:block" />
                <span className="text-amber-400">еврейской семьи</span>
              </h2>

              <p className="mt-4 md:mt-6 max-w-[32rem] text-center mx-auto text-sm md:text-base/7 text-blue-100 font-medium">
                <Balancer>
                  Неважно, ищете ли вы знания, духовную поддержку или просто
                  друзей. В Менора Центре вас всегда ждут. Вместе мы делаем этот
                  мир светлее.
                </Balancer>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 md:mt-10 w-full sm:w-auto">
                {/* Кнопка 1: Вступить */}
                <Link href="/join" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-white text-blue-900 hover:bg-blue-50 font-bold px-8 h-12 text-base shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-transform hover:-translate-y-1 rounded-xl">
                    Вступить в общину
                  </Button>
                </Link>

                {/* Кнопка 2: Цдака */}
                <Link href="/donate" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-8 h-12 rounded-xl font-bold text-base text-amber-100 border border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-400 transition-all flex items-center justify-center gap-2">
                    Дать Цдаку <span>❤️</span>
                  </button>
                </Link>
              </div>

              {/* Мелкий текст */}
              <p className="text-center text-blue-200/30 text-[10px] md:text-xs mt-8 md:mt-12 uppercase tracking-widest">
                Ришон ле-Цион • Menorah Center
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
