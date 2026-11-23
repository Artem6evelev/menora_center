"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Flame,
  Maximize,
  Minimize,
  Moon,
  RefreshCw,
  Settings2,
  Sun,
  Sunrise,
  WifiOff,
  X,
} from "lucide-react";
import { communityContact } from "@/lib/telegram/contact";
import {
  boardHebrewDate,
  chabadSourceUrl,
  formatCalendarDate,
  israelClock,
  israelDate,
  nextZman,
  ZMANIM_LOCATION,
  type Zman,
  type ZmanimData,
} from "@/lib/zmanim/shared";
import styles from "./zmanim-board.module.css";
import HolidayStrip, { holidayThemeStyle } from "./holiday-strip";
import HolidayArtwork from "./holiday-art";
import {
  HOLIDAYS,
  CHABAD_CALENDAR_SOURCE,
  type HolidayCalendar,
} from "@/lib/zmanim/holiday-catalog";
import {
  boardHolidays,
  validHolidayCalendar,
} from "@/lib/zmanim/holiday-display";

const columns = [
  {
    title: "Утро",
    subtitle: "Начало нового дня",
    icon: Sunrise,
    keys: [
      "AlosHashachar",
      "EarliestTefillin",
      "NetzHachamah",
      "LatestShema",
      "LatestTefillah",
    ],
  },
  {
    title: "День",
    subtitle: "От полудня до вечера",
    icon: Sun,
    keys: ["Chatzos", "MinchahGedolah", "MinchahKetanah", "PlagHaminchah"],
  },
  {
    title: "Вечер",
    subtitle: "Завершение дня",
    icon: Moon,
    keys: ["Shkiah", "Tzeis", "FastEnds", "ShabbatEndTime", "ChatzosNight"],
  },
];

function TimeRow({ time, active }: { time: Zman; active: boolean }) {
  return (
    <div
      className={`${styles.row} ${active ? styles.active : ""}`}
      data-zman={time.key}
    >
      <div className={styles.rowLabel}>
        {time.label}
        {time.note && (
          <span className={styles.noteMark} title={time.note}>
            *
          </span>
        )}
      </div>
      <div className={styles.rowValue}>
        <span>{time.time}</span>
        {time.dayOffset === 1 && <small>завтра</small>}
      </div>
    </div>
  );
}

