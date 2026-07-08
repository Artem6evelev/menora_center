// components/authors/AuthorSidebar.tsx
import { Globe, Facebook, Instagram, Youtube, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  profile: any;
  user: any;
}

export default function AuthorSidebar({ profile, user }: Props) {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-8 border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm flex flex-col items-center text-center sticky top-28">
      {/* Аватар */}
      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-neutral-100 dark:border-neutral-800 shadow-lg mb-6 relative bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
        {user.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt={fullName}
            fill
            className="object-cover"
          />
        ) : (
          <span className="text-4xl font-black text-neutral-400">
            {fullName.charAt(0) || "A"}
          </span>
        )}
      </div>

      {/* Имя */}
      <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-4">
        {fullName}
      </h2>

      {/* Соцсети */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {profile.websiteUrl && (
          <Link
            href={profile.websiteUrl}
            target="_blank"
            className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
          >
            <Globe size={20} />
          </Link>
        )}
        {profile.facebookUrl && (
          <Link
            href={profile.facebookUrl}
            target="_blank"
            className="text-neutral-400 hover:text-blue-600 transition"
          >
            <Facebook size={20} />
          </Link>
        )}
        {profile.instagramUrl && (
          <Link
            href={profile.instagramUrl}
            target="_blank"
            className="text-neutral-400 hover:text-pink-600 transition"
          >
            <Instagram size={20} />
          </Link>
        )}
        {profile.youtubeUrl && (
          <Link
            href={profile.youtubeUrl}
            target="_blank"
            className="text-neutral-400 hover:text-red-600 transition"
          >
            <Youtube size={20} />
          </Link>
        )}
        {profile.telegramUrl && (
          <Link
            href={profile.telegramUrl}
            target="_blank"
            className="text-neutral-400 hover:text-blue-500 transition"
          >
            <Send size={20} />
          </Link>
        )}
      </div>

      {/* Описание (Bio) */}
      {profile.shortBio && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-8">
          {profile.shortBio}
        </p>
      )}

      {/* Кнопка Помощи (Цдака) */}
      {profile.donationLink && (
        <Link
          href={profile.donationLink}
          target="_blank"
          className="w-full bg-[#E5481B] hover:bg-[#c93b12] text-white font-bold py-3 px-6 rounded-full transition-colors shadow-md hover:shadow-lg"
        >
          Помочь уроку
        </Link>
      )}
    </div>
  );
}
