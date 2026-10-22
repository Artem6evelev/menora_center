"use client";
import { Logo } from "@/components/Logo";
import { miniAppDictionaries } from "@/lib/telegram/miniapp-i18n";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const copy = miniAppDictionaries.ru;
  return <main className="miniapp" data-menorah-surface="miniapp" lang="ru" dir="ltr">
    <section className="miniapp-panel miniapp-state mx-auto max-w-xl"><Logo linked={false} appearance="light" />
      <h1>{copy.errorTitle}</h1><p>{copy.errorBody}</p><button className="miniapp-primary" onClick={reset}>{copy.retry}</button></section>
  </main>;
}
