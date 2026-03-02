import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Ensures the currently authenticated Clerk user exists in our DB (synced via `clerkUserId`).
 * Also ensures a default Family + FamilyMember(HEAD) exists on first sync.
 */
export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const clerkUserId = user.id;

    // Prefer primary email if available
    const primaryEmail =
      user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress;

    // Our schema requires email to be present
    if (!primaryEmail) {
      console.error(
        "checkUser: missing primary email for Clerk user",
        clerkUserId,
      );
      return null;
    }

    const fullName =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      "Новый прихожанин";

    // 1) Find user by clerkUserId (NOT by id)
    const existing = await prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        familyMember: {
          include: {
            family: true,
          },
        },
      },
    });

    if (existing) {
      // keep email up-to-date (optional but useful)
      if (existing.email !== primaryEmail) {
        await prisma.user.update({
          where: { clerkUserId },
          data: { email: primaryEmail },
        });
      }
      return existing;
    }

    // 2) Fallback: webhook might not have run yet.
    // Create user + default family + HEAD member atomically.
    const created = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          clerkUserId,
          email: primaryEmail,
        },
        select: { id: true },
      });

      const family = await tx.family.create({
        data: {
          name:
            `Семья ${user.lastName || user.firstName || ""}`.trim() || "Семья",
        },
        select: { id: true },
      });

      await tx.familyMember.create({
        data: {
          userId: createdUser.id,
          familyId: family.id,
          role: "HEAD",
          fullName,
        },
      });

      return createdUser;
    });

    return await prisma.user.findUnique({
      where: { id: created.id },
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
