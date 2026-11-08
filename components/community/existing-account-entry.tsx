"use client";
import GoogleButton from "./google-button";
export default function ExistingAccountEntry({
  returnTo,
}: {
  returnTo: string;
}) {
  return (
    <aside
      className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2"
      data-existing-account-entry
    >
      <GoogleButton
        returnTo={returnTo}
        preserveDraft={false}
        resumeEvent
        label="Я уже зарегистрирован — войти в кабинет"
      />
      <p className="text-sm text-slate-600">
        Войдите через Google. Мы используем вашу сохранённую анкету
        {returnTo.startsWith("/events/")
          ? " и вернёмся к записи на это мероприятие."
          : "."}
      </p>
    </aside>
  );
}
