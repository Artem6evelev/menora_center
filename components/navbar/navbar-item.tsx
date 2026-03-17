"use client";

import { cn } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: ReactNode;
  active?: boolean;
  className?: string;
  target?: "_blank";
};

export function NavBarItem({
  children,
  href,
  active,
  target,
  className,
}: Props) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-center text-[15px] font-semibold leading-none px-5 py-2.5 rounded-full transition-all text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-100/80 dark:hover:bg-neutral-800 dark:hover:text-white",
        (active || pathname === href) &&
          "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white",
        className,
      )}
      target={target}
    >
      {children}
    </Link>
  );
}
