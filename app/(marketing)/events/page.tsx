import {
  getPublicEventsPaginated,
  getActivePublicCategories,
} from "@/actions/event";
import EventsPageClient from "@/components/events/events-page-client";
import { auth } from "@clerk/nextjs/server";

export default async function PublicEventsPage() {
  const { userId } = await auth();
  const [initialData, categories] = await Promise.all([
    getPublicEventsPaginated(1, 12, null),
    getActivePublicCategories(),
  ]);

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-20 relative overflow-hidden">
      {/* Сетка Aceternity */}
      <div className="absolute inset-0 h-full w-full bg-white dark:bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10">
        <EventsPageClient
          initialEvents={initialData.events}
          initialHasMore={initialData.hasMore}
          categories={categories}
          userId={userId}
        />
      </div>
    </main>
  );
}
