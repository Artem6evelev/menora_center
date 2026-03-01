"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { filterGroupsByRole, NAV_GROUPS, type UserRole } from "./nav-config";
import { NavItem } from "./nav-item";

type MobileBadges = {
  openKvitels?: number;
};

export function MobileSidebar({
  role,
  badges,
}: {
  role: UserRole;
  badges?: MobileBadges;
}) {
  const [open, setOpen] = React.useState(false);
  const groups = filterGroupsByRole(NAV_GROUPS, role);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden rounded-2xl"
          aria-label="Открыть меню"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[320px] p-3">
        <div className="px-2 py-2">
          <div className="text-sm font-semibold">Меню</div>
          <div className="text-xs text-neutral-500">Навигация по кабинету</div>
        </div>

        <div className="mt-2 space-y-5">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="px-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
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
                      onClick={() => setOpen(false)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-200/60 bg-neutral-50 p-3 text-xs dark:border-neutral-800/60 dark:bg-neutral-950">
          <div className="font-medium">Совет</div>
          <div className="mt-1 text-neutral-500 dark:text-neutral-400">
            На десктопе меню закреплено слева.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
