"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Youtube,
  Plus,
  Trash2,
  Loader2,
  Link as LinkIcon,
  UserRound,
  Pencil,
  X,
  Save,
  Tag,
} from "lucide-react";
import { addVideo, deleteVideo, updateVideo } from "@/actions/video";

export default function AdminVideosClient({
  initialVideos,
  authors,
}: {
  initialVideos: any[];
  authors: { id: string; name: string }[];
}) {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [category, setCategory] = useState(""); // <-- Стейт для категории
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !link.trim()) return;

    setIsLoading(true);

    // Сохраняем результат ответа от сервера
    const result = editingId
      ? await updateVideo(
          editingId,
          title,
          link,
          authorId || null,
          category || null,
        )
      : await addVideo(title, link, authorId || null, category || null);

    // Если всё успешно - сбрасываем форму, если ошибка - показываем Alert
    if (result.success) {
      resetForm();
    } else {
      alert("Ошибка сохранения: " + result.error);
    }

    setIsLoading(false);
  };

  const handleEdit = (video: any) => {
    setEditingId(video.id);
    setTitle(video.title);
    setLink(video.link);
    setAuthorId(video.authorId || "");
    setCategory(video.category || ""); // Загружаем категорию при редактировании
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteVideo(id);
    setDeletingId(null);
    if (editingId === id) resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setLink("");
    setAuthorId("");
    setCategory("");
  };

  return (
    <div className="max-w-5xl mx-auto w-full pb-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tighter">
          Управление{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
            Видеоуроками
          </span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2">
          Добавляйте новые видео с YouTube. Указывайте лектора и категорию для
          удобного поиска.
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className={`rounded-[32px] p-8 border shadow-sm mb-10 flex flex-col gap-6 transition-colors duration-300 ${
          editingId
            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/30"
            : "bg-white dark:bg-neutral-900 border-neutral-200/50 dark:border-neutral-800/50"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h2
            className={`font-black text-lg ${editingId ? "text-amber-600 dark:text-amber-500" : "text-neutral-900 dark:text-white"}`}
          >
            {editingId ? "Редактирование видео" : "Добавить новое видео"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <X size={14} /> Отменить
            </button>
          )}
        </div>

        {/* Изменили на 2 колонки (grid-cols-2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full relative">
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

          <div className="w-full relative">
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

          <div className="w-full relative">
            <label className="block text-[10px] uppercase tracking-widest font-black text-neutral-500 mb-2 pl-2">
              Лектор (Раввин)
            </label>
            <div className="relative">
              <UserRound
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 pl-12 font-medium text-sm focus:ring-2 focus:ring-red-500/50 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Без лектора (Общее видео)</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* НОВОЕ ПОЛЕ: КАТЕГОРИЯ */}
          <div className="w-full relative">
            <label className="block text-[10px] uppercase tracking-widest font-black text-neutral-500 mb-2 pl-2">
              Категория (Тема)
            </label>
            <div className="relative">
              <Tag
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Например: Недельная глава, Хасидут..."
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 pl-12 font-medium text-sm focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`h-[54px] w-full md:w-auto md:px-12 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 self-end ${editingId ? "bg-amber-500 hover:bg-amber-600" : "bg-red-500 hover:bg-red-600"}`}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : editingId ? (
            <Save size={16} />
          ) : (
            <Plus size={16} />
          )}
          {editingId ? "Обновить видео" : "Сохранить видео"}
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
                className={`p-4 pl-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all shadow-sm ${editingId === video.id ? "bg-amber-50/30 dark:bg-amber-900/10 border-amber-500 shadow-md" : "bg-white dark:bg-neutral-900 border-neutral-200/50 dark:border-neutral-800 hover:border-red-500/30"}`}
              >
                <div className="flex items-center gap-4 truncate">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${editingId === video.id ? "bg-amber-500/20 text-amber-500" : "bg-red-500/10 text-red-500"}`}
                  >
                    <Youtube size={20} />
                  </div>
                  <div className="truncate flex flex-col items-start">
                    {/* Вывод категории в админке, если есть */}
                    {video.category && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">
                        {video.category}
                      </span>
                    )}
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                      {video.title}
                    </h4>
                    {video.speaker ? (
                      <div className="flex items-center gap-2 mt-1">
                        <UserRound size={12} className="text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                          {video.speaker}
                        </span>
                      </div>
                    ) : (
                      <a
                        href={video.link}
                        target="_blank"
                        className="text-xs text-neutral-400 hover:text-red-500 truncate transition-colors block mt-1"
                      >
                        {video.link}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => handleEdit(video)}
                    className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-all shrink-0"
                    title="Редактировать"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    disabled={deletingId === video.id}
                    className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shrink-0"
                    title="Удалить"
                  >
                    {deletingId === video.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
