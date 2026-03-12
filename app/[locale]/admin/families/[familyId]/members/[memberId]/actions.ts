"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";

export async function updateFamilyMemberAction(input: {
  locale: string;
  familyId: string;
  memberId: string;
  fullName: string;
  hebrewName: string;
  gender: string;
  role: string;
  birthDateGeorgian: string;
  yahrzeitDateGeorgian: string;
  isJewishBirthday: boolean;
}) {
  await requireAdmin();

  const toDateOrNull = (v: string) => {
    const s = v.trim();
    if (!s) return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  await prisma.familyMember.updateMany({
    where: { id: input.memberId, familyId: input.familyId },
    data: {
      fullName: input.fullName.trim(),
      hebrewName: input.hebrewName.trim() || null,
      gender: (input.gender.trim() as any) || null,
      role: input.role.trim() as any,
      birthDateGeorgian: toDateOrNull(input.birthDateGeorgian),
      yahrzeitDateGeorgian: toDateOrNull(input.yahrzeitDateGeorgian),
      isJewishBirthday: input.isJewishBirthday,
    },
  });

  revalidatePath(`/${input.locale}/admin/families/${input.familyId}`);
  revalidatePath(
    `/${input.locale}/admin/families/${input.familyId}/members/${input.memberId}`,
  );
}
