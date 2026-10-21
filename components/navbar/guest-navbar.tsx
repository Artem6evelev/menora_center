'use client';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Logo } from '../Logo';
import GoogleButton from '@/components/community/google-button';
import { eventReturnTo, registrationUrl } from '@/lib/community/policy';
function Header() {
  const path = usePathname(), params = useSearchParams();
  const event = /^\/events\/[^/]+$/.test(path), register = path === '/register';
  const target = eventReturnTo(event ? path : params.get('returnTo'));
  const [title, setTitle] = useState<string | null>(null);
  useEffect(() => {
    if (!event) return; const controller = new AbortController(); setTitle(null);
    void fetch('/api/community/event-title?id=' + encodeURIComponent(path.slice('/events/'.length)), { signal: controller.signal }).then(response => response.json()).then(result => setTitle(result.title || null)).catch(() => {});
    return () => controller.abort();
  }, [event, path]);
  return <nav aria-label="Вход в общину" className={`fixed top-4 inset-x-0 z-50 mx-auto w-[95%] max-w-7xl bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 shadow-sm px-3 sm:px-5 py-3 flex items-center justify-between gap-3 ${event ? 'rounded-2xl' : 'rounded-[24px] sm:rounded-full'}`}>
    <div className="shrink-0 [&_img]:h-7 sm:[&_img]:h-10 lg:[&_img]:h-14"><Logo linked={!event && !register} /></div>
    {event ? <p className="font-bold text-sm sm:text-lg min-w-0 break-words line-clamp-3 text-center flex-1" role="status">{title || 'Событие общины'}</p> : <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm [&_button]:px-3 [&_button]:py-3 sm:[&_button]:px-5 sm:[&_button]:py-4">
      <div className={register ? 'max-w-sm' : 'max-w-28'}><GoogleButton draftId={params.get('draft') || undefined} returnTo={target} label={register ? 'Я уже регистрировался. Войти в свой кабинет >>' : 'Войти'} /></div>
      {!register && <Link href={registrationUrl(target)} className="font-bold rounded-2xl sm:rounded-full bg-[#FFB800] px-3 sm:px-6 py-3 sm:py-4 text-black">Регистрация</Link>}
    </div>}
  </nav>;
}
export default function GuestNavbar() { return <Suspense fallback={null}><Header /></Suspense>; }
