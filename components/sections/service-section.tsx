import { getPublicServicesPaginated } from "@/actions/service";
import PublicServiceCard from "../services/public-service-card";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export async function ServicesSection() {
  const { userId } = await auth();

  // Получаем 4 последние услуги
  const { services: latestServices } = await getPublicServicesPaginated(
    1,
    4,
    null,
  );

  return (
    <div className="w-full py-20 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 w-full">
        <div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Услуги центра
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl">
            Профессиональные консультации, обряды и индивидуальные занятия.
          </p>
        </div>

        <Link
          href="/dashboard/services"
          className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl transition-colors shrink-0"
        >
          Смотреть все услуги
        </Link>
      </div>

      {latestServices.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-sm border border-dashed border-gray-200 rounded-3xl p-12 text-center w-full">
          <p className="text-gray-500 font-medium text-lg">
            Услуги пока не добавлены.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {latestServices.map((item) => (
            <PublicServiceCard
              key={item.service.id}
              item={item}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
