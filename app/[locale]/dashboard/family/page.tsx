import React from "react";
import { redirect } from "next/navigation";
import { checkUser } from "@/lib/check-user";
import { prisma } from "@/lib/prisma";
import { InviteDialog } from "./InviteDialog";
import { CreateFamilyForm } from "./CreateFamilyForm";
import { FamilyHeadRelationsClient } from "./FamilyHeadRelationsClient";

// 1. Обязательно типизируем как Promise (Требование Next.js 15)
interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function FamilyPage({ params }: PageProps) {
  // 2. Распаковываем параметры через await
  const resolvedParams = await params;
  const locale = resolvedParams.locale;

  const t =
    locale === "he"
      ? {
          pageTitle: "פרופיל משפחה",
          pageSubtitle: "ניהול בני המשפחה ותאריכים חשובים",
          criticalError: "שגיאה קריטית: המשפחה לא נמצאה במסד הנתונים.",
        }
      : locale === "en"
        ? {
            pageTitle: "Family profile",
            pageSubtitle: "Manage family members and memorable dates",
            criticalError: "Critical error: Family not found in the database.",
          }
        : {
            pageTitle: "Профиль семьи",
            pageSubtitle: "Управление составом семьи и памятными датами",
            criticalError:
              "Критическая ошибка: Семья не найдена в базе данных.",
          };

  const user = await checkUser();
  if (!user) redirect(`/${locale}/sign-in`);

  if (!user.familyMember?.familyId) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-start">
            {t.pageTitle}
          </h1>
          <p className="text-muted-foreground mt-1 text-start">
            {t.pageSubtitle}
          </p>
        </div>
        <CreateFamilyForm />
      </div>
    );
  }

  const familyId = user.familyMember.familyId;

  const family = await prisma.family.findUnique({
    where: { id: familyId },
    select: {
      id: true,
      name: true,
      members: {
        orderBy: [{ createdAt: "asc" }],
        select: {
          id: true,
          userId: true,
          role: true,
          fullName: true,
          hebrewName: true,
          gender: true,
          birthDateGeorgian: true,
          yahrzeitDateGeorgian: true,
          isJewishBirthday: true,
        },
      },
      relations: {
        select: {
          id: true,
          fromMemberId: true,
          toMemberId: true,
          type: true,
          toMember: { select: { id: true, fullName: true } },
        },
      },
    },
  });

  if (!family) {
    return (
      <div className="p-8 text-center text-destructive">{t.criticalError}</div>
    );
  }

  const headMember = family.members.find((m) => m.role === "HEAD");
  if (!headMember) {
    return (
      <div className="p-8 text-center text-destructive">{t.criticalError}</div>
    );
  }

  const membersForClient = family.members.map((m) => ({
    id: m.id,
    userId: m.userId ?? null,
    fullName: m.fullName,
    hebrewName: m.hebrewName ?? null,
    gender: (m.gender as any) ?? null,
    birthDateGeorgian: m.birthDateGeorgian
      ? m.birthDateGeorgian.toISOString()
      : null,
    yahrzeitDateGeorgian: m.yahrzeitDateGeorgian
      ? m.yahrzeitDateGeorgian.toISOString()
      : null,
    isJewishBirthday: m.isJewishBirthday,
  }));

  const relationsFromHead = family.relations
    .filter((r) => r.fromMemberId === headMember.id)
    .map((r) => ({
      id: r.id,
      fromMemberId: r.fromMemberId,
      toMemberId: r.toMemberId,
      type: r.type as any,
      toMember: r.toMember,
    }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-start">
            {family.name}
          </h1>
          <p className="text-muted-foreground text-start mt-1">
            {t.pageSubtitle}
          </p>
        </div>

        {user.familyMember.role === "HEAD" && <InviteDialog locale={locale} />}
      </div>

      {/* ✅ client wrapper с dynamic ssr:false внутри */}
      <FamilyHeadRelationsClient
        locale={locale}
        familyId={familyId}
        isHead={user.familyMember.role === "HEAD"}
        currentMemberId={user.familyMember.id}
        headMemberId={headMember.id}
        headName={headMember.fullName}
        members={membersForClient}
        relationsFromHead={relationsFromHead}
      />
    </div>
  );
}
