"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  target?: "_blank";
};

export function NavBarItem({ children, href, target, className }: Props) {
  const pathname = usePathname();
  // Активное состояние, если путь начинается с href (для вложенных страниц)
  // Исключение для главной "/", чтобы она не горела всегда
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      target={target}
      className={cn(
        "relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full",
        isActive
          ? "text-blue-900 dark:text-blue-100 bg-blue-50 dark:bg-blue-900/20 font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
        className,
      )}
    >
      {children}
    </Link>
  );
}
