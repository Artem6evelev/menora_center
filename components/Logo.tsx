"use client";

import Link from "next/link";
import Image from "next/image";

export const Logo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center justify-center outline-none transition-transform active:scale-95 hover:opacity-90"
    >
      {/* Логотип для СВЕТЛОЙ темы (скрывается в темной) */}
      <Image
        src="/logos/menora-logo.svg"
        alt="Menora Center"
        width={180}
        height={60}
        priority
        // h-10 на мобилках, h-12 на планшетах, h-14 на десктопе
        className="h-10 md:h-12 lg:h-14 w-auto object-contain block dark:hidden"
      />

      {/* Логотип для ТЕМНОЙ темы (скрывается в светлой) */}
      <Image
        // Убедись, что у тебя есть версия логотипа со светлым текстом в папке public/logos/
        src="/logos/menora-logo-dark.svg"
        alt="Menora Center"
        width={180}
        height={60}
        priority
        className="h-10 md:h-12 lg:h-14 w-auto object-contain hidden dark:block"
      />
    </Link>
  );
};
