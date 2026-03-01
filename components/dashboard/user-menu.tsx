"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user } = useUser();

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:block text-right">
        <div className="text-sm font-medium text-neutral-900 dark:text-white leading-tight">
          {user?.firstName || user?.username || "Пользователь"}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          {user?.primaryEmailAddress?.emailAddress || ""}
        </div>
      </div>

      <div
        className={cn(
          "rounded-2xl p-1",
          "bg-white/60 ring-1 ring-black/5 shadow-sm",
          "dark:bg-neutral-900/50 dark:ring-white/10",
        )}
      >
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
            },
          }}
        />
      </div>
    </div>
  );
}
