import { cn } from "@/lib/utils";
import {
  IconHeartHandshake,
  IconBook2,
  IconHomeHeart,
  IconShieldCheck,
  IconUsersGroup,
  IconMessageCircle,
  IconCoffee,
  IconSparkles,
} from "@tabler/icons-react";

export const GridFeatures = () => {
  const features = [
    {
      title: "Духовная поддержка",
      description:
        "Всегда на связи. Наши раввины готовы ответить на ваши вопросы и поддержать в трудную минуту.",
      icon: (
        <IconHeartHandshake className="text-neutral-700 dark:text-neutral-300" />
      ),
    },
    {
      title: "Глубокие знания",
      description:
        "Уроки Торы, хасидизма и изучение недельных глав с опытными преподавателями для любого уровня.",
      icon: <IconBook2 className="text-neutral-700 dark:text-neutral-300" />,
    },
    {
      title: "Тепло и уют",
      description:
        "Menorah Center — это ваш второй дом. Место, где вас всегда ждут с улыбкой и горячим кофе.",
      icon: (
        <IconHomeHeart className="text-neutral-700 dark:text-neutral-300" />
      ),
    },
    {
      title: "Безопасность",
      description:
        "Мы заботимся о вашем комфорте и безопасности во время проведения всех мероприятий общины.",
      icon: (
        <IconShieldCheck className="text-neutral-700 dark:text-neutral-300" />
      ),
    },
    {
      title: "Сильное комьюнити",
      description:
        "Общение, нетворкинг и дружба. Окружите себя людьми, разделяющими ваши ценности.",
      icon: (
        <IconUsersGroup className="text-neutral-700 dark:text-neutral-300" />
      ),
    },
    {
      title: "Удобный кабинет",
      description:
        "Записывайтесь на уроки, заказывайте кошерные продукты и получайте уведомления в один клик.",
      icon: (
        <IconMessageCircle className="text-neutral-700 dark:text-neutral-300" />
      ),
    },
    {
      title: "Ежедневный Хасидут",
      description:
        "Начинайте свой день правильно. Каждое утро мы встречаемся онлайн на Хасидут с чашкой кофе.",
      icon: <IconCoffee className="text-neutral-700 dark:text-neutral-300" />,
    },
    {
      title: "Развитие и проекты",
      description:
        "От детских садов до женских программ — община постоянно растет и создает новые проекты.",
      icon: <IconSparkles className="text-neutral-700 dark:text-neutral-300" />,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto py-24 px-6 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter mb-4">
          Почему мы?
        </h2>
        <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
          Menorah Center объединяет традиции и современный подход, создавая
          идеальную среду для вашей духовной и светской жизни.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        {features.map((feature, index) => (
          <Feature key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </div>
  );
};

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col py-10 relative group dark:border-neutral-800 transition-colors duration-300",
        // Границы ячеек
        "border-b border-neutral-100 dark:border-neutral-800/50",
        index % 4 !== 3 && "md:border-r",
        "hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
      )}
    >
      <div className="mb-4 relative z-10 px-10">{icon}</div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10 text-neutral-900 dark:text-white">
        <div className="absolute left-0 inset-y-0 h-6 w-1 rounded-tr-full rounded-br-full bg-neutral-200 dark:bg-neutral-800 group-hover:bg-[#FFB800] transition duration-300" />
        <span className="group-hover:translate-x-2 transition duration-300 inline-block">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto relative z-10 px-10 leading-relaxed">
        {description}
      </p>
    </div>
  );
};
