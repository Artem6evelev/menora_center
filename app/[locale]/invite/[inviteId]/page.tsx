// app/[locale]/invite/[inviteId]/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AcceptInviteButton } from "./AcceptInviteButton";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; inviteId: string }>;
}) {
  const { locale, inviteId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect(`/${locale}/sign-in?redirect_url=/${locale}/invite/${inviteId}`);
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Приглашение в семью</h1>

      <p className="text-muted-foreground">
        Нажмите кнопку, чтобы принять приглашение.
      </p>

      <AcceptInviteButton inviteId={inviteId} locale={locale} />
    </div>
  );
}
