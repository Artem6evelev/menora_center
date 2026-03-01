// app/[locale]/dashboard/family/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { checkUser } from "@/lib/check-user";
import { prisma } from "@/lib/prisma";
import { InviteDialog } from "./InviteDialog";
import { CreateFamilyForm } from "./CreateFamilyForm";

export default async function FamilyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const dateLocale =
    locale === "he" ? "he-IL" : locale === "en" ? "en-US" : "ru-RU";

  const t =
    locale === "he"
      ? {
          pageTitle: "פרופיל משפחה",
          pageSubtitle: "ניהול בני המשפחה ותאריכים חשובים",
          birthday: "יום הולדת:",
          yahrzeit: "יורצייט:",
          notSet: "לא צוין",
          criticalError: "שגיאה קריטית: המשפחה לא נמצאה במסד הנתונים.",
        }
      : locale === "en"
        ? {
            pageTitle: "Family profile",
            pageSubtitle: "Manage family members and memorable dates",
            birthday: "Birthday:",
            yahrzeit: "Yahrzeit:",
            notSet: "Not set",
            criticalError: "Critical error: Family not found in the database.",
          }
        : {
            pageTitle: "Профиль семьи",
            pageSubtitle: "Управление составом семьи и памятными датами",
            birthday: "День рождения:",
            yahrzeit: "Йорцайт:",
            notSet: "Не указано",
            criticalError:
              "Критическая ошибка: Семья не найдена в базе данных.",
          };

  const roleTranslationsByLocale: Record<string, Record<string, string>> = {
    ru: {
      HEAD: "Глава семьи",
      SPOUSE: "Супруг(а)",
      CHILD: "Ребёнок",
      DEPENDENT: "Родственник",
    },
    en: {
      HEAD: "Head of family",
      SPOUSE: "Spouse",
      CHILD: "Child",
      DEPENDENT: "Dependent",
    },
    he: {
      HEAD: "ראש המשפחה",
      SPOUSE: "בן/בת זוג",
      CHILD: "ילד/ה",
      DEPENDENT: "תלוי/ה",
    },
  };

  const roleTranslations =
    roleTranslationsByLocale[locale] ?? roleTranslationsByLocale.ru;

  const user = await checkUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  if (!user.familyMember || !user.familyMember.familyId) {
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
    include: {
      members: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!family) {
    return (
      <div className="p-8 text-center text-destructive">{t.criticalError}</div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {family.members.map((member) => (
          <div
            key={member.id}
            className="flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm p-6 text-start transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-4 gap-2">
              <div className="space-y-1">
                <h3 className="font-semibold leading-none tracking-tight">
                  {member.fullName}
                </h3>
                {member.hebrewName && (
                  <p className="text-sm text-muted-foreground font-serif mt-1">
                    {member.hebrewName}
                  </p>
                )}
              </div>

              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary/50 text-secondary-foreground whitespace-nowrap">
                {roleTranslations[member.role] || member.role}
              </span>
            </div>

            <div className="mt-auto space-y-3 text-sm text-muted-foreground pt-4 border-t border-border/50">
              <div className="flex justify-between items-center">
                <span>{t.birthday}</span>
                <span
                  className={
                    member.birthDateGeorgian
                      ? "font-medium text-foreground"
                      : "text-xs italic"
                  }
                >
                  {member.birthDateGeorgian
                    ? new Date(member.birthDateGeorgian).toLocaleDateString(
                        dateLocale,
                      )
                    : t.notSet}
                </span>
              </div>

              {member.yahrzeitDateGeorgian && (
                <div className="flex justify-between items-center text-amber-600 dark:text-amber-500">
                  <span>{t.yahrzeit}</span>
                  <span className="font-medium">
                    {new Date(member.yahrzeitDateGeorgian).toLocaleDateString(
                      dateLocale,
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
