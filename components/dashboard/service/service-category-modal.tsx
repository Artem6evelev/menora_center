"use client";

import { useState } from "react";
import { X, Trash2, Plus, Loader2 } from "lucide-react";
import {
  createServiceCategory,
  deleteServiceCategory,
} from "@/actions/service";
import { useServiceStore } from "@/store/useServiceStore";

export default function ServiceCategoryModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { categories, addCategory, removeCategory } = useServiceStore();

  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const res = await createServiceCategory(name, color);

    if (res.success) {
      addCategory({ id: res.id, name, color });
      setName("");
      setColor("#6366f1");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Удалить эту категорию? Услуги из этой категории останутся, но будут 'Без категории'.",
      )
    )
      return;

    setDeletingId(id);
    const res = await deleteServiceCategory(id);
    if (res.success) {
      removeCategory(id);
    }
    setDeletingId(null);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">Категории услуг</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Форма создания */}
          <form
            onSubmit={handleCreate}
            className="mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100"
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3">
              Создать новую
            </h3>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer shrink-0 border-none bg-transparent"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название категории..."
                className="flex-1 border border-gray-200 p-2.5 rounded-xl outline-none focus:border-indigo-500 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full mt-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-bold text-sm transition-colors flex justify-center"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Добавить"
              )}
            </button>
          </form>

          {/* Список категорий */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">
              Существующие категории
            </h3>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Категорий пока нет
              </p>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex justify-between items-center p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-gray-800 text-sm">
                        {cat.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      {deletingId === cat.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
