import { getUserRegisteredEvents } from "@/actions/event";
import MyEventsClient from "../events/my-events-client";
// import { auth } from "@/lib/auth"; // Раскомментируй и используй свою авторизацию

export default async function MyEventsPage() {
  // ВАЖНО: Получи реальный ID пользователя из своей системы авторизации!
  // Пример для Clerk: const { userId } = auth();
  const userId = "id_пользователя"; // <--- ЗАМЕНИ ЭТО

  if (!userId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Пожалуйста, авторизуйтесь
      </div>
    );
  }

  const myEvents = await getUserRegisteredEvents(userId);

  return <MyEventsClient initialEvents={myEvents} userId={userId} />;
}
