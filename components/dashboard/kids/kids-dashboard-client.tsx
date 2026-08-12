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
} from "lucide-react";
import { updateUserChildren } from "@/actions/kids-profile";
import { submitKidsApplication } from "@/actions/kids.actions";

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
  const [activeTab, setActiveTab] = useState<"children" | "programs">(
    "children",
  );

  const getInitialChildren = () => {
    try {
      if (!user?.childrenData) return [{ name: "", birthDate: "" }];

      const parsed =
        typeof user.childrenData === "string"
          ? JSON.parse(user.childrenData)
          : user.childrenData;

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return [{ name: "", birthDate: "" }];
    } catch (e) {
      console.error("Ошибка парсинга детей:", e);
      return [{ name: "", birthDate: "" }];
    }
  };

  const [children, setChildren] =
    useState<{ name: string; birthDate: string }[]>(getInitialChildren());

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [enrollingProgram, setEnrollingProgram] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return "";
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age.toString();
  };

  const handleUpdateChild = (
    index: number,
    field: "name" | "birthDate",
    value: string,
  ) => {
    const newChildren = [...children];
    newChildren[index][field] = value;
    setChildren(newChildren);
    setSaveSuccess(false);
  };

  const handleSaveChildren = async () => {
    setIsSaving(true);
    const validChildren = children.filter((c) => c.name.trim() !== "");

    const res = await updateUserChildren(validChildren);

    if (res.success) {
      setSaveSuccess(true);
      if (validChildren.length === 0) {
        setChildren([{ name: "", birthDate: "" }]);
      } else {
        setChildren(validChildren);
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert("Не удалось сохранить профили. Попробуйте еще раз.");
    }
    setIsSaving(false);
  };

  const handleEnroll = async (programTitle: string) => {
    const validChildren = children.filter((c) => c.name.trim() !== "");

    if (validChildren.length === 0 || validChildren.some((c) => !c.birthDate)) {
      alert(
        "Сначала добавьте ребенка (Имя и Дата рождения) во вкладке 'Мои дети' и сохраните профиль.",
      );
      setActiveTab("children");
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
        birthDate: c.birthDate,
        age: calculateAge(c.birthDate),
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
    <div className="max-w-7xl mx-auto w-full pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
            Menorah{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
              Kids
            </span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2 text-lg">
            Управление профилями детей и запись на программы.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-2xl w-fit relative">
        <button
          onClick={() => setActiveTab("children")}
          className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "children"
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          {activeTab === "children" && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-xl shadow-sm -z-10"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          Мои дети
        </button>
        <button
          onClick={() => setActiveTab("programs")}
          className={`relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "programs"
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          }`}
        >
          {activeTab === "programs" && (
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-xl shadow-sm -z-10"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          Доступные программы
        </button>
      </div>

      <motion.div layout className="relative">
        <AnimatePresence mode="wait">
          {activeTab === "children" ? (
            <motion.div
              key="children"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-neutral-900 rounded-[32px] p-6 md:p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm max-w-3xl">
                <h2 className="text-2xl font-black mb-6">Анкеты детей</h2>

                <div className="space-y-4 mb-6">
                  <AnimatePresence initial={false}>
                    {children.map((child, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4 p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800 relative group overflow-hidden"
                      >
                        <div className="flex-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block ml-1">
                            Имя ребенка *
                          </label>
                          <input
                            type="text"
                            value={child.name}
                            onChange={(e) =>
                              handleUpdateChild(idx, "name", e.target.value)
                            }
                            placeholder="Например: Ной"
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-xl outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all font-medium"
                          />
                        </div>

                        <div className="flex-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block ml-1">
                            Дата рождения *
                          </label>
                          <input
                            type="date"
                            value={child.birthDate}
                            onChange={(e) =>
                              handleUpdateChild(
                                idx,
                                "birthDate",
                                e.target.value,
                              )
                            }
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-xl outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all text-neutral-600 dark:text-neutral-300 font-medium"
                          />
                        </div>

                        <div className="sm:w-24 shrink-0 flex flex-col justify-end">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 block text-center">
                            Возраст
                          </label>
                          <div className="h-[50px] bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center font-bold text-neutral-500 border border-transparent">
                            {child.birthDate
                              ? `${calculateAge(child.birthDate)} лет`
                              : "—"}
                          </div>
                        </div>

                        {children.length > 1 && (
                          <button
                            onClick={() =>
                              setChildren(children.filter((_, i) => i !== idx))
                            }
                            className="absolute -top-1 -right-1 w-9 h-9 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-red-500 rounded-bl-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:border-red-200 shadow-sm"
                            title="Удалить ребенка"
                          >
                            <Trash2
                              size={14}
                              className="translate-x-0.5 -translate-y-0.5"
                            />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() =>
                      setChildren([...children, { name: "", birthDate: "" }])
                    }
                    className="text-sm font-bold text-pink-500 hover:text-pink-600 flex items-center gap-2 p-2 active:scale-95 transition-transform"
                  >
                    <Plus size={18} /> Добавить еще
                  </button>

                  <button
                    onClick={handleSaveChildren}
                    disabled={isSaving}
                    className={`px-8 py-3.5 font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[200px] ${
                      saveSuccess
                        ? "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20"
                        : "bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black shadow-sm"
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : saveSuccess ? (
                      "Сохранено!"
                    ) : (
                      "Сохранить профили"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="programs"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {programs.map((program, idx) => {
                  const isEnrolled = applications.some(
                    (app) => app.programTitle === program.title,
                  );

                  return (
                    <motion.div
                      key={program.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white dark:bg-neutral-900 p-6 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col h-full hover:shadow-lg transition-shadow group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-rotate-6 ${program.bg} ${program.color}`}
                        >
                          <program.icon size={24} />
                        </div>
                        <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-500 transition-colors group-hover:bg-white dark:group-hover:bg-neutral-700 shadow-sm">
                          {program.age}
                        </span>
                      </div>
                      <h3 className="text-xl font-black leading-tight mb-2 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                        {program.title}
                      </h3>

                      <div className="mt-auto pt-6">
                        {isEnrolled ? (
                          <div className="w-full py-3.5 bg-green-50 dark:bg-green-500/10 text-green-600 rounded-2xl font-bold text-sm text-center border border-green-100 dark:border-green-500/20">
                            Заявка отправлена
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEnroll(program.title)}
                            disabled={isEnrolling}
                            className="w-full py-3.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
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
      </motion.div>
    </div>
  );
}
