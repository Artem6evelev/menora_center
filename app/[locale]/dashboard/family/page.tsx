// app/[locale]/dashboard/family/page.tsx
import { checkUser } from "@/lib/check-user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { InviteDialog } from "./InviteDialog";
import { CreateFamilyForm } from "./CreateFamilyForm";

export default async function FamilyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // В Next.js 15+ params - это промис
  const resolvedParams = await params;
  const locale = resolvedParams.locale;

  // 1. Получаем пользователя из базы (checkUser должен возвращать юзера с familyMember, если он есть)
  const user = await checkUser();

  if (!user) {
    return redirect(`/${locale}/sign-in`);
  }

  // 2. СОСТОЯНИЕ: СЕМЬИ НЕТ -> Показываем форму создания
  if (!user.familyMember || !user.familyMember.familyId) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-start">
            Профиль семьи
          </h1>
          <p className="text-muted-foreground mt-1 text-start">
            Управление составом семьи и памятными датами
          </p>
        </div>
        <CreateFamilyForm />
      </div>
    );
  }

  // 3. СОСТОЯНИЕ: СЕМЬЯ ЕСТЬ -> Получаем всю семью целиком
  const familyId = user.familyMember.familyId;
  const family = await prisma.family.findUnique({
    where: { id: familyId },
    include: {
      members: {
        orderBy: { createdAt: "asc" }, // Глава семьи обычно будет первым
      },
    },
  });

  if (!family) {
    return (
      <div className="p-8 text-center text-destructive">
        Критическая ошибка: Семья не найдена в базе данных.
      </div>
    );
  }

  // Перевод системных ролей для UI
  const roleTranslations: Record<string, string> = {
    HEAD: "Глава семьи",
    SPOUSE: "Супруг(а)",
    CHILD: "Ребенок",
    DEPENDENT: "Родственник",
  };

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-start">
            {family.name}
          </h1>
          <p className="text-muted-foreground text-start mt-1">
            Управляйте составом семьи и памятными датами
          </p>
        </div>

        {/* Кнопка приглашения (Доступна только Главе семьи) */}
        {user.familyMember.role === "HEAD" && <InviteDialog locale={locale} />}
      </div>

      {/* Список членов семьи */}
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
              {/* Светский день рождения */}
              <div className="flex justify-between items-center">
                <span>День рождения:</span>
                <span
                  className={
                    member.birthDateGeorgian
                      ? "font-medium text-foreground"
                      : "text-xs italic"
                  }
                >
                  {member.birthDateGeorgian
                    ? new Date(member.birthDateGeorgian).toLocaleDateString(
                        "ru-RU",
                      )
                    : "Не указано"}
                </span>
              </div>

              {/* Йорцайт */}
              {member.yahrzeitDateGeorgian && (
                <div className="flex justify-between items-center text-amber-600 dark:text-amber-500">
                  <span>Йорцайт:</span>
                  <span className="font-medium">
                    {new Date(member.yahrzeitDateGeorgian).toLocaleDateString(
                      "ru-RU",
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
