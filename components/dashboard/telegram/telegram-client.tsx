"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Loader2,
  Users,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  HeartHandshake,
  Coffee,
  Save,
  BellRing,
} from "lucide-react";
import { sendBroadcastMessage } from "@/actions/telegram";
import { updateBotSettings } from "@/actions/bot-settings"; // Путь к экшену настроек

interface TelegramClientProps {
  totalSubscribers: number;
  initialAdminChatId: string;
}

export default function TelegramClient({
  totalSubscribers,
  initialAdminChatId,
}: TelegramClientProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  const [adminChatId, setAdminChatId] = useState(initialAdminChatId);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);

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
        setMessage("");
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

  const handleSaveAdminId = async () => {
    setIsSavingAdmin(true);
    try {
      await updateBotSettings({ adminNotificationChatId: adminChatId });
      alert("ID для получения файлов успешно сохранен!");
    } catch (error) {
      alert("Ошибка при сохранении ID.");
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const insertTemplate = (type: "hasidut" | "tzedakah") => {
    if (type === "hasidut") {
      setMessage(
        "<b>☕️ Утренний Хасидут с кофе уже начинается!</b>\n\nЖдем всех резидентов общины на наше традиционное утреннее вдохновение.\n\n📍 Присоединяйтесь по ссылке прямо сейчас: <a href='https://t.me/menorah_rishon'>Смотреть трансляцию</a>",
      );
    } else if (type === "tzedakah") {
      setMessage(
        "<b>🤍 Важный сбор Цдаки общины Menorah Center</b>\n\nКаждая монета, вложенная в развитие уроков Торы и помощь общине, возвращается благословением во все ваши дела.\n\n👉 Сделать вклад онлайн в 1 клик: <a href='https://shutaf.im/cba30'>Поддержать общину</a>",
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tighter">
          Управление{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
            Telegram Ботом
          </span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2">
          Создавайте рассылки и настраивайте уведомления.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 bg-[#FFB800]/10 text-[#FFB800] rounded-2xl flex items-center justify-center shrink-0">
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
        <motion.div className="lg:col-span-2 flex flex-col gap-8">
          {/* ФОРМА РАССЫЛКИ */}
          <form
            onSubmit={handleSend}
            className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-[32px] p-8 shadow-sm flex flex-col gap-6"
          >
            <div>
              <h2 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight mb-1">
                Создать рассылку
              </h2>
            </div>

            <div className="w-full relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Введите текст сообщения... Например: <b>Жирный текст</b>"
                rows={8}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 font-medium text-sm outline-none transition-all resize-none leading-relaxed focus:ring-2 focus:ring-[#FFB800]/50"
                required
              />
            </div>

            {status && (
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 text-sm font-semibold ${status.success ? "bg-green-50/50 border-green-500/30 text-green-600" : "bg-red-50/50 border-red-500/30 text-red-600"}`}
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
              className="h-[54px] w-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 disabled:opacity-50 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Отправляем...
                </>
              ) : (
                <>
                  <Send size={16} /> Запустить рассылку сейчас
                </>
              )}
            </button>
          </form>

          {/* НАСТРОЙКИ УВЕДОМЛЕНИЙ */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-[32px] p-8 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
                <BellRing size={20} className="text-[#FFB800]" />
                Уведомления о записях на события
              </h3>
              <p className="text-xs font-medium text-neutral-400 mt-1">
                Укажите свой Telegram Chat ID (только цифры). Бот будет
                присылать текстовый файл с данными при каждой записи.
              </p>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <input
                type="text"
                value={adminChatId}
                onChange={(e) => setAdminChatId(e.target.value)}
                placeholder="Chat ID (например: 123456789)"
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 font-medium text-sm outline-none transition-all focus:ring-2 focus:ring-[#FFB800]/50"
              />
              <button
                type="button"
                onClick={handleSaveAdminId}
                disabled={isSavingAdmin}
                className="h-[54px] px-8 bg-[#FFB800] text-black hover:bg-yellow-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shrink-0 shadow-lg shadow-[#FFB800]/20"
              >
                {isSavingAdmin ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Save size={16} /> Сохранить
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ШАБЛОНЫ */}
        <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-800/60 rounded-[32px] p-6">
          <h3 className="font-black text-sm uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
            <Megaphone size={14} className="text-[#FFB800]" /> Быстрые шаблоны
          </h3>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => insertTemplate("hasidut")}
              className="w-full p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl text-left hover:border-[#FFB800]/40 transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Coffee size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  Анонс Хасидута
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => insertTemplate("tzedakah")}
              className="w-full p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl text-left hover:border-[#FFB800]/40 transition-all flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 group-hover:bg-green-500 group-hover:text-white transition-colors">
                <HeartHandshake size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  Сбор Цдаки
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
