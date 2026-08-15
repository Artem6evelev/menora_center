import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Sidebar from "@/components/dashboard/sidebar";
import NotificationBell from "@/components/dashboard/notification-bell";
import OnboardingForm from "@/components/dashboard/main/onboarding-form";

// 🔥 1. Импортируем наш компонент
import AutoRegister from "@/components/dashboard/auto-register";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const userRole = user?.role || "client";

  // 🛑 БЛОКИРАТОР ДЛЯ НОВЫХ ПОЛЬЗОВАТЕЛЕЙ (ОНБОРДИНГ)
  if (userRole === "client" && (!user || !user.isProfileComplete)) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* 🔥 2. Размещаем авто-регистратор для новых пользователей */}
        <AutoRegister userId={userId} userPhone={user?.phone || ""} />

        <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10 w-full max-w-xl">
          <OnboardingForm userId={userId} />
        </div>
      </div>
    );
  }

  // 🟢 ОБЫЧНЫЙ ВЫВОД ДЛЯ АВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex font-sans">
      {/* 🔥 3. Размещаем авто-регистратор для тех, у кого профиль уже заполнен */}
      <AutoRegister userId={userId} userPhone={user?.phone || ""} />

      <Sidebar userRole={userRole} />

      <main className="flex-1 lg:pl-[280px] w-full min-h-screen flex flex-col transition-all duration-300">
        <nav className="h-[72px] border-b border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-end px-6 lg:px-8 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-2xl sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <NotificationBell userId={userId} />
            <span className="hidden sm:inline-flex items-center text-[10px] font-black px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full uppercase tracking-widest text-neutral-500 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50">
              {userRole}
            </span>
          </div>
        </nav>

        <div className="flex-1 p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
