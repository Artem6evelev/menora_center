import { prisma } from "@/lib/prisma";

export type DashboardData = {
  profile: {
    firstName: string | null;
    lastName: string | null;
  } | null;
  stats: {
    upcomingEvents: number;
    totalDonationsThisMonth: number; // ILS
    openKvitels: number;
    gmachActive: number;
  };
  nextEvent: {
    id: string;
    title: string;
    startDate: string; // ISO
    location: string;
    guestsCount: number;
    status: string;
  } | null;
  recentGmach: Array<{
    id: string;
    title: string;
    type: string;
    createdAt: string; // ISO
  }>;
  recentDonations: Array<{
    id: string;
    amount: number;
    currency: string;
    purpose: string | null;
    createdAt: string; // ISO
  }>;
  kvitelPreview: Array<{
    id: string;
    content: string;
    isRead: boolean;
    createdAt: string; // ISO
  }>;
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  // --- ВРЕМЕННАЯ ЗАГЛУШКА ---
  // Так как старые таблицы (Profile, Event, Donation и т.д.) временно отсутствуют
  // в schema.prisma, мы отдаем безопасные дефолтные данные.
  // TODO: Вернуть реальные запросы к БД после восстановления полной схемы.

  return {
    profile: {
      firstName: "Уважаемый",
      lastName: "Прихожанин",
    },
    stats: {
      upcomingEvents: 0,
      totalDonationsThisMonth: 0,
      openKvitels: 0,
      gmachActive: 0,
    },
    nextEvent: null,
    recentGmach: [],
    recentDonations: [],
    kvitelPreview: [],
  };
}
