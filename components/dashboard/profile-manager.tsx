"use client";

import { useState } from "react";
import {
  User,
  Phone,
  MapPin,
  Heart,
  Baby,
  Edit2,
  X,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { AFFILIATION_LABELS, Affiliation } from "@/lib/community/policy";
import GiyurStageForm from "@/components/community/giyur-stage-form";
import OnboardingForm from "./main/onboarding-form";

// --- Вспомогательные функции для расчета возраста ---
function getPlural(number: number, words: string[]) {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[
    number % 100 > 4 && number % 100 < 20
      ? 2
      : cases[number % 10 < 5 ? number % 10 : 5]
  ];
}

function calculateAge(dateString: string | Date | null) {
  if (!dateString) return "Возраст не указан";
  const birthDate = new Date(dateString);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 0) return "Ещё не родился";

  if (age === 0) {
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0) months += 12;
    if (today.getDate() < birthDate.getDate()) months--;

    if (months <= 0) return "Меньше месяца";
    return `${months} ${getPlural(months, ["месяц", "месяца", "месяцев"])}`;
  }

  return `${age} ${getPlural(age, ["год", "года", "лет"])}`;
}
// ----------------------------------------------------

export default function ProfileManager({ user }: { user: any }) {
  const [isEditing, setIsEditing] = useState(false);

  // ==========================================
  // РЕЖИМ ПРОСМОТРА ПРОФИЛЯ
  // ==========================================
  if (!isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-[32px] p-6 md:p-8 shadow-sm relative overflow-hidden"
      >
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-[#FFB800]/10 text-[#FFB800] rounded-xl">
              <User size={24} />
            </div>
            Мой Профиль
          </h2>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
          >
            <Edit2 size={16} />{" "}
            <span className="hidden sm:inline">Изменить</span>
          </button>
        </div>

        {user.affiliation === "giyur" && user.gender === "female" && !user.giyurStage && <div className="mb-6"><a href="/dashboard/kids" className="font-bold underline">Добавить или записать ребёнка — перейти в детский раздел</a></div>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <InfoRow
              icon={User}
              label="ФИО"
              value={`${user.firstName} ${user.lastName || ""}`}
            />
            <InfoRow
              icon={Mail}
              label="Email (не редактируется)"
              value={user.email}
            />
            <InfoRow icon={Phone} label="Телефон" value={user.phone} />
            <InfoRow icon={MapPin} label="Город" value={user.city} />
            <InfoRow icon={User} label="Пол" value={user.gender === "female" ? "Женский" : user.gender === "male" ? "Мужской" : "Не указан"} />
            <InfoRow icon={Heart} label="Связь с еврейством" value={AFFILIATION_LABELS[user.affiliation as Affiliation] || "Требуется уточнить в анкете"} />
          </div>

          <div className="bg-orange-50/50 dark:bg-orange-950/20 p-6 md:p-8 rounded-3xl border border-orange-100 dark:border-orange-900/30 flex flex-col h-full">
            <h3 className="font-black text-sm uppercase tracking-widest text-neutral-500 mb-6">
              Семья
            </h3>
            <InfoRow
              icon={Heart}
              label="Статус"
              value={
                user.maritalStatus === "married"
                  ? `В браке (${user.spouseName || "Имя не указано"})`
                  : user.maritalStatus === "single"
                    ? "Холост / Не замужем"
                    : user.maritalStatus === "divorced"
                      ? "В разводе"
                      : user.maritalStatus === "widowed"
                        ? "Вдовец / Вдова"
                        : "Не указано"
              }
            />

            {user.hasChildren &&
              user.childrenData &&
              user.childrenData.length > 0 && (
                <div className="mt-6 pt-6 border-t border-orange-200/50 dark:border-orange-800/50 flex-1">
                  <div className="flex items-center gap-2 text-neutral-500 mb-4">
                    <Baby size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Дети ({user.childrenData.length})
                    </span>
                  </div>

                  {/* Адаптивная сетка карточек детей */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {user.childrenData.map((child: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-white/60 dark:bg-neutral-900/50 border border-orange-200/50 dark:border-orange-800/50 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-neutral-900 dark:text-white text-sm truncate">
                            {child.name}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-medium mt-0.5">
                            {child.dateOfBirth
                              ? new Date(child.dateOfBirth).toLocaleDateString(
                                  "ru-RU",
                                )
                              : "Дата не указана"}
                          </div>
                        </div>
                        <div className="text-[11px] font-black px-2.5 py-1.5 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-lg shrink-0 text-center">
                          {calculateAge(child.dateOfBirth)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </motion.div>
    );
  }

  return <div className="space-y-4"><button type="button" onClick={() => setIsEditing(false)} className="font-bold underline">Отмена</button><OnboardingForm userId={user.id} initialProfile={user} onSaved={() => setIsEditing(false)} /></div>;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | undefined | null;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 rounded-[14px] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">
          {label}
        </div>
        <div className="font-bold text-neutral-900 dark:text-white leading-tight">
          {value || "Не указано"}
        </div>
      </div>
    </div>
  );
}
