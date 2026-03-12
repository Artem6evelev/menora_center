"use client";

import { useState } from "react";
import Link from "next/link";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth, UserButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { NavBarItem } from "./navbar-item";
import { NavDropdown } from "./nav-dropdown";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ZmanimWidget } from "@/components/shared/zmanim-widget";
import type { NavItem } from "./index";
import { useTranslations } from "next-intl";

interface DesktopNavbarProps {
  navItems: NavItem[];
}

export const DesktopNavbar = ({ navItems }: DesktopNavbarProps) => {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const t = useTranslations("Navigation");

  // 1. ИНИЦИАЛИЗИРУЕМ ХУК АВТОРИЗАЦИИ
  const { isLoaded, isSignedIn } = useAuth();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 10);
  });

  return (
    <header
      className={cn(
        "hidden lg:flex fixed top-0 left-0 right-0 z-[100] w-full items-center transition-all duration-300",
        scrolled
          ? "h-16 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-border/10 shadow-sm"
          : "h-20 bg-transparent border-b border-transparent",
      )}
    >
      <div className="w-full max-w-[1600px] mx-auto px-6 flex items-center justify-between h-full">
        {/* 1. ЛЕВАЯ ЧАСТЬ: Логотип */}
        <div className="flex shrink-0 w-[200px]">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo className={cn("transition-all", scrolled ? "h-7" : "h-9")} />
          </Link>
        </div>

        {/* 2. ЦЕНТР: Меню */}
        <nav className="flex-1 flex items-center justify-center gap-1 px-4">
          {navItems.map((item, idx) => {
            if (item.special) return null;

            if (item.items) {
              return (
                <NavDropdown key={idx} label={item.title} items={item.items} />
              );
            }

            if (item.link) {
              return (
                <NavBarItem key={item.link} href={item.link}>
                  {item.title}
                </NavBarItem>
              );
            }
            return null;
          })}
        </nav>

        {/* 3. ПРАВАЯ ЧАСТЬ: Инструменты и Действие */}
        <div className="flex shrink-0 items-center justify-end gap-3 w-[200px] xl:w-auto">
          {/* Chai Club */}
          {navItems.map((item) =>
            item.special && item.link ? (
              <Link
                key={item.link}
                href={item.link}
                className="hidden 2xl:block"
              >
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-800/30 whitespace-nowrap transition-colors">
                  ♥ Club
                </span>
              </Link>
            ) : null,
          )}

          {/* Виджеты: Зманим + Язык */}
          <div className="flex items-center bg-secondary/50 rounded-full px-1.5 py-1 border border-border/20 backdrop-blur-sm">
            <ZmanimWidget />
            <div className="w-px h-3 bg-border/40 mx-1" />
            <div className="scale-90 origin-right">
              <LanguageSwitcher />
            </div>
          </div>

          {/* 4. ГЛАВНАЯ КНОПКА (ИСПРАВЛЕННАЯ ЛОГИКА) */}
          <div className="pl-1 flex items-center h-9 min-w-[120px] justify-end">
            {!isLoaded ? (
              // Скелетон во время загрузки состояния Clerk
              <div className="h-9 w-32 bg-neutral-200/50 dark:bg-neutral-800/50 animate-pulse rounded-full" />
            ) : isSignedIn ? (
              // Пользователь ВОШЕЛ в систему
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full h-9 border-blue-200/50 bg-blue-50/50 text-blue-900 hover:bg-blue-100 hover:text-blue-950 font-semibold shadow-sm"
                  >
                    {t("my_community")}
                  </Button>
                </Link>
                <UserButton />{" "}
              </div>
            ) : (
              // Пользователь НЕ ВОШЕЛ (Гость)
              <SignUpButton mode="modal">
                <Button
                  size="sm"
                  className="rounded-full bg-blue-900 hover:bg-blue-800 text-white px-5 h-9 font-bold shadow-md shadow-blue-900/10 transition-transform hover:scale-105"
                >
                  {t("join_community")}
                </Button>
              </SignUpButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
