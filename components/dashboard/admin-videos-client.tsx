"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Youtube, Plus, Trash2, Loader2, Link as LinkIcon } from "lucide-react";
import { addVideo, deleteVideo } from "@/actions/video";

export default function AdminVideosClient({
  initialVideos,
}: {
  initialVideos: any[];
}) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !link.trim()) return;

    setIsLoading(true);
    await addVideo(title, link);
    setTitle("");
    setLink("");
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteVideo(id);
    setDeletingId(null);
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-12">
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tighter">
          Управление{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
            Видеоуроками
          </span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2">
          Добавляйте новые видео с YouTube, и они сразу появятся на публичной
          странице.
        </p>
      </div>

      {/* ФОРМА ДОБАВЛЕНИЯ */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 rounded-[32px] p-8 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm mb-10 flex flex-col md:flex-row gap-4 items-end"
      >
        <div className="w-full flex-1 relative">
          <label className="block text-[10px] uppercase tracking-widest font-black text-neutral-500 mb-2 pl-2">
            Название урока
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Секреты Торы..."
            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 font-medium text-sm focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
            required
          />
        </div>

        <div className="w-full flex-1 relative">
          <label className="block text-[10px] uppercase tracking-widest font-black text-neutral-500 mb-2 pl-2">
            Ссылка на YouTube
          </label>
          <div className="relative">
            <LinkIcon
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://youtube.com/..."
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 pl-12 font-medium text-sm focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="h-[54px] px-8 bg-red-500 hover:bg-red-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Добавить
        </button>
      </motion.form>

      {/* СПИСОК ВИДЕО */}
      <div className="space-y-4">
        <h3 className="text-lg font-black tracking-tight mb-4">
          Добавленные видео ({initialVideos.length})
        </h3>

        <AnimatePresence>
          {initialVideos.length === 0 ? (
            <motion.div className="text-center py-12 text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-neutral-800 border-dashed">
              Видео пока нет. Добавьте первое видео выше.
            </motion.div>
          ) : (
            initialVideos.map((video) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-neutral-900 p-4 pl-6 rounded-2xl border border-neutral-200/50 dark:border-neutral-800 flex items-center justify-between gap-4 group hover:border-red-500/30 transition-all shadow-sm"
              >
                <div className="flex items-center gap-4 truncate">
                  <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                    <Youtube size={20} />
                  </div>
                  <div className="truncate">
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                      {video.title}
                    </h4>
                    <a
                      href={video.link}
                      target="_blank"
                      className="text-xs text-neutral-400 hover:text-red-500 truncate transition-colors"
                    >
                      {video.link}
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(video.id)}
                  disabled={deletingId === video.id}
                  className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shrink-0"
                >
                  {deletingId === video.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
