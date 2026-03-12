import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { updateFamilyMemberAction } from "./actions";

// 1. Строго типизируем params как Promise (Требование Next.js 15)
interface PageProps {
  params: Promise<{
    locale: string;
    familyId: string;
    memberId: string;
  }>;
}

export default async function AdminMemberPage({ params }: PageProps) {
  await requireAdmin();

  // 2. Обязательно распаковываем параметры перед использованием
  const { locale, familyId, memberId } = await params;

  // 3. Используем чистые переменные в запросе
  const member = await prisma.familyMember.findFirst({
    where: { id: memberId, familyId: familyId },
    include: {
      user: {
        select: { email: true, telegramChatId: true, clerkUserId: true },
      },
      family: { select: { name: true } },
    },
  });

  if (!member) notFound();

  const telegramChatId =
    member.user?.telegramChatId !== null &&
    member.user?.telegramChatId !== undefined
      ? member.user.telegramChatId.toString()
      : "";

  async function onSubmit(formData: FormData) {
    "use server";

    await updateFamilyMemberAction({
      // Используем распакованные переменные из замыкания
      locale,
      familyId,
      memberId,
      fullName: String(formData.get("fullName") ?? ""),
      hebrewName: String(formData.get("hebrewName") ?? ""),
      gender: String(formData.get("gender") ?? ""),
      role: String(formData.get("role") ?? ""),
      birthDateGeorgian: String(formData.get("birthDateGeorgian") ?? ""),
      yahrzeitDateGeorgian: String(formData.get("yahrzeitDateGeorgian") ?? ""),
      isJewishBirthday: formData.get("isJewishBirthday") === "on",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{member.fullName}</h1>
          <div className="text-xs text-muted-foreground">
            Family: {member.family.name}
          </div>
          <div className="text-xs text-muted-foreground">
            Linked user: {member.user?.email ?? "—"}{" "}
            {telegramChatId ? `• TG: ${telegramChatId}` : ""}
          </div>
        </div>

        {/* Используем чистые переменные в ссылках */}
        <Link
          href={`/${locale}/admin/families/${familyId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to family
        </Link>
      </div>

      <div className="rounded-2xl border p-4">
        <form action={onSubmit} className="grid gap-3 max-w-xl">
          <label className="grid gap-1 text-sm">
            Full name
            <input
              name="fullName"
              defaultValue={member.fullName}
              className="rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
              required
            />
          </label>

          <label className="grid gap-1 text-sm">
            Hebrew name
            <input
              name="hebrewName"
              defaultValue={member.hebrewName ?? ""}
              className="rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Role
              <select
                name="role"
                defaultValue={member.role}
                className="rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
              >
                <option value="HEAD">HEAD</option>
                <option value="SPOUSE">SPOUSE</option>
                <option value="CHILD">CHILD</option>
                <option value="DEPENDENT">DEPENDENT</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              Gender
              <select
                name="gender"
                defaultValue={member.gender ?? ""}
                className="rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
              >
                <option value="">—</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            Birth date (ISO, например 1990-01-31)
            <input
              name="birthDateGeorgian"
              defaultValue={
                member.birthDateGeorgian
                  ? member.birthDateGeorgian.toISOString().slice(0, 10)
                  : ""
              }
              className="rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
              placeholder="YYYY-MM-DD"
            />
          </label>

          <label className="grid gap-1 text-sm">
            Yahrzeit date (ISO)
            <input
              name="yahrzeitDateGeorgian"
              defaultValue={
                member.yahrzeitDateGeorgian
                  ? member.yahrzeitDateGeorgian.toISOString().slice(0, 10)
                  : ""
              }
              className="rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
              placeholder="YYYY-MM-DD"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isJewishBirthday"
              defaultChecked={member.isJewishBirthday}
              className="h-4 w-4"
            />
            isJewishBirthday
          </label>

          <button className="rounded-xl border px-4 py-2 text-sm hover:bg-muted w-fit">
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
