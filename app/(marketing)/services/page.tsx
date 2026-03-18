import {
  getPublicServicesPaginated,
  getActivePublicServiceCategories,
} from "@/actions/service";
import ServicesPageClient from "@/components/services/services-page-client";
import { auth } from "@clerk/nextjs/server";

export default async function PublicServicesPage() {
  const { userId } = await auth();

  // Получаем начальные данные для услуг и их категории
  const [initialData, categories] = await Promise.all([
    getPublicServicesPaginated(1, 100, null),
    getActivePublicServiceCategories(),
  ]);

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20 relative overflow-hidden">
      {/* Сетка Aceternity (такая же как в событиях) */}
      <div className="absolute inset-0 h-full w-full bg-white dark:bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10">
        <ServicesPageClient
          initialServices={initialData.services}
          categories={categories}
          userId={userId}
        />
      </div>
    </main>
  );
}
