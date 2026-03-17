import { getUserRegisteredServices } from "@/actions/service";
import MyServicesClient from "@/components/dashboard/events/my-services-client";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function MyServicesPage() {
  const { userId } = await auth();

  // Если не авторизован - на страницу входа
  if (!userId) {
    redirect("/sign-in");
  }

  // Получаем список услуг, на которые записан этот пользователь
  const registeredServices = await getUserRegisteredServices(userId);

  return (
    <MyServicesClient initialServices={registeredServices} userId={userId} />
  );
}
