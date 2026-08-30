"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Baby,
  Plus,
  Trash2,
  Star,
  Palette,
  Brain,
  MessageCircleQuestion,
  Compass,
  Users as UsersIcon,
  MessageSquare,
  Loader2,
  UserPlus,
  Heart,
  CheckCircle2,
} from "lucide-react";
import { updateFamilyProfile } from "@/actions/user";
import { submitKidsApplication } from "@/actions/kids.actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const programs = [
  {
    title: "Занятия по еврейской традиции и изучению Торы",
    age: "4-12 лет",
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    title: "Творческие мастерские",
    age: "4-12 лет",
    icon: Palette,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    title: "Программы для детей с нейроотличиями",
    age: "3-12 лет",
    icon: Brain,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Коммуникативные навыки и лидерство",
    age: "6-12 лет",
    icon: UsersIcon,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Разговорный клуб иврита",
    age: "4-12 лет",
    icon: MessageCircleQuestion,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
  },
  {
    title: "Разговорный клуб русского языка",
    age: "4-12 лет",
    icon: MessageSquare,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    title: "Подростковые клубы «Я и мой путь»",
    age: "12-17 лет",
    icon: Compass,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
];

export default function KidsDashboardClient({
  user,
  applications,
}: {
  user: any;
  applications: any[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"family" | "programs">("family");

  const [spouseName, setSpouseName] = useState(user?.spouseName || "");

  const getInitialChildren = () => {
    try {
      if (!user?.childrenData) return [{ name: "", dateOfBirth: "" }];
      const parsed =
        typeof user.childrenData === "string"
          ? JSON.parse(user.childrenData)
          : user.childrenData;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c) => ({
          name: c.name || "",
          dateOfBirth: c.dateOfBirth || c.birthDate || "",
        }));
      }
      return [{ name: "", dateOfBirth: "" }];
    } catch (e) {
      return [{ name: "", dateOfBirth: "" }];
    }
  };

  const [children, setChildren] =
    useState<{ name: string; dateOfBirth: string }[]>(getInitialChildren());
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [enrollingProgram, setEnrollingProgram] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const calculateAge = (dateString: string) => {
    if (!dateString) return "";
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age.toString();
  };

  const handleUpdateChild = (
    index: number,
    field: "name" | "dateOfBirth",
    value: string,
  ) => {
    const newChildren = [...children];
    newChildren[index][field] = value;
    setChildren(newChildren);
    setSaveSuccess(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const validChildren = children.filter((c) => c.name.trim() !== "");
    const res = await updateFamilyProfile(user.id, spouseName, validChildren);

    if (res.success) {
      setSaveSuccess(true);
      if (validChildren.length === 0)
        setChildren([{ name: "", dateOfBirth: "" }]);
      else setChildren(validChildren);

      setTimeout(() => setSaveSuccess(false), 3000);
      router.refresh();
    } else {
      alert("Не удалось сохранить профили. Попробуйте еще раз.");
    }
    setIsSaving(false);
  };

  const handleEnroll = async (programTitle: string) => {
    const validChildren = children.filter((c) => c.name.trim() !== "");

    if (
      validChildren.length === 0 ||
      validChildren.some((c) => !c.dateOfBirth)
    ) {
      alert(
        "Сначала добавьте ребенка (Имя и Дата рождения) во вкладке 'Моя семья' и сохраните профиль.",
      );
      setActiveTab("family");
      return;
    }

    setIsEnrolling(true);
    setEnrollingProgram(programTitle);

    const res = await submitKidsApplication({
      programTitle,
      parentFirstName: user.firstName || "Не указано",
      parentLastName: user.lastName || "Не указано",
      email: user.email,
      phone: user.phone || "Не указан",
      children: validChildren.map((c) => ({
        name: c.name,
        birthDate: c.dateOfBirth,
        dateOfBirth: c.dateOfBirth,
        age: calculateAge(c.dateOfBirth),
      })),
    });

    if (res.success) {
      alert("Заявка успешно отправлена!");
      window.location.reload();
    } else {
      alert("Ошибка при отправке заявки.");
    }

    setIsEnrolling(false);
    setEnrollingProgram(null);
  };

  return (
    <div className="max-w-6xl mx-auto w-full pb-20 px-4 sm:px-6 relative">
      {/* Декоративный бэкграунд-блик */}
      <div className="absolute top-0 left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pt-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl font-black text-neutral-900 dark:text-white tracking-tighter">
            Menorah{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
              Kids
            </span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-3 text-base md:text-lg max-w-xl leading-relaxed">
            Единое пространство для управления профилями вашей семьи и записи на
            развивающие программы.
          </p>
        </motion.div>
      </div>

      {/* TABS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 mb-10 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl p-1.5 rounded-[24px] w-fit border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm relative z-10"
      >
        <button
          onClick={() => setActiveTab("family")}
          className={cn(
            "relative z-10 px-6 sm:px-8 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300",
            activeTab === "family"
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
          )}
        >
          {activeTab === "family" && (
            <motion.div
              layoutId="kids-tab"
              className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-neutral-200/50 dark:border-neutral-700/50 -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="flex items-center gap-2">
            <Heart
              size={16}
              className={activeTab === "family" ? "text-pink-500" : ""}
            />{" "}
            Моя семья
          </span>
        </button>
        <button
          onClick={() => setActiveTab("programs")}
          className={cn(
            "relative z-10 px-6 sm:px-8 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300",
            activeTab === "programs"
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
          )}
        >
          {activeTab === "programs" && (
            <motion.div
              layoutId="kids-tab"
              className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-neutral-200/50 dark:border-neutral-700/50 -z-10"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="flex items-center gap-2">
            <Star
              size={16}
              className={activeTab === "programs" ? "text-amber-500" : ""}
            />{" "}
            Программы
          </span>
        </button>
      </motion.div>

      {/* CONTENT */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === "family" ? (
            <motion.div
              key="family"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl"
            >
              <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-[40px] p-6 sm:p-10 shadow-xl shadow-pink-500/5">
                {/* СЕКЦИЯ СУПРУГА */}
                <div className="mb-10 relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-500/20 dark:to-rose-500/20 flex items-center justify-center text-pink-500">
                      <UserPlus size={20} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                      Профиль супруга/и
                    </h2>
                  </div>

                  <div className="bg-neutral-50/50 dark:bg-neutral-950/50 border border-neutral-200/60 dark:border-neutral-800/60 rounded-[24px] p-2 transition-all duration-300 focus-within:bg-white dark:focus-within:bg-neutral-900 focus-within:shadow-lg focus-within:shadow-pink-500/5 focus-within:border-pink-200 dark:focus-within:border-pink-500/30">
                    <div className="px-4 pt-3 pb-1">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">
                        Имя супруга/и
                      </label>
                      <input
                        type="text"
                        value={spouseName}
                        onChange={(e) => setSpouseName(e.target.value)}
                        placeholder="Укажите имя..."
                        className="w-full bg-transparent border-none p-0 text-base sm:text-lg font-bold outline-none placeholder:text-neutral-300 dark:placeholder:text-neutral-700 text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-neutral-100 dark:bg-neutral-800/50 mb-10" />

                {/* СЕКЦИЯ ДЕТЕЙ */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-500/20 dark:to-blue-500/20 flex items-center justify-center text-indigo-500">
                        <Baby size={20} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                        Анкеты детей
                      </h2>
                    </div>
                  </div>

                  <motion.div layout className="space-y-4 mb-8">
                    <AnimatePresence initial={false}>
                      {children.map((child, idx) => (
                        <motion.div
                          key={idx}
                          layout
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{
                            opacity: 0,
                            scale: 0.9,
                            height: 0,
                            overflow: "hidden",
                          }}
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.5,
                          }}
                          className="group bg-neutral-50/50 dark:bg-neutral-950/50 border border-neutral-200/60 dark:border-neutral-800/60 rounded-[24px] p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative transition-all duration-300 focus-within:bg-white dark:focus-within:bg-neutral-900 focus-within:shadow-lg focus-within:shadow-indigo-500/5 focus-within:border-indigo-200 dark:focus-within:border-indigo-500/30"
                        >
                          <div className="flex-1 px-4 py-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">
                              Имя ребенка *
                            </label>
                            <input
                              type="text"
                              value={child.name}
                              onChange={(e) =>
                                handleUpdateChild(idx, "name", e.target.value)
                              }
                              placeholder="Например: Ной"
                              className="w-full bg-transparent border-none p-0 text-base font-bold outline-none placeholder:text-neutral-300 dark:placeholder:text-neutral-700 text-neutral-900 dark:text-white"
                            />
                          </div>

                          <div className="w-full sm:w-[1px] h-[1px] sm:h-12 bg-neutral-200/60 dark:bg-neutral-800/60 my-2 sm:my-0" />

                          <div className="flex-1 px-4 py-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">
                              Дата рождения *
                            </label>
                            <input
                              type="date"
                              value={child.dateOfBirth}
                              onChange={(e) =>
                                handleUpdateChild(
                                  idx,
                                  "dateOfBirth",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-transparent border-none p-0 text-base font-bold text-neutral-600 dark:text-neutral-300 outline-none cursor-pointer"
                            />
                          </div>

                          <div className="w-full sm:w-[1px] h-[1px] sm:h-12 bg-neutral-200/60 dark:bg-neutral-800/60 my-2 sm:my-0" />

                          <div className="sm:w-28 shrink-0 px-4 py-2 flex flex-col justify-center bg-white dark:bg-neutral-900 rounded-xl sm:rounded-r-xl border border-neutral-100 dark:border-neutral-800 m-1">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1 text-center">
                              Возраст
                            </label>
                            <div className="w-full text-base font-black text-center text-indigo-500 dark:text-indigo-400">
                              {child.dateOfBirth
                                ? `${calculateAge(child.dateOfBirth)} лет`
                                : "—"}
                            </div>
                          </div>

                          {children.length > 1 && (
                            <button
                              onClick={() =>
                                setChildren(
                                  children.filter((_, i) => i !== idx),
                                )
                              }
                              className="absolute -top-3 -right-3 w-8 h-8 bg-white dark:bg-neutral-800 border border-red-100 dark:border-red-500/20 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-md hover:bg-red-500 hover:text-white hover:border-red-500 z-10"
                              title="Удалить ребенка"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>

                  <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-6 border-t border-neutral-100 dark:border-neutral-800 pt-8">
                    <button
                      onClick={() =>
                        setChildren([
                          ...children,
                          { name: "", dateOfBirth: "" },
                        ])
                      }
                      className="group flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 px-6 py-4 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-2xl transition-all w-full sm:w-auto justify-center border border-dashed border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-500"
                    >
                      <Plus
                        size={18}
                        className="group-hover:rotate-90 transition-transform"
                      />{" "}
                      Добавить ребенка
                    </button>

                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className={cn(
                        "w-full sm:w-auto px-10 py-4 font-black uppercase tracking-widest text-sm rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]",
                        saveSuccess
                          ? "bg-green-500 text-white shadow-[0_0_40px_-10px_rgba(34,197,94,0.5)]"
                          : "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-[0_10px_40px_-10px_rgba(244,63,94,0.5)] hover:shadow-[0_10px_40px_-5px_rgba(244,63,94,0.6)] disabled:opacity-70 disabled:shadow-none",
                      )}
                    >
                      {isSaving ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle2 size={18} /> Успешно
                        </>
                      ) : (
                        "Сохранить профили"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="programs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {programs.map((program, idx) => {
                  const isEnrolled = applications.some(
                    (app) => app.programTitle === program.title,
                  );

                  return (
                    <motion.div
                      key={program.title}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl p-8 rounded-[32px] border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div
                          className={cn(
                            "w-14 h-14 rounded-[20px] flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 shadow-inner",
                            program.bg,
                            program.color,
                          )}
                        >
                          <program.icon size={26} strokeWidth={2} />
                        </div>
                        <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-500 shadow-sm border border-neutral-200/50 dark:border-neutral-700">
                          {program.age}
                        </span>
                      </div>
                      <h3 className="text-xl font-black leading-tight mb-4 text-neutral-900 dark:text-white group-hover:text-pink-500 transition-colors">
                        {program.title}
                      </h3>

                      <div className="mt-auto pt-8">
                        {isEnrolled ? (
                          <div className="w-full py-4 bg-green-50 dark:bg-green-500/10 text-green-600 rounded-2xl font-black text-xs uppercase tracking-widest text-center border border-green-200 dark:border-green-500/20 shadow-sm flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} /> Заявка отправлена
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEnroll(program.title)}
                            disabled={isEnrolling}
                            className="w-full py-4 bg-neutral-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                          >
                            {isEnrolling &&
                            enrollingProgram === program.title ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              "Записать ребенка"
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
