"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassCard, CardHeader, CardBody, Badge, Divider } from "./ui";
import { formatDateTime, currencyILS } from "@/lib/dashboard/time-utils";
import {
  CalendarDays,
  HeartHandshake,
  QrCode,
  Sparkles,
  HandHeart,
  ScrollText,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  greeting: string;
  displayName: string;
  jewishDateLabel: string;
  shabbatLabel: string;
  data: {
    stats: {
      upcomingEvents: number;
      totalDonationsThisMonth: number;
      openKvitels: number;
      gmachActive: number;
    };
    nextEvent: {
      id: string;
      title: string;
      startDate: string;
      location: string;
      guestsCount: number;
      status: string;
    } | null;
    recentGmach: Array<{
      id: string;
      title: string;
      type: string;
      createdAt: string;
    }>;
    recentDonations: Array<{
      id: string;
      amount: number;
      currency: string;
      purpose: string | null;
      createdAt: string;
    }>;
    kvitelPreview: Array<{
      id: string;
      content: string;
      isRead: boolean;
      createdAt: string;
    }>;
  };
};

function clamp(text: string, n = 90) {
  return text.length > n ? text.slice(0, n).trim() + "…" : text;
}

export function PulseDashboard({
  greeting,
  displayName,
  jewishDateLabel,
  shabbatLabel,
  data,
}: Props) {
  const { stats, nextEvent, recentGmach, recentDonations, kvitelPreview } =
    data;

  return (
    <div className="space-y-8">
      {/* HERO */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-neutral-500 dark:text-neutral-400 text-sm">
            {greeting},{" "}
            <span className="font-medium text-neutral-900 dark:text-white">
              {displayName}
            </span>
          </div>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Пульс Общины
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="blue">{jewishDateLabel}</Badge>
            <Badge tone="amber">{shabbatLabel}</Badge>
            <Badge tone="neutral">Ришон ле-Цион</Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/schedule">
            <Button variant="secondary" className="rounded-2xl">
              <CalendarDays className="mr-2 h-4 w-4" />
              Афиша
            </Button>
          </Link>
          <Link href="/donate">
            <Button className="rounded-2xl">
              <HeartHandshake className="mr-2 h-4 w-4" />
              Цдака
            </Button>
          </Link>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6">
          {/* NEXT EVENT / TICKET */}
          <GlassCard>
            <CardHeader
              title={nextEvent ? "Мой билет" : "Ближайшее событие"}
              subtitle={
                nextEvent
                  ? "Вы уже записаны — всё под рукой"
                  : "Запишитесь в один клик"
              }
              right={
                nextEvent ? (
                  <Badge tone="green">Записан</Badge>
                ) : (
                  <Badge tone="neutral">Нет записи</Badge>
                )
              }
            />
            <CardBody>
              {nextEvent ? (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {nextEvent.title}
                    </div>
                    <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {formatDateTime(nextEvent.startDate)} •{" "}
                      {nextEvent.location} • Гостей: {nextEvent.guestsCount}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link href={`/events/${nextEvent.id}`}>
                        <Button variant="secondary" className="rounded-2xl">
                          Открыть событие
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/events/${nextEvent.id}/ticket`}>
                        <Button variant="outline" className="rounded-2xl">
                          <QrCode className="mr-2 h-4 w-4" />
                          QR-билет
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "rounded-2xl border border-neutral-200/60 bg-white/60 p-4",
                      "dark:border-neutral-800/60 dark:bg-neutral-900/40",
                    )}
                  >
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Быстрое напоминание
                    </div>
                    <div className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
                      Приходите за 10–15 минут.
                    </div>
                    <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                      (QR можно показать на входе)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-300">
                      У вас пока нет активных записей.
                    </div>
                    <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Откройте афишу — и система будет помнить ваши мероприятия.
                    </div>
                  </div>
                  <Link href="/schedule">
                    <Button className="rounded-2xl">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Открыть афишу
                    </Button>
                  </Link>
                </div>
              )}
            </CardBody>
          </GlassCard>

          {/* Wisdom of day */}
          <GlassCard>
            <CardHeader
              title="Мудрость дня"
              subtitle="Короткая мысль, чтобы начать день со смыслом"
              right={<Sparkles className="h-4 w-4 text-neutral-400" />}
            />
            <CardBody>
              <div className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                “Маленькое доброе действие сегодня — это кирпичик большого света
                завтра.”
              </div>
              <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                (Подключим «Хаюм Йом» / цитаты раввина как источник данных)
              </div>
            </CardBody>
          </GlassCard>

          {/* Feed: Gmach + Kvitels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard>
              <CardHeader
                title="Хесед рядом"
                subtitle="Свежие объявления Гмаха"
                right={<HandHeart className="h-4 w-4 text-neutral-400" />}
              />
              <CardBody>
                {recentGmach.length === 0 ? (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Пока нет объявлений.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentGmach.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-neutral-200/60 p-3 dark:border-neutral-800/60"
                      >
                        <div className="text-sm font-medium text-neutral-900 dark:text-white">
                          {p.title}
                        </div>
                        <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          Тип: {p.type} •{" "}
                          {new Date(p.createdAt).toLocaleDateString("ru-RU")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Divider />
                <Link href="/gmach">
                  <Button variant="secondary" className="w-full rounded-2xl">
                    Открыть Гмах
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardBody>
            </GlassCard>

            <GlassCard>
              <CardHeader
                title="Виртуальный квител"
                subtitle="Ваши записки раввину"
                right={<ScrollText className="h-4 w-4 text-neutral-400" />}
              />
              <CardBody>
                {kvitelPreview.length === 0 ? (
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Пока нет записок.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {kvitelPreview.map((k) => (
                      <div
                        key={k.id}
                        className="rounded-xl border border-neutral-200/60 p-3 dark:border-neutral-800/60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {new Date(k.createdAt).toLocaleDateString("ru-RU")}
                          </div>
                          <Badge tone={k.isRead ? "green" : "amber"}>
                            {k.isRead ? "Прочитано" : "Ожидает"}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-neutral-800 dark:text-neutral-200">
                          {clamp(k.content, 110)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Divider />
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/kvitel/new">
                    <Button className="w-full rounded-2xl">Написать</Button>
                  </Link>
                  <Link href="/kvitel">
                    <Button variant="secondary" className="w-full rounded-2xl">
                      Все
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </GlassCard>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Stats */}
          <GlassCard>
            <CardHeader title="Сегодня" subtitle="Быстрые показатели" />
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-neutral-200/60 p-4 dark:border-neutral-800/60">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Событий впереди
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">
                    {stats.upcomingEvents}
                  </div>
                </div>
                <div className="rounded-2xl border border-neutral-200/60 p-4 dark:border-neutral-800/60">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Непрочитано (квител)
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">
                    {stats.openKvitels}
                  </div>
                </div>
                <div className="rounded-2xl border border-neutral-200/60 p-4 dark:border-neutral-800/60">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Гмах активен
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">
                    {stats.gmachActive}
                  </div>
                </div>
                <div className="rounded-2xl border border-neutral-200/60 p-4 dark:border-neutral-800/60">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Цдака в этом месяце
                  </div>
                  <div className="mt-2 text-xl font-semibold text-neutral-900 dark:text-white">
                    {currencyILS(stats.totalDonationsThisMonth)}
                  </div>
                </div>
              </div>
            </CardBody>
          </GlassCard>

          {/* Donations */}
          <GlassCard>
            <CardHeader title="Моя Цдака" subtitle="Последние взносы" />
            <CardBody>
              {recentDonations.length === 0 ? (
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Пока нет пожертвований.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDonations.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200/60 p-3 dark:border-neutral-800/60"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-neutral-900 dark:text-white">
                          {d.purpose ?? "Пожертвование"}
                        </div>
                        <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          {new Date(d.createdAt).toLocaleDateString("ru-RU")}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {Math.round(d.amount)} {d.currency}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Divider />

              <Link href="/donate">
                <Button variant="secondary" className="w-full rounded-2xl">
                  Открыть Цдаку
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardBody>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
