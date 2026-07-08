// app/actions/author-profile.actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { authorProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateAuthorProfile(data: any) {
  const { userId } = await auth();
  if (!userId) throw new Error("Не авторизован");

  try {
    await db
      .update(authorProfiles)
      .set({
        shortBio: data.shortBio,
        donationLink: data.donationLink,
        websiteUrl: data.websiteUrl,
        facebookUrl: data.facebookUrl,
        instagramUrl: data.instagramUrl,
        youtubeUrl: data.youtubeUrl,
        telegramUrl: data.telegramUrl,
        updatedAt: new Date(),
      })
      .where(eq(authorProfiles.userId, userId));

    // Сбрасываем кэш, чтобы изменения сразу появились на публичной странице
    revalidatePath("/dashboard/author-profile");
    revalidatePath(`/authors/${data.slug}`);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Ошибка при сохранении профиля" };
  }
}
