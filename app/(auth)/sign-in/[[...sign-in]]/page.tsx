import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import GoogleButton from "@/components/community/google-button";
import { registrationUrl } from "@/lib/community/policy";
import Link from "next/link";
import { readJourney } from "@/lib/community/journey";
import { Logo } from "@/components/Logo";
export default async function SignInPage({ searchParams, params }: { searchParams: Promise<{ returnTo?: string; registration?: string; draft?: string }>; params: Promise<{ "sign-in"?: string[] }> }) {
  const query = await searchParams;
  const { target, draft } = await readJourney(query, (await auth()).userId);
  const suffix = draft ? `&draft=${draft.id}` : "";
  const destination = `/auth/complete?returnTo=${encodeURIComponent(target)}${suffix}`;
  if ((await auth()).userId) redirect(destination);
  if ((await params)["sign-in"]?.length) return <main className="min-h-screen flex items-center justify-center p-4"><SignIn forceRedirectUrl={destination} signUpUrl={`/sign-up?returnTo=${encodeURIComponent(target)}${suffix}`} signUpForceRedirectUrl={destination} /></main>;
  return <main className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4"><div className="w-full max-w-md rounded-[32px] bg-white dark:bg-neutral-900 p-8 shadow-lg border border-neutral-200 dark:border-neutral-800">
    <div className="flex justify-center mb-6"><Logo linked={false} /></div>
    <h1 className="text-3xl font-black mb-6">Вход в кабинет</h1><GoogleButton registration={query.registration === "1"} draftId={draft?.id} returnTo={target} label="Войти через Google" />
    <Link href={`${registrationUrl(target)}${suffix}`} className="block mt-6 text-center underline">Впервые здесь? Регистрационная анкета</Link>
  </div></main>;
}
