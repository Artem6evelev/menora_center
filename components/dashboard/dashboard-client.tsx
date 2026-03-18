"use client";

import { motion } from "framer-motion";
import { Users, Calendar, Newspaper, ArrowUpRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardClient({ stats }: { stats: any }) {
  // Карточки метрик
  const metrics = [
    {
      title: "Всего резидентов",
      value: stats.users,
      icon: Users,
      trend: "+12% за месяц",
      color: "from-blue-500 to-cyan-500",
      bgLight: "bg-blue-50 dark:bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      title: "Активные события",
      value: stats.events,
      icon: Calendar,
      trend: "+3 на этой неделе",
      color: "from-[#FFB800] to-orange-500",
      bgLight: "bg-orange-50 dark:bg-orange-500/10",
      iconColor: "text-[#FFB800]",
    },
    {
      title: "Публикации",
      value: stats.news,
      icon: Newspaper,
      trend: "Блог общины",
      color: "from-purple-500 to-pink-500",
      bgLight: "bg-purple-50 dark:bg-purple-500/10",
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* СЕТКА МЕТРИК */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-neutral-900 rounded-[32px] p-6 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm relative overflow-hidden group"
            >
              {/* Фоновый градиент при наведении */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500`}
              />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-3.5 rounded-2xl ${metric.bgLight}`}>
                  <Icon size={24} className={metric.iconColor} />
                </div>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-50 dark:bg-green-500/10 px-2.5 py-1 rounded-full">
                  <ArrowUpRight size={14} /> ТРЕНД
                </span>
              </div>

              <div className="relative z-10">
                <h3 className="text-5xl font-black text-neutral-900 dark:text-white tracking-tighter mb-2">
                  {metric.value}
                </h3>
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">
                  {metric.title}
                </p>
                <p className="text-xs font-medium text-neutral-400 mt-2">
                  {metric.trend}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ГРАФИК АКТИВНОСТИ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-neutral-900 rounded-[32px] p-8 border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-black tracking-tighter text-neutral-900 dark:text-white">
            Активность за неделю
          </h2>
          <p className="text-sm font-medium text-neutral-500 mt-1">
            Новые регистрации и записи на мероприятия
          </p>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={stats.chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFB800" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FFB800" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e5e5"
                className="dark:stroke-neutral-800"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#888888", fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#888888", fontWeight: 600 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
                  fontWeight: "bold",
                }}
                cursor={{
                  stroke: "#FFB800",
                  strokeWidth: 1,
                  strokeDasharray: "5 5",
                }}
              />
              <Area
                type="monotone"
                dataKey="users"
                name="Регистрации"
                stroke="#FFB800"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorUsers)"
              />
              <Area
                type="monotone"
                dataKey="events"
                name="Записи на события"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorEvents)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
