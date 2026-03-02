"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// helper: получаем DB user (по clerkUserId) и гарантируем что он существует
async function getDbUserOrThrow(clerkUserId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, email: true },
  });
  if (!dbUser) {
    throw new Error(
      "User is not synced to DB. Проверь checkUser() / webhook Clerk.",
    );
  }
  return dbUser;
}

// ==========================================
// 1) СОЗДАНИЕ НОВОЙ СЕМЬИ (HEAD)
// ==========================================
export async function createNewFamily(formData: FormData) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const familyName = String(formData.get("familyName") ?? "").trim();
    if (!familyName) {
      return { success: false, error: "Название семьи обязательно" };
    }

    const dbUser = await getDbUserOrThrow(clerkUserId);

    // имя
    const clerkUser = await currentUser();
    const fullName = clerkUser
      ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim()
      : "";
    const safeName = fullName || "Глава семьи";

    await prisma.$transaction(async (tx) => {
      // если пользователь уже в семье — не создаём новую
      const existingMember = await tx.familyMember.findUnique({
        where: { userId: dbUser.id },
        select: { id: true },
      });
      if (existingMember) {
        throw new Error("Вы уже состоите в профиле семьи");
      }

      const newFamily = await tx.family.create({
        data: { name: familyName },
        select: { id: true },
      });

      await tx.familyMember.create({
        data: {
          familyId: newFamily.id,
          userId: dbUser.id, // ✅ DB user id
          role: "HEAD",
          fullName: safeName,
        },
      });
    });

    revalidatePath("/[locale]/dashboard/family");
    return { success: true };
  } catch (error) {
    console.error("Create family error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Ошибка при создании семьи",
    };
  }
}

// ==========================================
// 2) ГЕНЕРАЦИЯ ИНВАЙТ-ССЫЛКИ (HEAD only)
// ==========================================
export async function createFamilyInvite(targetRole: string) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const dbUser = await getDbUserOrThrow(clerkUserId);

    const userMember = await prisma.familyMember.findUnique({
      where: { userId: dbUser.id }, // ✅ DB user id
      select: { familyId: true, role: true },
    });

    // Рекомендация: приглашать должен только HEAD (упростит безопасность)
    if (!userMember?.familyId || userMember.role !== "HEAD") {
      return {
        success: false,
        error: "У вас нет прав для приглашения новых участников",
      };
    }

    // В новой схеме targetRole — enum FamilyRole (HEAD не даём выдавать)
    const allowedRoles = ["SPOUSE", "CHILD", "DEPENDENT"] as const;
    const safeRole = allowedRoles.includes(targetRole as any)
      ? (targetRole as (typeof allowedRoles)[number])
      : "DEPENDENT";

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newInvite = await prisma.familyInvite.create({
      data: {
        familyId: userMember.familyId,
        inviterUserId: dbUser.id, // ✅ DB user id
        targetRole: safeRole,
        maxUses: 1,
        usedCount: 0,
        expiresAt,
      },
      select: { id: true },
    });

    return { success: true, inviteId: newInvite.id };
  } catch (error) {
    console.error("Create family invite error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Ошибка при генерации ссылки",
    };
  }
}

// ==========================================
// 3) ПРИНЯТИЕ ИНВАЙТА
// ==========================================
export async function acceptFamilyInvite(inviteId: string) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId)
      return { success: false, error: "Необходима авторизация" };

    const dbUser = await getDbUserOrThrow(clerkUserId);

    // если уже в семье — стоп
    const existingMember = await prisma.familyMember.findUnique({
      where: { userId: dbUser.id },
      select: { id: true },
    });
    if (existingMember) {
      return { success: false, error: "Вы уже состоите в профиле семьи" };
    }

    // Имя
    const clerkUser = await currentUser();
    const fullName = clerkUser
      ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim()
      : "";
    const safeName = fullName || "Новый участник";

    await prisma.$transaction(async (tx) => {
      const invite = await tx.familyInvite.findUnique({
        where: { id: inviteId },
      });

      if (!invite) throw new Error("Приглашение не найдено");
      if (invite.revokedAt) throw new Error("Приглашение отозвано");
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        throw new Error("Срок действия приглашения истек");
      }
      if (invite.usedCount >= invite.maxUses) {
        throw new Error("Приглашение уже было использовано");
      }

      // атомарно увеличиваем usedCount
      const updated = await tx.familyInvite.update({
        where: { id: inviteId },
        data: { usedCount: { increment: 1 } },
        select: {
          usedCount: true,
          maxUses: true,
          familyId: true,
          targetRole: true,
        },
      });

      if (updated.usedCount > updated.maxUses) {
        throw new Error("Приглашение уже было использовано");
      }

      await tx.familyMember.create({
        data: {
          familyId: updated.familyId,
          userId: dbUser.id, // ✅ DB user id
          role: updated.targetRole,
          fullName: safeName,
        },
      });

      // если одноразовый — можно закрыть
      if (updated.usedCount >= updated.maxUses) {
        await tx.familyInvite.update({
          where: { id: inviteId },
          data: { revokedAt: new Date() },
        });
      }
    });

    revalidatePath("/[locale]/dashboard/family");
    return { success: true };
  } catch (error) {
    console.error("Accept invite error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Системная ошибка при добавлении в семью",
    };
  }
}
