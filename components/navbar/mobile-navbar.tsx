"use client";

import { useState, useEffect } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { Link } from "next-view-transitions";
import { cn } from "@/lib/utils";
import { Logo } from "../Logo";
import { ModeToggle } from "../mode-toggle";
import {
  Menu,
  X,
  Newspaper,
  Users,
  CalendarDays,
  BookHeart,
  ScrollText,
} from "lucide-react";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";

const IconMap: any = {
  newspaper: Newspaper,
  users: Users,
  calendardays: CalendarDays,
  bookheart: BookHeart,
  scrolltext: ScrollText,
};

export const MobileNavbar = ({ navItems }: { navItems: any[] }) => {
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const [showBackground, setShowBackground] = useState(false);
  const { isSignedIn } = useAuth();

  useMotionValueEvent(scrollY, "change", (v) => setShowBackground(v > 80));

  // Блокируем скролл страницы, когда открыто мобильное меню
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  return (
    <div
      className={cn(
        "flex justify-between items-center w-full rounded-full px-4 py-2.5 transition-all bg-white dark:bg-neutral-900",
        showBackground && "shadow-md",
      )}
    >
      <Logo />
      <button
        onClick={() => setOpen(true)}
        className="p-1 text-gray-900 dark:text-white transition-transform active:scale-95"
      >
        <Menu className="h-7 w-7" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
            }}
            exit={{
              opacity: 0,
              y: -20,
              scale: 0.98,
              transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
            }}
            // Убрали прозрачность (/98) и блюр, сделали фон полностью плотным
            className="fixed inset-0 bg-white dark:bg-neutral-950 z-[100] flex flex-col h-[100dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-5 shrink-0">
              <Logo />
              <div className="flex items-center gap-4">
                <ModeToggle />
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full transition-transform active:scale-90"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-8 px-8 py-8 flex-1 text-left">
              {navItems.map((item: any, idx: number) => (
                <div key={idx} className="w-full text-left">
                  {item.children ? (
                    <div className="flex flex-col space-y-4 text-left">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-2">
                        {item.title}
                      </span>
                      <div className="flex flex-col space-y-2">
                        {item.children.map((child: any, cIdx: number) => {
                          const Icon = IconMap[child.icon] || Newspaper;
                          return (
                            <Link
                              key={cIdx}
                              href={child.link}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
                            >
                              <div className="bg-[#FFB800]/10 p-2.5 rounded-xl text-[#FFB800]">
                                <Icon size={24} />
                              </div>
                              <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                {child.title}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.link}
                      onClick={() => setOpen(false)}
                      className="text-2xl font-bold text-gray-800 dark:text-gray-200 pl-2 block transition-colors hover:text-[#FFB800]"
                    >
                      {item.title}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Кнопки входа внизу */}
            <div className="p-8 flex flex-col gap-4 mt-auto shrink-0 border-t border-gray-100 dark:border-neutral-800/50">
              {!isSignedIn ? (
                <SignUpButton mode="modal">
                  <button className="w-full bg-[#FFB800] py-5 rounded-2xl font-bold text-lg text-black hover:bg-orange-500 transition-colors">
                    Регистрация
                  </button>
                </SignUpButton>
              ) : (
                <div className="flex justify-between items-center bg-gray-50 dark:bg-neutral-900 p-4 rounded-3xl border border-gray-100 dark:border-neutral-800">
                  <UserButton />
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="bg-[#FFB800] px-6 py-2.5 rounded-xl font-bold text-sm text-black hover:bg-orange-500 transition-colors"
                  >
                    Кабинет
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
