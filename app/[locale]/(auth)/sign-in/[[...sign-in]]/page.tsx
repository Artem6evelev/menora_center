import { SignIn } from "@clerk/nextjs";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  const redirectUrl =
    typeof sp.redirect_url === "string" && sp.redirect_url.startsWith("/")
      ? sp.redirect_url
      : `/${locale}/dashboard`;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <SignIn
        routing="path"
        path={`/${locale}/sign-in`}
        signUpUrl={`/${locale}/sign-up`}
        forceRedirectUrl={redirectUrl}
      />
    </div>
  );
}
