"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, CheckCircle2 } from "lucide-react";

interface MassWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  participants: { phone: string; name: string }[];
}

export default function MassWhatsAppModal({
  isOpen,
  onClose,
  eventName,
  participants,
}: MassWhatsAppModalProps) {
  // Шаблон сообщения. {name} и {event} будут автоматически заменены.
  const [messageTemplate, setMessageTemplate] = useState(
    `Шалом, {name}! 👋\nНапоминаем про ваше участие в событии «{event}», которое состоится уже скоро. Ждем вас!`,
  );

  // Сохраняем индексы тех, кому уже нажали "Отправить"
  const [sentIndexes, setSentIndexes] = useState<Set<number>>(new Set());

  // Сброс чеклиста при закрытии/открытии новой модалки
  useEffect(() => {
    if (isOpen) setSentIndexes(new Set());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = (phone: string, name: string, index: number) => {
    // Очищаем номер телефона от всего, кроме цифр (WhatsApp требует формат 972501234567 без +)
    const cleanPhone = phone.replace(/\D/g, "");

    // Подставляем данные в шаблон
    const finalMessage = messageTemplate
      .replace(/{name}/g, name)
      .replace(/{event}/g, eventName);

    // Кодируем текст для URL и формируем ссылку
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMessage)}`;

    // Открываем WhatsApp в новой вкладке
    window.open(waLink, "_blank");

    // Отмечаем как отправленное
    setSentIndexes((prev) => new Set(prev).add(index));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                Рассылка в WhatsApp
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Событие: <span className="font-bold">{eventName}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* BODY */}
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Текстовое поле для шаблона */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-black text-neutral-500 mb-2">
                Шаблон сообщения
              </label>
              <textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                className="w-full h-32 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm focus:ring-2 focus:ring-[#FFB800]/50 outline-none resize-none"
                placeholder="Введите текст сообщения..."
              />
              <p className="text-[10px] text-neutral-400 mt-2">
                Используйте{" "}
                <code className="bg-neutral-200 dark:bg-neutral-800 px-1 rounded text-[#FFB800]">{`{name}`}</code>{" "}
                для имени и{" "}
                <code className="bg-neutral-200 dark:bg-neutral-800 px-1 rounded text-[#FFB800]">{`{event}`}</code>{" "}
                для названия события.
              </p>
            </div>

            {/* Список участников */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs uppercase tracking-widest font-black text-neutral-500">
                  Участники ({participants.length})
                </label>
                <span className="text-xs font-bold text-green-500">
                  Отправлено: {sentIndexes.size} / {participants.length}
                </span>
              </div>

              <div className="space-y-2">
                {participants.map((p, idx) => {
                  const isSent = sentIndexes.has(idx);
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        isSent
                          ? "bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/20"
                          : "bg-white border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-neutral-900 dark:text-white">
                          {p.name}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {p.phone}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSend(p.phone, p.name, idx)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                          isSent
                            ? "bg-green-500 text-white"
                            : "bg-[#25D366] hover:bg-[#1ebd5b] text-white shadow-md shadow-[#25D366]/20"
                        }`}
                      >
                        {isSent ? (
                          <>
                            <CheckCircle2 size={16} />
                            Отправлено
                          </>
                        ) : (
                          <>
                            <MessageCircle size={16} />
                            Отправить
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
