import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { readJourney } from "@/lib/community/journey";
import { Logo } from "@/components/Logo";
export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; registration?: string; draft?: string }> }) {
  const { target, draft } = await readJourney(await searchParams, (await auth()).userId);
  const destination = `/auth/complete?returnTo=${encodeURIComponent(target)}${draft ? `&draft=${draft.id}` : ""}`;
  return <div className="flex flex-col gap-6 min-h-screen items-center justify-center bg-slate-50 p-4"><Logo linked={false} /><SignUp forceRedirectUrl={destination} signInUrl={`/sign-in?returnTo=${encodeURIComponent(target)}${draft ? `&draft=${draft.id}` : ""}`} /></div>;
}
