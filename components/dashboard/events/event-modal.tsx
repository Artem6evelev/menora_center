"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Loader2,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createService,
  updateService,
  createServiceCategory,
  deleteServiceCategory,
} from "@/actions/service";
import { useServiceStore } from "@/store/useServiceStore";
import { uploadEventImage } from "@/supabase/storage";

export default function ServiceModal({ isOpen, onClose, editData }: any) {
  const {
    addService,
    updateService: updateInStore,
    categories,
    addCategory,
    removeCategory,
  } = useServiceStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Текстовые поля
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Поля для картинки
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === Стейты для создания категории "на лету" ===
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#10b981");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    if (editData && isOpen) {
      setTitle(editData.service.title);
      setDescription(editData.service.description || "");
      setPrice(editData.service.price || "");
      setDuration(editData.service.duration || "");
      setCategoryId(editData.service.categoryId || "");
      setImagePreview(editData.service.imageUrl || null);
      setImageFile(null);
      setIsCreatingCategory(false);
    } else {
      setTitle("");
      setDescription("");
      setPrice("");
      setDuration("");
      setCategoryId("");
      setImagePreview(null);
      setImageFile(null);
      setIsCreatingCategory(false);
    }
  }, [editData, isOpen]);

  // Обработчик выбора файла
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // === Создание новой категории ===
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);

    try {
      const res = await createServiceCategory(
        newCategoryName,
        newCategoryColor,
      );
      if (res.success && res.id) {
        addCategory({
          id: res.id,
          name: newCategoryName,
          color: newCategoryColor,
        });
        setCategoryId(res.id); // Сразу выбираем новую категорию
        setIsCreatingCategory(false);
        setNewCategoryName("");
      }
    } catch (error) {
      console.error("Ошибка при создании категории", error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  // === Удаление выбранной категории ===
  const handleDeleteCategory = async (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;

    if (
      confirm(`Удалить категорию "${cat.name}"? Она исчезнет у всех услуг.`)
    ) {
      // Мгновенно убираем из интерфейса
      removeCategory(id);
      setCategoryId(""); // Сбрасываем выбранную в форме

      // Удаляем в базе
      await deleteServiceCategory(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalImageUrl = editData?.service?.imageUrl || "";

    if (imageFile) {
      try {
        const uploadedUrl = await uploadEventImage(imageFile);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      } catch (error) {
        alert("Не удалось загрузить картинку. Попробуйте еще раз.");
        setIsSubmitting(false);
        return;
      }
    }

    const data = {
      title,
      description,
      price,
      duration,
      categoryId,
      imageUrl: finalImageUrl,
    };

    if (editData) {
      await updateService(editData.service.id, data);
      updateInStore(editData.service.id, {
        service: { id: editData.service.id, ...data },
        category: categories.find((c) => c.id === categoryId),
      });
    } else {
      const res = await createService(data);
      if (res.success) {
        addService({
          service: { id: res.id, ...data },
          category: categories.find((c) => c.id === categoryId),
        });
      }
    }

    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">
            {editData ? "Редактировать услугу" : "Добавить услугу"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* ЗАГРУЗКА КАРТИНКИ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Обложка услуги
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group
                ${imagePreview ? "border-indigo-500" : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30"}
              `}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                      <Upload size={18} /> Изменить фото
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-500 group-hover:scale-110 transition-transform">
                    <ImageIcon size={24} />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    Нажмите для загрузки фото
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Рекомендуемый размер: 800x600px
                  </p>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название услуги *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white"
              placeholder="Напр: Индивидуальный урок Торы"
            />
          </div>

          {/* === БЛОК КАТЕГОРИИ === */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            {!isCreatingCategory ? (
              <div className="flex gap-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl p-3.5 outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white cursor-pointer"
                >
                  <option value="">Без категории</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                {/* КНОПКА УДАЛЕНИЯ */}
                {categoryId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(categoryId)}
                    className="p-3.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
                    title="Удалить выбранную категорию"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

                {/* КНОПКА СОЗДАНИЯ */}
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium text-sm transition-colors border border-gray-200"
                >
                  <Plus size={16} /> Создать
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                  title="Цвет категории"
                />
                <input
                  type="text"
                  placeholder="Название (напр. Обряды)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  disabled={isSavingCategory || !newCategoryName.trim()}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isSavingCategory ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Сохранить"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="px-3 py-2.5 text-gray-500 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Отмена
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Цена
              </label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white"
                placeholder="Напр: 200 ₪ или Бесплатно"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Длительность
              </label>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white"
                placeholder="Напр: 60 мин"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 p-3.5 rounded-xl outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white resize-none"
              rows={4}
              placeholder="Подробное описание услуги..."
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98] flex justify-center items-center"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                "Сохранить услугу"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
