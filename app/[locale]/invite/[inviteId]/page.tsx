import { auth, currentUser } from "@clerk/nextjs/server";
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

  const cu = await currentUser();
  const email =
    cu?.emailAddresses?.find((e) => e.id === cu.primaryEmailAddressId)
      ?.emailAddress ??
    cu?.emailAddresses?.[0]?.emailAddress ??
    "unknown";

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Приглашение в семью</h1>

      {/* ✅ супер-важно: покажет, КТО реально залогинен при принятии */}
      <div className="text-sm rounded-lg border p-3 bg-muted/30">
        Вы вошли как: <span className="font-mono">{email}</span>
        <br />
        Clerk ID: <span className="font-mono">{userId}</span>
      </div>

      <AcceptInviteButton inviteId={inviteId} locale={locale} />
    </div>
  );
}
