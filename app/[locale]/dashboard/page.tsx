import { redirect } from "next/navigation";
import { checkUser } from "@/lib/check-user";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { greetingByTime } from "@/lib/dashboard/time-utils";
import { PulseDashboard } from "@/components/dashboard/pulse";

export default async function DashboardPage() {
  const user = await checkUser();
  if (!user) return redirect("/sign-in");

  const data = await getDashboardData(user.id);

  const greeting = greetingByTime(new Date());
  const displayName =
    data.profile?.firstName || (user.email?.split("@")[0] ?? "друг");

  // пока заглушки — потом подключим реальные
  const jewishDateLabel = "Еврейская дата: скоро подключим";
  const shabbatLabel = "Свечи/Шаббат: скоро подключим";

  return (
    <PulseDashboard
      greeting={greeting}
      displayName={displayName}
      jewishDateLabel={jewishDateLabel}
      shabbatLabel={shabbatLabel}
      data={data}
    />
  );
}
