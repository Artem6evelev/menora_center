"use client";

import { useState, useEffect } from "react";
import { X, Upload, Loader2, Plus, Trash2 } from "lucide-react";
import {
  createService,
  updateService,
  createServiceCategory,
  deleteServiceCategory,
} from "@/actions/service";
import { useServiceStore } from "@/store/useServiceStore";
import { uploadEventImage } from "@/supabase/storage";

export default function ServiceModal({ isOpen, onClose, editData }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    addService,
    updateService: updateInStore,
    categories,
    addCategory,
    removeCategory,
  } = useServiceStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#10b981"); // Зеленый для услуг по умолчанию
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setDuration("");
    setCategoryId("");
    setImageFile(null);
    setImagePreview(null);
    setIsCreatingCategory(false);
    setNewCategoryName("");
  };

  useEffect(() => {
    if (isOpen && editData) {
      const { service } = editData;
      setTitle(service.title);
      setDescription(service.description || "");
      setPrice(service.price || "");
      setDuration(service.duration || "");
      setCategoryId(service.categoryId || "");
      setImagePreview(service.imageUrl || null);
      setIsCreatingCategory(false);
    } else if (isOpen && !editData) {
      resetForm();
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

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
          createdAt: new Date(),
        });
        setCategoryId(res.id);
        setIsCreatingCategory(false);
        setNewCategoryName("");
      }
    } catch (error) {
      console.error("Ошибка при создании категории", error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;

    if (
      confirm(`Удалить категорию "${cat.name}"? Она исчезнет у всех услуг.`)
    ) {
      removeCategory(id);
      setCategoryId("");
      await deleteServiceCategory(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalImageUrl = editData?.service?.imageUrl || null;

      if (imageFile) {
        const uploadedUrl = await uploadEventImage(imageFile);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }

      const serviceData = {
        title,
        description: description || undefined,
        price: price || undefined,
        duration: duration || undefined,
        categoryId: categoryId || undefined,
        imageUrl: finalImageUrl || undefined,
      };

      if (editData) {
        const res = await updateService(editData.service.id, serviceData);
        if (res.success) {
          updateInStore(editData.service.id, {
            service: {
              ...editData.service,
              ...serviceData,
              imageUrl: finalImageUrl,
            } as any,
            category: categories.find((c) => c.id === categoryId) || null,
          });
          onClose();
        }
      } else {
        const res = await createService(serviceData);
        if (res.success && res.id) {
          addService({
            service: {
              id: res.id,
              ...serviceData,
              imageUrl: finalImageUrl,
              isActive: true,
              createdAt: new Date(),
            } as any,
            category: categories.find((c) => c.id === categoryId) || null,
          });
          onClose();
        }
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Ошибка при сохранении");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = !!editData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditMode ? "Редактировать услугу" : "Добавить услугу"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Обложка услуги
              </label>
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 overflow-hidden relative">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <Upload className="w-8 h-8 mb-3 text-gray-400 mx-auto" />
                    <p className="mb-1 text-sm text-gray-700 font-semibold">
                      Нажмите для загрузки фото
                    </p>
                    <p className="text-xs text-gray-400">
                      Рекомендуемый размер: 800x600px
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название услуги *
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  type="text"
                  placeholder="Напр: Индивидуальный урок Торы"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border"
                />
              </div>

              {/* === БЛОК КАТЕГОРИИ (Как в событиях) === */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Категория
                </label>

                {!isCreatingCategory ? (
                  <div className="flex gap-2">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="flex-1 border-gray-300 rounded-lg shadow-sm p-2.5 border bg-white focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Без категории</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>

                    {categoryId && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(categoryId)}
                        className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-100 flex items-center justify-center"
                        title="Удалить выбранную категорию"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory(true)}
                      className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors border border-gray-200"
                    >
                      <Plus size={16} /> Создать
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      title="Цвет категории"
                    />
                    <input
                      type="text"
                      placeholder="Название категории"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 border-gray-300 rounded-md p-2 text-sm border focus:ring-indigo-500 focus:border-indigo-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveCategory}
                      disabled={isSavingCategory || !newCategoryName.trim()}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isSavingCategory ? "..." : "Сохранить"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory(false)}
                      className="px-3 py-2 text-gray-500 hover:bg-gray-200 rounded-md text-sm font-medium"
                    >
                      Отмена
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Цена
                </label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="text"
                  placeholder="Напр: 200 ₪ или Бесплатно"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Длительность
                </label>
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  type="text"
                  placeholder="Напр: 60 мин"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание услуги
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Подробное описание услуги..."
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isEditMode ? "Сохранить изменения" : "Сохранить услугу"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
