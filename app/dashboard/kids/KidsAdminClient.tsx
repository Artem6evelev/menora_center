"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Calendar,
  Mail,
  Phone,
  Users,
  Trash2,
  Filter,
  XCircle,
  Loader2,
} from "lucide-react";
import { deleteKidsApplication } from "@/actions/kids.actions";

// Жестко заданный список всех программ (как на лендинге)
const PROGRAM_OPTIONS = [
  "Занятия по еврейской традиции и изучению Торы",
  "Творческие мастерские",
  "Программы для детей с нейроотличиями",
  "Совместные праздники и встречи",
  "Коммуникативные навыки и лидерство",
  "Разговорный клуб иврита",
  "Разговорный клуб русского языка",
  "Подростковые клубы «Я и мой путь»",
];

export default function KidsAdminClient({
  initialApplications,
}: {
  initialApplications: any[];
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Состояния фильтров
  const [filterType, setFilterType] = useState<"all" | "resident" | "guest">(
    "all",
  );
  const [filterProgram, setFilterProgram] = useState<string>("all"); // 🔥 Фильтр по программе
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту заявку?")) return;

    setIsDeleting(id);
    await deleteKidsApplication(id);
    setIsDeleting(null);
  };

  const filteredApplications =
    initialApplications?.filter((app) => {
      // 1. Фильтр Резидент / Гость
      if (filterType === "resident" && !app.userId) return false;
      if (filterType === "guest" && app.userId) return false;

      // 2. 🔥 Фильтр по названию программы
      if (filterProgram !== "all" && app.programTitle !== filterProgram) {
        return false;
      }

      // 3. Фильтр по возрасту детей
      if (minAge || maxAge) {
        const min = minAge ? parseInt(minAge) : 0;
        const max = maxAge ? parseInt(maxAge) : 999;

        const childrenArray = Array.isArray(app.children) ? app.children : [];

        const hasMatchingChild = childrenArray.some((child: any) => {
          const age = parseInt(child.age);
          if (isNaN(age)) return false;
          return age >= min && age <= max;
        });

        if (!hasMatchingChild) return false;
      }
      return true;
    }) || [];

  const clearFilters = () => {
    setFilterType("all");
    setFilterProgram("all");
    setMinAge("");
    setMaxAge("");
  };

  const isChildMatchingFilter = (childAgeString: string) => {
    if (!minAge && !maxAge) return true;
    const age = parseInt(childAgeString);
    if (isNaN(age)) return false;
    const min = minAge ? parseInt(minAge) : 0;
    const max = maxAge ? parseInt(maxAge) : 999;
    return age >= min && age <= max;
  };

  return (
    <div className="space-y-6">
      {/* ПАНЕЛЬ ФИЛЬТРОВ */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[32px] p-4 sm:p-6 flex flex-col xl:flex-row gap-4 xl:items-center shadow-sm">
        <div className="flex items-center gap-2 text-neutral-400 shrink-0">
          <Filter size={20} />
          <span className="text-xs font-black uppercase tracking-widest">
            Фильтры:
          </span>
        </div>

        <div className="flex flex-wrap gap-4 flex-1">
          {/* Фильтр: Резидент / Гость */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 outline-none focus:border-[#FFB800] transition-colors cursor-pointer w-full sm:w-auto"
          >
            <option value="all">Все пользователи</option>
            <option value="resident">Только Резиденты</option>
            <option value="guest">Только Гости</option>
          </select>

          {/* 🔥 Фильтр: Программы */}
          <select
            value={filterProgram}
            onChange={(e) => setFilterProgram(e.target.value)}
            className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 outline-none focus:border-[#FFB800] transition-colors cursor-pointer w-full sm:flex-1 max-w-md truncate"
          >
            <option value="all">Все программы</option>
            {PROGRAM_OPTIONS.map((program) => (
              <option key={program} value={program}>
                {program}
              </option>
            ))}
          </select>

          {/* Фильтр: Возраст */}
          <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-1 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs font-bold text-neutral-500 whitespace-nowrap">
              Возраст детей:
            </span>
            <div className="flex items-center">
              <input
                type="number"
                placeholder="От"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                className="w-12 sm:w-16 bg-transparent text-sm font-medium text-center outline-none py-2 dark:text-white"
              />
              <span className="text-neutral-300">-</span>
              <input
                type="number"
                placeholder="До"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                className="w-12 sm:w-16 bg-transparent text-sm font-medium text-center outline-none py-2 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Кнопка сброса */}
        {(filterType !== "all" ||
          filterProgram !== "all" ||
          minAge ||
          maxAge) && (
          <button
            onClick={clearFilters}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors w-full xl:w-auto shrink-0"
          >
            <XCircle size={16} /> Сбросить
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-950/50 border-b border-neutral-100 dark:border-neutral-800">
                <th className="p-6 text-xs font-black uppercase tracking-widest text-neutral-400 whitespace-nowrap">
                  Дата
                </th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-neutral-400 whitespace-nowrap">
                  Родитель
                </th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-neutral-400 whitespace-nowrap">
                  Контакты
                </th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-neutral-400 min-w-[200px]">
                  Программа
                </th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-neutral-400">
                  Дети (Имя, Возраст, Дата)
                </th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-neutral-400 text-right">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-12 text-center text-neutral-500 font-medium"
                  >
                    Заявок не найдено.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="p-6 align-top whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                        <Calendar
                          size={14}
                          className="text-neutral-400 shrink-0"
                        />
                        {format(new Date(app.createdAt), "dd MMM yyyy, HH:mm", {
                          locale: ru,
                        })}
                      </div>
                    </td>
                    <td className="p-6 align-top font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                      {app.parentFirstName} {app.parentLastName}
                      {app.userId ? (
                        <div className="text-[10px] font-black uppercase tracking-widest text-green-500 mt-1">
                          Резидент
                        </div>
                      ) : (
                        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
                          Гость
                        </div>
                      )}
                    </td>
                    <td className="p-6 align-top space-y-2 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                        <Phone
                          size={14}
                          className="text-neutral-400 shrink-0"
                        />{" "}
                        {app.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                        <Mail size={14} className="text-neutral-400 shrink-0" />{" "}
                        {app.email}
                      </div>
                    </td>
                    <td className="p-6 align-top">
                      <span className="inline-block px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-100 dark:border-amber-500/20 leading-relaxed">
                        {app.programTitle}
                      </span>
                    </td>

                    <td className="p-6 align-top">
                      <div className="flex flex-col gap-2 max-w-[250px]">
                        {(Array.isArray(app.children) ? app.children : [])?.map(
                          (child: any, idx: any) => {
                            const isMatch = isChildMatchingFilter(child.age);
                            return (
                              <div
                                key={idx}
                                className={`flex flex-col rounded-xl px-3 py-2 border w-fit transition-all ${
                                  isMatch
                                    ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700"
                                    : "bg-neutral-50 dark:bg-neutral-900 border-transparent opacity-40"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-200">
                                  <Users
                                    size={12}
                                    className={
                                      isMatch
                                        ? "text-[#FFB800]"
                                        : "text-neutral-400"
                                    }
                                  />
                                  {child.name}{" "}
                                  <span className="text-neutral-400 font-medium">
                                    ({child.age} лет)
                                  </span>
                                </div>
                                {child.birthDate && (
                                  <div className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 pl-[18px] mt-0.5">
                                    Дата:{" "}
                                    {format(
                                      new Date(child.birthDate),
                                      "dd.MM.yyyy",
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </td>

                    <td className="p-6 align-top text-right">
                      <button
                        onClick={() => handleDelete(app.id)}
                        disabled={isDeleting === app.id}
                        className="p-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 inline-flex items-center justify-center"
                        title="Удалить заявку"
                      >
                        {isDeleting === app.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
