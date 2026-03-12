import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) return null;

  try {
    const clerkUserId = user.id;

    // 1. Безопасное получение Email
    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress || user.emailAddresses[0]?.emailAddress;

    if (!primaryEmail) {
      console.error("[checkUser] No email found for Clerk user:", clerkUserId);
      return null;
    }

    const fullName =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      "Новый прихожанин";

    // 2. Поиск пользователя с вложенными данными семьи
    // ВАЖНО: Проверь в schema.prisma, называется ли поле familyMember или familyMembers
    const existing = await prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        familyMember: {
          include: { family: true },
        },
      },
    });

    if (existing) {
      // Background update если email изменился в Clerk
      if (existing.email !== primaryEmail) {
        await prisma.user.update({
          where: { clerkUserId },
          data: { email: primaryEmail },
        });
      }
      return existing;
    }

    // 3. Атомарная транзакция создания (User -> Family -> Member)
    // Это гарантирует, что мы не создадим юзера без семьи
    return await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          clerkUserId,
          email: primaryEmail,
        },
      });

      const newFamily = await tx.family.create({
        data: {
          name: `Семья ${user.lastName || user.firstName || "Новая"}`.trim(),
        },
      });

      await tx.familyMember.create({
        data: {
          userId: newUser.id,
          familyId: newFamily.id,
          role: "HEAD", // Глава семьи по умолчанию
          fullName: fullName,
        },
      });

      // Возвращаем полный объект со связями
      return await tx.user.findUnique({
        where: { id: newUser.id },
        include: {
          familyMember: {
            include: { family: true },
          },
        },
      });
    });
  } catch (error) {
    // В продакшене тут должен быть Sentry или LogSnag
    console.error("[checkUser Critical Error]:", error);
    return null;
  }
};
