// components/dashboard/authors/AuthorProfileForm.tsx
"use client";

import { useState } from "react";
import { updateAuthorProfile } from "@/actions/author-profile.actions";
import {
  Save,
  Globe,
  Youtube,
  Send,
  Facebook,
  Instagram,
  Heart,
} from "lucide-react";

export default function AuthorProfileForm({
  initialData,
}: {
  initialData: any;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    shortBio: initialData.shortBio || "",
    donationLink: initialData.donationLink || "",
    websiteUrl: initialData.websiteUrl || "",
    facebookUrl: initialData.facebookUrl || "",
    instagramUrl: initialData.instagramUrl || "",
    youtubeUrl: initialData.youtubeUrl || "",
    telegramUrl: initialData.telegramUrl || "",
    slug: initialData.slug,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await updateAuthorProfile(formData);
    if (res.success) {
      alert("Профиль успешно обновлен!");
    } else {
      alert("Ошибка при сохранении");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Биография */}
      <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Короткая Биография</h2>
        <textarea
          name="shortBio"
          value={formData.shortBio}
          onChange={handleChange}
          rows={4}
          placeholder="Например: Раввин общины, автор 5 книг по хасидуту..."
          className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#FFB800] outline-none"
        />
        <p className="text-xs text-neutral-400 mt-2">
          Отображается под вашим именем.
        </p>
      </div>

      {/* Цдака */}
      <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="text-red-500" />
          <h2 className="text-xl font-bold">Ссылка для сбора Цдаки</h2>
        </div>
        <input
          type="url"
          name="donationLink"
          value={formData.donationLink}
          onChange={handleChange}
          placeholder="https://..."
          className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#FFB800] outline-none"
        />
        <p className="text-xs text-neutral-400 mt-2">
          Привяжите кнопку «Помочь уроку» к вашей кампании сбора.
        </p>
      </div>

      {/* Социальные сети */}
      <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm space-y-4">
        <h2 className="text-xl font-bold mb-4">Социальные сети</h2>

        <div className="flex items-center gap-4">
          <Youtube className="text-red-500 shrink-0" />
          <input
            type="url"
            name="youtubeUrl"
            value={formData.youtubeUrl}
            onChange={handleChange}
            placeholder="YouTube URL"
            className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <Send className="text-blue-500 shrink-0" />
          <input
            type="url"
            name="telegramUrl"
            value={formData.telegramUrl}
            onChange={handleChange}
            placeholder="Telegram URL"
            className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <Instagram className="text-pink-500 shrink-0" />
          <input
            type="url"
            name="instagramUrl"
            value={formData.instagramUrl}
            onChange={handleChange}
            placeholder="Instagram URL"
            className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <Facebook className="text-blue-600 shrink-0" />
          <input
            type="url"
            name="facebookUrl"
            value={formData.facebookUrl}
            onChange={handleChange}
            placeholder="Facebook URL"
            className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <Globe className="text-neutral-500 shrink-0" />
          <input
            type="url"
            name="websiteUrl"
            value={formData.websiteUrl}
            onChange={handleChange}
            placeholder="Личный сайт URL"
            className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-sm outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-[#FFB800] hover:bg-amber-400 text-black font-black py-4 rounded-2xl transition-all duration-300 disabled:opacity-50"
      >
        <Save size={20} />
        {isLoading ? "Сохранение..." : "Сохранить изменения"}
      </button>
    </form>
  );
}
