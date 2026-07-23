"use client";

import { useState } from "react";
import { moderateContent } from "@/actions/moderation.actions";
import { Check, X, Newspaper, Video, Loader2 } from "lucide-react";

export default function ModerationClient({
  pendingData,
}: {
  pendingData: any;
}) {
  const allItems = [
    ...pendingData.articles.map((a: any) => ({ ...a, contentType: "news" })),
    ...pendingData.videos.map((v: any) => ({ ...v, contentType: "video" })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async (id: string, type: "news" | "video") => {
    setIsLoading(true);
    await moderateContent(id, type, "approve");
    alert("✅ Контент успешно опубликован!");
    setIsLoading(false);
  };

  const handleReject = async (id: string, type: "news" | "video") => {
    if (!comment.trim()) return alert("⚠️ Напишите причину отказа!");
    setIsLoading(true);
    await moderateContent(id, type, "reject", comment);
    alert("❌ Контент отклонен и возвращен автору.");
    setRejectId(null);
    setComment("");
    setIsLoading(false);
  };

  if (allItems.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800">
        <p className="text-xl font-bold text-neutral-400">
          Нет материалов на проверку 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allItems.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm"
        >
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  {item.contentType === "news" ? (
                    <Newspaper size={12} />
                  ) : (
                    <Video size={12} />
                  )}
                  {item.contentType === "news" ? "Статья" : "Видео"}
                </span>
                <span className="text-sm font-bold text-amber-600">
                  Автор: {item.author?.firstName} {item.author?.lastName}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              {item.contentType === "video" && (
                <a
                  href={item.link}
                  target="_blank"
                  className="text-sm text-blue-500 hover:underline"
                >
                  Смотреть видео на YouTube
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {rejectId === item.id ? (
                <div className="flex flex-col gap-2 w-full md:min-w-[300px]">
                  <textarea
                    placeholder="Причина отказа (увидит автор)..."
                    className="w-full text-sm p-3 rounded-xl border bg-neutral-50 dark:bg-neutral-950 outline-none focus:border-red-500"
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(item.id, item.contentType)}
                      disabled={isLoading}
                      className="flex-1 bg-red-500 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        "Отправить отказ"
                      )}
                    </button>
                    <button
                      onClick={() => setRejectId(null)}
                      className="px-4 bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white text-xs font-bold rounded-xl"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleApprove(item.id, item.contentType)}
                    disabled={isLoading}
                    className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <Check size={18} /> Одобрить
                  </button>
                  <button
                    onClick={() => setRejectId(item.id)}
                    className="px-4 py-3 bg-red-100 dark:bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
