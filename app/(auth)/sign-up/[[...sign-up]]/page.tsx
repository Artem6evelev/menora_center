import { SignUp } from "@clerk/nextjs";
import { safeReturnTo, validAttemptId } from "@/lib/community/policy";
export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; registration?: string; draft?: string }> }) {
  const query = await searchParams; const target = safeReturnTo(query.returnTo);
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><SignUp forceRedirectUrl={`/auth/complete?returnTo=${encodeURIComponent(target)}${query.registration === "1" ? `&registration=1${validAttemptId(query.draft) ? `&draft=${encodeURIComponent(query.draft)}` : ""}` : ""}`} /></div>;
}
