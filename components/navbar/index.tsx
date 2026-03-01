"use client";

import { DesktopNavbar } from "./desktop-navbar";
import { MobileNavbar } from "./mobile-navbar";
import { useTranslations } from "next-intl";

// Тип для элемента навигации (может быть ссылкой ИЛИ группой)
export type NavItem = {
  title: string;
  link?: string; // Если есть, то это прямая ссылка
  items?: { title: string; link: string }[]; // Если есть, то это выпадающий список
  special?: boolean; // Для Chai Club
};

export function NavBar() {
  const t = useTranslations("Navigation");

  // ГРУППИРУЕМ МЕНЮ (3-4 главных пункта)
  const navItems: NavItem[] = [
    // 1. Группа "Община"
    {
      title: t("community_group"), // Добавьте ключ "community_group": "Община" в ru.json
      items: [
        { title: t("about"), link: "/about" },
        { title: t("services"), link: "/services" },
        { title: t("contact"), link: "/contact" },
      ],
    },
    // 2. Группа "Афиша"
    {
      title: t("events_group"), // Ключ "events_group": "Афиша"
      items: [
        { title: t("schedule"), link: "/schedule" },
        { title: t("events"), link: "/events" },
      ],
    },
    // 3. Группа "Медиа"
    {
      title: t("media_group"), // Ключ "media_group": "Медиа"
      items: [
        { title: t("torah"), link: "/torah" },
        // Можно добавить сюда "Фотоотчеты" в будущем
      ],
    },
    // 4. Отдельные важные ссылки
    { title: t("chai_club"), link: "/chai-club", special: true },
    { title: t("donate"), link: "/donate" },
  ];

  return (
    <>
      <DesktopNavbar navItems={navItems} />
      <MobileNavbar navItems={navItems} />
    </>
  );
}
