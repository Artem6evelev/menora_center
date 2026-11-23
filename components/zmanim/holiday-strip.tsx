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
import { boardText, holidayTitle } from "@/lib/zmanim/board-i18n";
import type { BoardLocale, Zman } from "@/lib/zmanim/shared";
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
  locale,
  date,
  minute,
  times,
}: {
  events: HolidayOccurrence[];
  locale: BoardLocale;
  date: string;
  minute: number;
  times: Zman[];
}) {
  const t = boardText(locale);
  return (
    <section
      className={styles.holidayStrip}
      aria-label={t.upcoming}
      data-upcoming-holidays
    >
      <div className={styles.holidayStripLabel}>
        <span>{t.communityCalendar}</span>
        <h2>{t.upcoming}</h2>
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
                    {active ? t.today + " · " : ""}
                    {definition.kind === "chabad"
                      ? definition.tone === "memorial"
                        ? t.memorial
                        : t.chabadDate
                      : definition.kind === "fast"
                        ? event.observed
                          ? t.observedFast
                          : t.fast
                        : definition.kind === "new-month"
                          ? t.newMonth
                          : event.definitionId === "yom-kippur"
                            ? t.kippur
                            : t.holiday}
                  </div>
                  <h3>{holidayTitle(event.definitionId, locale)}</h3>
                  <p>
                    {holidayHebrewLabel(event, locale)} <span>·</span>{" "}
                    {holidayDateLabel(event, locale)}
                  </p>
                </div>
              </article>
            );
          })
        ) : (
          <p className={styles.calendarPending}>{t.calendarPending}</p>
        )}
      </div>
    </section>
  );
}
export default memo(HolidayStrip);
