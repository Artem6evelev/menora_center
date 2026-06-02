"use client";

import { useState, useEffect } from "react";
import { X, Loader2, MessageCircle, Send } from "lucide-react";
import { sendMassWhatsApp } from "@/actions/whatsapp";

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
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Обновляем шаблон сообщения, когда открывается модалка для нового события
  useEffect(() => {
    if (isOpen) {
      setMessage(
        `Шалом, {name}!\nНапоминаем, что сегодня состоится "${eventName}". Будем рады вас видеть!`,
      );
      setResult(null);
    }
  }, [isOpen, eventName]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!message.trim() || participants.length === 0) return;

    setIsSending(true);
    setResult(null);

    const res = await sendMassWhatsApp(participants, message);

    setIsSending(false);
    if (res.success) {
      setResult(res.message || "Успешно отправлено");
      setTimeout(() => {
        setResult(null);
        onClose();
      }, 4000); // Закрываем через 4 секунды после успеха
    } else {
      alert(`Ошибка: ${res.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 transition-all">
      <div
        className="bg-white dark:bg-neutral-900 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-neutral-200/50 dark:border-neutral-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ШАПКА */}
        <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/30 dark:bg-neutral-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-500">
              <MessageCircle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white">
                Массовая рассылка
              </h2>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-0.5">
                {participants.length} получателей
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* КОНТЕНТ */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2.5">
              Текст сообщения
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending || !!result}
              className="w-full bg-neutral-50 dark:bg-neutral-950 border-2 border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 min-h-[140px] resize-none text-sm font-medium leading-relaxed transition-all disabled:opacity-60"
              placeholder="Введите текст сообщения..."
            />
            <p className="text-[11px] text-neutral-500 mt-2 font-medium">
              💡 Используйте тег{" "}
              <span className="font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">{`{name}`}</span>
              , чтобы подставить имя участника.
            </p>
          </div>

          {/* СООБЩЕНИЕ ОБ УСПЕХЕ */}
          {result && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-2xl text-green-800 dark:text-green-400 text-sm font-bold flex items-center justify-center gap-2">
              <MessageCircle size={16} />
              {result}
            </div>
          )}
        </div>

        {/* КНОПКИ */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSending}
            className="flex-1 py-4 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-2xl font-bold text-neutral-600 dark:text-neutral-300 text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSend}
            disabled={
              isSending ||
              !!result ||
              !message.trim() ||
              participants.length === 0
            }
            className="flex-[2] py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-green-500/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all"
          >
            {isSending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Send size={16} /> Отправить всем
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
