"use client";

import { cn } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function NavBarItem({
  children,
  href,
  active,
  className,
}: {
  children: ReactNode;
  href: string;
  active?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = active || pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-center text-[15px] font-semibold leading-none px-5 py-2.5 rounded-full transition-all text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800",
        isActive &&
          "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}
