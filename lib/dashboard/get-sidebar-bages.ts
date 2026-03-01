// lib/dashboard/get-sidebar-badges.ts

// Заглушка для получения бейджей (уведомлений) в сайдбаре
export async function getSidebarBadges(userId: string) {
  // Позже здесь будет запрос к Prisma для подсчета непрочитанных сообщений, квителов и т.д.
  return {
    openKvitels: 0, // Пример бейджа, который ты используешь в nav-config.ts
  };
}
