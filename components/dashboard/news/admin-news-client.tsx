"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Pin,
  Image as ImageIcon,
  Loader2,
  X,
  Tags,
} from "lucide-react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  createNews,
  updateNews,
  deleteNews,
  getNewsCategories,
  createNewsCategory,
  deleteNewsCategory,
} from "@/actions/news";
import { uploadImageAction } from "@/actions/news"; // Используем твой экшен для загрузки картинок
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function AdminNewsClient({
  initialNews,
}: {
  initialNews: any[];
}) {
  const [newsList, setNewsList] = useState(initialNews);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  // Состояния для категорий
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("newspaper");

  // Состояния формы новости
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Загружаем категории при старте
  useEffect(() => {
    getNewsCategories().then(setCategories);
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImageFile(null);
    setImageUrl("");
    setIsPinned(false);
    setIsPublished(true);
    setSelectedCategoryId("");
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setImageUrl(item.imageUrl || "");
    setIsPinned(item.isPinned);
    setIsPublished(item.isPublished);
    setSelectedCategoryId(item.categoryId || "");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Точно удалить новость?")) return;
    const res = await deleteNews(id);
    if (res.success) {
      toast.success("Новость удалена");
      setNewsList((prev) => prev.filter((n) => n.id !== id));
    } else {
      toast.error(res.error);
    }
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      toast.error("Заполните заголовок и текст");
      return;
    }
    setIsSubmitting(true);
    let uploadedImageUrl = imageUrl;

    if (imageFile) {
      toast.loading("Загружаем обложку...");
      const formData = new FormData();
      formData.append("file", imageFile);
      const uploadRes = await uploadImageAction(formData);
      toast.dismiss();
      if (uploadRes.success && uploadRes.url) {
        uploadedImageUrl = uploadRes.url;
      } else {
        toast.error("Ошибка загрузки картинки");
        setIsSubmitting(false);
        return;
      }
    }

    const newsData = {
      title,
      content,
      imageUrl: uploadedImageUrl,
      isPinned,
      isPublished,
      categoryId: selectedCategoryId || null,
      authorId: "admin",
    };

    let res;
    if (editingId) {
      res = await updateNews(editingId, newsData);
    } else {
      res = await createNews(newsData);
    }

    if (res.success) {
      toast.success(editingId ? "Сохранено!" : "Опубликовано!");
      setIsModalOpen(false);
      resetForm();
      window.location.reload(); // Перезагружаем, чтобы подтянуть изменения
    } else {
      toast.error(res.error);
    }
    setIsSubmitting(false);
  };

  // --- Функции для категорий ---
  const handleCreateCategory = async () => {
    if (!newCatName) return;
    const res = await createNewsCategory({
      name: newCatName,
      description: newCatDesc,
      icon: newCatIcon,
    });
    if (res.success) {
      toast.success("Тема создана");
      setNewCatName("");
      setNewCatDesc("");
      getNewsCategories().then(setCategories);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Удалить тему?")) return;
    const res = await deleteNewsCategory(id);
    if (res.success) {
      toast.success("Удалено");
      getNewsCategories().then(setCategories);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-[32px] p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter">
            Все новости
          </h2>
          <p className="text-neutral-500 font-medium mt-1">
            Управление блогом общины
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-full font-bold text-sm transition-all"
          >
            <Tags size={18} />
            Темы
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 bg-[#FFB800] hover:bg-orange-500 text-black rounded-full font-bold text-sm transition-all shadow-lg shadow-[#FFB800]/20"
          >
            <Plus size={18} />
            Написать статью
          </button>
        </div>
      </div>

      {/* Список новостей */}
      <div className="space-y-4">
        {newsList.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 group hover:border-[#FFB800]/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-full h-full p-4 text-neutral-400" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  {item.title}
                </h3>
                <div className="flex gap-3 text-xs font-bold uppercase tracking-widest mt-1">
                  <span
                    className={
                      item.isPublished ? "text-green-500" : "text-neutral-400"
                    }
                  >
                    {item.isPublished ? "Опубликовано" : "Черновик"}
                  </span>
                  {item.isPinned && (
                    <span className="text-[#FFB800] flex items-center gap-1">
                      <Pin size={12} /> Важное
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEdit(item)}
                className="p-2 text-neutral-500 hover:text-[#FFB800] bg-white dark:bg-neutral-900 rounded-full shadow-sm"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-neutral-500 hover:text-red-500 bg-white dark:bg-neutral-900 rounded-full shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* МОДАЛКА НОВОСТИ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-8 border border-neutral-200 dark:border-neutral-800">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black tracking-tighter">
                {editingId ? "Редактировать статью" : "Новая статья"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Выбор темы (Категории) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pl-1">
                  Тема статьи (Категория)
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border-none rounded-2xl p-4 font-bold text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#FFB800]"
                >
                  <option value="">-- Без темы --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                placeholder="Заголовок новости"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-3xl font-black bg-transparent border-none outline-none placeholder:text-neutral-300 dark:placeholder:text-neutral-700"
              />

              <div className="flex gap-4 items-center p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-[#FFB800]/20 text-[#FFB800] flex items-center justify-center">
                  <ImageIcon size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Обложка статьи</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="text-xs mt-1 text-neutral-500"
                  />
                </div>
              </div>

              <div className="h-[300px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  className="h-full"
                  placeholder="Напишите потрясающую статью..."
                />
              </div>

              <div className="flex gap-6 mt-10">
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
                  <span className="font-bold text-sm">Опубликовать</span>
                </label>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 mt-8 bg-[#FFB800] text-black font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin mx-auto" />
                ) : (
                  "Сохранить статью"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА УПРАВЛЕНИЯ ТЕМАМИ */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-950 rounded-[32px] w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black tracking-tighter">
                Темы новостей
              </h2>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl mb-6 space-y-3">
              <input
                type="text"
                placeholder="Название темы (напр. Праздники)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-neutral-950 font-bold outline-none border border-neutral-200 dark:border-neutral-800"
              />
              <input
                type="text"
                placeholder="Краткое описание"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-neutral-950 text-sm outline-none border border-neutral-200 dark:border-neutral-800"
              />
              <select
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-white dark:bg-neutral-950 text-sm font-bold outline-none border border-neutral-200 dark:border-neutral-800"
              >
                <option value="newspaper">Иконка: Газета</option>
                <option value="users">Иконка: Люди</option>
                <option value="calendardays">Иконка: Календарь</option>
                <option value="bookheart">Иконка: Книга</option>
                <option value="scrolltext">Иконка: Свиток</option>
              </select>
              <button
                onClick={handleCreateCategory}
                className="w-full py-2 bg-[#FFB800] text-black font-bold rounded-xl text-sm hover:opacity-90"
              >
                Добавить тему
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-center text-sm text-neutral-500 py-4">
                  Нет созданных тем
                </p>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex justify-between items-center p-3 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl"
                  >
                    <div>
                      <div className="font-bold text-sm">{cat.name}</div>
                      <div className="text-[10px] text-neutral-400">
                        {cat.slug}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
