import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import GoogleButton from "@/components/community/google-button";
import { registrationUrl, safeReturnTo, validAttemptId } from "@/lib/community/policy";
import Link from "next/link";
export default async function SignInPage({ searchParams, params }: { searchParams: Promise<{ returnTo?: string; registration?: string; draft?: string }>; params: Promise<{ "sign-in"?: string[] }> }) {
  const query = await searchParams;
  const target = safeReturnTo(query.returnTo);
  const destination = `/auth/complete?returnTo=${encodeURIComponent(target)}${query.registration === "1" ? `&registration=1${validAttemptId(query.draft) ? `&draft=${encodeURIComponent(query.draft)}` : ""}` : ""}`;
  if ((await auth()).userId) redirect(destination);
  if ((await params)["sign-in"]?.length) return <main className="min-h-screen flex items-center justify-center p-4"><SignIn forceRedirectUrl={destination} /></main>;
  return <main className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4"><div className="w-full max-w-md rounded-[32px] bg-white dark:bg-neutral-900 p-8 shadow-lg border border-neutral-200 dark:border-neutral-800">
    <h1 className="text-3xl font-black mb-6">Вход в кабинет</h1><GoogleButton registration={query.registration === "1"} draftId={query.draft} returnTo={target} label="Войти через Google" />
    <Link href={registrationUrl(target)} className="block mt-6 text-center underline">Впервые здесь? Регистрационная анкета</Link>
  </div></main>;
}
