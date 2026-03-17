import { getEvents } from "@/actions/event";
import ApplicationsClient from "@/components/dashboard/applications/application-client";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function ApplicationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (
    !dbUser.length ||
    (dbUser[0].role !== "admin" && dbUser[0].role !== "superadmin")
  ) {
    redirect("/dashboard");
  }

  const eventsData = await getEvents();
  const plannedEvents = eventsData.map((e) => e.event);

  return <ApplicationsClient events={plannedEvents} />;
}
