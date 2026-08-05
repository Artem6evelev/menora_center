import { getKidsApplications } from "@/actions/kids.actions";
import { Baby } from "lucide-react";
import { Metadata } from "next";
import KidsAdminClient from "./KidsAdminClient"; // Импортируем нашу таблицу

export const metadata: Metadata = {
  title: "Заявки Menorah Kids",
};

export default async function KidsAdminPage() {
  // 🔥 Вот этот запрос получает данные из базы!
  const applications = await getKidsApplications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl flex items-center justify-center">
              <Baby size={20} />
            </div>
            Заявки Menorah Kids
          </h1>
          <p className="text-neutral-500 font-medium mt-2">
            Список всех регистраций на детские программы
          </p>
        </div>
        <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-900 rounded-full font-bold text-sm text-neutral-600 dark:text-neutral-400">
          Всего заявок: {applications.length}
        </div>
      </div>

      {/* 🔥 Передаем данные в клиентский компонент */}
      <KidsAdminClient initialApplications={applications} />
    </div>
  );
}
