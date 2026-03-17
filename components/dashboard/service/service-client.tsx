"use client";

import { useState, useEffect } from "react";
import { Plus, HeartHandshake, Tags } from "lucide-react";
import ServiceModal from "./service-modal";
import ServiceCard from "./service-card";
import ServiceCategoryModal from "./service-category-modal";
import { useServiceStore } from "@/store/useServiceStore";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";

export default function ServicesClient({
  initialServices,
  categories,
  isAdmin,
}: {
  initialServices: any[];
  categories: any[];
  isAdmin: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<any | null>(null);

  const { services, setServices, setCategories } = useServiceStore();

  // Плавная пружинная анимация Apple для всех элементов
  const springTransition = {
    duration: 0.5,
    ease: cubicBezier(0.22, 1, 0.36, 1),
  };

  // Синхронизируем данные с сервером при загрузке
  useEffect(() => {
    setServices(initialServices);
    setCategories(categories);
  }, [initialServices, categories, setServices, setCategories]);

  const handleCreateNew = () => {
    setServiceToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setServiceToEdit(item);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto w-full pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springTransition}
        >
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
            Услуги{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              Общины
            </span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2 text-lg leading-relaxed max-w-xl">
            Управление консультациями, обрядами и образовательными программами
            центра.
          </p>
        </motion.div>

        {/* Кнопки админа (Категории + Добавить) */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, ...springTransition }}
            className="flex flex-wrap items-center gap-3 shrink-0"
          >
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="group flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-5 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-colors active:scale-95"
            >
              <Tags size={16} strokeWidth={2.5} />
              Категории
            </button>

            <button
              onClick={handleCreateNew}
              className="group flex items-center gap-2 bg-[#FFB800] hover:bg-[#E5A600] text-black px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-[#FFB800]/20 active:scale-95"
            >
              <Plus
                size={18}
                strokeWidth={2.5}
                className="transition-transform group-hover:rotate-90"
              />
              Добавить
            </button>
          </motion.div>
        )}
      </div>

      {/* CONTENT */}
      {services.length === 0 ? (
        // EMPTY STATE (Премиальная карточка если пусто)
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...springTransition }}
          className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-[40px] p-16 text-center flex flex-col items-center justify-center shadow-sm relative overflow-hidden"
        >
          {/* Декоративное свечение */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FFB800]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 w-24 h-24 bg-[#FFB800]/10 dark:bg-[#FFB800]/5 rounded-3xl flex items-center justify-center text-[#FFB800] mb-6 shadow-inner">
            <HeartHandshake size={40} strokeWidth={1.5} />
          </div>
          <h3 className="relative z-10 text-3xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight">
            Список услуг пока пуст
          </h3>
          <p className="relative z-10 text-neutral-500 dark:text-neutral-400 font-medium max-w-md text-lg leading-relaxed">
            {isAdmin
              ? "Нажмите кнопку «Добавить», чтобы создать первую услугу в каталоге."
              : "Здесь скоро появятся услуги общины. Загляните чуть позже!"}
          </p>
        </motion.div>
      ) : (
        // GRID
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, ...springTransition }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {services.map((item) => (
              <motion.div
                key={item.service.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={springTransition}
              >
                <ServiceCard
                  item={item}
                  onEdit={handleEdit}
                  isAdmin={isAdmin}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Модальные окна (открываются поверх всего) */}
      {isAdmin && (
        <>
          <ServiceModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            editData={serviceToEdit}
          />
          <ServiceCategoryModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}
