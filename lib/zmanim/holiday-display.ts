import {
  HOLIDAYS,
  type HolidayCalendar,
  type HolidayOccurrence,
} from "./holiday-catalog";
import {
  formatCalendarDate,
  isZmanimDate,
  shiftDate,
  type Zman,
} from "./shared";

export function validHolidayCalendar(value: unknown): value is HolidayCalendar {
  const data = value as HolidayCalendar | null;
  return (
    !!data &&
    data.version === 1 &&
    isZmanimDate(data.generatedFor) &&
    isZmanimDate(data.through) &&
    Array.isArray(data.events) &&
    data.events.length <= 180 &&
    data.events.every(
      (event) =>
        !!event &&
        typeof event.id === "string" &&
        Object.hasOwn(HOLIDAYS, event.definitionId) &&
        isZmanimDate(event.startDate) &&
        isZmanimDate(event.endDate) &&
        event.endDate >= event.startDate,
    )
  );
}
export function holidayPhase(
  event: HolidayOccurrence,
  date: string,
  minute: number,
  times: Zman[],
): "active" | "upcoming" | "past" {
  const definition = HOLIDAYS[event.definitionId];
  const eveningDate =
    definition.start === "sunset"
      ? shiftDate(event.startDate, -1)
      : event.startDate;
  if (date > event.endDate) return "past";
  if (date < eveningDate) return "upcoming";
  const end = ["FastEnds", "Tzeis", "ShabbatEndTime"]
    .map((key) =>
      times.find((time) => time.key === key && time.dayOffset === 0),
    )
    .find(Boolean)?.minutes;
  if (date === event.endDate && end !== undefined && minute >= end)
    return "past";
  // No guessed sunset/dawn: if the source is unavailable, keep calendar dates but do not assert "active".
  if (!times.length) return "upcoming";
  if (date === eveningDate) {
    const begin = times.find(
      (time) =>
        time.key ===
        (definition.start === "sunset" ? "Shkiah" : "AlosHashachar"),
    )?.minutes;
    return begin !== undefined && minute >= begin ? "active" : "upcoming";
  }
  return "active";
}

export function boardHolidays(
  calendar: HolidayCalendar | null,
  date: string,
  minute: number,
  times: Zman[],
) {
  if (
    !calendar ||
    date < shiftDate(calendar.generatedFor, -1) ||
    date > calendar.through
  )
    return { current: null, upcoming: [] as HolidayOccurrence[] };
  let rows = calendar.events
    .map((event) => ({
      event,
      phase: holidayPhase(event, date, minute, times),
    }))
    .filter((row) => row.phase !== "past");
  const superseded = new Set(
    rows
      .filter((row) => row.phase === "active")
      .map((row) => HOLIDAYS[row.event.definitionId].supersedes)
      .filter(Boolean),
  );
  rows = rows.filter((row) => !superseded.has(row.event.definitionId));
  rows.sort((a, b) => {
    if (a.phase === "active" && b.phase !== "active") return -1;
    if (b.phase === "active" && a.phase !== "active") return 1;
    if (a.phase === "active" && b.phase === "active")
      return (
        HOLIDAYS[b.event.definitionId].priority -
          HOLIDAYS[a.event.definitionId].priority ||
        a.event.id.localeCompare(b.event.id)
      );
    return (
      a.event.startDate.localeCompare(b.event.startDate) ||
      HOLIDAYS[b.event.definitionId].priority -
        HOLIDAYS[a.event.definitionId].priority
    );
  });
  return {
    current: rows.find((row) => row.phase === "active")?.event ?? null,
    upcoming: rows.slice(0, 3).map((row) => row.event),
  };
}

export function holidayDateLabel(event: HolidayOccurrence): string {
  const definition = HOLIDAYS[event.definitionId];
  const start =
    definition.start === "sunset"
      ? shiftDate(event.startDate, -1)
      : event.startDate;
  const text = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "long",
  }).format(new Date(start + "T12:00:00Z"));
  return definition.start === "sunset"
    ? `С вечера ${text}`
    : `${text} · с рассвета`;
}
export function holidayHebrewLabel(event: HolidayOccurrence): string {
  const start = formatCalendarDate(event.startDate, true).replace(
    / \d{4}$/,
    "",
  );
  if (event.startDate === event.endDate) return start;
  const end = formatCalendarDate(event.endDate, true).replace(/ \d{4}$/, "");
  if (start.replace(/^\d+ /, "") === end.replace(/^\d+ /, ""))
    return `${start.split(" ")[0]}–${end}`;
  return `${start} — ${end}`;
}
