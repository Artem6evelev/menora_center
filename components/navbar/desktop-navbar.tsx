"use client";

import { useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { Link } from "next-view-transitions";
import { cn } from "@/lib/utils";
import { Logo } from "../Logo";
import { NavBarItem } from "./navbar-item";
import { ModeToggle } from "../mode-toggle";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import {
  ChevronDown,
  Newspaper,
  Users,
  CalendarDays,
  BookHeart,
  ScrollText,
} from "lucide-react";

// Словарь иконок (Клиентская часть знает, как их рисовать)
const IconMap: Record<string, any> = {
  newspaper: Newspaper,
  users: Users,
  calendardays: CalendarDays,
  bookheart: BookHeart,
  scrolltext: ScrollText,
};

const NavItemWithDropdown = ({ item }: { item: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!item.children)
    return <NavBarItem href={item.link}>{item.title}</NavBarItem>;

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
            "w-4 h-4 transition-transform opacity-50",
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
            className="absolute top-full left-1/2 -translate-x-1/2 pt-5 w-[700px] z-50"
          >
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-neutral-800 p-6 flex gap-6 text-left">
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3 mb-2">
                  Навигация
                </span>
                {item.children.map((child: any, idx: number) => {
                  const Icon = IconMap[child.icon] || Newspaper;
                  return (
                    <Link
                      key={idx}
                      href={child.link}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-all group"
                    >
                      <div className="text-[#FFB800] bg-[#FFB800]/10 p-2 rounded-xl group-hover:scale-110 transition-transform">
                        <Icon size={20} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-[#FFB800] transition-colors">
                          {child.title}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 leading-tight line-clamp-1">
                          {child.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {item.featured && (
                <Link
                  href={item.featured.link}
                  className="w-[260px] shrink-0 bg-gray-50 dark:bg-neutral-800/30 rounded-2xl overflow-hidden border border-gray-100/50 dark:border-neutral-700/30 flex flex-col group"
                >
                  <div className="h-36 overflow-hidden relative bg-neutral-200">
                    <img
                      src={item.featured.image}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-center bg-white dark:bg-neutral-800/50">
                    <div className="text-[10px] font-bold text-[#FFB800] uppercase mb-1">
                      {item.featured.tag}
                    </div>
                    <div className="font-bold text-sm leading-snug text-gray-900 dark:text-gray-100 line-clamp-2">
                      {item.featured.title}
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DesktopNavbar = ({ navItems }: { navItems: any[] }) => {
  const { scrollY } = useScroll();
  const [showBackground, setShowBackground] = useState(false);
  const { isSignedIn } = useAuth();

  useMotionValueEvent(scrollY, "change", (v) => setShowBackground(v > 80));

  return (
    <div
      className={cn(
        "w-full flex justify-between px-5 py-3 rounded-full transition-all duration-300",
        showBackground &&
          "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg shadow-lg border border-neutral-200 dark:border-neutral-800",
      )}
    >
      <div className="flex gap-8 items-center z-10">
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
            <SignInButton mode="modal">
              <button className="font-bold text-[15px] px-4 py-2 text-gray-700 dark:text-gray-300">
                Войти
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="bg-[#FFB800] text-gray-900 font-bold rounded-full px-7 py-2.5 text-[15px]">
                Регистрация
              </button>
            </SignUpButton>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="font-bold text-[15px] px-5 py-2.5 bg-[#FFB800] text-gray-900 rounded-full"
            >
              Кабинет
            </Link>
            <UserButton
              appearance={{ elements: { userButtonAvatarBox: "w-10 h-10" } }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
