"use client";
import { DesktopNavbar } from "./desktop-navbar";
import { MobileNavbar } from "./mobile-navbar";
import { motion } from "framer-motion";
import { Newspaper, CalendarDays, BookHeart, Users } from "lucide-react";

// Структура на русском под Menora Center
const navItems = [
  {
    title: "Услуги",
    link: "/services",
  },
  {
    title: "Мероприятия",
    link: "/events",
  },
  {
    title: "Новости",
    link: "/news",
    children: [
      {
        title: "Все новости",
        description: "Главные события нашей общины",
        link: "/news",
        icon: Newspaper,
      },
      {
        title: "Жизнь общины",
        description: "Интервью, фотоотчеты и истории",
        link: "/news/community",
        icon: Users,
      },
      {
        title: "Еврейские праздники",
        description: "Традиции, расписание и законы",
        link: "/news/holidays",
        icon: CalendarDays,
      },
      {
        title: "Уроки Торы",
        description: "Статьи и видео от раввинов",
        link: "/news/torah",
        icon: BookHeart,
      },
    ],
    // Блок для последней новости (Featured)
    featured: {
      tag: "АКТУАЛЬНО",
      title: "Открытие нового сезона в Menora Center",
      image:
        "https://images.unsplash.com/photo-1599939571322-792a326cbddc?w=400&q=80",
      link: "/news/latest",
    },
  },
  {
    title: "Контакты",
    link: "/contact",
  },
];

export function NavBar() {
  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ ease: [0.6, 0.05, 0.1, 0.9], duration: 0.8 }}
      className="max-w-7xl fixed top-4 mx-auto inset-x-0 z-50 w-[95%] lg:w-full"
    >
      <div className="hidden lg:block w-full">
        <DesktopNavbar navItems={navItems} />
      </div>
      <div className="flex h-full w-full items-center lg:hidden">
        <MobileNavbar navItems={navItems} />
      </div>
    </motion.nav>
  );
}
