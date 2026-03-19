"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Loader2,
  Upload,
  Image as ImageIcon,
  Plus,
  Calendar,
  MapPin,
  Users,
  Coins,
} from "lucide-react";

import { createEvent, updateEvent, createEventCategory } from "@/actions/event"; // Проверь путь к экшенам
import { useEventStore } from "@/store/useEventStore";
import { uploadEventImage } from "@/supabase/storage";

export default function EventModal({ isOpen, onClose, editData }: any) {
  const {
    addEvent,
    updateEvent: updateInStore,
    categories,
    addCategory,
  } = useEventStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState("");
  const [audience, setAudience] = useState("all");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#FFB800");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    if (editData && isOpen) {
      const ev = editData.event || editData;

      setTitle(ev.title || "");
      setDescription(ev.description || "");
      setCategoryId(ev.categoryId || "");
      setEventDate(ev.date || "");
      setEventTime(ev.time || "");
      setLocation(ev.location || "");
      setIsFree(ev.isFree || false);
      setPrice(ev.price || "");
      setAudience(ev.audience || "all");
      setImagePreview(ev.imageUrl || null);

      setImageFile(null);
      setIsCreatingCategory(false);
    } else {
      setTitle("");
      setDescription("");
      setCategoryId("");
      setEventDate("");
      setEventTime("");
      setLocation("");
      setIsFree(false);
      setPrice("");
      setAudience("all");
      setImagePreview(null);
      setImageFile(null);
      setIsCreatingCategory(false);
    }
  }, [editData, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);
    try {
      const res = await createEventCategory(newCategoryName, newCategoryColor);
      if (res.success && res.id) {
        addCategory({
          id: res.id,
          name: newCategoryName,
          color: newCategoryColor,
          createdAt: new Date() as any,
        });
        setCategoryId(res.id);
        setIsCreatingCategory(false);
        setNewCategoryName("");
      }
    } catch (error) {
      console.error("Ошибка", error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const ev = editData?.event || editData;
    let finalImageUrl = ev?.imageUrl || "";

    if (imageFile) {
      try {
        const uploadedUrl = await uploadEventImage(imageFile);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      } catch (error) {
        alert("Не удалось загрузить картинку.");
        setIsSubmitting(false);
        return;
      }
    }

    const data = {
      title,
      description,
      categoryId,
      date: eventDate,
      time: eventTime,
      location,
      isFree,
      price: isFree ? "" : price,
      audience,
      imageUrl: finalImageUrl,
    };

    if (editData) {
      await updateEvent(ev.id, data);
      updateInStore(ev.id, {
        event: {
          id: ev.id,
          ...ev,
          ...data,
        } as any,
        category: categories.find((c) => c.id === categoryId) || null,
      });
    } else {
      const res = await createEvent(data);
      if (res.success) {
        addEvent({
          event: {
            id: res.id,
            status: "planned",
            createdAt: new Date(),
            ...data,
          } as any,
          category: categories.find((c) => c.id === categoryId) || null,
        });
      }
    }

    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl sm:rounded-[32px] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] transition-transform duration-300 scale-100">
        <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-neutral-50/50 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight line-clamp-1">
            {editData ? "Редактировать событие" : "Создать событие"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 rounded-full transition-colors text-neutral-500 hover:text-black flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1"
        >
          {/* ОБЛОЖКА */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">
              Обложка афиши
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative w-full h-40 sm:h-56 rounded-2xl sm:rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group
                ${imagePreview ? "border-[#FFB800]" : "border-neutral-300 hover:border-[#FFB800] hover:bg-[#FFB800]/5"}
              `}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold text-xs sm:text-sm flex items-center gap-2 bg-black/50 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full backdrop-blur-md">
                      <Upload size={16} className="sm:size-[18px]" /> Заменить
                      афишу
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 text-neutral-400 group-hover:text-[#FFB800] group-hover:bg-[#FFB800]/10 transition-colors">
                    <ImageIcon size={24} className="sm:size-[28px]" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-neutral-700">
                    Нажмите для загрузки
                  </p>
                  <p className="text-[10px] sm:text-xs text-neutral-400 mt-1">
                    Рекомендуем вертикальную
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

          {/* НАЗВАНИЕ */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">
              Название события *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-2 border-neutral-200 p-3 sm:p-4 rounded-xl sm:rounded-2xl outline-none focus:border-[#FFB800] transition-colors text-sm sm:text-base"
              placeholder="Напр: Большой хасидский фарбренген"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <label className="block text-sm font-bold text-neutral-700">
                Когда?
              </label>
              <div className="grid grid-cols-1 xs:grid-cols-[1fr,auto] gap-2">
                <div className="relative">
                  <Calendar
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  />
                  <input
                    required
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full border-2 border-neutral-200 p-3 pl-10 rounded-xl sm:rounded-2xl outline-none focus:border-[#FFB800] text-sm"
                  />
                </div>
                <div className="relative xs:w-28">
                  <input
                    required
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full border-2 border-neutral-200 p-3 rounded-xl sm:rounded-2xl outline-none focus:border-[#FFB800] text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <label className="block text-sm font-bold text-neutral-700">
                Где?
              </label>
              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border-2 border-neutral-200 p-3 pl-10 rounded-xl sm:rounded-2xl outline-none focus:border-[#FFB800] text-sm"
                  placeholder="Адрес или ссылка на Zoom"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 bg-neutral-50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-neutral-100 items-start">
            <div className="flex flex-col space-y-3">
              <label className="block text-sm font-bold text-neutral-700 flex items-center gap-2">
                <Coins size={16} className="text-[#FFB800]" /> Стоимость
              </label>
              <div
                className={`transition-all duration-300 ease-in-out ${isFree ? "max-h-0 opacity-0 overflow-hidden" : "max-h-16 opacity-100"}`}
              >
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isFree}
                  className="w-full border-2 border-neutral-200 p-3 rounded-xl outline-none focus:border-[#FFB800] text-sm transition-colors disabled:bg-neutral-100"
                  placeholder="Цена (напр. 200 ₪)"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-300 text-[#FFB800] focus:ring-[#FFB800] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-neutral-800 group-hover:text-black">
                    Событие бесплатное
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <label className="block text-sm font-bold text-neutral-700 flex items-center gap-2">
                <Users size={16} className="text-[#FFB800]" /> Для кого?
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full border-2 border-neutral-200 p-3 rounded-xl outline-none focus:border-[#FFB800] bg-white cursor-pointer text-sm"
              >
                <option value="all">Для всех</option>
                <option value="men">Только для мужчин</option>
                <option value="women">Только для женщин</option>
                <option value="kids">Для детей</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">
              Категория (Тег на карточке)
            </label>
            {!isCreatingCategory ? (
              <div className="flex gap-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex-1 border-2 border-neutral-200 rounded-xl p-3 outline-none focus:border-[#FFB800] bg-white cursor-pointer text-sm"
                >
                  <option value="">Выберите категорию...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-bold text-xs sm:text-sm transition-colors border border-neutral-200 flex items-center gap-1.5 flex-shrink-0"
                >
                  <Plus size={16} />{" "}
                  <span className="hidden xs:inline">Создать</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-xl transition-all duration-300">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-9 h-9 rounded cursor-pointer border-0 p-0 bg-transparent flex-shrink-0"
                  title="Цвет категории"
                />
                <input
                  type="text"
                  placeholder="Название..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 min-w-[120px] border-2 border-neutral-200 p-2 rounded-lg outline-none focus:border-[#FFB800] text-sm"
                  autoFocus
                />
                <div className="flex gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={handleSaveCategory}
                    className="px-3 py-2 bg-black text-white rounded-lg text-xs font-bold disabled:opacity-50"
                  >
                    {isSavingCategory ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Сохранить"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(false)}
                    className="px-2.5 py-2 text-neutral-500 font-medium text-xs hover:bg-neutral-100 rounded-lg"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-2">
              Описание события
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-2 border-neutral-200 p-3 sm:p-4 rounded-xl sm:rounded-2xl outline-none focus:border-[#FFB800] min-h-[100px] sm:min-h-[120px] resize-none text-sm"
              placeholder="Расскажите подробнее о мероприятии..."
            />
          </div>

          <div className="pt-3 sm:pt-4 border-t border-neutral-100 flex-shrink-0">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 sm:py-5 bg-[#FFB800] hover:bg-orange-500 text-black rounded-full font-black uppercase tracking-widest text-xs sm:text-sm transition-all shadow-lg shadow-[#FFB800]/20 flex justify-center items-center active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Сохранить событие"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
