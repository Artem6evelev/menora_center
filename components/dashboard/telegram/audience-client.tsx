"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getTelegramAudience,
  previewTelegramBroadcast,
  getTelegramBroadcastHistory,
} from "@/actions/telegram-broadcast";
import type {
  AudienceFilter,
  AudienceSelection,
} from "@/lib/telegram/audience";
import { updateBotSettings } from "@/actions/bot-settings";
import CityPicker from "@/components/community/city-picker";
import BroadcastComposer from "./broadcast-composer";
import BroadcastDelivery from "./broadcast-delivery";
type Audience = Awaited<ReturnType<typeof getTelegramAudience>>;
export default function TelegramAudience({
  settings,
}: {
  settings: {
    notificationGroupId: string;
    eventsTopicId: string;
    servicesTopicId: string;
  };
}) {
  const [filters, setFilters] = useState<AudienceFilter>({ search: "" }),
    [data, setData] = useState<Audience>({
      rows: [],
      total: 0,
      reachableTotal: 0,
      page: 1,
    }),
    [page, setPage] = useState(1);
  const [all, setAll] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [excluded, setExcluded] = useState<string[]>([]),
    [count, setCount] = useState(0);
  const [sending, setSending] = useState(false),
    [activeBroadcast, setActiveBroadcast] = useState<string | null>(null),
    [deliveryAttempt, setDeliveryAttempt] = useState(0);
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const [history, setHistory] = useState<
      Awaited<ReturnType<typeof getTelegramBroadcastHistory>>
    >([]),
    [config, setConfig] = useState(settings),
    [city, setCity] = useState("");
  const selection: AudienceSelection = {
    filters,
    allFiltered: all,
    selected,
    excluded,
  };
  const loadSequence = useRef(0);
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    try {
      const result = await getTelegramAudience(filters, page);
      if (sequence !== loadSequence.current) return;
      setData(result);
      setError("");
    } catch {
      setError("Не удалось загрузить аудиторию");
    }
  }, [filters, page]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      previewTelegramBroadcast({
        filters,
        allFiltered: all,
        selected,
        excluded,
      })
        .then((value) => {
          if (active) setCount(value.count);
        })
        .catch(() => {
          if (active) setCount(0);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters, all, selected, excluded]);
  const refreshHistory = useCallback(() => {
    void getTelegramBroadcastHistory()
      .then(setHistory)
      .catch(() => {});
  }, []);
  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);
  function filter(value: Partial<AudienceFilter>) {
    setFilters((old) => ({ ...old, ...value }));
    setPage(1);
    setAll(false);
    setSelected([]);
    setExcluded([]);
  }
  function toggle(id: string, checked: boolean) {
    if (all)
      setExcluded((old) =>
        checked ? old.filter((x) => x !== id) : [...old, id],
      );
    else
      setSelected((old) =>
        checked ? [...old, id] : old.filter((x) => x !== id),
      );
  }
  return (
    <fieldset
      disabled={busy || sending}
      className="min-w-0 space-y-6 text-slate-900"
      data-telegram-audience
    >
      <header>
        <h1 className="text-3xl font-bold">Telegram · Рассылки</h1>
        <p className="text-slate-600">
          Рассылка всем выбранным участникам с доступным Telegram-чатом. Прежний
          статус подписки не ограничивает отправку.
        </p>
      </header>
      <section className="rounded-3xl bg-white border p-5 space-y-4">
        <h2 className="text-xl font-bold">Аудитория</h2>
        <p className="text-sm text-slate-600" data-telegram-reachability>
          В базе: {data.total}. Доступных Telegram-чатов: {data.reachableTotal}.
          Без чата или при блокировке бота доставка невозможна.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label>
            Имя / username
            <input
              className="border rounded-xl p-3 w-full"
              value={filters.search || ""}
              onChange={(e) => filter({ search: e.target.value })}
            />
          </label>
          <label>
            Категория
            <select
              className="border rounded-xl p-3 w-full"
              value={filters.affiliation || ""}
              onChange={(e) =>
                filter({
                  affiliation: (e.target.value ||
                    undefined) as AudienceFilter["affiliation"],
                })
              }
            >
              <option value="">Все</option>
              <option value="maternal">По материнской линии</option>
              <option value="giyur">Гиюр</option>
              <option value="none">Нет галахического еврейства</option>
            </select>
          </label>
          <label>
            Пол
            <select
              className="border rounded-xl p-3 w-full"
              value={filters.gender || ""}
              onChange={(e) =>
                filter({
                  gender: (e.target.value ||
                    undefined) as AudienceFilter["gender"],
                })
              }
            >
              <option value="">Все</option>
              <option value="female">Женский</option>
              <option value="male">Мужской</option>
            </select>
          </label>
          <label>
            Город
            <CityPicker
              required={false}
              value={city}
              cityId={filters.cityId || null}
              onChange={(value, id) => {
                setCity(value);
                filter({ cityId: id || undefined });
              }}
            />
          </label>
          <label>
            Telegram
            <select
              className="border rounded-xl p-3 w-full"
              value={filters.linked === undefined ? "" : String(filters.linked)}
              onChange={(e) =>
                filter({
                  linked:
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "true",
                })
              }
            >
              <option value="">Все</option>
              <option value="true">Привязан</option>
              <option value="false">Не привязан</option>
            </select>
          </label>
          <label>
            Доставка
            <select
              className="border rounded-xl p-3 w-full"
              value={filters.delivery || ""}
              onChange={(e) =>
                filter({
                  delivery: (e.target.value ||
                    undefined) as AudienceFilter["delivery"],
                })
              }
            >
              <option value="">Все</option>
              <option value="reachable">Доступна</option>
              <option value="unreachable">Недоступна</option>
            </select>
          </label>
          {(["profileComplete", "filterComplete"] as const).map((key) => (
            <label key={key}>
              {key === "profileComplete" ? "Анкета" : "Фильтр"}
              <select
                className="border rounded-xl p-3 w-full"
                value={filters[key] === undefined ? "" : String(filters[key])}
                onChange={(e) =>
                  filter({
                    [key]:
                      e.target.value === ""
                        ? undefined
                        : e.target.value === "true",
                  })
                }
              >
                <option value="">Все</option>
                <option value="true">Заполнен</option>
                <option value="false">Не заполнен</option>
              </select>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            className="border rounded-xl p-3"
            onClick={() => {
              setAll(true);
              setSelected([]);
              setExcluded([]);
            }}
          >
            Выбрать все доступные чаты ({data.reachableTotal})
          </button>
          <button
            className="border rounded-xl p-3"
            onClick={() => {
              setAll(false);
              setSelected([]);
              setExcluded([]);
            }}
          >
            Снять выбор
          </button>
          <p role="status">
            Получателей: <b>{count}</b>
            {all ? " · вся аудитория по фильтру" : ""}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-3">Выбор</th>
                <th className="text-start">Человек</th>
                <th className="text-start">Город</th>
                <th className="text-start">Telegram</th>
                <th className="text-start">Доставка</th>
                <th className="text-start">Анкета / фильтр</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr className="border-t" key={row.id}>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      aria-label={`Выбрать ${row.firstName || "участника"}`}
                      disabled={!row.reachable}
                      checked={
                        row.reachable &&
                        (all
                          ? !excluded.includes(row.id)
                          : selected.includes(row.id))
                      }
                      onChange={(e) => toggle(row.id, e.target.checked)}
                    />
                  </td>
                  <td className="p-3">
                    {row.firstName} {row.lastName}
                  </td>
                  <td>{row.city || "—"}</td>
                  <td>
                    {row.linked
                      ? row.username
                        ? `@${row.username}`
                        : "Привязан"
                      : "Нет"}
                    {row.linked && !row.reachable ? " · чат недоступен" : ""}
                  </td>
                  <td>
                    {row.reachable
                      ? "Доступна"
                      : row.linked
                        ? "Чат недоступен"
                        : "Нет Telegram-чата"}
                  </td>
                  <td>
                    {row.profileComplete ? "✓" : "—"} /{" "}
                    {row.filterComplete ? "✓" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-4">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Назад
          </button>
          <span>
            {page} · всего {data.total}
          </span>
          <button
            disabled={page * 20 >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </button>
        </div>
      </section>
      <BroadcastComposer
        selection={selection}
        count={count}
        busy={busy || sending}
        onBusyChange={setBusy}
        onQueued={(id, value) => {
          setNotice(
            `Рассылка создана для ${value} получателей. Отправка начинается.`,
          );
          setActiveBroadcast(id);
          setDeliveryAttempt((n) => n + 1);
          refreshHistory();
        }}
      />
      {activeBroadcast && (
        <BroadcastDelivery
          key={`${activeBroadcast}:${deliveryAttempt}`}
          id={activeBroadcast}
          onSending={setSending}
          onUpdate={refreshHistory}
        />
      )}

      {error && (
        <p role="alert" className="text-red-700 p-4 bg-red-50 rounded-xl">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-green-800 p-4 bg-green-50 rounded-xl">
          {notice}
        </p>
      )}
      <section
        className="rounded-3xl bg-white border p-5 space-y-4"
        data-broadcast-history
      >
        <h2 className="text-xl font-bold">История рассылок</h2>
        {!history.length && (
          <p className="text-slate-600">
            Здесь появятся отправленные и незавершённые рассылки.
          </p>
        )}
        {history.map((row) => (
          <article
            key={row.id}
            data-broadcast-id={row.id}
            className="rounded-2xl border p-4 space-y-2 min-w-0"
          >
            <p className="font-medium whitespace-pre-wrap break-words line-clamp-2">
              {row.message}
            </p>
            <p className="text-sm text-slate-600">
              {new Date(row.createdAt).toLocaleString("ru-RU")} ·{" "}
              {row.status === "cancelled"
                ? "Отменена"
                : row.queued || row.sending
                  ? "Не завершена"
                  : "Завершена"}
            </p>
            <p>
              Доставлено: {row.delivered} из {row.count}
              {row.failed + row.unknown > 0
                ? ` · не доставлено / требуют проверки: ${row.failed + row.unknown}`
                : ""}
              {row.skipped > 0 ? ` · пропущено: ${row.skipped}` : ""}
            </p>
            {row.status === "queued" && (row.queued > 0 || row.sending > 0) && (
              <button
                type="button"
                className="rounded-xl border px-4 py-3 font-bold"
                disabled={busy || sending}
                onClick={() => {
                  if (
                    window.confirm(
                      `Продолжить эту рассылку оставшимся получателям (${row.queued + row.sending})? Уже доставленные сообщения не будут отправлены повторно.`,
                    )
                  ) {
                    setActiveBroadcast(row.id);
                    setDeliveryAttempt((n) => n + 1);
                    refreshHistory();
                  }
                }}
              >
                Продолжить отправку — осталось {row.queued + row.sending}
              </button>
            )}
          </article>
        ))}
      </section>
      <section className="rounded-3xl bg-white border p-5 space-y-4">
        <h2 className="text-xl font-bold">
          Существующие настройки уведомлений
        </h2>
        {(
          ["notificationGroupId", "eventsTopicId", "servicesTopicId"] as const
        ).map((key) => (
          <label className="block" key={key}>
            {
              {
                notificationGroupId: "Группа",
                eventsTopicId: "Тема мероприятий",
                servicesTopicId: "Тема услуг",
              }[key]
            }
            <input
              className="border rounded-xl p-3 w-full"
              value={config[key]}
              onChange={(e) =>
                setConfig((old) => ({ ...old, [key]: e.target.value }))
              }
            />
          </label>
        ))}
        <button
          className="border rounded-xl p-3"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await updateBotSettings(config);
              if (!r.success) throw new Error();
              setNotice("Настройки сохранены");
            } catch {
              setError("Не удалось сохранить настройки");
            } finally {
              setBusy(false);
            }
          }}
        >
          Сохранить настройки
        </button>
      </section>
    </fieldset>
  );
}
