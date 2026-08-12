// app/dashboard/applications/page.tsx
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, events, eventParticipants } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import ApplicationsClient from "@/components/dashboard/applications/application-client";

export default async function ApplicationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Жесткий оверрайд прав, как мы делали ранее
  const role =
    dbUser?.email === "artemdev.isr@gmail.com" ? "superadmin" : dbUser?.role;

  if (role !== "admin" && role !== "superadmin") {
    redirect("/dashboard");
  }

  // Получаем все события
  const allEvents = await db
    .select()
    .from(events)
    .orderBy(desc(events.createdAt));

  // Получаем ВСЕХ участников, чтобы сразу посчитать статистику
  const allParticipants = await db.select().from(eventParticipants);

  // Склеиваем события со статистикой
  const eventsWithStats = allEvents.map((ev) => {
    const parts = allParticipants.filter((p) => p.eventId === ev.id);
    return {
      ...ev,
      totalParticipants: parts.length,
      pendingParticipants: parts.filter((p) => p.status === "pending").length,
    };
  });

  return <ApplicationsClient events={eventsWithStats} />;
}
