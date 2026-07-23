import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getPendingContent } from "@/actions/moderation.actions";
import ModerationClient from "@/components/dashboard/ModerationClient";

export default async function ModerationPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "superadmin")) {
    redirect("/dashboard");
  }

  const pending = await getPendingContent();

  return (
    <div className="max-w-5xl mx-auto w-full p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black">Модерация контента</h1>
        <p className="text-neutral-500 mt-2">
          Материалы от спикеров, ожидающие проверки перед публикацией.
        </p>
      </div>
      <ModerationClient pendingData={pending} />
    </div>
  );
}
