import React from "react";
import { Heading } from "./heading";
import { Subheading } from "./subheading";
import { cn } from "@/lib/utils";
import { GridLineHorizontal, GridLineVertical } from "./grid-lines";
import { SkeletonOne } from "./skeletons/first";
import { SkeletonTwo } from "./skeletons/second";
import { SkeletonThree } from "./skeletons/third";
import { SkeletonFour } from "./skeletons/fourth";
import Link from "next/link"; // Добавили Link

export const Features = () => {
  const features = [
    {
      title: "Мероприятия и праздники",
      description:
        "Участвуйте в фарбренгенах, отмечайте праздники в кругу общины и не пропускайте важные уроки.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 lg:col-span-4 border-b border-r dark:border-neutral-800",
      link: "/events",
    },
    {
      title: "Хасидут с кофе ☕",
      description:
        "Ежедневные утренние эфиры в нашем Telegram. Заряжайтесь мудростью Торы на весь день.",
      skeleton: <SkeletonTwo />,
      className: "border-b col-span-1 lg:col-span-2 dark:border-neutral-800",
      link: "https://t.me/твой_канал",
    },
    {
      title: "Услуги центра",
      description:
        "Проверка мезуз, заказ кошерных продуктов, консультации раввина и организация Хупы.",
      skeleton: <SkeletonThree />,
      className: "col-span-1 lg:col-span-3 border-r dark:border-neutral-800",
      link: "/services",
    },
    {
      title: "Новости общины",
      description:
        "Будьте в курсе всех обновлений, новых проектов, расписания молитв и важных объявлений.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3",
      link: "/news",
    },
  ];

  return (
    <div className="relative z-20 py-10  overflow-hidden">
      <Heading as="h2">Всё для резидентов общины</Heading>
      <Subheading className="text-center">
        От ежедневных уроков Торы до заказа кошерных продуктов — вся жизнь
        Menorah Center в одном удобном пространстве.
      </Subheading>

      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-6 mt-12">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              className={feature.className}
              link={feature.link}
            >
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
        <GridLineHorizontal style={{ top: 0, left: "-10%", width: "120%" }} />
        <GridLineHorizontal
          style={{ bottom: 0, left: "-10%", width: "120%" }}
        />
        <GridLineVertical style={{ top: "-10%", right: 0, height: "120%" }} />
        <GridLineVertical style={{ top: "-10%", left: 0, height: "120%" }} />
      </div>
    </div>
  );
};

// Обернули в Link, чтобы вся карточка была кликабельной
const FeatureCard = ({
  children,
  className,
  link,
}: {
  children?: React.ReactNode;
  className?: string;
  link: string;
}) => {
  return (
    <Link
      href={link}
      className={cn(
        `p-4 sm:p-8 relative overflow-hidden group hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors block`,
        className,
      )}
    >
      {children}
    </Link>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Heading
      as="h3"
      size="sm"
      className="text-left group-hover:text-[#FFB800] transition-colors"
    >
      {children}
    </Heading>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Subheading className="text-left max-w-sm mx-0 lg:text-sm my-2">
      {children}
    </Subheading>
  );
};
