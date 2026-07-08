// components/dashboard/telegram-client.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Send,
  Loader2,
  Users,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  HeartHandshake,
  Coffee,
} from "lucide-react";
import { sendBroadcastMessage } from "@/actions/telegram";

export default function TelegramClient({
  totalSubscribers,
}: {
  totalSubscribers: number;
}) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsLoading(true);
    setStatus(null);

    try {
      const result = await sendBroadcastMessage(message);

      if (result.success) {
        setStatus({
          success: true,
          text: result.message || "Рассылка успешно отправлена!",
        });
        setMessage(""); // Очищаем поле после успеха
      } else {
        setStatus({
          success: false,
          text: result.error || "Ошибка при отправке рассылки.",
        });
      }
    } catch (error) {
      setStatus({ success: false, text: "Произошла системная ошибка." });
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для быстрой вставки готовых шаблонов рекламы/анонсов
  const insertTemplate = (type: "hasidut" | "tzedakah") => {
    if (type === "hasidut") {
      setMessage(
        "<b>☕️ Утренний Хасидут с кофе уже начинается!</b>\n\nЖдем всех резидентов общины на наше традиционное утреннее вдохновение. Изучаем внутренний смысл Торы в легкой и понятной форме.\n\n📍 Присоединяйтесь по ссылке прямо сейчас: <a href='https://menorah-rishon.com/lessons'>Смотреть трансляцию</a>",
      );
    } else if (type === "tzedakah") {
      setMessage(
        "<b>🤍 Важный сбор Цдаки общины Menorah Center</b>\n\nКаждая монета, вложенная в развитие уроков Торы и помощь нуждающимся семьям нашей общины, возвращается благословением во все ваши дела.\n\n👉 Сделать вклад онлайн в 1 клик: <a href='https://shutaf.im/cba30'>Поддержать общину</a>",
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-12">
      {/* ЗАГОЛОВОК */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tighter">
          Управление{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">
            Telegram Ботом
          </span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2">
          Создавайте мгновенные рассылки и рекламу для всех пользователей,
          которые запустили вашего бота.
        </p>
      </div>

      {/* СТАТИСТИКА */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">
              Аудитория в боте
            </p>
            <p className="text-2xl font-black text-neutral-900 dark:text-white leading-tight">
              {totalSubscribers} чел.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ФОРМА РАССЫЛКИ */}
        <motion.form
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSend}
          className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-[32px] p-8 shadow-sm flex flex-col gap-6"
        >
          <div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight mb-1">
              Создать рассылку
            </h2>
            <p className="text-xs font-medium text-neutral-400">
              Вы можете использовать HTML-теги для форматирования текста.
            </p>
          </div>

          <div className="w-full relative">
            <label className="block text-[10px] uppercase tracking-widest font-black text-neutral-500 mb-2 pl-2">
              Текст сообщения (Реклама / Объявление)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Введите текст сообщения... Например: <b>Жирный текст</b>, <a href='ссылка'>Ссылка</a>"
              rows={8}
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 font-medium text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all resize-none leading-relaxed"
              required
            />
          </div>

          {/* СТАТУС ОТПРАВКИ */}
          {status && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 text-sm font-semibold ${
                status.success
                  ? "bg-green-50/50 dark:bg-green-950/20 border-green-500/30 text-green-600 dark:text-green-400"
                  : "bg-red-50/50 dark:bg-red-950/20 border-red-500/30 text-red-600 dark:text-red-400"
              }`}
            >
              {status.success ? (
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
              )}
              <p>{status.text}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="h-[54px] w-full bg-blue-600 hover:bg-blue-600/90 disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:text-neutral-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/10"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Отправляем сообщения...
              </>
            ) : (
              <>
                <Send size={16} />
                Запустить рассылку сейчас
              </>
            )}
          </button>
        </motion.form>

        {/* ПАНЕЛЬ БЫСТРЫХ ШАБЛОНОВ */}
        <div className="space-y-4">
          <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60 rounded-[32px] p-6">
            <h3 className="font-black text-sm uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
              <Megaphone size={14} className="text-blue-500" /> Быстрые шаблоны
            </h3>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => insertTemplate("hasidut")}
                className="w-full p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl text-left hover:border-blue-500/40 hover:shadow-sm transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Coffee size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    Анонс Хасидута
                  </p>
                  <p className="text-[10px] font-medium text-neutral-400 mt-0.5">
                    Шаблон утреннего урока
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => insertTemplate("tzedakah")}
                className="w-full p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl text-left hover:border-blue-500/40 hover:shadow-sm transition-all flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 group-hover:bg-green-500 group-hover:text-white transition-colors">
                  <HeartHandshake size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    Сбор Цдаки
                  </p>
                  <p className="text-[10px] font-medium text-neutral-400 mt-0.5">
                    Шаблон ссылки на оплату
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
