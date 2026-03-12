"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
// Убрали SignedIn/SignedOut, добавили useAuth
import { useAuth, UserButton, SignUpButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { ZmanimWidget } from "@/components/shared/zmanim-widget";
import { cn } from "@/lib/utils";
import type { NavItem } from "./index";
import { useTranslations } from "next-intl";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

interface MobileNavbarProps {
  navItems: NavItem[];
}

export const MobileNavbar = ({ navItems }: MobileNavbarProps) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Navigation");

  // Добавили хук авторизации
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [open]);

  // Хелпер для ссылок
  const RenderLink = ({
    title,
    link,
    special,
    className,
  }: {
    title: string;
    link: string;
    special?: boolean;
    className?: string;
  }) => (
    <Link
      href={link}
      onClick={() => setOpen(false)}
      className={cn(
        "group flex items-center justify-between p-2.5 rounded-lg text-[15px] font-medium transition-all active:scale-[0.98]",
        special
          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-100/50"
          : "hover:bg-muted/50 text-foreground/90",
        className,
      )}
    >
      <span className="flex items-center gap-2.5">
        {special && <Heart className="w-4 h-4 fill-current text-amber-500" />}
        {title}
      </span>
      {!special && (
        <ChevronRight className="w-4 h-4 opacity-10 group-hover:opacity-100 transition-opacity" />
      )}
    </Link>
  );

  return (
    <div className="lg:hidden">
      {/* ШАПКА: Закрепленная (fixed) */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2.5 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-black/5 dark:border-white/10 shadow-sm">
        <Link
          href="/"
          className="flex items-center gap-2 active:scale-95 transition-transform"
        >
          <Logo className="h-6 w-auto text-blue-900" />
        </Link>

        <div className="flex items-center gap-2">
          <div className="scale-[0.85] origin-right">
            <ZmanimWidget />
          </div>
          <div className="w-px h-4 bg-border/40" />
          <div className="scale-[0.85]">
            <LanguageSwitcher />
          </div>
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 -mr-1 text-foreground/80 hover:bg-muted/50 rounded-full transition-all active:scale-90"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* МЕНЮ */}
      <AnimatePresence>
        {open && (
          <>
            {/* Затемнение */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9998]"
            />

            {/* Панель */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-[9999] w-full max-w-[80%] sm:max-w-xs bg-white dark:bg-zinc-950 shadow-2xl flex flex-col h-[100dvh] overflow-y-auto border-l border-border/10"
            >
              <div className="flex flex-col h-full px-5 py-4 bg-white dark:bg-zinc-950">
                {/* Кнопка закрытия */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-full bg-muted/40 hover:bg-muted/70 transition-colors active:scale-90"
                  >
                    <X className="h-5 w-5 text-foreground/70" />
                  </button>
                </div>

                {/* Список ссылок */}
                <motion.nav
                  className="flex flex-col gap-1 flex-1 overflow-y-auto"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {navItems.map((item, idx) => {
                    if (!item.title) return null;

                    // Группа
                    if (item.items) {
                      return (
                        <motion.div
                          key={idx}
                          variants={itemVariants}
                          className="mb-2"
                        >
                          <div className="px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mt-1">
                            {item.title}
                          </div>
                          <div className="flex flex-col gap-0.5 pl-2 border-l border-border/30 ml-2">
                            {item.items.map((subItem) => (
                              <RenderLink
                                key={subItem.link}
                                title={subItem.title}
                                link={subItem.link}
                              />
                            ))}
                          </div>
                        </motion.div>
                      );
                    }

                    // Одиночная ссылка
                    if (item.link) {
                      return (
                        <motion.div key={item.link} variants={itemVariants}>
                          <RenderLink
                            title={item.title}
                            link={item.link}
                            special={item.special}
                          />
                        </motion.div>
                      );
                    }
                    return null;
                  })}
                </motion.nav>

                {/* Нижняя часть с авторизацией */}
                <div className="mt-auto pt-4 flex flex-col gap-3 pb-6 border-t border-border/40 min-h-[120px] justify-end">
                  {!isLoaded ? (
                    // Скелетон загрузки
                    <div className="w-full h-11 bg-muted/50 animate-pulse rounded-xl" />
                  ) : isSignedIn ? (
                    // Авторизованный пользователь
                    <>
                      <div className="flex items-center gap-3 px-1 mb-1">
                        <div className="scale-90 origin-left">
                          {/* Убрали afterSignOutUrl, оставили голый компонент */}
                          <UserButton />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          Вы вошли в систему
                        </span>
                      </div>
                      <Link href="/dashboard" onClick={() => setOpen(false)}>
                        <Button
                          className="w-full h-11 rounded-xl border border-border/60 bg-secondary/30 text-foreground hover:bg-secondary/50 text-[15px] font-medium active:scale-[0.98]"
                          size="lg"
                        >
                          {t("my_community")}
                        </Button>
                      </Link>
                    </>
                  ) : (
                    // Гость
                    <SignUpButton mode="modal">
                      <Button
                        size="lg"
                        className="w-full h-11 text-[15px] rounded-xl bg-blue-900 text-white shadow-lg shadow-blue-900/10 active:scale-[0.98]"
                      >
                        {t("join_community")}
                      </Button>
                    </SignUpButton>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
