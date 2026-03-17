import { getUserRegisteredEvents } from "@/actions/event";
import MyEventsClient from "@/components/dashboard/events/my-events-client";
import { auth } from "@clerk/nextjs/server";

export default async function MyEventsPage() {
  const { userId } = await auth(); // Clerk сам дает ID текущего залогиненного пользователя!

  if (!userId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Пожалуйста, авторизуйтесь
      </div>
    );
  }

  // Достаем из базы только события этого конкретного юзера
  const myEvents = await getUserRegisteredEvents(userId);

  return <MyEventsClient initialEvents={myEvents} userId={userId} />;
}
