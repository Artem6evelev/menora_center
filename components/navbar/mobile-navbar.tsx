"use client";

import { cn } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "../Logo";
import {
  useMotionValueEvent,
  useScroll,
  AnimatePresence,
  motion,
} from "framer-motion";
import { ModeToggle } from "../mode-toggle";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";

export const MobileNavbar = ({ navItems }: any) => {
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const [showBackground, setShowBackground] = useState(false);

  const { isSignedIn } = useAuth();

  useMotionValueEvent(scrollY, "change", (value) => {
    if (value > 80) {
      setShowBackground(true);
    } else {
      setShowBackground(false);
    }
  });

  return (
    <div
      className={cn(
        "flex justify-between bg-white dark:bg-neutral-900 items-center w-full rounded-full px-4 py-2.5 transition-all duration-300",
        showBackground &&
          "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md dark:shadow-[0px_-2px_0px_0px_var(--neutral-800),0px_2px_0px_0px_var(--neutral-800)]",
      )}
    >
      <Logo />

      <button
        onClick={() => setOpen(true)}
        className="p-1 text-gray-900 dark:text-white active:scale-95 transition-transform"
      >
        <Menu className="h-7 w-7" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl z-[100] flex flex-col h-[100dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between w-full px-6 py-5">
              <Logo />
              <div className="flex items-center space-x-4">
                <ModeToggle />
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 bg-gray-100/50 dark:bg-neutral-800/50 rounded-full text-gray-900 dark:text-white hover:bg-gray-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6 px-8 py-6 flex-1">
              {navItems.map((navItem: any, idx: number) => (
                <div key={`link-group-${idx}`} className="w-full">
                  {navItem.children && navItem.children.length > 0 ? (
                    <div className="flex flex-col space-y-4">
                      <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-2">
                        {navItem.title}
                      </span>

                      <div className="flex flex-col space-y-2">
                        {navItem.children.map((child: any, cIdx: number) => {
                          const Icon = child.icon;
                          return (
                            <Link
                              key={`child-${cIdx}`}
                              href={child.link}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-4 group p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors"
                            >
                              <div className="bg-[#FFB800]/10 p-2.5 rounded-xl text-[#FFB800]">
                                <Icon size={22} strokeWidth={1.5} />
                              </div>
                              <span className="text-xl font-bold text-gray-800 dark:text-gray-200 group-hover:text-[#1E3A8A] transition-colors">
                                {child.title}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={navItem.link}
                      onClick={() => setOpen(false)}
                      className="block px-2 py-1"
                    >
                      <span className="text-2xl font-bold text-gray-800 dark:text-gray-200 hover:text-[#1E3A8A] transition-colors">
                        {navItem.title}
                      </span>
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col w-full gap-3 px-8 pb-10 mt-auto">
              {!isSignedIn ? (
                <>
                  <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                    <button
                      onClick={() => setOpen(false)}
                      className="w-full bg-[#FFB800] hover:bg-[#E5A600] text-gray-900 font-bold rounded-2xl py-6 text-lg shadow-lg shadow-[#FFB800]/30 transition-all cursor-pointer"
                    >
                      Регистрация
                    </button>
                  </SignUpButton>

                  <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                    <button
                      onClick={() => setOpen(false)}
                      className="w-full py-6 text-lg font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      Войти
                    </button>
                  </SignInButton>
                </>
              ) : (
                <div className="flex items-center justify-between p-[2px] rounded-3xl bg-[#FFB800] shadow-lg shadow-[#FFB800]/20 overflow-hidden">
                  <div className="flex items-center justify-between w-full bg-white dark:bg-neutral-900 p-4 rounded-3xl">
                    <div className="flex items-center gap-3">
                      <UserButton />
                      <span className="font-bold text-gray-900 dark:text-white">
                        Мой профиль
                      </span>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="bg-[#FFB800] hover:bg-[#E5A600] text-gray-900 font-bold rounded-xl px-5 py-2.5 transition-colors text-sm shadow-md shadow-[#FFB800]/20"
                    >
                      В кабинет
                    </Link>
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
