"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Loader2,
  Image as ImageIcon,
  Save,
  Send,
  UserRound,
} from "lucide-react";
import { createNews, uploadImageAction } from "@/actions/news";
// @ts-ignore: CSS import has no type declarations
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function CreateNewsClient({
  role,
  categories,
  authors,
}: {
  role: string;
  categories: any[];
  authors: { id: string; name: string }[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [targetAuthorId, setTargetAuthorId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [isPinned, setIsPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // ЖЕСТКАЯ ПРОВЕРКА НА ПУСТЫЕ ПОЛЯ
    if (!title.trim()) {
      alert("⚠️ Пожалуйста, введите заголовок статьи!");
      return;
    }
    if (!content.trim() || content === "<p><br></p>") {
      alert("⚠️ Пожалуйста, напишите текст статьи!");
      return;
    }

    setIsSubmitting(true);
    let uploadedImageUrl = "";

    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadRes = await uploadImageAction(formData);
      if (uploadRes.success && uploadRes.url) {
        uploadedImageUrl = uploadRes.url;
      } else {
        alert(
          "❌ Ошибка загрузки картинки: " +
            (uploadRes.error || "Неизвестная ошибка"),
        );
        setIsSubmitting(false);
        return;
      }
    }

    const status =
      role === "author" ? "draft" : isPublished ? "published" : "draft";

    const newsData = {
      title,
      content,
      imageUrl: uploadedImageUrl,
      isPinned: role === "author" ? false : isPinned,
      categoryId: selectedCategoryId || null,
      targetAuthorId: targetAuthorId || null,
      status: status as any,
    };

    const res = await createNews(newsData);

    setIsSubmitting(false);

    if (res.success) {
      alert(
        role === "author"
          ? "✅ Черновик успешно сохранен!"
          : "✅ Статья успешно создана!",
      );
      if (role === "author") {
        router.push("/dashboard/author-profile?tab=articles");
      } else {
        router.push("/dashboard/news");
      }
    } else {
      alert("❌ Ошибка при сохранении: " + res.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-6 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter">
          {role === "author" ? "Написать статью" : "Создать новость"}
        </h1>
        <p className="text-neutral-500 font-medium mt-2">
          {role === "author"
            ? "Статья сохранится как черновик в вашем кабинете. Потом вы сможете отправить её на публикацию."
            : "Создание новой статьи от имени администрации или выбранного спикера."}
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">
              Тема статьи
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 font-bold outline-none focus:border-amber-500"
            >
              <option value="">-- Без темы --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {(role === "superadmin" || role === "admin") && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1 flex items-center gap-1">
                <UserRound size={12} /> Публикация от лица:
              </label>
              <select
                value={targetAuthorId}
                onChange={(e) => setTargetAuthorId(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 font-bold outline-none focus:border-amber-500"
              >
                <option value="">От имени Администрации</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Укажите заголовок статьи..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-3xl font-black bg-transparent border-b border-neutral-200 dark:border-neutral-800 pb-2 outline-none placeholder:text-neutral-300 dark:placeholder:text-neutral-700"
        />

        <div className="flex gap-4 items-center p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <div className="w-12 h-12 rounded-xl bg-[#FFB800]/20 text-[#FFB800] flex items-center justify-center">
            <ImageIcon size={24} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Обложка статьи</p>
            <input
              type="file"
              accept=".png, .jpg, .jpeg, .webp, image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="text-xs mt-1 text-neutral-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="h-[400px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 mb-12">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            className="h-full"
            placeholder="Напишите потрясающую статью..."
          />
        </div>

        {(role === "superadmin" || role === "admin") && (
          <div className="flex gap-6 mt-12 pt-6 border-t border-neutral-100 dark:border-neutral-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`w-12 h-7 rounded-full transition-all relative ${isPinned ? "bg-[#FFB800]" : "bg-neutral-200"}`}
                onClick={() => setIsPinned(!isPinned)}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isPinned ? "left-6" : "left-1"}`}
                />
              </div>
              <span className="font-bold text-sm">Закрепить</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`w-12 h-7 rounded-full transition-all relative ${isPublished ? "bg-green-500" : "bg-neutral-200"}`}
                onClick={() => setIsPublished(!isPublished)}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isPublished ? "left-6" : "left-1"}`}
                />
              </div>
              <span className="font-bold text-sm">Опубликовать сразу</span>
            </label>
          </div>
        )}

        <div className="pt-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-[#FFB800] text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : role === "author" ? (
              <Save size={18} />
            ) : (
              <Send size={18} />
            )}
            {role === "author" ? "Сохранить как черновик" : "Сохранить статью"}
          </button>
        </div>
      </div>
    </div>
  );
}
