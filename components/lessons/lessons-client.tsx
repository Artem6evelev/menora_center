"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Youtube, Play, Search, VideoOff, X } from "lucide-react";
import { useVideoStore } from "@/store/useVideoStore";

type VideoItem = {
  id: string;
  title: string;
  link: string;
  description?: string | null;
  speaker?: string | null;
  category?: string | null;
};

// Достаём ID YouTube-видео из разных вариантов ссылок
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

      if (watchId?.length === 11) {
        return watchId;
      }

      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      const possibleId = pathParts[pathParts.length - 1];

      if (
        ["embed", "shorts", "live"].some((part) =>
          parsedUrl.pathname.includes(`/${part}/`),
        ) &&
        possibleId?.length === 11
      ) {
        return possibleId;
      }
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
  const { searchQuery, setSearchQuery, getFilteredVideos, setVideos } =
    useVideoStore();

  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos, setVideos]);

  // Закрытие модалки по Escape
  useEffect(() => {
    if (!selectedVideo) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedVideo(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedVideo]);

  // Блокируем прокрутку страницы, когда открыта модалка
  useEffect(() => {
    if (selectedVideo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedVideo]);

  const filteredVideos = getFilteredVideos() as VideoItem[];

  const selectedEmbedUrl = useMemo(() => {
    if (!selectedVideo) return null;

    return getEmbedUrl(selectedVideo.link);
  }, [selectedVideo]);

  const springTransition = { duration: 0.5 };

  return (
    <section className="max-w-7xl mx-auto w-full">
      {/* ЗАГОЛОВОК И ПОИСК */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springTransition}
          className="max-w-3xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-red-500/10 text-red-500 p-2 rounded-xl">
              <Youtube size={24} strokeWidth={2.5} />
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
              Библиотека уроков
            </p>
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight mb-4">
            Смотрите уроки{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              прямо на сайте
            </span>
          </h2>

          <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-lg leading-relaxed">
            Выберите видео из списка ниже. Урок откроется во всплывающем плеере
            поверх страницы. Используйте поиск, чтобы быстро найти нужную тему,
            лектора или вебинар.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, ...springTransition }}
          className="relative w-full lg:w-96"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-neutral-400" />
          </div>

          <input
            type="text"
            placeholder="Поиск уроков..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/50 shadow-sm transition-all"
          />
        </motion.div>
      </div>

      {/* СЕТКА С ВИДЕО */}
      {filteredVideos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-32 flex flex-col items-center justify-center bg-white/70 dark:bg-neutral-900/70 rounded-3xl border border-neutral-200/60 dark:border-neutral-800/60"
        >
          <div className="bg-neutral-100 dark:bg-neutral-800 w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-inner">
            <VideoOff
              className="text-neutral-300 dark:text-neutral-600"
              size={32}
            />
          </div>

          <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
            Ничего не найдено
          </h3>

          <p className="text-neutral-500 dark:text-neutral-400 font-medium">
            {searchQuery
              ? `По вашему запросу «${searchQuery}» нет доступных видео.`
              : "Видеоуроки еще не добавлены. Загляните позже!"}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...springTransition }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredVideos.map((video, idx) => {
            const videoId = getYoutubeId(video.link);
            const thumbnailUrl = getThumbnailUrl(video.link);

            return (
              <motion.button
                key={video.id || idx}
                type="button"
                disabled={!videoId}
                onClick={() => {
                  if (!videoId) return;
                  setSelectedVideo(video);
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05, ...springTransition }}
                className="group text-left bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm overflow-hidden hover:shadow-xl hover:border-red-500/30 transition-all duration-300 block disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="relative aspect-video overflow-hidden bg-neutral-200 dark:bg-neutral-800">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Youtube className="text-neutral-400" size={42} />
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

                  <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md">
                    Смотреть
                  </div>
                </div>

                <div className="p-6">
                  {video.category && (
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFB800] mb-3">
                      {video.category}
                    </p>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight line-clamp-2">
                      {video.title}
                    </h3>

                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 group-hover:bg-red-500/10 transition-colors">
                      <Youtube
                        size={16}
                        className="text-neutral-400 group-hover:text-red-500"
                      />
                    </div>
                  </div>

                  {video.description && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mt-3 line-clamp-2">
                      {video.description}
                    </p>
                  )}

                  {video.speaker && (
                    <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-4">
                      Лектор: {video.speaker}
                    </p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* МОДАЛКА С ВИДЕО */}
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

                  {selectedVideo.description && (
                    <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed max-w-3xl">
                      {selectedVideo.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 hover:text-red-500 transition-colors shrink-0"
                  aria-label="Закрыть видео"
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
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-center p-8">
                    Не удалось встроить это видео. Проверьте ссылку YouTube.
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
