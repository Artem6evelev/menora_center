// app/[locale]/dashboard/family/tree-actions.ts
"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type FamilyRole = "HEAD" | "SPOUSE" | "CHILD" | "DEPENDENT";
type Gender = "MALE" | "FEMALE" | "OTHER";

async function getOrCreateDbUser(clerkUserId: string) {
  const existing = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });
  if (existing) return existing;

  const cu = await currentUser();
  const email =
    cu?.emailAddresses?.find((e) => e.id === cu.primaryEmailAddressId)
      ?.emailAddress ?? cu?.emailAddresses?.[0]?.emailAddress;

  if (!email) throw new Error("No email in Clerk profile");

  return prisma.user.create({
    data: { clerkUserId, email },
    select: { id: true },
  });
}

async function assertHead(dbUserId: string, familyId: string) {
  const member = await prisma.familyMember.findUnique({
    where: { userId: dbUserId },
    select: { role: true, familyId: true },
  });

  if (!member?.familyId || member.familyId !== familyId) {
    throw new Error("Forbidden");
  }
  if (String(member.role) !== "HEAD") {
    throw new Error("Only HEAD can edit family tree");
  }
}

export async function placeMemberAction(input: {
  familyId: string;
  memberId: string;
  role: Exclude<FamilyRole, "HEAD">; // SPOUSE | CHILD | DEPENDENT
}) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateDbUser(clerkUserId);
  await assertHead(dbUser.id, input.familyId);

  const target = await prisma.familyMember.findUnique({
    where: { id: input.memberId },
    select: { familyId: true, role: true },
  });
  if (!target || target.familyId !== input.familyId)
    throw new Error("Forbidden");
  if (String(target.role) === "HEAD") throw new Error("Cannot move HEAD");

  const maxOrder = await prisma.familyMember.aggregate({
    where: {
      familyId: input.familyId,
      role: input.role as any,
      treePlaced: true,
    },
    _max: { treeOrder: true },
  });

  const nextOrder = (maxOrder._max.treeOrder ?? 0) + 1;

  await prisma.familyMember.update({
    where: { id: input.memberId },
    data: {
      role: input.role as any,
      treePlaced: true,
      treeOrder: nextOrder,
    },
  });

  return { ok: true as const };
}

export async function unplaceMemberAction(input: {
  familyId: string;
  memberId: string;
}) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateDbUser(clerkUserId);
  await assertHead(dbUser.id, input.familyId);

  const target = await prisma.familyMember.findUnique({
    where: { id: input.memberId },
    select: { familyId: true, role: true },
  });
  if (!target || target.familyId !== input.familyId)
    throw new Error("Forbidden");
  if (String(target.role) === "HEAD") throw new Error("Cannot move HEAD");

  await prisma.familyMember.update({
    where: { id: input.memberId },
    data: {
      role: "DEPENDENT" as any,
      treePlaced: false,
      treeOrder: 0,
    },
  });

  return { ok: true as const };
}

export async function updateMemberDetailsAction(input: {
  familyId: string;
  memberId: string;
  fullName: string;
  hebrewName?: string | null;
  gender?: Gender | null;
  birthDateGeorgian?: string | null; // YYYY-MM-DD
  yahrzeitDateGeorgian?: string | null; // YYYY-MM-DD
}) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateDbUser(clerkUserId);

  const target = await prisma.familyMember.findUnique({
    where: { id: input.memberId },
    select: { id: true, familyId: true, userId: true },
  });

  if (!target || target.familyId !== input.familyId) {
    throw new Error("Forbidden");
  }

  const caller = await prisma.familyMember.findUnique({
    where: { userId: dbUser.id },
    select: { role: true, familyId: true },
  });

  const isHead =
    caller?.familyId === input.familyId && String(caller?.role) === "HEAD";
  const isSelf = target.userId != null && target.userId === dbUser.id;

  if (!isHead && !isSelf) {
    throw new Error("Нет прав на редактирование этого профиля");
  }
  if (!target.userId && !isHead) {
    throw new Error("Эту карточку может редактировать только глава семьи");
  }

  const parseDate = (v?: string | null) => {
    if (!v) return null;
    const d = new Date(`${v}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  await prisma.familyMember.update({
    where: { id: input.memberId },
    data: {
      fullName: input.fullName.trim() || "Member",
      hebrewName: input.hebrewName?.trim() || null,
      gender: (input.gender ?? null) as any,
      birthDateGeorgian: parseDate(input.birthDateGeorgian),
      yahrzeitDateGeorgian: parseDate(input.yahrzeitDateGeorgian),
    },
  });

  return { ok: true as const };
}
