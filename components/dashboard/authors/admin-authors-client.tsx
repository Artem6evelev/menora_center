// components/dashboard/authors/admin-authors-client.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserRound,
  Trash2,
  Loader2,
  Newspaper,
  Youtube,
  ExternalLink,
  ShieldAlert,
  Link as LinkIcon,
} from "lucide-react";
import { deleteAuthorProfile } from "@/actions/authors.actions";
import Link from "next/link";

export default function AdminAuthorsClient({ authors }: { authors: any[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (userId: string, name: string) => {
    if (
      !window.confirm(
        `Вы уверены, что хотите удалить профиль лектора ${name}? Его опубликованные статьи и видео останутся на сайте, но сам профиль спикера будет удален.`,
      )
    ) {
      return;
    }

    setDeletingId(userId);
    await deleteAuthorProfile(userId);
    setDeletingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto w-full pb-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tighter">
          Управление{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
            Лекторами
          </span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-2">
          Здесь вы можете просматривать всех назначенных спикеров, их статистику
          контента и удалять их публичные профили.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {authors.length === 0 ? (
            <motion.div className="col-span-full text-center py-24 bg-white dark:bg-neutral-900/50 rounded-[32px] border border-neutral-200 dark:border-neutral-800 border-dashed">
              <ShieldAlert
                className="mx-auto text-neutral-400 mb-4"
                size={48}
              />
              <p className="text-lg font-bold text-neutral-500">
                Пока нет ни одного спикера.
              </p>
              <p className="text-sm text-neutral-400 mt-2">
                Назначьте лектора в разделе "База людей".
              </p>
            </motion.div>
          ) : (
            authors.map((profile) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200/50 dark:border-neutral-800 shadow-sm flex flex-col group hover:shadow-xl hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-700">
                    {profile.user?.imageUrl ? (
                      <img
                        src={profile.user.imageUrl}
                        alt={profile.user.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserRound className="w-full h-full p-4 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-neutral-900 dark:text-white truncate">
                      {profile.user?.firstName} {profile.user?.lastName}
                    </h3>
                    <p className="text-xs font-bold text-neutral-400 mb-2 truncate">
                      @{profile.slug}
                    </p>

                    <div
                      className={
                        profile.isActive ? "text-green-500" : "text-neutral-400"
                      }
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest bg-current/10 px-2 py-1 rounded-full">
                        {profile.isActive ? "Профиль активен" : "Профиль скрыт"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 flex-1">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-4">
                    {profile.shortBio || "Биография не заполнена..."}
                  </p>

                  <div className="flex items-center gap-2">
                    {profile.telegramUrl && (
                      <LinkIcon size={14} className="text-[#229ED9]" />
                    )}
                    {profile.youtubeUrl && (
                      <Youtube size={14} className="text-red-500" />
                    )}
                    {profile.websiteUrl && (
                      <ExternalLink size={14} className="text-neutral-400" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 p-3 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Newspaper size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">
                        Статьи
                      </p>
                      <p className="text-sm font-bold leading-none">
                        {profile.articlesCount}
                      </p>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                      <Youtube size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">
                        Видео
                      </p>
                      <p className="text-sm font-bold leading-none">
                        {profile.videosCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <Link
                    href={`/authors/${profile.slug}`}
                    target="_blank"
                    className="flex-1 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <ExternalLink size={14} />
                    Страница спикера
                  </Link>
                  <button
                    onClick={() =>
                      handleDelete(
                        profile.userId,
                        profile.user?.firstName || "этого спикера",
                      )
                    }
                    disabled={deletingId === profile.userId}
                    className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shrink-0"
                    title="Удалить профиль"
                  >
                    {deletingId === profile.userId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
