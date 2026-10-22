import { requireDashboardFilter } from "@/lib/community/server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import TelegramAudience from "@/components/dashboard/telegram/audience-client";

export default async function TelegramDashboardPage() {
  await requireDashboardFilter();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));

  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "superadmin")) {
    redirect("/dashboard");
  }

  const settings = await db.query.botSettings.findFirst();

  return (
    <TelegramAudience
      settings={{
        notificationGroupId: settings?.notificationGroupId || "",
        eventsTopicId: settings?.eventsTopicId || "",
        servicesTopicId: settings?.servicesTopicId || "",
      }}
    />
  );
}
