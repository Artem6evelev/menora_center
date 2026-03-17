"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, User, ShieldCheck, Info } from "lucide-react";
import { sendClientMessage } from "@/actions/notification";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ChatClientView({
  initialMessages,
  userId,
}: {
  initialMessages: any[];
  userId: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Добавляем 'as any', чтобы TypeScript не ругался на типы Framer Motion
  const springTransition: any = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    setIsSending(true);
    const newMessageText = input.trim();
    setInput("");

    const tempId = Date.now().toString();
    const newMessage = {
      id: tempId,
      senderId: userId,
      message: newMessageText,
      createdAt: new Date(),
      isPending: true,
    };

    setMessages((prev) => [...prev, newMessage]);

    const res = await sendClientMessage(newMessageText);

    if (!res.success) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(newMessageText);
      alert("Не удалось отправить сообщение.");
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, isPending: false } : m)),
      );
    }

    setIsSending(false);
  };

  return (
    <div className="flex-1 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl rounded-[32px] md:rounded-[40px] shadow-sm border border-neutral-200/50 dark:border-neutral-800/50 flex flex-col overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FFB800]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50 px-6 py-4 flex items-center justify-center gap-2 relative z-10 shrink-0">
        <Info size={14} className="text-neutral-400" />
        <span className="text-xs font-medium text-neutral-500">
          Специалисты отвечают в рабочее время (вс-чт, 09:00 - 18:00)
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 relative z-10 no-scrollbar scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center opacity-50"
            >
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <Send size={24} className="text-neutral-400 translate-x-1" />
              </div>
              <p className="text-neutral-500 font-medium">
                Здесь пока пусто. Напишите первое сообщение!
              </p>
            </motion.div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === userId;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={springTransition}
                  className={cn(
                    "flex w-full",
                    isMe ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] md:max-w-[70%] p-4 md:px-5 md:py-4 shadow-sm relative group",
                      isMe
                        ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-[24px] rounded-br-[8px]"
                        : "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white border border-neutral-200/50 dark:border-neutral-800/50 rounded-[24px] rounded-bl-[8px]",
                      msg.isPending && "opacity-60",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5 mb-1.5 text-[10px] font-black uppercase tracking-widest",
                        isMe
                          ? "text-neutral-400 dark:text-neutral-500 justify-end"
                          : "text-[#FFB800] justify-start",
                      )}
                    >
                      {!isMe && <ShieldCheck size={12} strokeWidth={2.5} />}
                      {isMe ? "Вы" : "Администрация"}
                    </div>

                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {msg.message}
                    </p>

                    <div
                      className={cn(
                        "mt-2 text-[9px] font-bold tracking-wider opacity-40",
                        isMe ? "text-right" : "text-left",
                      )}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {msg.isPending && " • Отправка..."}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 md:p-6 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl border-t border-neutral-200/50 dark:border-neutral-800/50 relative z-10 shrink-0">
        <form
          onSubmit={handleSend}
          className="flex gap-3 bg-neutral-100 dark:bg-neutral-950 p-2 rounded-[24px] border border-neutral-200/50 dark:border-neutral-800/50 shadow-inner focus-within:ring-2 focus-within:ring-[#FFB800]/50 transition-all"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1 bg-transparent border-none px-4 py-2 outline-none text-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="w-12 h-12 shrink-0 bg-[#FFB800] text-black rounded-full flex items-center justify-center hover:bg-[#E5A600] transition-all disabled:opacity-30 disabled:hover:bg-[#FFB800] shadow-md shadow-[#FFB800]/20 active:scale-95"
          >
            {isSending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} className="translate-x-[1px]" strokeWidth={2.5} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
