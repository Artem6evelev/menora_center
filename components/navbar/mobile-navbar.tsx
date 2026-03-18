"use client";

import { useState } from "react";
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

  return (
    <div
      className={cn(
        "flex justify-between items-center w-full rounded-full px-4 py-2.5 transition-all bg-white dark:bg-neutral-900",
        showBackground &&
          "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md",
      )}
    >
      <Logo />
      <button
        onClick={() => setOpen(true)}
        className="p-1 text-gray-900 dark:text-white"
      >
        <Menu className="h-7 w-7" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 bg-white/98 dark:bg-neutral-950/98 backdrop-blur-xl z-[100] flex flex-col h-screen overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <Logo />
              <div className="flex items-center gap-4">
                <ModeToggle />
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-8 px-8 py-10 flex-1 text-left">
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
                              className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-900"
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
                      className="text-2xl font-bold text-gray-800 dark:text-gray-200"
                    >
                      {item.title}
                    </Link>
                  )}
                </div>
              ))}
            </div>
            {/* Кнопки входа внизу */}
            <div className="p-8 flex flex-col gap-4 mt-auto">
              {!isSignedIn ? (
                <>
                  <SignUpButton mode="modal">
                    <button className="w-full bg-[#FFB800] py-5 rounded-2xl font-bold text-lg">
                      Регистрация
                    </button>
                  </SignUpButton>
                </>
              ) : (
                <div className="flex justify-between items-center bg-gray-50 dark:bg-neutral-900 p-4 rounded-3xl">
                  <UserButton />
                  <Link
                    href="/dashboard"
                    className="bg-[#FFB800] px-6 py-2 rounded-xl font-bold text-sm"
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
