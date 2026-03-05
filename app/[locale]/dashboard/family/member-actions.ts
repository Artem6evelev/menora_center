"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  familyId: z.string().min(1),
  memberId: z.string().min(1),

  fullName: z.string().min(1).max(120).optional(),
  hebrewName: z.string().max(120).nullable().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullable().optional(),

  // YYYY-MM-DD
  birthDateGeorgian: z.string().nullable().optional(),
  yahrzeitDateGeorgian: z.string().nullable().optional(),

  isJewishBirthday: z.boolean().optional(),
});

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error("Неверный формат даты");
  return d;
}

async function getCaller() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });
  if (!dbUser) throw new Error("User not synced in DB");

  const member = await prisma.familyMember.findUnique({
    where: { userId: dbUser.id },
    select: { id: true, familyId: true, role: true },
  });

  if (!member?.familyId) throw new Error("У пользователя нет семьи");
  return { member };
}

/**
 * Правила:
 * - HEAD может редактировать всех в своей семье
 * - любой может редактировать только себя
 */
export async function updateFamilyMemberAction(input: unknown) {
  const data = UpdateSchema.parse(input);
  const { member: caller } = await getCaller();

  if (caller.familyId !== data.familyId) throw new Error("Недостаточно прав");

  const isSelf = caller.id === data.memberId;
  const isHead = caller.role === "HEAD";
  if (!isSelf && !isHead) throw new Error("Можно редактировать только себя");

  const target = await prisma.familyMember.findFirst({
    where: { id: data.memberId, familyId: data.familyId },
    select: { id: true },
  });
  if (!target) throw new Error("Участник не найден");

  const update: any = {};

  if (typeof data.fullName === "string") update.fullName = data.fullName.trim();
  if (data.hebrewName !== undefined)
    update.hebrewName = (data.hebrewName ?? "").trim() || null;
  if (data.gender !== undefined) update.gender = data.gender ?? null;

  if (data.birthDateGeorgian !== undefined)
    update.birthDateGeorgian = parseDate(data.birthDateGeorgian);

  if (data.yahrzeitDateGeorgian !== undefined)
    update.yahrzeitDateGeorgian = parseDate(data.yahrzeitDateGeorgian);

  if (typeof data.isJewishBirthday === "boolean")
    update.isJewishBirthday = data.isJewishBirthday;

  await prisma.familyMember.update({
    where: { id: data.memberId },
    data: update,
  });

  return { ok: true };
}
