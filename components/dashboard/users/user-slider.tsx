"use client";

import { useCrmStore } from "@/store/useCrmStore";
import {
  X,
  Send,
  Phone,
  Mail,
  MapPin,
  Loader2,
  User,
  ShieldCheck,
  MessageCircle,
  Tag,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  createNotification,
  getNotificationHistory,
} from "@/actions/notification";
import { updateUserTags } from "@/actions/user";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PREDEFINED_TAGS = [
  "VIP",
  "Волонтер",
  "Новичок",
  "Семья",
  "Спонсор",
  "Актив",
];

export default function UserSlider({ users }: { users: any[] }) {
  const { activeUserId, closeSlider } = useCrmStore();
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const springTransition: any = { duration: 0.5, ease: [0.22, 1, 0.36, 1] };

  const user = users.find((u) => u.id === activeUserId);

  useEffect(() => {
    if (activeUserId && user) {
      const loadHistory = async () => {
        setIsLoadingHistory(true);
        const data = await getNotificationHistory(activeUserId);
        setHistory(data.reverse());
        setIsLoadingHistory(false);
        setTimeout(
          () => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight),
          100,
        );
      };

      try {
        setTags(JSON.parse(user.tags || "[]"));
      } catch {
        setTags([]);
      }
      loadHistory();
    } else {
      setHistory([]);
      setTags([]);
    }
  }, [activeUserId, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    const res = await createNotification(
      user!.id,
      "Личное сообщение",
      message.trim(),
      "/dashboard",
      undefined,
      "crm_personal",
    );

    if (res.success) {
      setHistory([
        ...history,
        {
          id: Math.random().toString(),
          message: message.trim(),
          createdAt: new Date(),
          type: "crm_personal",
          senderId: "me",
        },
      ]);
      setMessage("");
      setTimeout(
        () =>
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          }),
        100,
      );
    } else {
      toast.error("Ошибка отправки");
    }
    setIsSending(false);
  };

  const handleTagClick = async (tag: string) => {
    const newTags = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    setTags(newTags);
    await updateUserTags(user!.id, newTags);
  };

  return (
    <AnimatePresence>
      {activeUserId && user && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeSlider}
          />

          {/* Slider Panel */}
          <motion.div
            initial={{ x: "100%", boxShadow: "0 0 0 rgba(0,0,0,0)" }}
            animate={{ x: 0, boxShadow: "-20px 0 40px rgba(0,0,0,0.2)" }}
            exit={{ x: "100%", boxShadow: "0 0 0 rgba(0,0,0,0)" }}
            transition={springTransition}
            className="relative w-full max-w-lg bg-white dark:bg-neutral-900 h-full flex flex-col border-l border-neutral-200/50 dark:border-neutral-800/50"
          >
            {/* HEADER */}
            <div className="p-8 border-b border-neutral-100 dark:border-neutral-800/50 shrink-0 bg-neutral-50/50 dark:bg-neutral-950/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800]/10 rounded-full blur-3xl" />
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-5">
                  <img
                    src={user.imageUrl || "/default-avatar.png"}
                    className="w-16 h-16 rounded-full object-cover border border-neutral-200 dark:border-neutral-700 shadow-sm"
                  />
                  <div>
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-white leading-tight tracking-tight">
                      {user.firstName} {user.lastName}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-black px-2.5 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded uppercase tracking-widest shadow-sm">
                        {user.role}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                        {user.city || "Город не указан"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeSlider}
                  className="p-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-all active:scale-95 shadow-sm"
                >
                  <X size={16} strokeWidth={2.5} className="text-neutral-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                  <Phone size={14} className="text-[#FFB800]" />{" "}
                  {user.phone || "Нет номера"}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                  <Mail size={14} className="text-[#FFB800] shrink-0" />{" "}
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
            </div>

            {/* TAGS SECTION */}
            <div className="px-8 py-5 border-b border-neutral-100 dark:border-neutral-800/50 shrink-0">
              <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                <Tag size={12} strokeWidth={2.5} /> Сегментация (Теги)
              </div>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TAGS.map((tag) => {
                  const isActive = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm active:scale-95",
                        isActive
                          ? "bg-[#FFB800] border-[#FFB800] text-black shadow-[#FFB800]/20"
                          : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-[#FFB800]/50",
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MESSAGES HISTORY */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 bg-neutral-50/30 dark:bg-neutral-950/30 space-y-6 no-scrollbar"
            >
              {isLoadingHistory ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-[#FFB800]" />
                </div>
              ) : history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 opacity-60">
                  <MessageCircle size={40} strokeWidth={1.5} />
                  <p className="text-sm font-bold mt-3 uppercase tracking-widest text-[10px]">
                    История пуста
                  </p>
                </div>
              ) : (
                history.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex w-full",
                      msg.senderId ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] p-4 shadow-sm",
                        msg.senderId
                          ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black rounded-[24px] rounded-tr-[8px]"
                          : "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-200/50 dark:border-neutral-800/50 rounded-[24px] rounded-tl-[8px]",
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-1.5 mb-2 text-[9px] font-black uppercase tracking-widest",
                          msg.senderId
                            ? "text-neutral-400 dark:text-neutral-500"
                            : "text-[#FFB800]",
                        )}
                      >
                        {msg.senderId ? (
                          <ShieldCheck size={10} strokeWidth={2.5} />
                        ) : (
                          <User size={10} strokeWidth={2.5} />
                        )}
                        {msg.senderId ? "Администратор" : "Система"}
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap text-sm font-medium">
                        {msg.message}
                      </p>
                      <div className="mt-2 text-[9px] font-bold tracking-wider opacity-40 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* INPUT AREA */}
            <div className="p-6 bg-white dark:bg-neutral-900 border-t border-neutral-200/50 dark:border-neutral-800/50 shrink-0">
              <form onSubmit={handleSendMessage} className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Введите сообщение..."
                  className="w-full bg-neutral-100/50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 pr-16 outline-none focus:ring-2 focus:ring-[#FFB800]/50 transition-all resize-none min-h-[120px] text-sm font-medium placeholder:text-neutral-400 text-neutral-900 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isSending}
                  className="absolute bottom-5 right-5 w-10 h-10 flex items-center justify-center bg-[#FFB800] text-black rounded-full transition-all shadow-md shadow-[#FFB800]/20 disabled:opacity-30 disabled:shadow-none active:scale-95"
                >
                  {isSending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send
                      size={16}
                      strokeWidth={2.5}
                      className="translate-x-[1px]"
                    />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
