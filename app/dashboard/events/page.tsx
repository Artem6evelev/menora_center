import { getEvents, getEventCategories } from "@/actions/event";
import EventsClient from "@/components/dashboard/events/event-client";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function EventsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const eventsData = await getEvents();
  const categories = await getEventCategories();

  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const isAdmin =
    dbUser[0]?.role === "admin" || dbUser[0]?.role === "superadmin";

  return (
    <EventsClient
      initialEvents={eventsData}
      categories={categories}
      isAdmin={isAdmin}
    />
  );
}
