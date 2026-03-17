"use client";

import { useState } from "react";
import { useCrmStore } from "@/store/useCrmStore";
import { sendBulkCrmMessages } from "@/actions/notification";
import { X, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BulkMessageModal() {
  const { isBulkModalOpen, closeBulkModal, selectedUserIds, clearSelection } =
    useCrmStore();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const springTransition: any = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

  const handleSend = async () => {
    if (!message.trim() || selectedUserIds.length === 0) return;
    setIsSending(true);

    const res = await sendBulkCrmMessages(selectedUserIds, message);

    if (res.success) {
      setMessage("");
      closeBulkModal();
      clearSelection();
    }
    setIsSending(false);
  };

  return (
    <AnimatePresence>
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={closeBulkModal}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springTransition}
            className="bg-white dark:bg-neutral-900 rounded-[40px] shadow-2xl w-full max-w-lg relative z-10 border border-neutral-200/50 dark:border-neutral-800/50 overflow-hidden"
          >
            {/* HEADER */}
            <div className="p-8 border-b border-neutral-100 dark:border-neutral-800/50 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-950/50">
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                Массовая рассылка
              </h3>
              <button
                onClick={closeBulkModal}
                className="p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-all active:scale-95 shadow-sm text-neutral-500"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-8">
              <div className="bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-2xl p-5 mb-6 shadow-inner">
                <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  Вы выбрали{" "}
                  <span className="font-black text-neutral-900 dark:text-white bg-[#FFB800]/20 px-2 py-0.5 rounded">
                    {selectedUserIds.length} чел.
                  </span>{" "}
                  Сообщение появится в их личном кабинете.
                </p>
              </div>

              <label className="block text-[10px] uppercase tracking-widest font-black text-neutral-400 mb-2 pl-1">
                Текст уведомления
              </label>
              <textarea
                autoFocus
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 min-h-[160px] outline-none focus:ring-2 focus:ring-[#FFB800]/50 bg-neutral-100/50 dark:bg-neutral-950/50 transition-all resize-none text-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
                placeholder="Напишите важное объявление для общины..."
              />
            </div>

            {/* FOOTER */}
            <div className="p-6 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800/50 flex gap-3">
              <button
                onClick={closeBulkModal}
                className="flex-1 py-4 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-2xl font-black uppercase tracking-widest text-[10px] text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all active:scale-95"
              >
                Отмена
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || !message.trim()}
                className="flex-[1.5] py-4 bg-[#FFB800] hover:bg-[#E5A600] text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex justify-center items-center gap-2 shadow-xl shadow-[#FFB800]/20 active:scale-95 disabled:opacity-30 disabled:shadow-none transition-all"
              >
                {isSending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    {" "}
                    <Send size={16} strokeWidth={2.5} /> Отправить{" "}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
