"use client";

import { Edit2, Trash2, Clock, Banknote } from "lucide-react";
import { useServiceStore } from "@/store/useServiceStore";
import { deleteService } from "@/actions/service";

export default function ServiceCard({ item, onEdit, isAdmin }: any) {
  const { service, category } = item;
  const { deleteService: deleteFromStore } = useServiceStore();

  const serviceImageUrl = service.imageUrl || "/default-service.png";

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Удалить услугу "${service.title}"?`)) {
      deleteFromStore(service.id);
      await deleteService(service.id);
    }
  };

  return (
    <div className="group relative rounded-3xl overflow-hidden aspect-[3/4] bg-gray-100 shadow-sm transition-all hover:shadow-lg border border-gray-100">
      {/* Изображение */}
      <img
        src={serviceImageUrl}
        alt={service.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Кнопки админа */}
      {isAdmin && (
        <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(item)}
            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:text-indigo-600 shadow-sm transition-all"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:text-red-600 shadow-sm transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* Оверлей */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        {category && (
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/80 mb-2">
            {category.name}
          </span>
        )}

        <h3 className="text-white text-xl font-bold leading-tight mb-3">
          {service.title}
        </h3>

        {/* Цена и длительность */}
        <div className="flex items-center gap-4 mb-4">
          {service.price && (
            <div className="flex items-center gap-1.5 text-green-400 text-sm font-bold">
              <Banknote size={14} />
              <span>{service.price}</span>
            </div>
          )}
          {service.duration && (
            <div className="flex items-center gap-1.5 text-blue-300 text-sm font-medium">
              <Clock size={14} />
              <span>{service.duration}</span>
            </div>
          )}
        </div>

        {service.description && (
          <p className="text-gray-300 text-xs line-clamp-3 leading-relaxed">
            {service.description}
          </p>
        )}
      </div>
    </div>
  );
}
