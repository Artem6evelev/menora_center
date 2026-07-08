// components/authors/ContentTabs.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useAuthorStore } from "@/store/useAuthorStore";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Youtube, X, FileText } from "lucide-react";
import Link from "next/link";

// Утилиты для YouTube
const getYoutubeId = (url: string) => {
  if (!url) return null;
  try {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([^?&/]+)/,
    );
    return match?.[1]?.length === 11 ? match[1] : null;
  } catch {
    return null;
  }
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

interface Props {
  articles: any[];
  videos: any[];
}

export default function ContentTabs({ articles, videos }: Props) {
  const { activeFilter, setFilter, selectedVideo, setSelectedVideo } =
    useAuthorStore();

  // Логика блокировки скролла и закрытия по ESC для модалки
  useEffect(() => {
    if (!selectedVideo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedVideo(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedVideo, setSelectedVideo]);

  const selectedEmbedUrl = useMemo(() => {
    if (!selectedVideo) return null;
    return getEmbedUrl(selectedVideo.link);
  }, [selectedVideo]);

  const springTransition = { duration: 0.5 };

  return (
    <div className="w-full">
      {/* ТАБЫ */}
      <div className="flex gap-6 mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        {(["all", "articles", "videos"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`font-bold text-sm md:text-base uppercase tracking-wider transition-colors relative ${
              activeFilter === tab
                ? "text-neutral-900 dark:text-white"
                : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            {tab === "all" ? "Всё" : tab === "articles" ? "Статьи" : "Видео"}

            {/* Активная полоска */}
            {activeFilter === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-[17px] left-0 right-0 h-1 bg-[#FFB800] rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* СЕТКА КОНТЕНТА */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {/* РЕНДЕР СТАТЕЙ */}
          {(activeFilter === "all" || activeFilter === "articles") &&
            articles.map((article, idx) => (
              <motion.div
                key={`article-${article.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05, ...springTransition }}
              >
                <Link
                  href={`/news/${article.slug}`}
                  className="block bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm overflow-hidden hover:shadow-xl transition-all h-full"
                >
                  {article.imageUrl && (
                    <div className="aspect-video w-full relative overflow-hidden bg-neutral-100">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3 text-orange-500">
                      <FileText size={16} />
                      <span className="text-xs font-bold uppercase tracking-[0.2em]">
                        Статья
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}

          {/* РЕНДЕР ВИДЕО */}
          {(activeFilter === "all" || activeFilter === "videos") &&
            videos.map((video, idx) => {
              const videoId = getYoutubeId(video.link);
              const thumbnailUrl = getThumbnailUrl(video.link);

              return (
                <motion.button
                  key={`video-${video.id}`}
                  onClick={() => videoId && setSelectedVideo(video)}
                  disabled={!videoId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
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
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3 text-red-500">
                      <Youtube size={16} />
                      <span className="text-xs font-bold uppercase tracking-[0.2em]">
                        Видео
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-2">
                      {video.title}
                    </h3>
                  </div>
                </motion.button>
              );
            })}
        </AnimatePresence>
      </div>

      {/* МОДАЛКА ПЛЕЕРА */}
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
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl bg-white dark:bg-neutral-950 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-between p-5 border-b border-neutral-200/70 dark:border-neutral-800/70">
                <h3 className="text-lg md:text-xl font-black text-neutral-950 dark:text-white line-clamp-1">
                  {selectedVideo.title}
                </h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:text-red-500 transition-colors shrink-0"
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
                  <div className="w-full h-full flex items-center justify-center text-white p-8">
                    Не удалось загрузить видео.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
