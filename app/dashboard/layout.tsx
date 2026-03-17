import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Sidebar from "@/components/dashboard/sidebar"; // Убедись, что путь к новому sider.tsx верный
import NotificationBell from "@/components/dashboard/notification-bell";
import OnboardingForm from "@/components/dashboard/main/onboarding-form";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Пытаемся найти пользователя в нашей базе
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  // Если пользователя еще нет в БД, по умолчанию считаем его клиентом
  const userRole = user?.role || "client";

  // 🛑 БЛОКИРАТОР: Срабатывает ТОЛЬКО для роли "client"
  if (userRole === "client" && (!user || !user.isProfileComplete)) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Добавляем стильную сетку Aceternity на фон онбординга */}
        <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10 w-full max-w-xl">
          <OnboardingForm userId={userId} />
        </div>
      </div>
    );
  }

  // 🟢 ОБЫЧНЫЙ ВЫВОД: Для Админов, Суперадминов и Клиентов с заполненной анкетой
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex font-sans">
      {/* Наш новый умный сайдбар. 
        Обертки больше не нужны, он сам знает, когда быть drawer'ом на мобилке, 
        а когда фиксированным блоком на десктопе. 
      */}
      <Sidebar userRole={userRole} />

      {/* Основной контент */}
      {/* lg:pl-[280px] - отступает ровно на ширину десктопного сайдбара */}
      <main className="flex-1 lg:pl-[280px] w-full min-h-screen flex flex-col transition-all duration-300">
        {/* Верхняя навигационная панель */}
        <nav className="h-[72px] border-b border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-end px-6 lg:px-8 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-2xl sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            <NotificationBell userId={userId} />

            {/* Бейдж роли (скрываем на мобилках, чтобы не мешал, он и так есть в сайдбаре) */}
            <span className="hidden sm:inline-flex items-center text-[10px] font-black px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full uppercase tracking-widest text-neutral-500 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50">
              {userRole}
            </span>
          </div>
        </nav>

        {/* Контейнер для дочерних страниц (dashboard/*) */}
        <div className="flex-1 p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
