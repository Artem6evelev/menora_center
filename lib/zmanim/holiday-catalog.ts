/** Public presentation data only. Hebrew/Gregorian date calculation stays on the server. */
export type HolidayArt =
  | "shofar"
  | "prayer"
  | "sukkah"
  | "torah"
  | "chanukiah"
  | "purim"
  | "matzah"
  | "tablets"
  | "tree"
  | "bonfire"
  | "heart"
  | "moon"
  | "book"
  | "rings"
  | "sunrise"
  | "candle"
  | "willow"
  | "waters";
export const HOLIDAY_PALETTES = {
  honey: {
    deep: "#35220f",
    accent: "#ffd46f",
    wash: "#fbf3dc",
    ink: "#705018",
  },
  pearl: {
    deep: "#263347",
    accent: "#f0e5ca",
    wash: "#edf1f4",
    ink: "#394c62",
  },
  olive: {
    deep: "#1d3529",
    accent: "#e7d88f",
    wash: "#edf3e3",
    ink: "#355b39",
  },
  violet: {
    deep: "#30203f",
    accent: "#eed0ff",
    wash: "#f3e9f8",
    ink: "#653d7a",
  },
  light: {
    deep: "#101a42",
    accent: "#ffcf69",
    wash: "#f8f0da",
    ink: "#775312",
  },
  wine: { deep: "#452039", accent: "#ffcfb0", wash: "#f9e9f0", ink: "#85435f" },
  sea: { deep: "#123b40", accent: "#d3ead8", wash: "#e6f2ed", ink: "#285c55" },
  sky: { deep: "#183852", accent: "#f5dfb0", wash: "#eaf1f9", ink: "#365779" },
  forest: {
    deep: "#24382a",
    accent: "#efce99",
    wash: "#edf1e1",
    ink: "#516137",
  },
  fire: { deep: "#4b281d", accent: "#ffd279", wash: "#fcf0df", ink: "#8a4b23" },
  rose: { deep: "#452638", accent: "#f8d9a4", wash: "#f7e9ec", ink: "#804b5e" },
  silver: {
    deep: "#202e40",
    accent: "#d0dbe7",
    wash: "#edf0f4",
    ink: "#45556c",
  },
} as const;
export type HolidayPalette = keyof typeof HOLIDAY_PALETTES;
export type HolidayKind = "major" | "minor" | "fast" | "chabad" | "new-month";
export type HolidayDefinition = {
  title: string;
  kind: HolidayKind;
  art: HolidayArt;
  palette: HolidayPalette;
  tone: "festive" | "reflective" | "memorial";
  start: "sunset" | "dawn";
  priority: number;
  supersedes?: string;
};
function holiday(
  title: string,
  kind: HolidayKind,
  art: HolidayArt,
  palette: HolidayPalette,
  tone: HolidayDefinition["tone"] = "festive",
  start: HolidayDefinition["start"] = "sunset",
): HolidayDefinition {
  return {
    title,
    kind,
    art,
    palette,
    tone,
    start,
    priority:
      kind === "major"
        ? 100
        : kind === "fast"
          ? 90
          : kind === "minor"
            ? 70
            : kind === "chabad"
              ? 60
              : 20,
  };
}
export const HOLIDAYS: Record<string, HolidayDefinition> = {
  "rosh-hashanah": holiday("Рош а-Шана", "major", "shofar", "honey"),
  "yom-kippur": holiday("Йом Кипур", "major", "prayer", "pearl", "reflective"),
  sukkot: holiday("Суккот", "major", "sukkah", "olive"),
  "hoshana-rabba": {
    ...holiday("Ошана Раба", "major", "willow", "forest"),
    priority: 110,
    supersedes: "sukkot",
  },
  "simchat-torah": holiday(
    "Шмини Ацерет и Симхат Тора",
    "major",
    "torah",
    "violet",
  ),
  chanukah: holiday("Ханука", "minor", "chanukiah", "light"),
  purim: holiday("Пурим", "minor", "purim", "wine"),
  "purim-katan": holiday("Пурим катан", "minor", "purim", "violet"),
  pesach: holiday("Песах", "major", "matzah", "sea"),
  "pesach-seventh": {
    ...holiday("Седьмой день Песаха", "major", "waters", "sky"),
    priority: 110,
    supersedes: "pesach",
  },
  "pesach-sheni": holiday("Песах шени", "minor", "matzah", "honey"),
  shavuot: holiday("Шавуот", "major", "tablets", "sky"),
  "tu-bishvat": holiday("Ту би-Шват", "minor", "tree", "forest"),
  "lag-baomer": holiday("Лаг ба-Омер", "minor", "bonfire", "fire"),
  "tu-bav": holiday("Ту бе-Ав", "minor", "heart", "rose"),
  "rosh-chodesh": holiday(
    "Рош ходеш",
    "new-month",
    "moon",
    "sky",
    "reflective",
  ),
  "fast-gedaliah": holiday(
    "Пост Гедалии",
    "fast",
    "prayer",
    "silver",
    "reflective",
    "dawn",
  ),
  "fast-tevet": holiday(
    "Пост 10 Тевета",
    "fast",
    "prayer",
    "pearl",
    "reflective",
    "dawn",
  ),
  "fast-esther": holiday(
    "Пост Эстер",
    "fast",
    "prayer",
    "silver",
    "reflective",
    "dawn",
  ),
  "fast-tammuz": holiday(
    "Пост 17 Тамуза",
    "fast",
    "prayer",
    "pearl",
    "reflective",
    "dawn",
  ),
  "tisha-bav": holiday("9 Ава", "fast", "candle", "silver", "reflective"),
  "chana-yahrzeit": holiday(
    "День памяти ребецн Ханы",
    "chabad",
    "candle",
    "pearl",
    "memorial",
  ),
  "maharash-yahrzeit": holiday(
    "День памяти Ребе Маараша",
    "chabad",
    "candle",
    "silver",
    "memorial",
  ),
  "rashab-birthday": holiday(
    "День рождения Ребе Рашаба",
    "chabad",
    "book",
    "forest",
  ),
  "rosh-chodesh-kislev": holiday(
    "Рош ходеш Кислев",
    "chabad",
    "sunrise",
    "honey",
  ),
  "mitteler-day": holiday(
    "День Мителер Ребе",
    "chabad",
    "book",
    "sky",
    "reflective",
  ),
  "yud-kislev": holiday(
    "Освобождение Мителер Ребе",
    "chabad",
    "sunrise",
    "sea",
  ),
  "rebbe-wedding": holiday("Свадьба Ребе и Ребецн", "chabad", "rings", "rose"),
  "yud-tes-kislev": holiday("Новый год хасидизма", "chabad", "book", "honey"),
  "hei-tevet": holiday("Хей Тевет · Дидан ноцах", "chabad", "book", "violet"),
  "alter-rebbe-yahrzeit": holiday(
    "День памяти Алтер Ребе",
    "chabad",
    "candle",
    "pearl",
    "memorial",
  ),
  "yud-shevat": holiday("Йуд Шват", "chabad", "torah", "sky", "reflective"),
  "rebbetzin-yahrzeit": holiday(
    "День памяти ребецн Хаи Мушки",
    "chabad",
    "candle",
    "silver",
    "memorial",
  ),
  "rebbetzin-birthday": holiday(
    "День рождения ребецн Хаи Мушки",
    "chabad",
    "heart",
    "rose",
  ),
  "rashab-yahrzeit": holiday(
    "День памяти Ребе Рашаба",
    "chabad",
    "candle",
    "pearl",
    "memorial",
  ),
  "rebbe-birthday": holiday("День рождения Ребе", "chabad", "sunrise", "honey"),
  "tzemach-yahrzeit": holiday(
    "День памяти Цемах Цедека",
    "chabad",
    "candle",
    "silver",
    "memorial",
  ),
  "maharash-birthday": holiday(
    "День рождения Ребе Маараша",
    "chabad",
    "book",
    "sea",
  ),
  "baal-shem-tov-yahrzeit": holiday(
    "День памяти Баал-Шем-Това",
    "chabad",
    "candle",
    "pearl",
    "memorial",
  ),
  "sivan-28": holiday(
    "28 Сивана · прибытие Ребе в США",
    "chabad",
    "sunrise",
    "sky",
  ),
  "gimmel-tammuz": holiday(
    "Гимел Тамуз · день памяти Ребе",
    "chabad",
    "candle",
    "silver",
    "memorial",
  ),
  "yud-bet-tammuz": holiday(
    "Дни освобождения Ребе Раяца",
    "chabad",
    "sunrise",
    "fire",
  ),
  "levi-yitzchak-yahrzeit": holiday(
    "День памяти рава Леви-Ицхака",
    "chabad",
    "candle",
    "pearl",
    "memorial",
  ),
  "chai-elul": holiday("Хай Элул", "chabad", "book", "forest"),
  "tzemach-birthday": holiday(
    "День рождения Цемах Цедека",
    "chabad",
    "book",
    "violet",
  ),
};

export type HolidayOccurrence = {
  id: string;
  definitionId: string;
  startDate: string;
  endDate: string;
  observed?: boolean;
};
export type HolidayCalendar = {
  version: 1;
  generatedFor: string;
  through: string;
  events: HolidayOccurrence[];
};
export const CHABAD_CALENDAR_SOURCE =
  "https://www.chabad.org/library/article_cdo/aid/357752/jewish/Chabad-Calendar.htm";
export const CHABAD_EXTRA_DATES_SOURCE =
  "https://www.chabad.org/library/article_cdo/aid/559301/jewish/Special-Days-on-the-Chassidic-Calendar.htm";
export const CHABAD_ADAR_SOURCE =
  "https://www.chabad.org/library/article_cdo/aid/630346/jewish/When-Do-I-Celebrate-My-birthday-in-a-Leap-Year.htm";
