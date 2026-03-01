"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { filterGroupsByRole, NAV_GROUPS, type UserRole } from "./nav-config";
import { NavItem } from "./nav-item";

type SidebarBadges = {
  openKvitels?: number;
};

export function Sidebar({
  role,
  badges,
}: {
  role: UserRole;
  badges?: SidebarBadges;
}) {
  const groups = filterGroupsByRole(NAV_GROUPS, role);

  return (
    <aside className="h-full border-r border-neutral-200/60 bg-neutral-50/80 backdrop-blur-xl dark:border-neutral-800/60 dark:bg-neutral-950/40">
      <div className="flex h-full flex-col px-3 py-4">
        {/* Brand */}
        <Link
          href="/dashboard"
          className={cn(
            "mb-4 flex items-center gap-2 rounded-2xl px-3 py-3",
            "bg-white/60 ring-1 ring-black/5 shadow-sm",
            "dark:bg-neutral-900/50 dark:ring-white/10",
          )}
        >
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
            <span className="text-sm font-semibold">AO</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-neutral-900 dark:text-white">
              Am Olam
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Dashboard
            </div>
          </div>
        </Link>

        {/* Groups */}
        <nav className="flex-1 space-y-5">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                {group.title}
              </div>

              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const badgeValue =
                    item.badgeKey === "openKvitels"
                      ? (badges?.openKvitels ?? 0)
                      : undefined;

                  return (
                    <NavItem
                      key={item.href}
                      item={item}
                      badge={
                        badgeValue && badgeValue > 0 ? badgeValue : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer card */}
        <div
          className={cn(
            "mt-4 rounded-2xl p-3 text-xs",
            "bg-white/60 ring-1 ring-black/5 shadow-sm",
            "dark:bg-neutral-900/50 dark:ring-white/10",
          )}
        >
          <div className="font-medium text-neutral-900 dark:text-white">
            Быстрый доступ
          </div>
          <div className="mt-1 text-neutral-500 dark:text-neutral-400">
            Поддержка, обновления и настройки — в одном месте.
          </div>
          <Link
            href="/settings"
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Открыть настройки
          </Link>
        </div>
      </div>
    </aside>
  );
}
