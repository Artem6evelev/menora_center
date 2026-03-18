"use client";

import React from "react";
import Balancer from "react-wrap-balancer";
import Link from "next/link";
import { Heart } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-20 md:py-32 w-full overflow-hidden relative z-30">
      <div className="bg-transparent">
        <div className="mx-auto w-full relative z-20 sm:max-w-[40rem] md:max-w-[48rem] lg:max-w-[64rem] xl:max-w-[80rem] bg-gradient-to-br from-neutral-900 to-black sm:rounded-[32px] shadow-2xl">
          <div className="relative -mx-6 sm:mx-0 sm:rounded-[32px] overflow-hidden px-6 md:px-8 border border-neutral-800">
            {/* Текстура шума (оставляем из твоего шаблона) */}
            <div
              className="absolute inset-0 w-full h-full opacity-20 bg-noise fade-vignette [mask-image:radial-gradient(#fff,transparent,75%)]"
              style={{
                backgroundImage: "url(/noise.webp)",
                backgroundSize: "30%",
              }}
            ></div>

            {/* Легкая подсветка в правом верхнем углу */}
            <div
              className="pointer-events-none absolute inset-y-0 right-0 select-none overflow-hidden rounded-2xl"
              style={{
                mask: "radial-gradient(33.875rem 33.875rem at calc(100% - 8.9375rem) 0, white 3%, transparent 70%)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFB800]/20 to-transparent"></div>
            </div>

            <div className="relative px-6 pb-14 pt-20 sm:px-10 sm:pb-20 lg:px-[4.5rem]">
              <h2 className="text-center text-balance mx-auto text-4xl md:text-6xl font-black tracking-tighter text-white mb-6">
                Станьте частью семьи{" "}
                <span className="text-[#FFB800]">Менора</span>
              </h2>
              <p className="max-w-[32rem] text-center mx-auto text-base/6 text-neutral-400 font-medium">
                <Balancer>
                  Зарегистрируйтесь, чтобы получить доступ к расписанию, записи
                  на мероприятия и всем сервисам общины в едином личном
                  кабинете.
                </Balancer>
              </p>

              <div className="relative z-10 mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                {/* 1. Кнопка Регистрации (ведет в дашборд/авторизацию) */}
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <button className="w-full px-10 py-4 bg-[#FFB800] hover:bg-orange-500 text-black font-black uppercase tracking-widest text-sm rounded-full transition-all shadow-lg shadow-[#FFB800]/20">
                    Регистрация
                  </button>
                </Link>

                {/* 2. Кнопка Цдаки (второстепенная, темная со светящейся иконкой) */}
                <Link href="/donate" className="w-full sm:w-auto">
                  <button className="w-full group flex items-center justify-center gap-2 px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-full transition-all backdrop-blur-sm border border-white/10">
                    <Heart
                      size={18}
                      className="text-[#FFB800] group-hover:scale-110 transition-transform"
                    />
                    Сделать Цдаку
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