export default function ZmanimBoard({
  initialData,
  initialCalendar = null,
  initialNow,
}: {
  initialData: ZmanimData | null;
  initialCalendar?: HolidayCalendar | null;
  initialNow: number;
}) {
  const [now, setNow] = useState(initialNow);
  const [data, setData] = useState(initialData);
  const [calendar, setCalendar] = useState(initialCalendar);
  const [lastSuccess, setLastSuccess] = useState(
    initialData ? initialNow : null,
  );
  const [offline, setOffline] = useState(!initialData);
  const [revision, setRevision] = useState(0);
  const [controls, setControls] = useState(true);
  const [settings, setSettings] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [screenMessage, setScreenMessage] = useState("");
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const settingsDialog = useRef<HTMLDialogElement>(null);
  const today = israelDate(now),
    clock = israelClock(now);
  // Never label yesterday's cached times as today's during a midnight network outage.
  const visible = data?.date === today ? data : null;
  const hebrewDate = boardHebrewDate(
    today,
    visible?.times ?? [],
    clock.minuteOfDay,
  );
  const next = visible
    ? nextZman(
        [
          ...visible.times,
          ...(visible.previousNight ? [visible.previousNight] : []),
        ],
        clock.minuteOfDay,
      )
    : null;
  const holidays = useMemo(
    () =>
      boardHolidays(calendar, today, clock.minuteOfDay, visible?.times ?? []),
    [calendar, today, clock.minuteOfDay, visible?.times],
  );
  const currentHoliday = holidays.current
    ? HOLIDAYS[holidays.current.definitionId]
    : null;

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const requestTimeout = setTimeout(() => controller.abort(), 20000);
    let active = true,
      timer: ReturnType<typeof setTimeout>;
    void (async () => {
      let delay = 30000;
      try {
        const response = await fetch("/api/zmanim?date=" + today, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result: ZmanimData & { calendar?: HolidayCalendar } =
          await response.json();
        if (
          active &&
          validHolidayCalendar(result.calendar) &&
          result.calendar.generatedFor === today
        )
          setCalendar(result.calendar);
        if (!response.ok) throw new Error("Unavailable");
        if (
          result.date !== today ||
          result.source !== "Chabad.org" ||
          result.locationId !== "1-853" ||
          !Array.isArray(result.times)
        )
          throw new Error("Unexpected day");
        if (active) {
          setData(result);
          setLastSuccess(Date.now());
          setOffline(false);
        }
        delay = 15 * 60000;
      } catch {
        if (active) setOffline(true);
      } finally {
        clearTimeout(requestTimeout);
        if (active) timer = setTimeout(() => setRevision((n) => n + 1), delay);
      }
    })();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(requestTimeout);
      clearTimeout(timer);
    };
  }, [today, revision]);

  useEffect(() => {
    if (settings) settingsDialog.current?.showModal();
  }, [settings]);

  useEffect(() => {
    if (!screenMessage) return;
    const timer = setTimeout(() => setScreenMessage(""), 10000);
    return () => clearTimeout(timer);
  }, [screenMessage]);

  useEffect(() => {
    let active = true;
    let requesting = false;
    const acquire = async () => {
      if (
        document.visibilityState !== "visible" ||
        !navigator.wakeLock ||
        wakeLock.current ||
        requesting
      )
        return;
      requesting = true;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (!active) {
          await lock.release();
          return;
        }
        wakeLock.current = lock;
        lock.addEventListener("release", () => {
          if (wakeLock.current === lock) wakeLock.current = null;
        });
      } catch {
        /* TV sleep also depends on device settings; the clock keeps working. */
      } finally {
        requesting = false;
      }
    };
    const resume = () => {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        setRevision((n) => n + 1);
        void acquire();
      }
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    window.addEventListener("focus", resume);
    void acquire();
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
      window.removeEventListener("focus", resume);
      void wakeLock.current?.release();
      wakeLock.current = null;
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reveal = () => {
      setControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => setControls(false), 7000);
    };
    reveal();
    window.addEventListener("pointermove", reveal);
    window.addEventListener("pointerdown", reveal);
    window.addEventListener("keydown", reveal);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", reveal);
      window.removeEventListener("pointerdown", reveal);
      window.removeEventListener("keydown", reveal);
    };
  }, []);

  useEffect(() => {
    const change = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else
        setScreenMessage(
          "Включите полноэкранный режим в меню браузера телевизора.",
        );
    } catch {
      setScreenMessage(
        "Включите полноэкранный режим в меню браузера телевизора.",
      );
    }
  }

  const minchaNote = visible?.times.find(
    (time) => time.key === "MinchahGedolah",
  )?.note;
  const special =
    visible?.times.filter((time) =>
      ["CandleLighting", "LastEatingChametzTime", "BurnChametzTime"].includes(
        time.key,
      ),
    ) ?? [];

  return (
    <main
      className={styles.board}
      style={holidayThemeStyle(holidays.current)}
      data-zmanim-board
      data-board-holiday={holidays.current?.definitionId ?? ""}
      data-board-tone={currentHoliday?.tone ?? ""}
      lang="ru"
    >
      <header className={styles.header}>
        <Link
          href="/"
          prefetch={false}
          className={styles.brand}
          aria-label="Menorah Center — на главную"
        >
          <Image
            src="/logos/menora-logo-dark.svg"
            alt=""
            width={160}
            height={160}
            priority
            className={styles.logo}
          />
          <div>
            <span className={styles.brandTitle}>Menorah Center</span>
            <span className={styles.location}>{ZMANIM_LOCATION}</span>
          </div>
        </Link>
        <div className={styles.calendar}>
          <h1>Зманим{hebrewDate !== today ? " · после захода солнца" : ""}</h1>
          <p>{formatCalendarDate(hebrewDate, true)}</p>
          <div className={styles.gregorian}>{formatCalendarDate(today)}</div>
        </div>
        <div className={styles.clockBlock}>
          <time
            className={styles.clock}
            dateTime={new Date(now).toISOString()}
            aria-label={`Время в Израиле ${clock.hours}:${clock.minutes}:${clock.seconds}`}
          >
            {clock.hours}
            <span className={styles.colon}>:</span>
            {clock.minutes}
            <small>{clock.seconds}</small>
          </time>
          <span className={styles.clockCaption}>Местное время Израиля</span>
        </div>
      </header>

      <section
        className={styles.next}
        aria-label="Ближайший зман"
        data-next-zman={next?.key ?? ""}
      >
        {currentHoliday && (
          <div className={styles.nextHolidayArt}>
            <HolidayArtwork art={currentHoliday.art} />
          </div>
        )}
        <div
          className={`${styles.nextLabel} ${currentHoliday ? styles.nextLabelHoliday : ""}`}
        >
          <span className={styles.dot} />
          Ближайший зман
          {currentHoliday && (
            <small className={styles.currentHolidayTitle}>
              {currentHoliday.title}
            </small>
          )}
        </div>
        <div className={styles.nextName}>
          {next?.label ??
            (visible ? "Все зманим дня завершены" : "Обновляем время дня")}
        </div>
        <div className={styles.nextTime}>
          {next?.time ?? "—"}
          {next?.dayOffset === 1 && <small>завтра</small>}
        </div>
      </section>

      {visible ? (
        <div className={styles.columns}>
          {columns.map((column, index) => (
            <section
              className={`${styles.column} ${index === 1 && special.length > 1 ? styles.busyColumn : ""}`}
              key={column.title}
              aria-label={column.title}
            >
              <div className={styles.columnHead}>
                <column.icon aria-hidden="true" />
                <div>
                  <h2>{column.title}</h2>
                  <p>{column.subtitle}</p>
                </div>
                <span className={styles.sectionNumber}>0{index + 1}</span>
              </div>
              <div className={styles.rows}>
                {column.keys.flatMap((key) => {
                  const time = visible.times.find((t) => t.key === key);
                  return time
                    ? [
                        <TimeRow
                          key={key}
                          time={time}
                          active={next?.key === key}
                        />,
                      ]
                    : [];
                })}
                {index === 1 &&
                  special.map((time) => (
                    <TimeRow
                      key={time.key}
                      time={time}
                      active={next?.key === time.key}
                    />
                  ))}
              </div>
              {index === 1 && (
                <div className={styles.minchaNote}>
                  {minchaNote && <p>* {minchaNote}</p>}
                  {visible.proportionalHour && (
                    <p>
                      Галахический час: <b>{visible.proportionalHour}</b>
                    </p>
                  )}
                </div>
              )}
              {index === 2 && (
                <div className={styles.shabbat} aria-label="Шаббат и праздники">
                  <h3>
                    <Flame aria-hidden="true" />
                    Шаббат и праздники
                  </h3>
                  {[
                    {
                      date: visible.shabbat.friday,
                      time: visible.shabbat.candles,
                    },
                    {
                      date: visible.shabbat.saturday,
                      time: visible.shabbat.ending,
                    },
                  ].map((entry) => (
                    <div className={styles.shabbatRow} key={entry.date}>
                      <div>
                        <span>
                          {entry.time?.label ?? "Подробнее на Chabad.org"}
                        </span>
                        <small>
                          {new Intl.DateTimeFormat("ru-RU", {
                            timeZone: "Asia/Jerusalem",
                            day: "numeric",
                            month: "long",
                            weekday: "short",
                          }).format(new Date(entry.date + "T12:00:00Z"))}
                        </small>
                      </div>
                      <strong>{entry.time?.time ?? "—"}</strong>
                    </div>
                  ))}
                  {visible.shabbat.ending?.note && (
                    <p className={styles.festivalNote}>
                      {visible.shabbat.ending.note}
                    </p>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <section className={styles.unavailable} role="status">
          {offline ? (
            <WifiOff aria-hidden="true" />
          ) : (
            <RefreshCw aria-hidden="true" />
          )}
          <h2>{offline ? "Ожидаем данные Chabad.org" : "Загружаем зманим"}</h2>
          <p>
            Обновление происходит автоматически. Время за другую дату не
            показываем.
          </p>
          <a
            href={chabadSourceUrl(today)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Посмотреть время на Chabad.org <ArrowUpRight size={20} />
          </a>
        </section>
      )}

      <HolidayStrip
        events={holidays.upcoming}
        date={today}
        minute={clock.minuteOfDay}
        times={visible?.times ?? []}
      />

      <footer className={styles.footer}>
        <p>
          По обычаям Хабад <span>·</span> Источник:{" "}
          <a
            href={chabadSourceUrl(today)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Chabad.org
          </a>
          <span>·</span>
          <span>Календарь: Hebcal / Chabad</span>
        </p>
        <p
          className={offline ? styles.connectionWarning : styles.connection}
          role="status"
        >
          {offline ? (
            <>
              <WifiOff />
              Нет связи · повторяем автоматически
            </>
          ) : (
            <>
              <Check />
              Обновлено{" "}
              {lastSuccess
                ? `${israelClock(lastSuccess).hours}:${israelClock(lastSuccess).minutes}`
                : "—"}
            </>
          )}
        </p>
      </footer>

      <div
        className={`${styles.controls} ${controls || settings ? styles.controlsVisible : ""}`}
      >
        <button
          type="button"
          aria-label={fullscreen ? "Выйти из полного экрана" : "На весь экран"}
          onClick={() => void toggleFullscreen()}
        >
          {fullscreen ? <Minimize /> : <Maximize />}
        </button>
        <button
          type="button"
          aria-label="Настройки табло"
          onClick={() => setSettings(true)}
        >
          <Settings2 />
        </button>
      </div>
      {screenMessage && (
        <p className={styles.screenMessage} role="status">
          {screenMessage}
        </p>
      )}
      {settings && (
        <dialog
          ref={settingsDialog}
          className={styles.settings}
          aria-label="Настройки табло"
          onCancel={() => setSettings(false)}
        >
          <button
            autoFocus
            className={styles.close}
            aria-label="Закрыть настройки"
            onClick={() => setSettings(false)}
          >
            <X />
          </button>
          <h2>Табло для синагоги</h2>
          <p>
            Время и дата обновляются автоматически. Местонахождение: Ришон
            ле-Цион, Израиль. Расчёты Chabad.org, по обычаям Хабад.
          </p>
          <p>
            Галахические сроки не являются расписанием миньянов. Время молитв в
            центре можно уточнить в общине.
          </p>
          <p>
            Праздники показаны по календарю Израиля. Хабадские даты сверены с{" "}
            <a
              className="underline"
              href={CHABAD_CALENDAR_SOURCE}
              target="_blank"
              rel="noopener noreferrer"
            >
              календарём Chabad
            </a>
            . Перевод дат и перенесённые посты —{" "}
            <a
              className="underline"
              href="https://www.hebcal.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hebcal
            </a>
            . Расчёт зманим по-прежнему выполняет Chabad.org.
          </p>
          <p>
            Не откладывайте исполнение заповедей до последней минуты. Настройки
            сна телевизора регулируются на самом устройстве.
          </p>
          <div className={styles.settingActions}>
            <button onClick={() => void toggleFullscreen()}>
              <Maximize />
              На весь экран
            </button>
            <button
              onClick={() => {
                setRevision((n) => n + 1);
                setSettings(false);
              }}
            >
              <RefreshCw />
              Обновить данные
            </button>
            <a
              href={communityContact.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Связаться с общиной · WhatsApp
            </a>
            <Link href="/">Вернуться на сайт</Link>
          </div>
        </dialog>
      )}
    </main>
  );
}
