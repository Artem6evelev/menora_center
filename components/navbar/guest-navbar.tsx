"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "../Logo";
import GoogleButton from "@/components/community/google-button";
import { registrationUrl, safeReturnTo } from "@/lib/community/policy";
export default function GuestNavbar() {
  const path = usePathname();
  const event = /^\/events\/[^/]+$/.test(path);
  const target = safeReturnTo(path, "/dashboard");
  return <nav aria-label="Вход в общину" className="fixed top-4 inset-x-0 z-50 mx-auto w-[95%] max-w-7xl rounded-[24px] sm:rounded-full bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 shadow-sm px-3 sm:px-5 py-3 flex items-center justify-between gap-3">
    <div className="shrink-0 [&_img]:h-7 sm:[&_img]:h-10 lg:[&_img]:h-14"><Logo /></div>
    {!event && <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm [&_button]:px-3 [&_button]:py-3 sm:[&_button]:px-5 sm:[&_button]:py-4"><div className="max-w-28"><GoogleButton returnTo={target} label="Войти" /></div>
      <Link href={registrationUrl(target)} className="font-bold rounded-2xl sm:rounded-full bg-[#FFB800] px-3 sm:px-6 py-3 sm:py-4 text-black">Регистрация</Link>
    </div>}
  </nav>;
}
