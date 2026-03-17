import { getBotSettings } from "@/actions/bot-settings";
import TelegramSettingsClient from "@/components/dashboard/telegram/telegram-settings-client";

export default async function TelegramPage() {
  const settings = await getBotSettings();

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-neutral-900 tracking-tighter">
          Управление <span className="text-[#FFB800]">Telegram Ботом</span>
        </h1>
        <p className="text-neutral-500 font-medium mt-2">
          Настройка автоматизации утреннего Хасидута и рассылок.
        </p>
      </div>

      <TelegramSettingsClient initialSettings={settings} />
    </div>
  );
}
