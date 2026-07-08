"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Youtube,
  Play,
  Search,
  VideoOff,
  X,
  UserRound,
  ArrowRight,
} from "lucide-react";
import { useVideoStore } from "@/store/useVideoStore";
import Link from "next/link";
import { cn } from "@/lib/utils";

type VideoItem = {
  id: string;
  title: string;
  link: string;
  description?: string | null;
  speaker?: string | null;
  category?: string | null;
  authorSlug?: string | null;
};

const getYoutubeId = (url: string) => {
  if (!url) return null;
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace("www.", "");
    if (hostname === "youtu.be") {
      const id = parsedUrl.pathname.split("/")[1];
      return id?.length === 11 ? id : null;
    }
    if (hostname.includes("youtube.com")) {
      const watchId = parsedUrl.searchParams.get("v");
      if (watchId?.length === 11) return watchId;
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      const possibleId = pathParts[pathParts.length - 1];
      if (
        ["embed", "shorts", "live"].some((part) =>
          parsedUrl.pathname.includes(`/${part}/`),
        ) &&
        possibleId?.length === 11
      )
        return possibleId;
    }
  } catch {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([^?&/]+)/,
    );
    return match?.[1]?.length === 11 ? match[1] : null;
  }
  return null;
};

const getEmbedUrl = (url: string) => {
  const videoId = getYoutubeId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
};

