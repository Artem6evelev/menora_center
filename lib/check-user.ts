import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    // 1. Ищем пользователя в нашей новой структуре БД
    // Сразу подтягиваем его профиль участника семьи и саму семью
    const loggedInUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        familyMember: {
          include: {
            family: true,
          },
        },
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    // 2. ФОЛЛБЭК: Если пользователя нет в БД (например, вебхук еще не успел сработать)
    const primaryEmail = user.emailAddresses[0]?.emailAddress;
    const fullName =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      "Новый прихожанин";

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          id: user.id,
          email: primaryEmail,
        },
      });

      const family = await tx.family.create({
        data: {
          name: `Семья ${user.lastName || user.firstName || ""}`.trim(),
        },
      });

      await tx.familyMember.create({
        data: {
          userId: createdUser.id,
          familyId: family.id,
          role: "HEAD",
          fullName: fullName,
        },
      });

      return createdUser;
    });

    // Возвращаем свежесозданного юзера со всеми связями
    return await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        familyMember: {
          include: {
            family: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error in checkUser:", error);
    return null;
  }
};
