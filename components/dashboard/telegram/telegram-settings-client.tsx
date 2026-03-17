"use client";

import { useState } from "react";
import {
  updateBotSettings,
  sendBulkTelegramMessage,
} from "@/actions/bot-settings";
import { toast } from "sonner";
import {
  Send,
  Save,
  Bell,
  Link as LinkIcon,
  Coffee,
  Heart,
} from "lucide-react";

export default function TelegramSettingsClient({
  initialSettings,
}: {
  initialSettings: any;
}) {
  const [settings, setSettings] = useState(
    initialSettings || {
      isActive: true,
      channelLink: "",
      tzedakahLink: "",
      reminderMessage:
        "Доброе утро! ☕️ Утренний Хасидут начнется через 10 минут. Ждем вас!",
      tzedakahMessage:
        "Спасибо, что были с нами на эфире! Поддержать общину можно по ссылке ниже:",
    },
  );

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    await updateBotSettings(settings);
    toast.success("Настройки бота обновлены");
    setIsLoading(false);
  };

  const handleSendTzedakah = async () => {
    if (!settings.tzedakahLink)
      return toast.error("Сначала укажите ссылку на цдаку");

    const confirmSend = confirm("Отправить ссылку на цдаку всем резидентам?");
    if (!confirmSend) return;

    setIsLoading(true);
    const text = `${settings.tzedakahMessage}\n\n${settings.tzedakahLink}`;
    const res = await sendBulkTelegramMessage(text);
    toast.success(`Сообщение отправлено ${res.count} резидентам`);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Основные настройки */}
      <div className="bg-white rounded-[32px] border border-neutral-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFB800]/10 rounded-full flex items-center justify-center text-[#FFB800]">
              <Bell size={20} />
            </div>
            <div>
              <p className="font-bold text-neutral-900">Статус уведомлений</p>
              <p className="text-xs text-neutral-400 font-medium uppercase tracking-widest">
                Утренние пуши
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setSettings({ ...settings, isActive: !settings.isActive })
            }
            className={`w-14 h-8 rounded-full transition-all relative ${settings.isActive ? "bg-[#FFB800]" : "bg-neutral-200"}`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.isActive ? "left-7" : "left-1"}`}
            />
          </button>
        </div>

        <div className="grid gap-6">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block ml-1">
              Ссылка на закрытый канал
            </label>
            <div className="relative">
              <LinkIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                size={16}
              />
              <input
                value={settings.channelLink}
                onChange={(e) =>
                  setSettings({ ...settings, channelLink: e.target.value })
                }
                placeholder="https://t.me/joinchat/..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#FFB800]/50 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2 block ml-1">
              Ссылка для Утренней Цдаки
            </label>
            <div className="relative">
              <Heart
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFB800]"
                size={16}
              />
              <input
                value={settings.tzedakahLink}
                onChange={(e) =>
                  setSettings({ ...settings, tzedakahLink: e.target.value })
                }
                placeholder="https://pay.menora.center/..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#FFB800]/50 font-medium"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
        >
          {isLoading ? (
            "Загрузка..."
          ) : (
            <>
              <Save size={16} /> Сохранить настройки
            </>
          )}
        </button>
      </div>

      {/* Быстрые действия */}
      <div className="bg-[#FFB800]/5 rounded-[32px] border border-[#FFB800]/20 p-8">
        <h3 className="text-xl font-black text-neutral-900 mb-4 flex items-center gap-2">
          <Coffee size={24} className="text-[#FFB800]" /> Прямой эфир
        </h3>
        <p className="text-sm text-neutral-600 font-medium mb-6">
          После завершения трансляции в Telegram, вы можете отправить ссылку на
          пожертвование всем авторизованным участникам.
        </p>
        <button
          onClick={handleSendTzedakah}
          disabled={isLoading}
          className="w-full py-6 bg-[#FFB800] text-black rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl shadow-[#FFB800]/20 hover:scale-[1.02] transition-all active:scale-95"
        >
          <Send size={20} /> Отправить ссылку на Цдаку сейчас
        </button>
      </div>
    </div>
  );
}
