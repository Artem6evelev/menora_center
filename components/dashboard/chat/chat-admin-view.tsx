"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/useChatStore";
import {
  getActiveChats,
  getConversation,
  createNotification,
  markChatAsRead,
} from "@/actions/notification";
import { useUser } from "@clerk/nextjs";
import { Search, Send, Loader2, MessageSquare } from "lucide-react";

export default function ChatAdminView() {
  const { user: currentUser } = useUser();
  const {
    chats,
    setChats,
    activeChatId,
    setActiveChat,
    messages,
    setMessages,
    addMessage,
    isLoading,
    setIsLoading,
    markAsReadInStore,
  } = useChatStore();

  // 1. Загружаем список чатов (с сортировкой по непрочитанным)
  useEffect(() => {
    const fetchList = async () => {
      const data = await getActiveChats();
      setChats(data);
    };
    fetchList();
  }, [setChats]);

  // 2. Загружаем переписку при выборе человека
  useEffect(() => {
    if (activeChatId && currentUser) {
      const fetchMessages = async () => {
        setIsLoading(true);
        const data = await getConversation(currentUser.id, activeChatId);
        const validMessages = data.filter((msg) => msg.senderId !== null);
        setMessages(validMessages as any);
        setIsLoading(false);
      };
      fetchMessages();
    }
  }, [activeChatId, currentUser, setMessages, setIsLoading]);

  // 3. Обработка клика по чату (сброс счетчика)
  const handleSelectChat = async (userId: string) => {
    setActiveChat(userId);
    markAsReadInStore(userId); // Мгновенно убираем красный кружок в интерфейсе
    await markChatAsRead(userId); // В фоне отмечаем прочитанным в БД
  };

  // 4. Отправка сообщения
  const onSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get("message") as string;
    if (!text.trim() || !activeChatId || !currentUser) return;

    e.currentTarget.reset();

    // Оптимистичное добавление в стор (чтобы сообщение появилось сразу)
    const tempMsg = {
      id: Math.random().toString(),
      senderId: currentUser.id,
      userId: activeChatId,
      message: text.trim(),
      createdAt: new Date(),
    };
    addMessage(tempMsg as any);

    // Отправляем в базу
    await createNotification(
      activeChatId,
      "Ответ админа",
      text.trim(),
      "/dashboard/chat",
      currentUser.id,
      "crm_personal",
    );
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden mt-4">
      {/* ЛЕВАЯ КОЛОНКА: Список пользователей */}
      <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/20">
        <div className="p-6 bg-white border-b border-gray-50 shrink-0">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Чаты</h2>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              placeholder="Найти клиента..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 ring-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <p className="p-8 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
              Нет активных диалогов
            </p>
          ) : (
            chats.map((u) => {
              const hasUnread = u.unreadCount && u.unreadCount > 0;
              const isActive = activeChatId === u.id;

              return (
                <button
                  key={u.id}
                  onClick={() => handleSelectChat(u.id)}
                  className={`w-full p-4 flex items-center gap-4 transition-all border-l-4 ${
                    isActive
                      ? "bg-white border-indigo-600 shadow-sm"
                      : "border-transparent hover:bg-gray-100/50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={u.imageUrl || "/default-avatar.png"}
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover shadow-sm bg-gray-100"
                    />
                    {/* КРАСНЫЙ БЕЙДЖИК НЕПРОЧИТАННЫХ */}
                    {hasUnread ? (
                      <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 animate-in zoom-in">
                        {u.unreadCount! > 99 ? "99+" : u.unreadCount}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-left overflow-hidden flex-1">
                    <p
                      className={`font-bold truncate ${hasUnread ? "text-gray-900" : "text-gray-700"}`}
                    >
                      {u.firstName} {u.lastName}
                    </p>
                    <p
                      className={`text-[10px] uppercase font-bold mt-0.5 truncate ${hasUnread ? "text-indigo-600" : "text-gray-400"}`}
                    >
                      {hasUnread ? "Новое сообщение" : "Нажмите, чтобы открыть"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ПРАВАЯ КОЛОНКА: Окно переписки */}
      <div className="flex-1 flex flex-col bg-white relative">
        {activeChatId ? (
          <>
            {/* Шапка чата */}
            <div className="p-5 border-b border-gray-50 flex items-center gap-3 bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="font-bold text-gray-700">
                Переписка с клиентом
              </span>
            </div>

            {/* Область сообщений */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 font-medium text-sm">
                  Здесь пока нет сообщений
                </div>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.senderId === currentUser?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm ${
                          isAdmin
                            ? "bg-gray-900 text-white rounded-tr-none"
                            : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {m.message}
                        </p>
                        <p
                          className={`text-[9px] mt-2 text-right ${isAdmin ? "opacity-40" : "text-gray-400"}`}
                        >
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Поле ввода */}
            <form
              onSubmit={onSend}
              className="p-6 bg-white border-t border-gray-50 flex gap-3 shrink-0"
            >
              <input
                name="message"
                placeholder="Написать ответ..."
                autoComplete="off"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-indigo-500 transition-all shadow-inner text-sm"
              />
              <button
                type="submit"
                className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg active:scale-95 transition-all flex items-center justify-center"
              >
                <Send size={20} className="-ml-1" />
              </button>
            </form>
          </>
        ) : (
          /* Заглушка, если чат не выбран */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-6">
            <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center shadow-inner border border-gray-100">
              <MessageSquare
                size={48}
                strokeWidth={1}
                className="text-gray-300"
              />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900 mb-1">
                Центр сообщений
              </p>
              <p className="text-sm font-medium text-gray-500">
                Выберите диалог из списка слева, чтобы начать общение
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
