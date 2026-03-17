"use client";

import { Logo } from "../Logo";
import { NavBarItem } from "./navbar-item";
import {
  useMotionValueEvent,
  useScroll,
  motion,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link } from "next-view-transitions";
import { ModeToggle } from "../mode-toggle";
import { ChevronDown } from "lucide-react";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";

type Props = {
  navItems: any[];
};

const NavItemWithDropdown = ({ item }: { item: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!item.children) {
    return <NavBarItem href={item.link}>{item.title}</NavBarItem>;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <NavBarItem href={item.link} className="flex items-center gap-1.5">
        {item.title}
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-300 opacity-50",
            isOpen && "rotate-180",
          )}
        />
      </NavBarItem>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full left-1/2 -translate-x-1/2 pt-5 w-[700px] z-50"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-neutral-800 p-6 flex gap-6 overflow-hidden">
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3 mb-2">
                  Навигация
                </span>
                {item.children.map((child: any, idx: number) => {
                  const Icon = child.icon;
                  return (
                    <Link
                      key={idx}
                      href={child.link}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-all duration-300 group"
                    >
                      <div className="text-[#FFB800] opacity-90 group-hover:opacity-100 transition-opacity bg-[#FFB800]/10 p-2 rounded-xl">
                        <Icon size={20} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-[#1E3A8A] dark:group-hover:text-[#FFB800] transition-colors">
                          {child.title}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">
                          {child.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {item.featured && (
                <div className="w-[260px] shrink-0 bg-gray-50 dark:bg-neutral-800/30 rounded-2xl overflow-hidden flex flex-col group border border-gray-100/50 dark:border-neutral-700/30 relative">
                  <div className="h-36 overflow-hidden relative">
                    <img
                      src={item.featured.image}
                      alt={item.featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-center bg-white dark:bg-neutral-800/50 z-10 relative">
                    <div className="text-[10px] font-bold tracking-widest text-[#FFB800] uppercase mb-1.5">
                      {item.featured.tag}
                    </div>
                    <div className="font-bold text-sm leading-snug text-gray-900 dark:text-gray-100 group-hover:text-[#1E3A8A] transition-colors">
                      {item.featured.title}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DesktopNavbar = ({ navItems }: Props) => {
  const { scrollY } = useScroll();
  const [showBackground, setShowBackground] = useState(false);
  const { isSignedIn } = useAuth();

  useMotionValueEvent(scrollY, "change", (value) => {
    setShowBackground(value > 80);
  });

  return (
    <div
      className={cn(
        "w-full flex relative justify-between px-5 py-3 rounded-full bg-transparent transition-all duration-300",
        showBackground &&
          "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg shadow-lg dark:shadow-[0px_-2px_0px_0px_var(--neutral-800),0px_2px_0px_0px_var(--neutral-800)]",
      )}
    >
      <AnimatePresence>
        {showBackground && (
          <motion.div
            key={String(showBackground)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 h-full w-full bg-white/50 dark:bg-neutral-800 pointer-events-none rounded-full"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-row gap-8 items-center z-10">
        <Logo />
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavItemWithDropdown key={item.title} item={item} />
          ))}
        </div>
      </div>

      <div className="flex space-x-3 items-center z-10">
        <ModeToggle />

        {!isSignedIn ? (
          <>
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="font-bold text-[15px] px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer">
                Войти
              </button>
            </SignInButton>
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="bg-[#FFB800] hover:bg-[#E5A600] text-gray-900 font-bold rounded-full px-7 py-2.5 shadow-lg shadow-[#FFB800]/30 transition-all active:scale-95 cursor-pointer text-[15px]">
                Регистрация
              </button>
            </SignUpButton>
          </>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="font-bold text-[15px] px-5 py-2.5 bg-[#FFB800] hover:bg-[#E5A600] text-gray-900 rounded-full transition-colors mr-2 shadow-lg shadow-[#FFB800]/20"
            >
              Кабинет
            </Link>
            <div className="rounded-full p-[2px] bg-[#FFB800] shadow-sm shadow-[#FFB800]/20 flex items-center justify-center">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10", // <-- Задаем нужный размер здесь
                  },
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
