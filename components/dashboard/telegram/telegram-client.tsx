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
import { updateBotSettings } from "@/actions/bot-settings";

interface TelegramClientProps {
  totalSubscribers: number;
  initialGroupId: string;
  initialEventsTopicId: string;
}

export default function TelegramClient({
  totalSubscribers,
  initialGroupId,
  initialEventsTopicId,
}: TelegramClientProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  const [groupId, setGroupId] = useState(initialGroupId);
  const [eventsTopicId, setEventsTopicId] = useState(initialEventsTopicId);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsLoading(true);
    setStatus(null);
    try {
      const result = await sendBroadcastMessage(message);
      if (result.success) {
        setStatus({ success: true, text: result.message || "Отправлено!" });
        setMessage("");
      } else {
        setStatus({ success: false, text: result.error || "Ошибка." });
      }
    } catch (error) {
      setStatus({ success: false, text: "Ошибка." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateBotSettings({
        notificationGroupId: groupId,
        eventsTopicId: eventsTopicId,
      });
      alert("Настройки группы успешно сохранены!");
    } catch (error) {
      alert("Ошибка при сохранении.");
    } finally {
      setIsSavingSettings(false);
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
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
            className="bg-white dark:bg-neutral-900 border border-neutral-200/50 rounded-[32px] p-8 shadow-sm flex flex-col gap-6"
          >
            <h2 className="text-xl font-black mb-1">Создать рассылку</h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Введите текст сообщения... (поддерживает HTML)"
              rows={6}
              className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 rounded-2xl p-4 font-medium text-sm outline-none focus:ring-2 focus:ring-[#FFB800]/50 resize-none"
              required
            />
            {status && (
              <div
                className={`p-4 rounded-2xl border flex gap-3 text-sm font-semibold ${status.success ? "bg-green-50 text-green-600 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}
              >
                {status.success ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}{" "}
                <p>{status.text}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="h-[54px] w-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Send size={16} /> Запустить рассылку
                </>
              )}
            </button>
          </form>

          {/* НАСТРОЙКИ УВЕДОМЛЕНИЙ В ГРУППУ */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 rounded-[32px] p-8 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <BellRing size={20} className="text-[#FFB800]" /> Прием заявок с
                сайта
              </h3>
              <p className="text-xs font-medium text-neutral-400 mt-1">
                Бот будет отправлять новые заявки в специальную группу с темами
                (Форум).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 mb-2 block">
                  ID Группы
                </label>
                <input
                  type="text"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  placeholder="-1003599570996"
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#FFB800]/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 mb-2 block">
                  ID Темы "Мероприятия"
                </label>
                <input
                  type="text"
                  value={eventsTopicId}
                  onChange={(e) => setEventsTopicId(e.target.value)}
                  placeholder="2"
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#FFB800]/50"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="mt-2 h-[54px] w-full bg-[#FFB800] text-black hover:bg-yellow-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#FFB800]/20"
            >
              {isSavingSettings ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Save size={16} /> Сохранить настройки
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* ШАБЛОНЫ */}
        <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 rounded-[32px] p-6 hidden lg:block">
          <h3 className="font-black text-sm uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
            <Megaphone size={14} className="text-[#FFB800]" /> Шаблоны
          </h3>
          <p className="text-xs text-neutral-500">Быстрые шаблоны рассылок.</p>
        </div>
      </div>
    </div>
  );
}
