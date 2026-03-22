import Link from "next/link";
import React from "react";
import { Logo } from "./Logo";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = [
    { name: "О нас (Команда)", href: "/about" },
    { name: "Мероприятия", href: "/events" },
    { name: "Новости общины", href: "/news" },
    { name: "Услуги центра", href: "/services" },
    { name: "Личный кабинет", href: "/dashboard" },
  ];

  const legal = [
    { name: "Политика конфиденциальности", href: "/privacy" },
    { name: "Пользовательское соглашение", href: "/terms" },
    { name: "Правила посещения", href: "/rules" },
  ];

  const socials = [
    { name: "Telegram-канал", href: "#" },
    { name: "WhatsApp", href: "#" },
    { name: "YouTube", href: "#" },
  ];

  return (
    <footer className="bg-white dark:bg-neutral-950 pt-20 border-t border-neutral-100 dark:border-neutral-800 overflow-hidden flex flex-col relative">
      <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row justify-between items-start gap-12 w-full pb-16 z-10">
        {/* Левая колонка */}
        <div className="flex flex-col max-w-xs">
          <div className="mb-6">
            <Logo />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
            Единая система управления и платформа для резидентов нашей общины.
            Будьте в центре событий.
          </p>

          <div className="flex flex-col space-y-2">
            <div className="text-sm font-medium text-neutral-400 dark:text-neutral-500">
              &copy; {currentYear} Menorah Center.
              <br />
              Все права защищены.
            </div>

            {/* SEO-блок веб-студии */}
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/60 inline-flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
              <span>Powered by </span>
              <a
                href="https://www.ash-web.studio" // Замени на свой реальный домен
                target="_blank"
                rel="noopener noreferrer developer" // developer - семантический тег для SEO
                className="font-bold text-neutral-700 dark:text-neutral-300 hover:text-[#FFB800] dark:hover:text-[#FFB800] transition-colors"
                title="A.S.H Webstudio - Разработка B2B SaaS и Web-приложений"
              >
                A.S.H Webstudio
              </a>
            </div>
          </div>
        </div>

        {/* Правая часть: Колонки со ссылками */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-10 lg:gap-20 w-full sm:w-auto">
          <div className="flex flex-col space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white mb-2">
              Навигация
            </span>
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="transition-colors text-neutral-500 dark:text-neutral-400 hover:text-[#FFB800] dark:hover:text-[#FFB800] text-sm font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white mb-2">
              Документы
            </span>
            {legal.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="transition-colors text-neutral-500 dark:text-neutral-400 hover:text-[#FFB800] dark:hover:text-[#FFB800] text-sm font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white mb-2">
              Мы в соцсетях
            </span>
            {socials.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="transition-colors text-neutral-500 dark:text-neutral-400 hover:text-[#FFB800] dark:hover:text-[#FFB800] text-sm font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Огромный текст на фоне */}
      <div className="w-full flex justify-center items-end mt-auto pointer-events-none select-none overflow-hidden h-[15vw] relative z-0">
        <p className="absolute bottom-0 text-[20vw] font-black leading-[0.75] bg-clip-text text-transparent bg-gradient-to-b from-neutral-100 dark:from-neutral-900 to-white dark:to-neutral-950 tracking-tighter">
          MENORAH
        </p>
      </div>
    </footer>
  );
};
