import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { authorProfiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import AuthorProfileForm from "@/components/dashboard/AuthorProfileForm";
import { PenTool } from "lucide-react";
import { createProfile } from "@/actions/authors.actions"; // Вынесли логику сюда

export default async function AuthorProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let profile = await db.query.authorProfiles.findFirst({
    where: eq(authorProfiles.userId, userId),
    with: { user: true },
  });

  if (!profile) {
    // ВЫЗЫВАЕМ ОТДЕЛЬНЫЙ ACTION ДЛЯ СОЗДАНИЯ
    await createProfile(userId);
    redirect("/dashboard/author-profile"); // Редирект допустим в начале
  }

  return (
    <div className="max-w-3xl mx-auto w-full p-6">
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
          <PenTool size={24} />
        </div>
        <h1 className="text-3xl font-black">Мой профиль Спикера</h1>
      </div>
      <AuthorProfileForm initialData={profile!} />
    </div>
  );
}
