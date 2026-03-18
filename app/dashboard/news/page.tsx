import { getAdminNews } from "@/actions/news";
import AdminNewsClient from "@/components/dashboard/news/admin-news-client";

export default async function AdminNewsPage() {
  const news = await getAdminNews();

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-neutral-900 tracking-tighter">
          Новости <span className="text-[#FFB800]">общины</span>
        </h1>
        <p className="text-neutral-500 font-medium mt-2">
          Управление публикациями, важными объявлениями и статьями.
        </p>
      </div>

      <AdminNewsClient initialNews={news} />
    </div>
  );
}
