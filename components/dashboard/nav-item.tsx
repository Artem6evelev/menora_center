"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem as NavItemType } from "./nav-config";

export function NavItem({
  item,
  onClick,
  badge,
}: {
  item: NavItemType;
  onClick?: () => void;
  badge?: number;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href ||
    (item.href !== "/" && pathname?.startsWith(item.href + "/"));

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
        "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white",
        isActive &&
          "bg-white/70 text-neutral-900 shadow-sm ring-1 ring-black/5 dark:bg-neutral-900/70 dark:text-white dark:ring-white/10",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 transition-colors",
          isActive
            ? "text-neutral-900 dark:text-white"
            : "text-neutral-400 group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-300",
        )}
      />
      <span className="truncate flex-1">{item.label}</span>

      {typeof badge === "number" && (
        <span
          className={cn(
            "min-w-6 px-2 py-0.5 text-[11px] rounded-full text-center font-semibold",
            "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
          )}
        >
          {badge}
        </span>
      )}

      {isActive && (
        <span className="pointer-events-none absolute inset-y-2 left-1 w-1 rounded-full bg-neutral-900/80 dark:bg-white/80" />
      )}
    </Link>
  );
}
