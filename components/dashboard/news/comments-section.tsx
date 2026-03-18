"use client";

import { useState, useEffect } from "react";
import { useNewsComments } from "@/store/useNewsComments";
import { addNewsComment, deleteNewsComment } from "@/actions/news";
import { toast } from "sonner";
import { Trash2, Send, Loader2, MessageSquareOff } from "lucide-react";
import Link from "next/link";

export default function CommentsSection({
  newsId,
  initialComments,
  currentUser,
}: {
  newsId: string;
  initialComments: any[];
  currentUser: any | null;
}) {
  const { comments, setComments, addComment, removeComment } =
    useNewsComments();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Инициализируем Zustand начальными данными с сервера
  useEffect(() => {
    setComments(initialComments || []);
  }, [initialComments, setComments]);

  const handleSubmit = async () => {
    if (!content.trim() || !currentUser) return;
    setIsSubmitting(true);

    const tempId = Date.now().toString(); // Временный ID для моментального отображения

    // Создаем фейковый коммент для мгновенного отображения в UI
    const optimisticComment = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      user: currentUser, // Текущий юзер из пропсов
    };

    addComment(optimisticComment);
    setContent("");

    // Отправляем на сервер
    const res = await addNewsComment(
      newsId,
      currentUser.id,
      optimisticComment.content,
    );
    if (!res.success) {
      removeComment(tempId); // Если ошибка - убираем коммент
      toast.error(res.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить комментарий?")) return;
    removeComment(id); // Сразу прячем
    const res = await deleteNewsComment(id);
    if (!res.success) toast.error(res.error);
  };

  const canManage =
    currentUser?.role === "superadmin" || currentUser?.role === "admin";

  return (
    <div className="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800">
      <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter mb-8">
        Обсуждение <span className="text-neutral-400">({comments.length})</span>
      </h3>

      {/* Поле ввода (только для резидентов) */}
      {currentUser ? (
        <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-3xl mb-12 flex items-end gap-4 border border-neutral-200 dark:border-neutral-800">
          <div className="w-10 h-10 rounded-full bg-[#FFB800] text-black flex items-center justify-center font-bold text-sm shrink-0 uppercase">
            {currentUser.firstName?.charAt(0) || "U"}
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Поделитесь своими мыслями..."
              className="w-full bg-transparent resize-none outline-none max-h-32 text-neutral-900 dark:text-white placeholder:text-neutral-400 font-medium"
              rows={2}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="p-3 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 shrink-0"
          >
            {isSubmitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      ) : (
        <div className="bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-3xl p-6 mb-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#FFB800] font-bold text-sm">
            Оставлять комментарии могут только резиденты общины.
          </p>
          <Link
            href="/sign-in"
            className="px-6 py-2.5 bg-[#FFB800] text-black font-bold text-sm rounded-full transition-transform hover:scale-105 shrink-0"
          >
            Войти в систему
          </Link>
        </div>
      )}

      {/* Список комментариев */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
            <MessageSquareOff size={48} className="mb-4 opacity-50" />
            <p className="font-medium text-lg">
              Пока нет комментариев. Будьте первыми!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4 group">
              {/* Аватарка */}
              {comment.user?.imageUrl ? (
                <img
                  src={comment.user.imageUrl}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center font-bold shrink-0">
                  {comment.user?.firstName?.charAt(0) || "U"}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {comment.user?.firstName} {comment.user?.lastName}
                  </span>
                  <span className="text-xs font-medium text-neutral-400">
                    {new Date(comment.createdAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-2xl rounded-tl-sm inline-block">
                  {comment.content}
                </p>

                {/* Кнопка удаления для админов */}
                {canManage && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="ml-3 text-[10px] font-black uppercase tracking-widest text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
