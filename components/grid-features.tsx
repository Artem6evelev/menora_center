import { cn } from "@/lib/utils";
import {
  IconBuildingCommunity,
  IconHeartHandshake,
  IconBook,
  IconCandle,
  IconWoman,
  IconMoodKid,
  IconSoup,
  IconMessageChatbot,
} from "@tabler/icons-react";

export const GridFeatures = () => {
  const features = [
    {
      title: "Открыты для каждого",
      description:
        "Неважно, соблюдаете вы традиции или только начинаете свой путь. Двери нашего центра открыты для всех евреев.",
      icon: <IconBuildingCommunity className="text-blue-500" />,
    },
    {
      title: "Поддержка и Хесед",
      description:
        "Мы не оставляем своих в беде. Продуктовая помощь, волонтеры и просто доброе слово в трудную минуту.",
      icon: <IconHeartHandshake className="text-red-500" />,
    },
    {
      title: "Образование для всех",
      description:
        "Уроки Торы, лекции по истории, курсы иврита. Знания доступны мужчинам, женщинам и детям любого возраста.",
      icon: <IconBook className="text-indigo-500" />,
    },
    {
      title: "Яркие праздники",
      description:
        "Шаббаты, Ханука, Пурим, Песах. Мы умеем веселиться по-еврейски, сохраняя глубину и святость момента.",
      icon: <IconCandle className="text-amber-500" />,
    },
    {
      title: "Женский клуб",
      description:
        "Особое пространство для еврейских женщин. Встречи, мастер-классы, общение и вдохновение.",
      icon: <IconWoman className="text-pink-500" />,
    },
    {
      title: "Будущее поколения",
      description:
        "Детский сад, воскресная школа и молодежный клуб. Мы передаем традиции нашим детям с любовью.",
      icon: <IconMoodKid className="text-green-500" />,
    },
    {
      title: "Кошерная кухня",
      description:
        "Вкусные трапезы, доставка кошерной еды и помощь в организации кошерного быта у вас дома.",
      icon: <IconSoup className="text-orange-500" />,
    },
    {
      title: "Связь с Раввином",
      description:
        "Возможность задать личный вопрос, получить совет или благословение в любой жизненной ситуации.",
      icon: <IconMessageChatbot className="text-cyan-500" />,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
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
        "flex flex-col py-8 px-6 md:py-10 md:px-10 relative group dark:border-neutral-800",
        // Mobile Borders (Base)
        "border-b last:border-b-0",

        // Tablet Borders (md: 2 columns)
        // Right border on even items (left column)
        "md:border-r-0 md:even:border-r",
        // Bottom border on all except last row (indices 6 and 7)
        "md:border-b md:[&:nth-child(n+7)]:border-b-0",

        // Desktop Borders (lg: 4 columns)
        // Reset tablet logic first
        "lg:border-none",
        // Vertical lines
        "lg:border-r lg:[&:nth-child(4n)]:border-r-0",
        // Left border on first column (index 0 and 4)
        (index === 0 || index === 4) && "lg:border-l",
        // Bottom border on first row (index < 4)
        index < 4 && "lg:border-b",
      )}
    >
      {/* Градиенты при наведении (Адаптивные) */}
      <div className="opacity-0 group-hover:opacity-100 transition duration-200 group absolute inset-0 h-full w-full bg-gradient-to-t from-blue-50/50 dark:from-neutral-800/50 to-transparent pointer-events-none" />

      <div className="mb-4 relative z-10">{icon}</div>
      <div className="text-lg font-bold mb-2 relative z-10">
        {/* Боковая полоска-акцент */}
        <div className="absolute left-0 inset-y-0 h-6 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover:bg-blue-500 transition duration-200" />
        <span className="group-hover:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xs relative z-10 leading-relaxed">
        {description}
      </p>
    </div>
  );
};
