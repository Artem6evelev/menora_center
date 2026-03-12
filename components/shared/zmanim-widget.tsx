"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Loader2,
  Sunrise,
  Sun,
  Moon,
  Sunset,
  Flame,
  MapPin,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getZmanimData, type ZmanimData } from "@/lib/zmanim/zmanim";
import { cn } from "@/lib/utils";

// Иконка Меноры осталась без изменений
const MenorahIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v20M16 4v16M8 4v16M20 8v12M4 8v12M16 4c0-1.1.9-2 2-2s2 .9 2 2M8 4c0-1.1-.9-2-2-2s-2 .9-2 2M12 2c0-1.1.9-2 2-2s2 .9 2 2M12 22c-2.5 0-4.5-1.5-5-3.5h10c-.5 2-2.5 3.5-5 3.5Z" />
  </svg>
);

export function ZmanimWidget() {
  const t = useTranslations("Zmanim");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ZmanimData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [realCityName, setRealCityName] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isRTL = locale === "he";

  // 1. Оборачиваем в useCallback, чтобы стабилизировать ссылку
  const fetchCityName = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${locale}`,
        );
        const json = await res.json();
        if (json.city || json.locality)
          setRealCityName(json.city || json.locality);
      } catch (e) {
        console.error(e);
      }
    },
    [locale],
  );

  // 2. Оборачиваем в useCallback, добавляем fetchCityName в зависимости
  const fetchData = useCallback(
    async (lat?: number, lng?: number) => {
      setLoading(true);
      const zmanim = await getZmanimData(lat, lng);
      setData(zmanim);
      if (lat && lng) fetchCityName(lat, lng);
      else setRealCityName(null);
      setLoading(false);
      setIsLocating(false);
    },
    [fetchCityName],
  );

  // 3. Теперь useEffect чист и не вызывает warning от ESLint
  useEffect(() => {
    const init = () => {
      if (navigator.geolocation) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          (position) =>
            fetchData(position.coords.latitude, position.coords.longitude),
          () => fetchData(),
          { enableHighAccuracy: true },
        );
      } else {
        fetchData();
      }
    };
    init();

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node))
        setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fetchData]); // Добавили зависимость

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) =>
        fetchData(position.coords.latitude, position.coords.longitude),
      () => {
        alert(t("error_gps"));
        setIsLocating(false);
      },
      { enableHighAccuracy: true },
    );
  };

  const getCurrentPrayerName = () => {
    if (!data?.currentPrayer) return null;
    // @ts-ignore
    return t(data.currentPrayer);
  };

  const displayLocation =
    realCityName || data?.locationName || "Rishon LeTsiyon";

  return (
    <div className="relative z-50" ref={ref} dir={isRTL ? "rtl" : "ltr"}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-2 py-1 rounded-full transition-all duration-300",
          isOpen ? "bg-white dark:bg-zinc-800 shadow-sm" : "hover:bg-white/50",
        )}
      >
        <div className="relative flex items-center justify-center w-4 h-4">
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
              {!isLocating && data?.currentPrayer && (
                <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-40" />
              )}
            </>
          )}
        </div>

        <div className="flex flex-col items-start leading-none gap-0.5">
          {!loading ? (
            <span className="text-[10px] font-bold text-foreground/90 whitespace-nowrap">
              {data?.currentPrayer ? (
                <span className="text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {getCurrentPrayerName()}
                </span>
              ) : (
                data?.date
              )}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              {t("loading")}
            </span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && data && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 12, scale: 0.95, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={cn(
              "absolute top-full mt-2 w-[300px] rounded-[24px] overflow-hidden shadow-2xl ring-1 ring-black/5 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl z-[110]",
              isRTL
                ? "left-0 sm:left-auto sm:right-0"
                : "right-auto left-[-50px] sm:left-auto sm:right-[-60px]",
            )}
          >
            <div className="relative h-24 overflow-hidden shrink-0 bg-zinc-900">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-indigo-900/50 to-amber-900/30" />
              <div className="relative z-10 p-4 flex flex-col h-full justify-between text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">
                      {data.hebrewDate}
                    </h3>
                    <div className="text-[10px] text-white/60">
                      {data?.date}
                    </div>
                  </div>
                  {data.parasha && (
                    <div className="text-[10px] bg-white/10 px-2 py-1 rounded-md">
                      {data.parasha}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  className="flex items-center gap-1.5 text-[10px] text-white/80 hover:text-white transition-colors w-fit"
                >
                  {isLocating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <MapPin className="w-3 h-3" />
                  )}
                  <span className="truncate max-w-[180px] border-b border-white/20 pb-0.5">
                    {isLocating ? t("locating") : displayLocation}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-3 overflow-y-auto custom-scrollbar text-xs space-y-3 max-h-[50vh]">
              {(data.times.candleLighting || data.times.havdalah) && (
                <TimeGroup>
                  {data.times.candleLighting && (
                    <TimeRow
                      label={t("candleLighting")}
                      time={data.times.candleLighting}
                      icon={<Flame className="w-3.5 h-3.5 text-amber-500" />}
                      highlight
                      special
                    />
                  )}
                  {data.times.havdalah && (
                    <TimeRow
                      label={t("havdalah")}
                      time={data.times.havdalah}
                      icon={<Flame className="w-3.5 h-3.5 text-orange-500" />}
                      highlight
                      special
                    />
                  )}
                </TimeGroup>
              )}
              <div>
                <SectionTitle
                  active={data.currentPrayer === "shacharit"}
                  label={t("now")}
                >
                  {t("morning")}
                </SectionTitle>
                <TimeGroup active={data.currentPrayer === "shacharit"}>
                  <TimeRow
                    label={t("alot")}
                    time={data.times.alot}
                    icon={<Sunrise className="w-3.5 h-3.5 text-blue-400" />}
                  />
                  <TimeRow
                    label={t("misheyakir")}
                    time={data.times.misheyakir}
                  />
                  <TimeRow
                    label={t("sunrise")}
                    time={data.times.sunrise}
                    icon={<Sun className="w-3.5 h-3.5 text-amber-400" />}
                  />
                  <TimeRow
                    label={t("sofZmanShma")}
                    time={data.times.sofZmanShma}
                    highlight
                  />
                  <TimeRow
                    label={t("sofZmanTfila")}
                    time={data.times.sofZmanTfila}
                  />
                </TimeGroup>
              </div>
              <div>
                <SectionTitle
                  active={data.currentPrayer === "mincha"}
                  label={t("now")}
                >
                  {t("afternoon")}
                </SectionTitle>
                <TimeGroup active={data.currentPrayer === "mincha"}>
                  <TimeRow
                    label={t("chatzot")}
                    time={data.times.chatzot}
                    icon={<Sun className="w-3.5 h-3.5 text-amber-500" />}
                  />
                  <TimeRow
                    label={t("minchaGedola")}
                    time={data.times.minchaGedola}
                  />
                  <TimeRow
                    label={t("minchaKetana")}
                    time={data.times.minchaKetana}
                  />
                  <TimeRow
                    label={t("plagHaMincha")}
                    time={data.times.plagHaMincha}
                  />
                  <TimeRow
                    label={t("sunset")}
                    time={data.times.sunset}
                    icon={<Sunset className="w-3.5 h-3.5 text-orange-500" />}
                    highlight
                  />
                </TimeGroup>
              </div>
              <div>
                <SectionTitle
                  active={data.currentPrayer === "arvit"}
                  label={t("now")}
                >
                  {t("evening")}
                </SectionTitle>
                <TimeGroup active={data.currentPrayer === "arvit"}>
                  <TimeRow
                    label={t("tzeit")}
                    time={data.times.tzeit}
                    icon={<Moon className="w-3.5 h-3.5 text-indigo-400" />}
                    highlight
                  />
                </TimeGroup>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimeGroup({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden border shadow-sm transition-colors duration-300 bg-gray-50/80 dark:bg-zinc-900/80 border-gray-100 dark:border-zinc-800",
        active && "ring-1 ring-amber-500/30 bg-amber-50/50",
      )}
    >
      <div className="divide-y divide-gray-200/50 dark:divide-zinc-800/50">
        {children}
      </div>
    </div>
  );
}

function SectionTitle({
  children,
  active,
  label,
}: {
  children: React.ReactNode;
  active?: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        "text-[9px] font-bold uppercase tracking-widest px-2 pb-1 pt-1 flex items-center justify-between transition-colors",
        active ? "text-amber-600" : "text-muted-foreground/70",
      )}
    >
      <span>{children}</span>
      {active && (
        <span className="flex items-center gap-1 text-[8px] bg-amber-500 text-white px-1.5 py-px rounded-full">
          {label}
        </span>
      )}
    </div>
  );
}

function TimeRow({ label, time, highlight, special, icon }: any) {
  return (
    <div
      className={cn(
        "flex justify-between items-center px-3 py-2 transition-all duration-300 group",
        special && "bg-amber-50/80",
        highlight && !special && "bg-amber-50/30",
        "hover:bg-white",
      )}
    >
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 flex items-center justify-center">{icon}</div>
        <span
          className={cn(
            "font-medium text-foreground/80",
            (highlight || special) && "text-foreground font-semibold",
          )}
        >
          {label}
        </span>
      </div>
      <span
        className={cn(
          "font-mono font-semibold text-foreground/70",
          (highlight || special) && "text-amber-700",
        )}
      >
        {time}
      </span>
    </div>
  );
}
