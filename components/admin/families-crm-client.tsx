"use client";

import { useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import {
  createFamilyTagAction,
  sendEmailBroadcastAction,
  toggleFamilyTagAction,
} from "../../app/[locale]/admin/families/actions";
import { useRouter } from "next/navigation";

type TagDTO = { id: string; name: string; color: string | null };

type FamilyRowDTO = {
  id: string;
  name: string;

  headName: string | null;
  spouses: string[];
  children: { name: string; age: number | null }[];

  emails: string[];
  tags: TagDTO[];
};

type BroadcastDTO = {
  id: string;
  subject: string;
  status: "DRAFT" | "QUEUED" | "SENDING" | "DONE" | "FAILED";
  createdAt: string; // ISO
  sent: number;
  failed: number;
  queued: number;
};

function textToPreviewHtml(body: string) {
  const safe = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return safe
    .split("\n")
    .map((line) =>
      line.trim()
        ? `<p style="margin:0 0 10px 0;">${line}</p>`
        : `<div style="height:8px;"></div>`,
    )
    .join("");
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function statusRu(s: BroadcastDTO["status"]) {
  if (s === "DRAFT") return "Черновик";
  if (s === "QUEUED") return "В очереди";
  if (s === "SENDING") return "Отправляется";
  if (s === "DONE") return "Отправлено";
  return "Ошибка";
}

export function FamiliesCRMClient({
  locale,
  initialFamilies,
  initialTags,
  initialBroadcasts,
}: {
  locale: string;
  initialFamilies: FamilyRowDTO[];
  initialTags: TagDTO[];
  initialBroadcasts: BroadcastDTO[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [families, setFamilies] = useState(initialFamilies);
  const [tags, setTags] = useState<TagDTO[]>(initialTags);
  const [broadcasts] = useState<BroadcastDTO[]>(initialBroadcasts);

  // selection
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // filters
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"OR" | "AND">("OR");
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  // composer
  const [subject, setSubject] = useState("Сообщение общины");
  const [bodyText, setBodyText] = useState("");
  const [result, setResult] = useState<string | null>(null);

  // create tag
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#22c55e");

  const filteredFamilies = useMemo(() => {
    const q = query.trim().toLowerCase();

    return families.filter((f) => {
      const familyTagIds = new Set(f.tags.map((t) => t.id));

      const matchesTags =
        tagFilter.length === 0
          ? true
          : mode === "OR"
            ? tagFilter.some((id) => familyTagIds.has(id))
            : tagFilter.every((id) => familyTagIds.has(id));

      if (!matchesTags) return false;

      if (!q) return true;

      const hay = [
        f.name,
        f.headName ?? "",
        ...f.spouses,
        ...f.children.map((c) => c.name),
        ...f.emails,
        ...f.tags.map((t) => t.name),
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [families, query, tagFilter, mode]);

  const selectedFamilyIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([id]) => id),
    [selected],
  );

  const selectedEmails = useMemo(() => {
    const set = new Set<string>();
    for (const f of families) {
      if (!selected[f.id]) continue;
      f.emails.forEach((e) => set.add(e));
    }
    return Array.from(set);
  }, [families, selected]);

  const previewHtml = useMemo(() => textToPreviewHtml(bodyText), [bodyText]);

  const selectFamilies = (ids: string[], checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      for (const id of ids) next[id] = checked;
      return next;
    });
  };

  const selectAllFiltered = (checked: boolean) => {
    selectFamilies(
      filteredFamilies.map((f) => f.id),
      checked,
    );
  };

  const clearSelection = () => setSelected({});

  const toggleTag = (familyId: string, tagId: string, enabled: boolean) => {
    // optimistic update
    setFamilies((prev) =>
      prev.map((f) => {
        if (f.id !== familyId) return f;
        const has = f.tags.some((t) => t.id === tagId);
        const tag = tags.find((t) => t.id === tagId);
        if (!tag) return f;

        if (enabled && !has) return { ...f, tags: [...f.tags, tag] };
        if (!enabled && has)
          return { ...f, tags: f.tags.filter((t) => t.id !== tagId) };
        return f;
      }),
    );

    startTransition(async () => {
      await toggleFamilyTagAction({ locale, familyId, tagId, enabled }).catch(
        () => {},
      );
      router.refresh();
    });
  };

  const createTag = () => {
    setResult(null);
    const name = newTagName.trim();
    if (!name) return;

    startTransition(async () => {
      const res = await createFamilyTagAction({
        locale,
        name,
        color: newTagColor,
      });
      if (!res.ok) {
        setResult(res.message);
        return;
      }
      setTags((prev) => [...prev, res.tag]);
      setNewTagName("");
      router.refresh();
    });
  };

  const send = () => {
    setResult(null);
    startTransition(async () => {
      const res = await sendEmailBroadcastAction({
        locale,
        familyIds: selectedFamilyIds,
        subject,
        bodyText,
      });

      if (!res.ok) {
        setResult(res.message);
        return;
      }

      setResult(`✅ Отправлено: ${res.sent}. Ошибок: ${res.failed}.`);
      router.refresh(); // обновим историю рассылок и таблицу
    });
  };

  const toggleFilterTag = (tagId: string) => {
    setTagFilter((prev) =>
      prev.includes(tagId) ? prev.filter((x) => x !== tagId) : [...prev, tagId],
    );
  };

  const removeFilterTag = (tagId: string) => {
    setTagFilter((prev) => prev.filter((x) => x !== tagId));
  };

  const copyEmails = async () => {
    try {
      await navigator.clipboard.writeText(selectedEmails.join(", "));
      setResult("✅ Emails скопированы в буфер обмена");
    } catch {
      setResult("Ошибка: не удалось скопировать emails");
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      {/* LEFT */}
      <div className="min-w-0 rounded-2xl border bg-white dark:bg-neutral-950">
        {/* Header + Filters */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Семьи</div>
              <div className="text-xs text-neutral-500">
                Фильтры → «Выбрать все по фильтру» → рассылка справа
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => selectAllFiltered(true)}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
              >
                Выбрать по фильтру
              </button>
              <button
                onClick={() => selectAllFiltered(false)}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
              >
                Снять по фильтру
              </button>
              <button
                onClick={clearSelection}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
              >
                Сбросить выбор
              </button>
            </div>
          </div>

          <div className="grid gap-2 lg:grid-cols-[1fr_auto_auto] items-start">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск: семья, имена, email, теги…"
              className="rounded-xl border px-3 py-2 text-sm bg-background"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode((m) => (m === "OR" ? "AND" : "OR"))}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
                title="OR: любой тег, AND: все теги"
              >
                Режим: {mode}
              </button>

              <details className="relative">
                <summary className="cursor-pointer rounded-xl border px-3 py-2 text-sm hover:bg-muted select-none">
                  Теги ({tagFilter.length})
                </summary>

                <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border bg-white p-3 shadow-lg dark:bg-neutral-950">
                  <div className="text-xs text-neutral-500 mb-2">
                    Фильтр по тегам семей
                  </div>

                  <div className="max-h-64 overflow-auto space-y-2">
                    {tags.map((t) => {
                      const checked = tagFilter.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFilterTag(t.id)}
                          />
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: t.color ?? "#a3a3a3" }}
                          />
                          <span>{t.name}</span>
                        </label>
                      );
                    })}
                    {tags.length === 0 && (
                      <div className="text-sm text-neutral-500">
                        Пока нет тегов.
                      </div>
                    )}
                  </div>

                  {tagFilter.length > 0 && (
                    <button
                      className="mt-3 text-xs text-neutral-600 hover:underline"
                      onClick={() => setTagFilter([])}
                    >
                      Сбросить фильтр тегов
                    </button>
                  )}
                </div>
              </details>
            </div>

            <div className="text-xs text-neutral-500 lg:text-right pt-2">
              Показано: {filteredFamilies.length} • Выбрано семей:{" "}
              {selectedFamilyIds.length}
            </div>
          </div>

          {tagFilter.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tagFilter.map((id) => {
                const t = tags.find((x) => x.id === id);
                if (!t) return null;
                return (
                  <button
                    key={id}
                    onClick={() => removeFilterTag(id)}
                    className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs hover:bg-muted"
                    title="Убрать из фильтра"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: t.color ?? "#a3a3a3" }}
                    />
                    {t.name}
                    <span className="text-neutral-400">×</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="p-4 overflow-x-auto overflow-y-visible">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="text-xs text-neutral-500">
              <tr className="border-b">
                <th className="py-2 text-left w-10">✓</th>
                <th className="py-2 text-left">Семья</th>
                <th className="py-2 text-left">Глава</th>
                <th className="py-2 text-left">Супруг(а)</th>
                <th className="py-2 text-left">Дети</th>
                <th className="py-2 text-left">Теги</th>
                <th className="py-2 text-left">Email</th>
              </tr>
            </thead>

            <tbody>
              {filteredFamilies.map((f) => (
                <tr key={f.id} className="border-b last:border-b-0 align-top">
                  <td className="py-3">
                    <input
                      type="checkbox"
                      checked={Boolean(selected[f.id])}
                      onChange={(e) =>
                        setSelected((prev) => ({
                          ...prev,
                          [f.id]: e.target.checked,
                        }))
                      }
                    />
                  </td>

                  <td className="py-3 font-medium">{f.name}</td>

                  <td className="py-3">
                    {f.headName ? (
                      <div>{f.headName}</div>
                    ) : (
                      <div className="text-neutral-400">—</div>
                    )}
                  </td>

                  <td className="py-3">
                    {f.spouses.length ? (
                      <div className="space-y-1">
                        {f.spouses.map((s) => (
                          <div key={s}>{s}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-neutral-400">—</div>
                    )}
                  </td>

                  <td className="py-3">
                    {f.children.length ? (
                      <div className="space-y-1">
                        {f.children.slice(0, 3).map((c) => (
                          <div key={c.name}>
                            {c.name}
                            {typeof c.age === "number" ? (
                              <span className="text-xs text-neutral-500">
                                {" "}
                                · {c.age} лет
                              </span>
                            ) : null}
                          </div>
                        ))}
                        {f.children.length > 3 ? (
                          <div className="text-xs text-neutral-500">
                            + ещё {f.children.length - 3}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-neutral-400">—</div>
                    )}
                  </td>

                  <td className="py-3">
                    <div className="flex flex-wrap gap-2 items-start">
                      {f.tags.map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: t.color ?? "#a3a3a3" }}
                          />
                          {t.name}
                        </span>
                      ))}

                      <details className="relative">
                        <summary className="cursor-pointer text-xs text-neutral-500 hover:underline select-none">
                          Изменить
                        </summary>

                        <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border bg-white p-3 shadow-lg dark:bg-neutral-950">
                          <div className="text-xs text-neutral-500 mb-2">
                            Теги семьи
                          </div>

                          <div className="max-h-56 overflow-auto space-y-2">
                            {tags.map((t) => {
                              const checked = f.tags.some((x) => x.id === t.id);
                              return (
                                <label
                                  key={t.id}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) =>
                                      toggleTag(f.id, t.id, e.target.checked)
                                    }
                                  />
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{
                                      backgroundColor: t.color ?? "#a3a3a3",
                                    }}
                                  />
                                  <span>{t.name}</span>
                                </label>
                              );
                            })}
                            {tags.length === 0 && (
                              <div className="text-sm text-neutral-500">
                                Сначала создайте тег справа.
                              </div>
                            )}
                          </div>
                        </div>
                      </details>
                    </div>
                  </td>

                  <td className="py-3">
                    {f.emails.length ? (
                      <div className="space-y-1">
                        {f.emails.slice(0, 3).map((e) => (
                          <div
                            key={e}
                            className="text-xs text-neutral-700 dark:text-neutral-300"
                          >
                            {e}
                          </div>
                        ))}
                        {f.emails.length > 3 ? (
                          <div className="text-xs text-neutral-500">
                            + ещё {f.emails.length - 3}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-neutral-400">—</div>
                    )}
                  </td>
                </tr>
              ))}

              {filteredFamilies.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-sm text-neutral-500"
                  >
                    Ничего не найдено по текущим фильтрам.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT */}
      <div className="min-w-0 space-y-4">
        {/* Composer */}
        <div className="rounded-2xl border bg-white dark:bg-neutral-950 p-4">
          <div className="text-lg font-semibold">Рассылка по e-mail</div>
          <div className="text-xs text-neutral-500 mt-1">
            Получатели: {selectedEmails.length} • Выбрано семей:{" "}
            {selectedFamilyIds.length}
          </div>

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm">
              Тема
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-xl border px-3 py-2 bg-background"
                placeholder="Тема письма"
              />
            </label>

            <label className="grid gap-1 text-sm">
              Текст
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="min-h-[140px] rounded-xl border px-3 py-2 bg-background"
                placeholder="Введите текст рассылки..."
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                disabled={isPending}
                onClick={send}
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm",
                  "hover:bg-muted",
                  isPending && "opacity-60 cursor-not-allowed",
                )}
              >
                Отправить выбранным
              </button>

              <details className="relative">
                <summary className="cursor-pointer rounded-xl border px-3 py-2 text-sm hover:bg-muted select-none">
                  Emails ({selectedEmails.length})
                </summary>
                <div className="absolute right-0 z-50 mt-2 w-[360px] rounded-2xl border bg-white p-3 shadow-lg dark:bg-neutral-950">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="text-xs text-neutral-500">
                      Список получателей
                    </div>
                    <button
                      onClick={copyEmails}
                      className="text-xs text-neutral-600 hover:underline"
                      type="button"
                    >
                      Скопировать
                    </button>
                  </div>
                  <div className="max-h-56 overflow-auto text-xs space-y-1">
                    {selectedEmails.length ? (
                      selectedEmails.map((e) => <div key={e}>{e}</div>)
                    ) : (
                      <div className="text-neutral-500">
                        Пока никого не выбрано.
                      </div>
                    )}
                  </div>
                </div>
              </details>
            </div>

            {result && (
              <div className="text-sm">
                <span
                  className={cn(
                    result.startsWith("✅")
                      ? "text-emerald-600"
                      : "text-red-600",
                  )}
                >
                  {result}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-2xl border bg-white dark:bg-neutral-950 p-4">
          <div className="text-sm font-semibold">Превью письма</div>
          <div className="mt-3 rounded-2xl border p-4 bg-neutral-50 dark:bg-neutral-900/30">
            <div className="text-xs text-neutral-500">Menora Center</div>
            <div className="mt-2 text-base font-semibold">{subject || "—"}</div>
            <div
              className="mt-3 text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html:
                  previewHtml ||
                  "<span class='text-neutral-400'>Текст появится здесь…</span>",
              }}
            />
          </div>
        </div>

        {/* Create tag */}
        <div className="rounded-2xl border bg-white dark:bg-neutral-950 p-4">
          <div className="text-sm font-semibold">Создать тег семьи</div>
          <div className="mt-3 grid gap-2">
            <input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="rounded-xl border px-3 py-2 bg-background"
              placeholder='Например: "Потенциальный спонсор"'
            />
            <input
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="rounded-xl border px-3 py-2 bg-background"
              placeholder="#22c55e"
            />
            <button
              disabled={isPending}
              onClick={createTag}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm hover:bg-muted w-fit",
                isPending && "opacity-60 cursor-not-allowed",
              )}
            >
              Создать тег
            </button>
          </div>
        </div>

        {/* History */}
        <div className="rounded-2xl border bg-white dark:bg-neutral-950 p-4">
          <div className="text-sm font-semibold">История рассылок</div>
          <div className="text-xs text-neutral-500 mt-1">
            Последние 10 отправок
          </div>

          <div className="mt-3 divide-y rounded-2xl border">
            {broadcasts.length ? (
              broadcasts.map((b) => (
                <div key={b.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {b.subject}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {formatDate(b.createdAt)}
                      </div>
                    </div>

                    <span
                      className={cn(
                        "text-xs rounded-full border px-2 py-1",
                        b.status === "DONE" &&
                          "text-emerald-700 border-emerald-200 bg-emerald-50",
                        b.status === "FAILED" &&
                          "text-red-700 border-red-200 bg-red-50",
                        (b.status === "SENDING" || b.status === "QUEUED") &&
                          "text-neutral-700 border-neutral-200 bg-neutral-50",
                        b.status === "DRAFT" &&
                          "text-neutral-500 border-neutral-200 bg-transparent",
                      )}
                    >
                      {statusRu(b.status)}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-neutral-600 flex gap-3">
                    <span>✅ {b.sent}</span>
                    <span>❌ {b.failed}</span>
                    <span>⏳ {b.queued}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-sm text-neutral-500">
                Пока нет рассылок.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
