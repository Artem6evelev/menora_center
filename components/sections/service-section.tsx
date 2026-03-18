import { getPublicServicesPaginated } from "@/actions/service";
import PublicServiceCard from "../services/public-service-card";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, HeartHandshake } from "lucide-react";

export async function ServicesSection() {
  const { userId } = await auth();

  // Получаем 4 последние услуги
  const { services: latestServices } = await getPublicServicesPaginated(
    1,
    4,
    null,
  );

  return (
    <section className="w-full py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Шапка секции */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 w-full">
          <div className="max-w-2xl">
            {/* Стильный бейджик сверху */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 text-[10px] font-black uppercase tracking-widest mb-6">
              <HeartHandshake size={14} />
              <span>Помощь общины</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tighter mb-4 leading-tight">
              Услуги <span className="text-neutral-400">центра</span>
            </h2>
            <p className="text-neutral-500 text-lg font-medium leading-relaxed">
              Профессиональные консультации, обряды и индивидуальные занятия.
            </p>
          </div>

          {/* Десктопная кнопка */}
          <Link
            href="/dashboard/services"
            className="hidden md:flex items-center gap-2 text-neutral-900 font-bold bg-white border-2 border-neutral-200 px-6 py-3 rounded-full hover:border-neutral-900 hover:bg-neutral-50 transition-all active:scale-95 shadow-sm"
          >
            Все услуги <ArrowRight size={18} />
          </Link>
        </div>

        {/* Контент */}
        {latestServices.length === 0 ? (
          <div className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-[32px] p-12 text-center w-full">
            <p className="text-neutral-400 font-black uppercase tracking-widest text-sm">
              Услуги пока не добавлены
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

        {/* Мобильная кнопка (внизу) */}
        {latestServices.length > 0 && (
          <div className="mt-10 flex justify-center md:hidden w-full">
            <Link
              href="/dashboard/services"
              className="flex items-center justify-center gap-2 text-neutral-900 font-bold bg-white border-2 border-neutral-200 px-6 py-4 rounded-2xl w-full hover:border-neutral-900 active:scale-95 transition-all shadow-sm"
            >
              Смотреть все услуги <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
