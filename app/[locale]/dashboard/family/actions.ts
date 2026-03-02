"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function createInviteAction(): Promise<{ inviteId: string }> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: { familyMember: true },
  });

  if (!user?.familyMember?.familyId) {
    throw new Error("У пользователя нет семьи");
  }

  if (user.familyMember.role !== "HEAD") {
    throw new Error("Только глава семьи может приглашать");
  }

  // TTL: 7 дней
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await prisma.familyInvite.create({
    data: {
      familyId: user.familyMember.familyId,
      inviterUserId: user.id, // ✅ DB user id
      targetRole: "DEPENDENT", // ✅ enum FamilyRole
      maxUses: 1,
      usedCount: 0,
      expiresAt,
      // revokedAt: null (по умолчанию)
    },
    select: { id: true },
  });

  return { inviteId: invite.id };
}
