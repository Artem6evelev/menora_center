"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type FamilyRole = "HEAD" | "SPOUSE" | "CHILD" | "DEPENDENT";
type CreateInviteResult =
  | { success: true; inviteId: string }
  | { success: false; error: string };

async function getDbUserOrThrow(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new Error(
      "User is not synced in DB. Проверь webhook Clerk / checkUser().",
    );
  }
  return user;
}

function sanitizeTargetRole(input?: string): FamilyRole {
  const v = (input ?? "").toUpperCase();
  if (v === "SPOUSE" || v === "CHILD" || v === "DEPENDENT") return v;
  // никогда не даём выдать HEAD через invite
  return "DEPENDENT";
}

/**
 * 1) Создание семьи (пользователь становится HEAD)
 */
export async function createNewFamily(formData: FormData) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const dbUser = await getDbUserOrThrow(clerkUserId);

    const familyName = String(formData.get("familyName") ?? "").trim();
    if (!familyName) {
      return { success: false, error: "Название семьи обязательно" };
    }

    const cu = await currentUser();
    const fullName = cu
      ? `${cu.firstName || ""} ${cu.lastName || ""}`.trim()
      : "";
    const safeName = fullName || "Глава семьи";

    await prisma.$transaction(async (tx) => {
      // если уже состоит в семье — не создаём новую
      const existing = await tx.familyMember.findUnique({
        where: { userId: dbUser.id },
        select: { id: true },
      });
      if (existing) throw new Error("Вы уже состоите в семье");

      const family = await tx.family.create({
        data: { name: familyName },
        select: { id: true },
      });

      await tx.familyMember.create({
        data: {
          familyId: family.id,
          userId: dbUser.id,
          role: "HEAD",
          fullName: safeName,
        },
      });
    });

    revalidatePath("/[locale]/dashboard/family");
    return { success: true };
  } catch (e: any) {
    console.error("createNewFamily error:", e);
    return { success: false, error: e?.message ?? "Ошибка при создании семьи" };
  }
}

/**
 * 2) Создание инвайта (только HEAD)
 */
export async function createFamilyInvite(
  targetRole?: string,
): Promise<CreateInviteResult> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const dbUser = await getDbUserOrThrow(clerkUserId);

    const member = await prisma.familyMember.findUnique({
      where: { userId: dbUser.id },
      select: { familyId: true, role: true },
    });

    if (!member?.familyId) {
      return { success: false, error: "Сначала создайте семью" } as const;
    }
    if (member.role !== "HEAD") {
      return {
        success: false,
        error: "Приглашать может только глава семьи",
      } as const;
    }

    const safeRole = sanitizeTargetRole(targetRole);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.familyInvite.create({
      data: {
        familyId: member.familyId,
        inviterUserId: dbUser.id,
        targetRole: safeRole,
        maxUses: 1,
        usedCount: 0,
        expiresAt,
      },
      select: { id: true },
    });

    return { success: true, inviteId: invite.id } as const;
  } catch (e: any) {
    console.error("createFamilyInvite error:", e);
    return {
      success: false,
      error: e?.message ?? "Ошибка генерации ссылки",
    } as const;
  }
}

/**
 * 3) Принятие инвайта
 * - работает для зарегистрированных и для новых (после sign-in)
 * - если пользователь уже в другой семье -> "переезд" в семью из инвайта
 * - защита: если он HEAD и в его семье есть другие участники — не даём уйти
 */
export async function acceptFamilyInvite(inviteId: string) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId)
      return { success: false, error: "Необходима авторизация" };

    const dbUser = await getDbUserOrThrow(clerkUserId);

    const cu = await currentUser();
    const fullName = cu
      ? `${cu.firstName || ""} ${cu.lastName || ""}`.trim()
      : "";
    const safeName = fullName || "Новый участник";

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const invite = await tx.familyInvite.findUnique({
        where: { id: inviteId },
        select: {
          id: true,
          familyId: true,
          targetRole: true,
          expiresAt: true,
          revokedAt: true,
          maxUses: true,
          usedCount: true,
        },
      });

      if (!invite) throw new Error("Приглашение не найдено");
      if (invite.revokedAt) throw new Error("Приглашение отозвано");
      if (invite.expiresAt && invite.expiresAt <= now) {
        throw new Error("Срок действия приглашения истёк");
      }
      if (invite.usedCount >= invite.maxUses) {
        throw new Error("Приглашение уже использовано");
      }

      // атомарно увеличиваем usedCount (защита от двойного клика)
      const updated = await tx.familyInvite.update({
        where: { id: inviteId },
        data: { usedCount: { increment: 1 } },
        select: { usedCount: true, maxUses: true },
      });

      if (updated.usedCount > updated.maxUses) {
        throw new Error("Приглашение уже использовано");
      }

      // текущий member пользователя (если есть) — будем переносить
      const existing = await tx.familyMember.findUnique({
        where: { userId: dbUser.id },
        select: { id: true, familyId: true, role: true },
      });

      // если уже в нужной семье — просто обновим роль (опционально)
      if (existing && existing.familyId === invite.familyId) {
        await tx.familyMember.update({
          where: { id: existing.id },
          data: { role: invite.targetRole },
        });
        return;
      }

      // если HEAD в другой семье и там есть другие — запрещаем “свалить”
      if (existing && existing.role === "HEAD") {
        const others = await tx.familyMember.count({
          where: {
            familyId: existing.familyId,
            NOT: { id: existing.id },
          },
        });
        if (others > 0) {
          throw new Error(
            "Вы глава текущей семьи. Сначала назначьте другого главой или удалите участников.",
          );
        }
      }

      // переносим или создаём
      if (existing) {
        await tx.familyMember.update({
          where: { id: existing.id },
          data: {
            familyId: invite.familyId,
            role: invite.targetRole,
          },
        });
      } else {
        await tx.familyMember.create({
          data: {
            familyId: invite.familyId,
            userId: dbUser.id,
            role: invite.targetRole,
            fullName: safeName,
          },
        });
      }

      // если одноразовый — можно “закрыть”
      if (updated.usedCount >= updated.maxUses) {
        await tx.familyInvite.update({
          where: { id: inviteId },
          data: { revokedAt: new Date() },
        });
      }
    });

    revalidatePath("/[locale]/dashboard/family");
    return { success: true };
  } catch (e: any) {
    console.error("acceptFamilyInvite error:", e);
    return {
      success: false,
      error: e?.message ?? "Ошибка принятия приглашения",
    };
  }
}
