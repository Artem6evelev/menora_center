"use client";

import { useState, useEffect, useRef } from "react";
import {
  getEventParticipantsList,
  updateEventParticipantStatus,
  deleteEventParticipant, // 🔥 ИМПОРТИРУЕМ НОВЫЙ ЭКШЕН
} from "@/actions/event";
import {
  Loader2,
  Users,
  Phone,
  Mail,
  Calendar,
  Ticket,
  MessageCircle,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Check,
  Baby,
  Trash2, // 🔥 Импортируем иконку корзины
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import MassWhatsAppModal from "../events/mass-whatsapp-modal";
import dayjs from "dayjs";
import "dayjs/locale/ru";

dayjs.locale("ru");

const formatPhoneForWhatsApp = (phone: string) => {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 10)
    return "972" + cleaned.slice(1);
  return cleaned;
};

// === 1. КАСТОМНЫЙ КОМПОНЕНТ ВЫБОРА СОБЫТИЯ ===
const CustomEventSelect = ({
  events,
  selectedId,
  onChange,
}: {
  events: any[];
  selectedId: string;
  onChange: (id: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedId) || events[0];

  return (
    <div className="relative w-full md:w-[450px]" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border rounded-2xl outline-none transition-all duration-200 text-left shadow-sm",
          isOpen
            ? "border-[#FFB800] shadow-[0_0_0_4px_rgba(255,184,0,0.1)]"
            : "border-neutral-200 dark:border-neutral-800 hover:border-[#FFB800]/50",
        )}
      >
        <div className="flex flex-col flex-1 min-w-0 pr-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">
            Выбранное событие
          </span>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "font-bold text-sm truncate",
                selectedEvent
                  ? "text-neutral-900 dark:text-white"
                  : "text-neutral-500",
              )}
            >
              {selectedEvent ? selectedEvent.title : "Выберите событие"}
            </span>
            {selectedEvent?.pendingParticipants > 0 && (
              <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse shrink-0 uppercase tracking-widest">
                {selectedEvent.pendingParticipants} новых
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          size={18}
          className={cn(
            "text-neutral-400 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 w-full md:w-[500px] top-[calc(100%+8px)] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col p-1.5 max-h-[400px] overflow-y-auto custom-scrollbar"
          >
            {events.length === 0 && (
              <div className="p-4 text-center text-sm font-medium text-neutral-500">
                Нет доступных событий
              </div>
            )}
            {events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => {
                  onChange(ev.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all text-left group",
                  selectedId === ev.id
                    ? "bg-[#FFB800]/10"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                )}
              >
                <div className="flex flex-col min-w-0 pr-4">
                  <span
                    className={cn(
                      "font-bold text-sm truncate transition-colors",
                      selectedId === ev.id
                        ? "text-[#FFB800]"
                        : "text-neutral-900 dark:text-white group-hover:text-[#FFB800]",
                    )}
                  >
                    {ev.title}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1 flex items-center gap-1.5">
                    <Calendar size={12} />{" "}
                    {ev.date
                      ? dayjs(ev.date).format("DD MMM YYYY")
                      : "Дата не указана"}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {ev.pendingParticipants > 0 && (
                    <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">
                      {ev.pendingParticipants} ожидает
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                    <Users size={12} /> {ev.totalParticipants}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// === 2. КАСТОМНЫЙ КОМПОНЕНТ СТАТУСА ДЛЯ ТАБЛИЦЫ ===
const StatusSelect = ({
  currentStatus,
  onChange,
}: {
  currentStatus: string;
  onChange: (s: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statuses = [
    {
      value: "pending",
      label: "Ожидает",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      border: "border-amber-100 dark:border-amber-500/20",
      dot: "bg-amber-500",
    },
    {
      value: "contacted",
      label: "Связались",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      border: "border-blue-100 dark:border-blue-500/20",
      dot: "bg-blue-500",
    },
    {
      value: "paid",
      label: "Оплачено",
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-500/10",
      border: "border-purple-100 dark:border-purple-500/20",
      dot: "bg-purple-500",
    },
    {
      value: "approved",
      label: "Одобрено",
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-500/10",
      border: "border-green-100 dark:border-green-500/20",
      dot: "bg-green-500",
    },
    {
      value: "rejected",
      label: "Отклонено",
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-500/10",
      border: "border-red-100 dark:border-red-500/20",
      dot: "bg-red-500",
    },
  ];

  const current =
    statuses.find((s) => s.value === currentStatus) || statuses[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-[130px] px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
          current.bg,
          current.color,
          current.border,
          "hover:brightness-95 active:scale-95",
        )}
      >
        <span>{current.label}</span>
        <ChevronDown
          size={14}
          className={cn("transition-transform", isOpen && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[calc(100%+8px)] w-40 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl z-[100] flex flex-col p-1.5"
          >
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  onChange(s.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-left rounded-xl transition-colors",
                  currentStatus === s.value
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white",
                )}
              >
                <div
                  className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)}
                />
                {s.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// === 3. ГЛАВНЫЙ КОМПОНЕНТ СТРАНИЦЫ ===
export default function ApplicationsClient({ events }: { events: any[] }) {
  const [eventsList, setEventsList] = useState(events);
  const [selectedEventId, setSelectedEventId] = useState<string>(
    eventsList[0]?.id || "",
  );
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!selectedEventId) return;
      setIsLoading(true);
      const data = await getEventParticipantsList(selectedEventId);
      setParticipants(data);
      setIsLoading(false);
    };
    fetchParticipants();
  }, [selectedEventId]);

  // ОБНОВЛЕНИЕ СТАТУСА
  const handleStatusChange = async (
    participantId: string,
    newStatus: string,
  ) => {
    const participantToUpdate = participants.find(
      (p) => p.participant.id === participantId,
    );
    if (!participantToUpdate) return;
    const oldStatus = participantToUpdate.participant.status;

    setParticipants((prev) =>
      prev.map((p) =>
        p.participant.id === participantId
          ? { ...p, participant: { ...p.participant, status: newStatus } }
          : p,
      ),
    );

    if (oldStatus === "pending" && newStatus !== "pending") {
      setEventsList((prev) =>
        prev.map((e) =>
          e.id === selectedEventId
            ? {
                ...e,
                pendingParticipants: Math.max(0, e.pendingParticipants - 1),
              }
            : e,
        ),
      );
    } else if (oldStatus !== "pending" && newStatus === "pending") {
      setEventsList((prev) =>
        prev.map((e) =>
          e.id === selectedEventId
            ? { ...e, pendingParticipants: e.pendingParticipants + 1 }
            : e,
        ),
      );
    }

    await updateEventParticipantStatus(participantId, newStatus);
  };

  // 🔥 УДАЛЕНИЕ ЗАЯВКИ
  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm("Вы уверены, что хотите безвозвратно удалить эту заявку?"))
      return;

    const participantToRemove = participants.find(
      (p) => p.participant.id === participantId,
    );
    if (!participantToRemove) return;
    const oldStatus = participantToRemove.participant.status;

    // Оптимистичное обновление UI: убираем из таблицы
    setParticipants((prev) =>
      prev.filter((p) => p.participant.id !== participantId),
    );

    // Оптимистичное обновление счетчиков в селекторе событий
    setEventsList((prev) =>
      prev.map((e) => {
        if (e.id === selectedEventId) {
          return {
            ...e,
            totalParticipants: Math.max(0, e.totalParticipants - 1),
            pendingParticipants:
              oldStatus === "pending"
                ? Math.max(0, e.pendingParticipants - 1)
                : e.pendingParticipants,
          };
        }
        return e;
      }),
    );

    // Запрос к БД на удаление
    await deleteEventParticipant(participantId);
  };

  const currentEventName =
    eventsList.find((e) => e.id === selectedEventId)?.title || "Событие";

  const filteredParticipants = participants.filter((p) => {
    const q = search.toLowerCase();
    const name =
      `${p.user?.firstName || ""} ${p.user?.lastName || ""}`.toLowerCase();
    return (
      name.includes(q) ||
      p.participant.phone.includes(q) ||
      (p.user?.email && p.user.email.toLowerCase().includes(q))
    );
  });

  const whatsappRecipients = participants
    .filter(
      (row) => row.participant?.phone && row.participant.status !== "rejected",
    )
    .map((row) => ({
      phone: row.participant.phone,
      name: row.user?.name || row.user?.firstName || "Участник",
    }));

  return (
    <div className="max-w-7xl mx-auto w-full pb-32">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
            Заявки на{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              События
            </span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2 text-lg">
            Управление бронированиями и рассылка уведомлений.
          </p>
        </motion.div>
      </div>

      {/* ПАНЕЛЬ ФИЛЬТРОВ И УПРАВЛЕНИЯ */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-6 relative z-50">
        <CustomEventSelect
          events={eventsList}
          selectedId={selectedEventId}
          onChange={setSelectedEventId}
        />

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64 shrink-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Поиск участника..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm outline-none focus:border-[#FFB800] transition-colors font-medium text-sm"
            />
          </div>

          <button
            onClick={() => setIsReminderOpen(true)}
            disabled={whatsappRecipients.length === 0 || isLoading}
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] disabled:bg-neutral-200 dark:disabled:bg-neutral-800 text-white disabled:text-neutral-400 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#25D366]/20 disabled:shadow-none transition-all active:scale-95 shrink-0 h-[54px]"
          >
            <MessageCircle size={18} />
            <span className="hidden sm:inline">Напомнить всем</span>
          </button>
        </div>
      </div>

      {/* ТАБЛИЦА */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden relative z-10"
      >
        <div className="overflow-x-auto min-h-[400px]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 gap-5"
              >
                <Loader2 className="animate-spin text-[#FFB800]" size={40} />
              </motion.div>
            ) : filteredParticipants.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-32 flex flex-col items-center justify-center"
              >
                <div className="bg-neutral-100 dark:bg-neutral-800 w-20 h-20 rounded-[24px] flex items-center justify-center mb-5 shadow-inner">
                  {search ? (
                    <Search className="text-neutral-400" size={32} />
                  ) : (
                    <Users className="text-neutral-400" size={32} />
                  )}
                </div>
                <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
                  {search ? "Ничего не найдено" : "Участников пока нет"}
                </h3>
                <p className="text-neutral-500 font-medium max-w-sm">
                  {search
                    ? "Попробуйте изменить поисковой запрос."
                    : "На это событие еще никто не забронировал билет."}
                </p>
              </motion.div>
            ) : (
              <motion.table
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full text-left whitespace-nowrap"
              >
                <thead className="bg-neutral-50 dark:bg-neutral-950/50 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20">
                  <tr className="text-[10px] uppercase tracking-widest text-neutral-400 font-black">
                    <th className="py-6 px-8">Участник</th>
                    <th className="py-6 px-6">Контакты</th>
                    <th className="py-6 px-6">Дата записи</th>
                    <th className="py-6 px-8 text-right">
                      Управление статусом
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  <AnimatePresence>
                    {filteredParticipants.map((row) => {
                      // 🔥 ПАРСИМ ДАННЫЕ ИЗ БД (Количество детей)
                      let extra = null;
                      if (row.participant.extraData) {
                        try {
                          extra = JSON.parse(row.participant.extraData);
                        } catch (e) {}
                      }

                      return (
                        <motion.tr
                          key={row.participant.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={cn(
                            "hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group",
                            row.participant.status === "rejected" &&
                              "opacity-50 grayscale",
                          )}
                        >
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                {row.user?.imageUrl ? (
                                  <img
                                    src={row.user.imageUrl}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Users
                                    size={16}
                                    className="text-neutral-400"
                                  />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <div className="font-bold text-neutral-900 dark:text-white text-base">
                                  {row.user?.firstName} {row.user?.lastName}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {row.user?.email === "Гость" ? (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded shadow-sm">
                                      Гость
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 shadow-sm">
                                      Резидент
                                    </span>
                                  )}

                                  {/* 🔥 ВЫВОДИМ БЕЙДЖ ДЛЯ ДЕТЕЙ */}
                                  {extra?.kidsCount > 0 && (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                      <Baby size={10} /> +{extra.kidsCount}{" "}
                                      детей
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-5 px-6">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-300">
                                <Phone size={14} className="text-neutral-400" />
                                {row.participant.phone}
                                {row.participant.phone && (
                                  <a
                                    href={`https://wa.me/${formatPhoneForWhatsApp(row.participant.phone)}?text=${encodeURIComponent(`Шалом, ${row.user?.firstName || "участник"}! 👋\nСвязываемся по поводу мероприятия «${currentEventName}».`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-1 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 p-1.5 rounded-full transition-all"
                                    title="Написать в WhatsApp"
                                  >
                                    <MessageCircle
                                      size={16}
                                      strokeWidth={2.5}
                                    />
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                                <Mail size={14} />
                                {row.user?.email || "—"}
                              </div>
                            </div>
                          </td>

                          <td className="py-5 px-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-bold text-neutral-900 dark:text-white">
                                {dayjs(row.participant.createdAt).format(
                                  "DD MMM YYYY",
                                )}
                              </span>
                              <span className="text-[10px] font-black text-neutral-400 tracking-widest uppercase">
                                {dayjs(row.participant.createdAt).format(
                                  "HH:mm",
                                )}
                              </span>
                            </div>
                          </td>

                          <td className="py-5 px-8 text-right">
                            {/* 🔥 БЛОК УПРАВЛЕНИЯ С КНОПКОЙ УДАЛЕНИЯ */}
                            <div className="flex items-center justify-end gap-3">
                              <StatusSelect
                                currentStatus={row.participant.status}
                                onChange={(newStatus) =>
                                  handleStatusChange(
                                    row.participant.id,
                                    newStatus,
                                  )
                                }
                              />
                              <button
                                onClick={() =>
                                  handleDeleteParticipant(row.participant.id)
                                }
                                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                title="Удалить заявку"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </motion.table>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <MassWhatsAppModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        eventName={currentEventName}
        participants={whatsappRecipients}
      />
    </div>
  );
}
