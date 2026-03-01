// lib/zmanim.ts
const DEFAULT_GEO_ID = "293703"; // Ришон-ле-Цион

export interface ZmanimData {
  date: string;
  hebrewDate: string;
  parasha: string;
  locationName: string;
  currentPrayer?: "shacharit" | "mincha" | "arvit" | null;
  times: {
    alot: string; // Dawn (Alot Hashachar)
    misheyakir: string; // Earliest Tallit
    sunrise: string; // Sunrise
    sofZmanShma: string; // Latest Shema
    sofZmanTfila: string; // Latest Shacharit
    chatzot: string; // Midday
    minchaGedola: string; // Earliest Mincha
    minchaKetana: string; // Mincha Ketanah
    plagHaMincha: string; // Plag Hamincha
    sunset: string; // Sunset
    tzeit: string; // Nightfall (Закат + 26 мин)
    candleLighting?: string;
    havdalah?: string;
  };
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr === "--:--") return -1;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export async function getZmanimData(
  lat?: number,
  lng?: number,
): Promise<ZmanimData> {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  // ВАЖНО: Добавляем ue=off (отключить высоту), чтобы совпадало с таблицами Хабада
  let url = `https://www.hebcal.com/zmanim?cfg=json&date=${dateStr}&ue=off`;

  if (lat && lng) {
    url += `&geo=pos&latitude=${lat}&longitude=${lng}&tzid=Asia/Jerusalem`;
  } else {
    url += `&geonameid=${DEFAULT_GEO_ID}`;
  }

  try {
    const zmanimRes = await fetch(url);
    const zmanimJson = await zmanimRes.json();

    const dateRes = await fetch(
      `https://www.hebcal.com/converter?cfg=json&date=${dateStr}&g2h=1&strict=1`,
    );
    const dateJson = await dateRes.json();

    const formatTime = (isoString: string) => {
      if (!isoString) return "--:--";
      return new Date(isoString).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // РАСЧЕТ TZEIT (ВЫХОД ЗВЕЗД)
    // На Chabad.org разница между Закатом (17:16) и Выходом звезд (17:42) составляет ровно 26 минут.
    const sunsetDate = new Date(zmanimJson.times.sunset);
    const tzeitDate = new Date(sunsetDate.getTime() + 26 * 60000);

    const times = {
      // Alot Hashachar (16.1 градус, без учета высоты должно быть ~5:14)
      alot: formatTime(zmanimJson.times.alotHaShachar),

      // Misheyakir (10.2 градус)
      misheyakir: formatTime(zmanimJson.times.misheyakir),

      sunrise: formatTime(zmanimJson.times.sunrise),

      // Latest Shema (Gra)
      sofZmanShma: formatTime(zmanimJson.times.sofZmanShma),

      // Latest Shacharit (Gra)
      sofZmanTfila: formatTime(
        zmanimJson.times.sofZmanTfila ||
          zmanimJson.times.sofZmanTfilla ||
          zmanimJson.times.sofZmanTfilaGra,
      ),

      chatzot: formatTime(zmanimJson.times.chatzot),
      minchaGedola: formatTime(zmanimJson.times.minchaGedola),
      minchaKetana: formatTime(zmanimJson.times.minchaKetana),
      plagHaMincha: formatTime(zmanimJson.times.plagHaMincha),
      sunset: formatTime(zmanimJson.times.sunset),

      // Nightfall (Закат + 26 минут)
      tzeit: formatTime(tzeitDate.toISOString()),

      candleLighting: zmanimJson.times.candles
        ? formatTime(zmanimJson.times.candles)
        : undefined,
      havdalah: zmanimJson.times.havdalah
        ? formatTime(zmanimJson.times.havdalah)
        : undefined,
    };

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let currentPrayer: "shacharit" | "mincha" | "arvit" | null = null;

    const tAlot = timeToMinutes(times.alot);
    const tMinchaGedola = timeToMinutes(times.minchaGedola);
    const tSunset = timeToMinutes(times.sunset);
    const tTzeit = timeToMinutes(times.tzeit);

    if (nowMinutes >= tAlot && nowMinutes < tMinchaGedola)
      currentPrayer = "shacharit";
    else if (nowMinutes >= tMinchaGedola && nowMinutes < tSunset)
      currentPrayer = "mincha";
    else if (nowMinutes >= tTzeit || nowMinutes < tAlot)
      currentPrayer = "arvit";

    let locationName = zmanimJson.location?.title || "Ришон-ле-Цион";
    if (locationName.match(/\d/)) locationName = "Моя локация";

    return {
      date: `${dateJson.hd} ${dateJson.hm}`,
      hebrewDate: dateJson.hebrew,
      parasha:
        dateJson.events && dateJson.events.length > 0 ? dateJson.events[0] : "",
      locationName,
      currentPrayer,
      times,
    };
  } catch (error) {
    console.error("Zmanim Error:", error);
    return {
      date: "Ошибка",
      hebrewDate: "",
      parasha: "",
      locationName: "Ошибка",
      currentPrayer: null,
      times: {
        alot: "--",
        misheyakir: "--",
        sunrise: "--",
        sofZmanShma: "--",
        sofZmanTfila: "--",
        chatzot: "--",
        minchaGedola: "--",
        minchaKetana: "--",
        plagHaMincha: "--",
        sunset: "--",
        tzeit: "--",
      },
    };
  }
}