const getThumbnailUrl = (url: string) => {
  const videoId = getYoutubeId(url);
  if (!videoId) return "";
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

export default function LessonsClient({
  initialVideos,
}: {
  initialVideos: VideoItem[];
}) {
  // 🔥 ИСПРАВЛЕНИЕ TYPESCRIPT: Явно приводим типы из стора к нашему новому формату VideoItem
  const storeVideos = useVideoStore((state) => state.videos) as VideoItem[];
  const setVideos = useVideoStore((state) => state.setVideos) as (
    v: VideoItem[],
  ) => void;
  const searchQuery = useVideoStore((state) => state.searchQuery);
  const setSearchQuery = useVideoStore((state) => state.setSearchQuery);

  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeAuthor, setActiveAuthor] = useState("Все лекторы");

  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos, setVideos]);

  useEffect(() => {
    if (!selectedVideo) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedVideo(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedVideo]);

  useEffect(() => {
    if (selectedVideo) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedVideo]);

  // 🔥 ИСПРАВЛЕНИЕ TYPESCRIPT: Явно указываем, что массив состоит из VideoItem
  const currentVideos = (
    storeVideos.length > 0 ? storeVideos : initialVideos
  ) as VideoItem[];

  const allCategories = useMemo(() => {
    const cats = Array.from(
      new Set(currentVideos.map((v) => v.category).filter(Boolean)),
    ) as string[];
    return ["Все", ...cats];
  }, [currentVideos]);

  const allAuthors = useMemo(() => {
    const auths = Array.from(
      new Set(currentVideos.map((v) => v.speaker).filter(Boolean)),
    ) as string[];
    return ["Все лекторы", ...auths];
  }, [currentVideos]);

  const filteredVideos = useMemo(() => {
    return currentVideos.filter((video) => {
      const matchSearch =
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.speaker?.toLowerCase() || "").includes(
          searchQuery.toLowerCase(),
        );
      const matchCategory =
        activeCategory === "Все" || video.category === activeCategory;
      const matchAuthor =
        activeAuthor === "Все лекторы" || video.speaker === activeAuthor;

      return matchSearch && matchCategory && matchAuthor;
    });
  }, [currentVideos, searchQuery, activeCategory, activeAuthor]);

  const selectedEmbedUrl = useMemo(() => {
    if (!selectedVideo) return null;
    return getEmbedUrl(selectedVideo.link);
  }, [selectedVideo]);

  const springTransition = { duration: 0.5 };

  return (
    <section className="w-full">
      <div className="flex flex-col items-center justify-center mb-12 max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="relative w-full max-w-xl"
        >
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search size={18} className="text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Поиск по названию или лектору..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full py-4 pl-12 pr-6 text-sm font-bold text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50 shadow-sm transition-all text-center"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...springTransition }}
          className="w-full flex flex-col items-center gap-4"
        >
          {allCategories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2">
              {allCategories.map((cat) => (
                <button
                  key={`cat-${cat}`}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-5 py-2 rounded-full font-bold text-xs transition-all duration-300",
                    activeCategory === cat
                      ? "bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20 scale-105"
                      : "bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {allAuthors.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 px-2">
                <UserRound size={14} /> Лекторы:
              </div>
              {allAuthors.map((author) => (
                <button
                  key={`auth-${author}`}
                  onClick={() => setActiveAuthor(author)}
                  className={cn(
                    "px-4 py-1.5 rounded-full font-bold text-[11px] transition-all duration-300",
                    activeAuthor === author
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md scale-105"
                      : "bg-transparent text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  )}
                >
                  {author}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {filteredVideos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900/50 rounded-[32px] border-2 border-dashed border-neutral-200 dark:border-neutral-800"
        >
          <div className="bg-white dark:bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <VideoOff className="text-neutral-400" size={24} />
          </div>
          <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
            Ничего не найдено
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium">
            По вашим фильтрам нет видеоуроков. Попробуйте сбросить настройки.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("Все");
              setActiveAuthor("Все лекторы");
            }}
            className="mt-4 text-[#FFB800] font-bold hover:underline underline-offset-4"
          >
            Сбросить фильтры
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...springTransition }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredVideos.map((video, idx) => {
            const videoId = getYoutubeId(video.link);
            const thumbnailUrl = getThumbnailUrl(video.link);

            return (
              <motion.div
                key={video.id || idx}
                onClick={() => {
                  if (!videoId) return;
                  setSelectedVideo(video);
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, ...springTransition }}
                className={`group flex flex-col bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 ${!videoId ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="relative w-full aspect-video overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
                      <Youtube className="text-neutral-400" size={42} />
                    </div>
                  )}
                  {video.category && (
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-md text-neutral-900 dark:text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest shadow-lg">
                      {video.category}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/15 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 dark:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center opacity-90 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 shadow-lg">
                      <Play
                        className="text-red-600 dark:text-white fill-red-600 dark:fill-white ml-1"
                        size={24}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    {video.speaker && (
                      <div className="relative z-10">
                        {video.authorSlug ? (
                          <Link
                            href={`/authors/${video.authorSlug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 group/author"
                          >
                            <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                              <UserRound
                                size={12}
                                className="text-neutral-500 group-hover/author:text-red-500 transition-colors"
                              />
                            </div>
                            <span className="text-xs font-bold text-neutral-900 dark:text-white group-hover/author:text-red-500 transition-colors">
                              {video.speaker}
                            </span>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                              <UserRound
                                size={12}
                                className="text-neutral-500"
                              />
                            </div>
                            <span className="text-xs font-bold text-neutral-900 dark:text-white">
                              {video.speaker}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] font-bold tracking-widest uppercase ml-auto">
                      <Youtube size={14} className="text-red-500" /> Видео
                    </div>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white tracking-tighter leading-tight mb-4 group-hover:text-red-500 transition-colors line-clamp-3">
                    {video.title}
                  </h3>

                  <div className="mt-auto pt-4 flex items-center text-sm font-bold text-neutral-900 dark:text-white group-hover:text-red-500 transition-colors">
                    Смотреть урок{" "}
                    <ArrowRight
                      size={16}
                      className="ml-2 group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.25 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-5xl bg-white dark:bg-neutral-950 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="flex items-start justify-between gap-4 p-5 md:p-6 border-b border-neutral-200/70 dark:border-neutral-800/70">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500 mb-2">
                    Сейчас воспроизводится
                  </p>
                  <h3 className="text-xl md:text-2xl font-black text-neutral-950 dark:text-white leading-tight">
                    {selectedVideo.title}
                  </h3>
                  {selectedVideo.speaker && (
                    <div className="mt-4">
                      {selectedVideo.authorSlug ? (
                        <Link
                          href={`/authors/${selectedVideo.authorSlug}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm font-bold text-neutral-900 dark:text-white hover:text-red-500 transition-colors"
                        >
                          <UserRound size={16} /> Лектор:{" "}
                          {selectedVideo.speaker}
                        </Link>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm font-bold text-neutral-700 dark:text-neutral-300">
                          <UserRound size={16} /> Лектор:{" "}
                          {selectedVideo.speaker}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="aspect-video bg-black">
                {selectedEmbedUrl ? (
                  <iframe
                    src={selectedEmbedUrl}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-center p-8">
                    Не удалось встроить это видео.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
