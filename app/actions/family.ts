"use server";

// ВОТ ЭТИ ИМПОРТЫ РЕШАЮТ ТВОИ ОШИБКИ:
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. ФУНКЦИЯ СОЗДАНИЯ НОВОЙ СЕМЬИ
// ==========================================
export async function createNewFamily(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const familyName = formData.get("familyName") as string;
    if (!familyName || familyName.trim() === "") {
      return { success: false, error: "Название семьи обязательно" };
    }

    const clerkUser = await currentUser();
    const fullName = clerkUser
      ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
        "Глава семьи"
      : "Глава семьи";

    await prisma.$transaction(async (tx) => {
      const newFamily = await tx.family.create({
        data: {
          name: familyName,
        },
      });

      await tx.familyMember.create({
        data: {
          familyId: newFamily.id,
          userId: userId,
          role: "HEAD",
          fullName: fullName,
        },
      });
    });

    revalidatePath("/[locale]/dashboard/family");
    return { success: true };
  } catch (error) {
    console.error("Create family error:", error);
    return { success: false, error: "Ошибка при создании семьи" };
  }
}

// ==========================================
// 2. ФУНКЦИЯ ГЕНЕРАЦИИ ИНВАЙТ-ССЫЛКИ
// ==========================================
export async function createFamilyInvite(targetRole: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const userMember = await prisma.familyMember.findUnique({
      where: { userId: userId },
      select: { familyId: true, role: true },
    });

    if (
      !userMember?.familyId ||
      !["HEAD", "SPOUSE"].includes(userMember.role)
    ) {
      return {
        success: false,
        error: "У вас нет прав для приглашения новых участников",
      };
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newInvite = await prisma.familyInvite.create({
      data: {
        familyId: userMember.familyId,
        targetRole: targetRole,
        inviterId: userId,
        expiresAt: expiresAt,
        isAccepted: false,
      },
    });

    return { success: true, token: newInvite.id };
  } catch (error) {
    console.error("Create family invite error:", error);
    return { success: false, error: "Ошибка при генерации ссылки" };
  }
}

// ДОБАВЬ ЭТО В КОНЕЦ ФАЙЛА app/actions/family.ts

export async function acceptFamilyInvite(tokenId: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Необходима авторизация" };

    // 1. Ищем инвайт
    const invite = await prisma.familyInvite.findUnique({
      where: { id: tokenId },
    });

    if (!invite) return { success: false, error: "Приглашение не найдено" };
    if (invite.isAccepted)
      return { success: false, error: "Приглашение уже было использовано" };
    if (invite.expiresAt < new Date())
      return { success: false, error: "Срок действия приглашения истек" };

    // 2. Проверяем, не состоит ли юзер уже в другой семье
    const existingMember = await prisma.familyMember.findUnique({
      where: { userId: userId },
    });

    if (existingMember) {
      return { success: false, error: "Вы уже состоите в профиле семьи" };
    }

    // 3. Получаем имя пользователя
    const clerkUser = await currentUser();
    const fullName = clerkUser
      ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
        "Новый участник"
      : "Новый участник";

    // 4. ТРАНЗАКЦИЯ: Принимаем инвайт и создаем профиль
    await prisma.$transaction(async (tx) => {
      // Помечаем инвайт как использованный
      await tx.familyInvite.update({
        where: { id: tokenId },
        data: { isAccepted: true },
      });

      // Добавляем юзера в семью с ролью из инвайта
      await tx.familyMember.create({
        data: {
          familyId: invite.familyId,
          userId: userId,
          role: invite.targetRole,
          fullName: fullName,
        },
      });
    });

    revalidatePath("/[locale]/dashboard/family");
    return { success: true };
  } catch (error) {
    console.error("Accept invite error:", error);
    return { success: false, error: "Системная ошибка при добавлении в семью" };
  }
}
