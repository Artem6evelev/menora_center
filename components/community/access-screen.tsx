import Link from "next/link";
import { registrationUrl, safeReturnTo } from "@/lib/community/policy";
import GoogleButton from "./google-button";
import ResourceMessage from "./resource-message";
export default function AccessScreen({ reason = "guest", returnTo = "/events" }: { reason?: string; returnTo?: string }) {
  const target = safeReturnTo(returnTo);
  return <section className="min-h-[85vh] flex items-center justify-center px-4 pt-32 pb-16 bg-neutral-50 dark:bg-neutral-950">
    <div className="w-full max-w-2xl rounded-[32px] border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 md:p-12 shadow-xl">
      {reason === "guest" ? <>
        <h1 className="text-3xl font-black mb-4">Один шаг до записи!</h1>
        <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-8">Чтобы записаться на мероприятие, войдите в аккаунт или сначала зарегистрируйтесь в нашей общине.</p>
        <div className="flex flex-col gap-4">
          <GoogleButton returnTo={target} label="Я уже регистрировался. Войти в кабинет>>" />
          <Link href={registrationUrl(target)} className="rounded-2xl border-2 border-[#FFB800] px-5 py-4 text-center font-bold hover:bg-amber-50 dark:hover:bg-amber-950/20">Я здесь впервые! Пройти быструю регистрацию&gt;&gt;</Link>
        </div>
      </> : reason === "resources" ? <ResourceMessage /> : reason === "restricted" ? <>
        <h1 className="text-2xl md:text-3xl font-black mb-4">Участие в событиях</h1>
        <p className="mb-6 leading-relaxed">Для указанной категории запись пока недоступна. Анкета сохранена. По вопросам участия обратитесь в общину.</p>
        <Link href="/dashboard/my-events" className="block underline">Мои прежние записи</Link>
        <Link href={registrationUrl(target)} className="block underline mt-4">Моя анкета</Link>
      </> : <>
        <h1 className="text-2xl md:text-3xl font-black mb-4">Анкета общины</h1>
        <p className="mb-6 leading-relaxed text-neutral-600 dark:text-neutral-300">Пожалуйста, заполните анкету, чтобы продолжить запись на мероприятие.</p>
        <Link href={registrationUrl(target)} className="inline-block rounded-2xl bg-[#FFB800] px-6 py-4 text-black font-bold">Открыть анкету</Link>
        <Link href="/dashboard/my-events" className="block mt-5 text-sm underline">Мои прежние записи</Link>
      </>}
    </div>
  </section>;
}
