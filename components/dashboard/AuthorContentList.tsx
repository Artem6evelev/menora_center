"use client";

import {
  submitForReview,
  authorCreateVideo,
  authorDeleteContent,
} from "@/actions/moderation.actions";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Edit,
  Plus,
  X,
  Loader2,
  Youtube,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthorContentList({
  items,
  type,
}: {
  items: any[];
  type: "news" | "video";
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Стейт для формы видео
  const [videoTitle, setVideoTitle] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [videoCategory, setVideoCategory] = useState("");

  const handleSendToReview = async (id: string) => {
    setLoadingId(id);
    await submitForReview(id, type);
    setLoadingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Удалить безвозвратно?")) return;
    setDeletingId(id);
    await authorDeleteContent(id, type);
    setDeletingId(null);
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim() || !videoLink.trim()) return;

    setIsSubmitting(true);
    const result = await authorCreateVideo(
      videoTitle,
      videoLink,
      videoCategory,
    );

    if (result.success) {
      setVideoTitle("");
      setVideoLink("");
      setVideoCategory("");
      setIsAdding(false);
    } else {
      alert("Ошибка при сохранении видео: " + result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-black">
          {type === "news" ? "Мои Статьи" : "Мои Видео"}
        </h2>

        {type === "news" ? (
          // 🔥 ДОБАВЛЕНО ?asAuthor=true
          <Link
            href="/dashboard/news/create?asAuthor=true"
            className="flex items-center gap-2 bg-[#FFB800] text-black px-4 py-2 rounded-xl font-bold hover:bg-amber-400 transition-colors"
          >
            <Plus size={18} /> Создать статью
          </Link>
        ) : (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${isAdding ? "bg-neutral-200 text-black" : "bg-[#FFB800] text-black hover:bg-amber-400"}`}
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
            {isAdding ? "Отмена" : "Добавить видео"}
          </button>
        )}
      </div>

      {/* ФОРМА ДОБАВЛЕНИЯ ВИДЕО */}
      <AnimatePresence>
        {isAdding && type === "video" && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateVideo}
            className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-neutral-500 mb-2">
                  Название видео
                </label>
                <input
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border bg-white dark:bg-neutral-950 text-sm outline-none"
                  placeholder="Секреты Торы..."
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-neutral-500 mb-2">
                  Ссылка на YouTube
                </label>
                <input
                  required
                  type="url"
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  className="w-full p-3 rounded-xl border bg-white dark:bg-neutral-950 text-sm outline-none"
                  placeholder="https://youtu.be/..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest font-black text-neutral-500 mb-2">
                  Категория (Тема)
                </label>
                <input
                  value={videoCategory}
                  onChange={(e) => setVideoCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border bg-white dark:bg-neutral-950 text-sm outline-none"
                  placeholder="Недельная глава..."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                disabled={isSubmitting}
                type="submit"
                className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Сохранить как черновик"
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* СПИСОК КОНТЕНТА */}
      {items.length === 0 && !isAdding ? (
        <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-800">
          <p className="text-neutral-500">
            У вас пока нет добавленных {type === "news" ? "статей" : "видео"}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-amber-500/30 transition-colors"
            >
              <div className="flex gap-4 items-start">
                {type === "video" && (
                  <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                    <Youtube size={24} />
                  </div>
                )}

                <div className="flex-1">
                  {item.category && (
                    <span className="text-[10px] font-black uppercase text-neutral-400 block mb-1">
                      {type === "video" ? item.category : item.category?.name}
                    </span>
                  )}
                  <h3 className="font-bold text-lg leading-tight">
                    {item.title}
                  </h3>

                  {/* Бейджик Статуса */}
                  <div className="flex items-center gap-2 mt-2">
                    {item.status === "published" && (
                      <span className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md">
                        <CheckCircle2 size={14} /> Опубликовано
                      </span>
                    )}
                    {item.status === "pending" && (
                      <span className="flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                        <Clock size={14} /> На проверке
                      </span>
                    )}
                    {item.status === "draft" && (
                      <span className="flex items-center gap-1 text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 px-2 py-1 rounded-md">
                        Черновик
                      </span>
                    )}
                    {item.status === "rejected" && (
                      <span className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-md">
                        <AlertCircle size={14} /> Отклонено
                      </span>
                    )}
                  </div>

                  {item.status === "rejected" && item.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/50 rounded-xl">
                      <p className="text-sm text-red-800 dark:text-red-400">
                        <strong>Причина отказа:</strong> {item.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Кнопки управления */}
              <div className="flex flex-wrap items-center gap-2">
                {(item.status === "draft" || item.status === "rejected") && (
                  <button
                    onClick={() => handleSendToReview(item.id)}
                    disabled={loadingId === item.id}
                    className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-xl text-xs font-bold hover:scale-95 transition-transform disabled:opacity-50"
                  >
                    <Send size={14} />{" "}
                    {loadingId === item.id
                      ? "Отправка..."
                      : "Отправить на проверку"}
                  </button>
                )}

                <Link
                  href={`/dashboard/${type === "news" ? "news" : "videos"}/${item.id}/edit`}
                  className="w-10 h-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-xl hover:bg-amber-500 hover:text-white transition-colors"
                >
                  <Edit size={16} />
                </Link>

                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="w-10 h-10 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-xl hover:bg-red-500 hover:text-white transition-colors text-neutral-400"
                >
                  {deletingId === item.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
