import { memo, type CSSProperties } from "react";
import {
  HOLIDAYS,
  HOLIDAY_PALETTES,
  type HolidayOccurrence,
} from "@/lib/zmanim/holiday-catalog";
import {
  holidayDateLabel,
  holidayHebrewLabel,
  holidayPhase,
} from "@/lib/zmanim/holiday-display";
import type { Zman } from "@/lib/zmanim/shared";
import HolidayArtwork from "./holiday-art";
import styles from "./zmanim-board.module.css";

export function holidayThemeStyle(
  event: HolidayOccurrence | null,
): CSSProperties | undefined {
  if (!event) return;
  const palette = HOLIDAY_PALETTES[HOLIDAYS[event.definitionId].palette];
  return {
    "--holiday-deep": palette.deep,
    "--holiday-accent": palette.accent,
    "--holiday-wash": palette.wash,
    "--holiday-ink": palette.ink,
  } as CSSProperties;
}

function HolidayStrip({
  events,
  date,
  minute,
  times,
}: {
  events: HolidayOccurrence[];
  date: string;
  minute: number;
  times: Zman[];
}) {
  return (
    <section
      className={styles.holidayStrip}
      aria-label="Ближайшие праздники"
      data-upcoming-holidays
    >
      <div className={styles.holidayStripLabel}>
        <span>Календарь общины</span>
        <h2>
          Ближайшие <br />
          праздники
        </h2>
      </div>
      <div className={styles.holidayCards}>
        {events.length ? (
          events.map((event) => {
            const definition = HOLIDAYS[event.definitionId],
              active = holidayPhase(event, date, minute, times) === "active";
            return (
              <article
                key={event.id}
                className={`${styles.holidayCard} ${active ? styles.holidayCardActive : ""}`}
                style={holidayThemeStyle(event)}
                data-holiday-id={event.definitionId}
                data-holiday-active={active ? "true" : "false"}
                data-holiday-tone={definition.tone}
              >
                <div className={styles.holidayCardArt}>
                  <HolidayArtwork art={definition.art} />
                </div>
                <div className={styles.holidayCardCopy}>
                  <div className={styles.holidayKind}>
                    {active ? "Сегодня · " : ""}
                    {definition.kind === "chabad"
                      ? definition.tone === "memorial"
                        ? "Памятная дата Хабада"
                        : "Хабадская дата"
                      : definition.kind === "fast"
                        ? event.observed
                          ? "Перенесённый пост"
                          : "День поста"
                        : definition.kind === "new-month"
                          ? "Новомесячье"
                          : event.definitionId === "yom-kippur"
                            ? "День молитвы и поста"
                            : "Еврейский праздник"}
                  </div>
                  <h3>{definition.title}</h3>
                  <p>
                    {holidayHebrewLabel(event)} <span>·</span>{" "}
                    {holidayDateLabel(event)}
                  </p>
                </div>
              </article>
            );
          })
        ) : (
          <p className={styles.calendarPending}>
            Календарь обновляется автоматически
          </p>
        )}
      </div>
    </section>
  );
}
export default memo(HolidayStrip);
