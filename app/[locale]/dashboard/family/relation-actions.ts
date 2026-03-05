"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type RelType =
  | "SPOUSE"
  | "PARENT"
  | "CHILD"
  | "SIBLING"
  | "GRANDPARENT"
  | "GRANDCHILD"
  | "AUNT_UNCLE"
  | "NIECE_NEPHEW"
  | "COUSIN"
  | "IN_LAW"
  | "GUARDIAN"
  | "WARD"
  | "OTHER";

const inverse: Record<RelType, RelType> = {
  SPOUSE: "SPOUSE",
  PARENT: "CHILD",
  CHILD: "PARENT",
  SIBLING: "SIBLING",
  GRANDPARENT: "GRANDCHILD",
  GRANDCHILD: "GRANDPARENT",
  AUNT_UNCLE: "NIECE_NEPHEW",
  NIECE_NEPHEW: "AUNT_UNCLE",
  COUSIN: "COUSIN",
  IN_LAW: "IN_LAW",
  GUARDIAN: "WARD",
  WARD: "GUARDIAN",
  OTHER: "OTHER",
};

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

export async function upsertRelationAction(input: {
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  type: RelType;
}) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  if (input.fromMemberId === input.toMemberId) {
    throw new Error("Нельзя связать человека с самим собой");
  }

  const dbUser = await getOrCreateDbUser(clerkUserId);

  const caller = await prisma.familyMember.findUnique({
    where: { userId: dbUser.id },
    select: { id: true, role: true, familyId: true },
  });

  if (!caller?.familyId || caller.familyId !== input.familyId) {
    throw new Error("Forbidden");
  }

  const isHead = caller.role === "HEAD";
  const isSelf = caller.id === input.fromMemberId;

  // правило: каждый может ставить связи "от себя", HEAD — любые
  if (!isHead && !isSelf) {
    throw new Error(
      "Можно менять связи только от своего имени (или быть HEAD)",
    );
  }

  // оба участника должны принадлежать одной семье
  const [fromM, toM] = await Promise.all([
    prisma.familyMember.findUnique({
      where: { id: input.fromMemberId },
      select: { familyId: true },
    }),
    prisma.familyMember.findUnique({
      where: { id: input.toMemberId },
      select: { familyId: true },
    }),
  ]);
  if (
    !fromM ||
    !toM ||
    fromM.familyId !== input.familyId ||
    toM.familyId !== input.familyId
  ) {
    throw new Error("Оба участника должны быть в одной семье");
  }

  const inv = inverse[input.type];

  await prisma.$transaction(async (tx) => {
    // удаляем любую старую связь между этой парой в обе стороны
    await tx.familyRelation.deleteMany({
      where: {
        OR: [
          { fromMemberId: input.fromMemberId, toMemberId: input.toMemberId },
          { fromMemberId: input.toMemberId, toMemberId: input.fromMemberId },
        ],
      },
    });

    // если ставим SPOUSE — вычищаем предыдущие SPOUSE у обоих (простая моногамия)
    if (input.type === "SPOUSE") {
      await tx.familyRelation.deleteMany({
        where: {
          OR: [
            { fromMemberId: input.fromMemberId, type: "SPOUSE" },
            { toMemberId: input.fromMemberId, type: "SPOUSE" },
            { fromMemberId: input.toMemberId, type: "SPOUSE" },
            { toMemberId: input.toMemberId, type: "SPOUSE" },
          ],
        },
      });
    }

    await tx.familyRelation.create({
      data: {
        familyId: input.familyId,
        fromMemberId: input.fromMemberId,
        toMemberId: input.toMemberId,
        type: input.type,
      },
    });

    await tx.familyRelation.create({
      data: {
        familyId: input.familyId,
        fromMemberId: input.toMemberId,
        toMemberId: input.fromMemberId,
        type: inv,
      },
    });
  });

  return { ok: true as const };
}

export async function deleteRelationBetweenAction(input: {
  familyId: string;
  a: string;
  b: string;
}) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateDbUser(clerkUserId);

  const caller = await prisma.familyMember.findUnique({
    where: { userId: dbUser.id },
    select: { id: true, role: true, familyId: true },
  });

  if (!caller?.familyId || caller.familyId !== input.familyId) {
    throw new Error("Forbidden");
  }

  const isHead = caller.role === "HEAD";
  const touchesSelf = caller.id === input.a || caller.id === input.b;

  if (!isHead && !touchesSelf) {
    throw new Error("Удалять связи можно только для себя (или быть HEAD)");
  }

  await prisma.familyRelation.deleteMany({
    where: {
      OR: [
        { fromMemberId: input.a, toMemberId: input.b },
        { fromMemberId: input.b, toMemberId: input.a },
      ],
    },
  });

  return { ok: true as const };
}
