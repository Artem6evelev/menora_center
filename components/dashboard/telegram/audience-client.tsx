"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getTelegramAudience,
  previewTelegramBroadcast,
  queueTelegramBroadcast,
  runTelegramQueue,
  getTelegramBroadcastHistory,
} from "@/actions/telegram-broadcast";
import type {
  AudienceFilter,
  AudienceSelection,
} from "@/lib/telegram/audience";
import { updateBotSettings } from "@/actions/bot-settings";
import CityPicker from "@/components/community/city-picker";
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
    [data, setData] = useState<Audience>({ rows: [], total: 0, page: 1 }),
    [page, setPage] = useState(1);
  const [all, setAll] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [excluded, setExcluded] = useState<string[]>([]),
    [count, setCount] = useState(0);
  const [message, setMessage] = useState(""),
    [eventId, setEventId] = useState(""),
    [buttonLabel, setButtonLabel] = useState("Открыть мероприятие"),
    [preview, setPreview] = useState(false);
  const [requestKey, setRequestKey] = useState(""),
    [busy, setBusy] = useState(false),
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
    setPreview(false);
    setRequestKey("");
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
  useEffect(() => {
    getTelegramBroadcastHistory()
      .then(setHistory)
      .catch(() => {});
  }, []);
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
  async function showPreview() {
    setBusy(true);
    setError("");
    try {
      const current = await previewTelegramBroadcast(selection);
      setCount(current.count);
      if (!current.count)
        throw new Error("Нет получателей с явной подпиской и доступным чатом");
      if (!message.trim()) throw new Error("Введите сообщение");
      setPreview(true);
      setRequestKey(crypto.randomUUID());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка предпросмотра");
    } finally {
      setBusy(false);
    }
  }
  async function enqueue() {
    setBusy(true);
    setError("");
    try {
      const result = await queueTelegramBroadcast({
        requestKey,
        message,
        selection,
        ...(eventId ? { eventId, buttonLabel } : {}),
      });
      if (!result.success) throw new Error(result.error);
      setNotice(`В очереди: ${result.count}. Сообщения ещё не отправлены.`);
      setHistory(await getTelegramBroadcastHistory());
      setPreview(false);
      setRequestKey("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка очереди");
    } finally {
      setBusy(false);
    }
  }
  return (
    <fieldset
      disabled={busy}
      className="min-w-0 space-y-6 text-slate-900"
      data-telegram-audience
    >
      <header>
        <h1 className="text-3xl font-bold">Telegram · Community CRM</h1>
        <p className="text-slate-600">
          Люди из общей базы. Отправка доступна только при явной подписке и
          известном чате.
        </p>
      </header>
      <section className="rounded-3xl bg-white border p-5 space-y-4">
        <h2 className="text-xl font-bold">Аудитория</h2>
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
            Анонсы
            <select
              className="border rounded-xl p-3 w-full"
              value={filters.marketing || ""}
              onChange={(e) =>
                filter({
                  marketing: (e.target.value ||
                    undefined) as AudienceFilter["marketing"],
                })
              }
            >
              <option value="">Все</option>
              <option value="subscribed">Подписан</option>
              <option value="unsubscribed">Отписан</option>
              <option value="unknown">Не включены</option>
              <option value="blocked">Заблокирован</option>
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
            Выбрать всех по фильтру ({data.total})
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
                <th className="text-start">Анонсы</th>
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
                      checked={
                        all
                          ? !excluded.includes(row.id)
                          : selected.includes(row.id)
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
                    {
                      (
                        {
                          unknown: "Не включены",
                          subscribed: "Подписан",
                          unsubscribed: "Отписан",
                          blocked: "Заблокирован",
                        } as Record<string, string>
                      )[row.marketing]
                    }
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
      <section
        className="rounded-3xl bg-white border p-5 space-y-4"
        data-broadcast-composer
      >
        <h2 className="text-xl font-bold">Новое сообщение</h2>
        <p>
          Обычный текст, без HTML. Перед постановкой в очередь аудитория
          проверяется повторно.
        </p>
        <label className="block">
          Сообщение
          <textarea
            className="w-full border rounded-xl p-3 min-h-36"
            maxLength={3500}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setPreview(false);
            }}
          />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label>
            ID события (необязательно)
            <input
              className="border rounded-xl p-3 w-full"
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value);
                setPreview(false);
              }}
            />
          </label>
          <label>
            Текст кнопки
            <input
              className="border rounded-xl p-3 w-full"
              maxLength={60}
              value={buttonLabel}
              onChange={(e) => {
                setButtonLabel(e.target.value);
                setPreview(false);
              }}
            />
          </label>
        </div>
        <button
          className="bg-[#020022] text-white rounded-xl px-5 py-3"
          disabled={busy}
          onClick={() => void showPreview()}
        >
          Предпросмотр
        </button>
        {preview && (
          <div className="border rounded-2xl bg-slate-50 p-5 space-y-3">
            <p className="whitespace-pre-wrap break-words">{message}</p>
            {eventId && (
              <p className="font-bold">{buttonLabel} → мероприятие</p>
            )}
            <p>Получателей: {count}</p>
            <button
              className="bg-[#020022] text-white rounded-xl px-5 py-3"
              disabled={busy}
              onClick={() => void enqueue()}
            >
              Поставить в очередь
            </button>
          </div>
        )}
      </section>
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
      <section className="rounded-3xl bg-white border p-5 space-y-4">
        <h2 className="text-xl font-bold">Очередь</h2>
        <p>
          Ручная обработка отправляет до 5 сообщений. Используйте после
          отдельного разрешения на реальные отправки.
        </p>
        <button
          className="border rounded-xl p-3"
          disabled={busy}
          onClick={async () => {
            if (
              !window.confirm("Отправить до 5 реальных сообщений из очереди?")
            )
              return;
            setBusy(true);
            try {
              const result = await runTelegramQueue();
              setNotice(
                `Обработано: ${result.processed}; доставлено: ${result.delivered}`,
              );
              setHistory(await getTelegramBroadcastHistory());
            } catch {
              setError("Не удалось обработать очередь");
            } finally {
              setBusy(false);
            }
          }}
        >
          Обработать пачку
        </button>
        {history.map((row) => (
          <p key={row.id}>
            {new Date(row.createdAt).toLocaleString("ru-RU")} · {row.status} ·
            получателей {row.count} · доставлено {row.delivered} · ошибки /
            неопределённые {row.failed}
          </p>
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
