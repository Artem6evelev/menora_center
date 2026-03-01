import { cn } from "@/lib/utils";
import type { UserRole } from "./nav-config";
import { MobileSidebar } from "./mobile-sidebar";
import { UserMenu } from "./user-menu";
import { Search } from "lucide-react";

export function Navbar({
  role,
  badges,
}: {
  role: UserRole;
  badges?: { openKvitels?: number };
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-20",
        "border-b border-neutral-200/60 bg-neutral-50/70 backdrop-blur-xl",
        "dark:border-neutral-800/60 dark:bg-neutral-950/40",
      )}
    >
      <div className="mx-auto flex h-full items-center justify-between gap-3 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <MobileSidebar role={role} badges={badges} />

          <div className="hidden md:block">
            <div className="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
              Кабинет
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Всё важное — в одном месте
            </div>
          </div>
        </div>

        {/* Fake search */}
        <div className="hidden lg:flex flex-1 max-w-xl">
          <div
            className={cn(
              "flex w-full items-center gap-2 rounded-2xl px-3 py-2",
              "bg-white/60 ring-1 ring-black/5 shadow-sm",
              "dark:bg-neutral-900/50 dark:ring-white/10",
            )}
          >
            <Search className="h-4 w-4 text-neutral-400" />
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Поиск (скоро)
            </div>
          </div>
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
