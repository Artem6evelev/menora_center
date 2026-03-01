import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  HeartHandshake,
  Settings,
  Users,
  Shield,
  ScrollText,
  UserRound,
  Cake,
  HandHeart,
  MapPin,
  Home,
  ClipboardList,
} from "lucide-react";

export type UserRole = "ADMIN" | "GUEST" | "USER" | string;

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  badgeKey?: "openKvitels";
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Главное",
    items: [
      // { label: "Пульс общины", href: "/dashboard", icon: LayoutDashboard },
      // { label: "Афиша", href: "/schedule", icon: CalendarDays },
      // { label: "Цдака", href: "/donate", icon: HeartHandshake },
      { label: "Профиль семьи", href: "/dashboard/family", icon: UserRound },
    ],
  },
  // {
  //   title: "Духовная забота",
  //   items: [
  //     {
  //       label: "Квитл",
  //       href: "/kvitel",
  //       icon: ScrollText,:
  //       badgeKey: "openKvitels",
  //     },
  //     { label: "Йорцайты", href: "/yahrzeit", icon: Cake },
  //   ],
  // },
  // {
  //   title: "Хесед",
  //   items: [
  //     { label: "Гмах", href: "/gmach", icon: HandHeart },
  //     { label: "Мой Шаббат", href: "/shabbat-hosting", icon: Home },
  //     { label: "Кошерный навигатор", href: "/kosher-map", icon: MapPin },
  //   ],
  // },
  // {
  //   title: "Настройки",
  //   items: [{ label: "Настройки", href: "/settings", icon: Settings }],
  // },
  // {
  //   title: "Админ",
  //   items: [
  //     {
  //       label: "Управление событиями",
  //       href: "/admin/events",
  //       icon: ClipboardList,
  //       adminOnly: true,
  //     },
  //     {
  //       label: "Пользователи",
  //       href: "/admin/users",
  //       icon: Users,
  //       adminOnly: true,
  //     },
  //     { label: "Админ-панель", href: "/admin", icon: Shield, adminOnly: true },
  //   ],
  // },
];

export function filterGroupsByRole(groups: NavGroup[], role?: UserRole) {
  const isAdmin = role === "ADMIN";
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => (it.adminOnly ? isAdmin : true)),
    }))
    .filter((g) => g.items.length > 0);
}
