"use client";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { miniAppDictionaries, miniAppLanguage, type MiniAppLanguage } from "@/lib/telegram/miniapp-i18n";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const [language, setLanguage] = useState<MiniAppLanguage>("ru");
  useEffect(() => setLanguage(miniAppLanguage(navigator.language)), []);
  const copy = miniAppDictionaries[language];
  return <main className="miniapp" data-menorah-surface="miniapp" lang={language} dir={language === "he" ? "rtl" : "ltr"}>
    <section className="miniapp-panel miniapp-state mx-auto max-w-xl"><Logo linked={false} appearance="light" />
      <h1>{copy.errorTitle}</h1><p>{copy.errorBody}</p><button className="miniapp-primary" onClick={reset}>{copy.retry}</button></section>
  </main>;
}
