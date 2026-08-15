// app/dashboard/my-events/page.tsx
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { events, eventParticipants, kidsApplications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import MyEventsClient from "@/components/dashboard/events/my-events-client";

// 🔥 ИСПРАВЛЕННЫЙ ПУТЬ ИМПОРТА

export default async function MyEventsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // 1. Получаем билеты на обычные события
  const myEvents = await db
    .select({
      participant: eventParticipants,
      event: events,
    })
    .from(eventParticipants)
    .innerJoin(events, eq(eventParticipants.eventId, events.id))
    .where(eq(eventParticipants.userId, userId))
    .orderBy(desc(eventParticipants.createdAt));

  // 2. Получаем заявки Menorah Kids
  const myKidsApps = await db
    .select()
    .from(kidsApplications)
    .where(eq(kidsApplications.userId, userId))
    .orderBy(desc(kidsApplications.createdAt));

  return <MyEventsClient myEvents={myEvents} myKidsApps={myKidsApps} />;
}
