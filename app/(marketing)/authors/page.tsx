// app/(marketing)/authors/page.tsx
import { db } from "@/lib/db";
import { authorProfiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, BookOpen, Youtube, UserRound } from "lucide-react";

export const revalidate = 60;

export const metadata = {
  title: "Спикеры и Раввины | Menorah Center",
  description: "Преподаватели, раввины и спикеры общины Menorah Center.",
};

export default async function AuthorsDirectoryPage() {
  const authors = await db.query.authorProfiles.findMany({
    where: eq(authorProfiles.isActive, true),
    with: { user: true },
    orderBy: [desc(authorProfiles.createdAt)],
  });

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-24 relative overflow-hidden">
      {/* Фоновая сетка Aceternity */}
      <div className="absolute inset-0 h-full w-full bg-white dark:bg-neutral-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6">
        {/* ЦЕНТРИРОВАННЫЙ HEADER КАК НА ДРУГИХ СТРАНИЦАХ */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-6">
            <span>Наши лекторы</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-neutral-900 dark:text-white tracking-tighter mb-6">
            Спикеры и{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB800] to-orange-500">
              Раввины
            </span>
          </h1>

          <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium max-w-2xl leading-relaxed">
            Выберите лектора, чтобы посмотреть все его статьи, видеоуроки и
            поддержать деятельность.
          </p>
        </div>

        {/* СЕТКА АВТОРОВ */}
        {authors.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900/50 rounded-[32px] border-2 border-dashed border-neutral-200 dark:border-neutral-800">
            <div className="bg-white dark:bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <UserRound className="text-neutral-400" size={24} />
            </div>
            <p className="text-xl font-black text-neutral-900 dark:text-white mb-2">
              Пока нет добавленных спикеров
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">
              Загляните сюда позже.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {authors.map((profile) => {
              const fullName =
                `${profile.user.firstName || ""} ${profile.user.lastName || ""}`.trim();

              return (
                <Link
                  key={profile.id}
                  href={`/authors/${profile.slug}`}
                  className="group flex flex-col bg-white dark:bg-neutral-900 rounded-[32px] p-8 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFB800]/5 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:bg-[#FFB800]/20 transition-colors duration-500 pointer-events-none" />

                  <div className="relative z-10 flex items-start gap-5 mb-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-700 group-hover:border-[#FFB800] transition-colors duration-300 relative">
                      {profile.user.imageUrl ? (
                        <Image
                          src={profile.user.imageUrl}
                          alt={fullName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-black text-neutral-400">
                          {fullName.charAt(0) || "A"}
                        </div>
                      )}
                    </div>
                    <div className="pt-2">
                      <h3 className="text-xl font-black text-neutral-900 dark:text-white leading-tight group-hover:text-[#FFB800] transition-colors line-clamp-2">
                        {fullName}
                      </h3>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#FFB800] mt-2">
                        Спикер общины
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3 mb-8 relative z-10 flex-1 leading-relaxed">
                    {profile.shortBio ||
                      "Нажмите, чтобы посмотреть профиль, изучить материалы и видеоуроки автора."}
                  </p>

                  <div className="relative z-10 mt-auto pt-5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex gap-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                      <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
                        <BookOpen size={14} /> Статьи
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
                        <Youtube size={14} /> Видео
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:bg-[#FFB800] group-hover:text-black transition-all">
                      <ChevronRight
                        size={16}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
