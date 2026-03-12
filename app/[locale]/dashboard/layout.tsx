import { checkUser } from "@/lib/check-user";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/dashboard/navbar";
import { getSidebarBadges } from "@/lib/dashboard/get-sidebar-bages";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await checkUser();
  if (!user) return redirect("/");

  // Если getSidebarBadges требует userId из Clerk:
  const badges = await getSidebarBadges(user.id);

  // ✅ вычисляем
  const isAdmin = Boolean(user.isAdmin);
  const role = isAdmin ? "ADMIN" : "USER";

  return (
    <div className="h-full relative">
      {/* SIDEBAR */}
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
        <Sidebar role={role} badges={badges} />
      </div>

      {/* MAIN */}
      <main className="md:pl-72 h-full bg-neutral-50 dark:bg-neutral-950">
        {/* ✅ ВОТ ТУТ главное изменение */}
        <Navbar role={role} badges={badges} isAdmin={isAdmin} />
        <div className="p-4 md:p-8 h-[calc(100vh-80px)] overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
