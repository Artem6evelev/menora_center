import { getPublicServicesPaginated } from "@/actions/service";
import PublicServiceCard from "../services/public-service-card";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, HeartHandshake } from "lucide-react";

export async function ServicesSection() {
  const { userId } = await auth();

  // Получаем 3 последние услуги
  const { services: latestServices } = await getPublicServicesPaginated(
    1,
    3,
    null,
  );

  return (
    <section className="py-24 relative bg-white dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800/50 w-full">
      {/* ВОТ ЗДЕСЬ ШИРИНА ТОЧНО ТАКАЯ ЖЕ КАК В СОБЫТИЯХ И HERO */}
      <div className="max-w-[1440px] w-full mx-auto px-6 md:px-10">
        {/* Шапка секции */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-black uppercase tracking-widest text-[#FFB800] mb-4 shadow-sm">
              <HeartHandshake size={14} />
              Помощь общины
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter">
              Услуги центра
            </h2>
          </div>

          <Link
            href="/services"
            className="group flex items-center gap-3 text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Все услуги
            <div className="w-10 h-10 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center group-hover:bg-[#FFB800] group-hover:border-[#FFB800] group-hover:text-black transition-all shadow-sm">
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </Link>
        </div>

        {/* Контент */}
        {latestServices.length === 0 ? (
          <div className="bg-neutral-50 dark:bg-neutral-900/30 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-[32px] p-12 text-center w-full">
            <p className="text-neutral-400 dark:text-neutral-500 font-black uppercase tracking-widest text-sm">
              Услуги пока не добавлены
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
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
    </section>
  );
}
