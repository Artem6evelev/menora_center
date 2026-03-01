import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AcceptInviteButton } from "./AcceptInviteButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, AlertCircle } from "lucide-react";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string; locale: string }>;
}) {
  const resolvedParams = await params;
  const { token, locale } = resolvedParams;

  // 1. Проверяем авторизацию. Если не вошел - отправляем в Clerk с редиректом обратно сюда
  const { userId } = await auth();
  if (!userId) {
    return redirect(
      `/${locale}/sign-in?redirect_url=/${locale}/invite/${token}`,
    );
  }

  // 2. Ищем данные инвайта и название семьи
  const invite = await prisma.familyInvite.findUnique({
    where: { id: token },
    include: { family: true },
  });

  // 3. Обработка ошибок (Инвайт не найден / просрочен / использован)
  if (!invite)
    return <ErrorCard message="Приглашение не найдено или ссылка неверна." />;
  if (invite.isAccepted)
    return <ErrorCard message="Это приглашение уже было использовано." />;
  if (invite.expiresAt < new Date())
    return <ErrorCard message="Срок действия ссылки истек." />;

  // 4. Проверяем, не в семье ли уже юзер
  const existingMember = await prisma.familyMember.findUnique({
    where: { userId },
  });

  if (existingMember) {
    return (
      <ErrorCard
        title="Вы уже в семье"
        message="Вы уже привязаны к профилю семьи. Один аккаунт может состоять только в одной семье."
      />
    );
  }

  // Роли для красивого отображения
  const roleTranslations: Record<string, string> = {
    SPOUSE: "Супруг / Супруга",
    CHILD: "Ребенок",
    DEPENDENT: "Подопечный",
  };

  // 5. Успешный рендер приглашения
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/20 p-4">
      <Card className="max-w-md w-full shadow-lg border-border/50 text-center">
        <CardHeader className="space-y-4 pb-6">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              Вас пригласили в семью
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Глава семьи приглашает вас присоединиться к профилю <br />
              <span className="font-semibold text-foreground">
                «{invite.family.name}»
              </span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg text-sm flex justify-between items-center text-start">
            <span className="text-muted-foreground">Ваша роль:</span>
            <span className="font-medium bg-background px-3 py-1 rounded-full border shadow-sm">
              {roleTranslations[invite.targetRole] || invite.targetRole}
            </span>
          </div>

          <AcceptInviteButton token={token} locale={locale} />
        </CardContent>
      </Card>
    </div>
  );
}

// Вспомогательный компонент для красивого вывода ошибок инвайта
function ErrorCard({
  title = "Ошибка",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/20 p-4">
      <Card className="max-w-md w-full border-destructive/20 text-center">
        <CardContent className="pt-6 space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
