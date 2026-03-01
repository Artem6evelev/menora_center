import React from "react";
import { Heading } from "./heading";
import { Subheading } from "./subheading";
import { cn } from "@/lib/utils";
import { GridLineHorizontal, GridLineVertical } from "./grid-lines";
import { SkeletonOne } from "./skeletons/first";
import { SkeletonTwo } from "./skeletons/second";
import { SkeletonFour } from "./skeletons/fourth";
import { SkeletonThree } from "./skeletons/third";

export const Features = () => {
  const features = [
    {
      title: "Праздники и традиции",
      description:
        "Мы создаем атмосферу настоящего праздника. От теплого семейного Шаббата до грандиозных событий на Хануку и Песах.",
      skeleton: <SkeletonOne />,
      className:
        "col-span-1 lg:col-span-4 border-b border-r dark:border-neutral-800",
    },
    {
      title: "Молодежный клуб",
      description:
        "Пространство для общения, знакомств и энергии. Встречи, поездки и еврейская гордость для студентов и подростков.",
      skeleton: <SkeletonTwo />,
      className: "border-b col-span-1 lg:col-span-2 dark:border-neutral-800",
    },
    {
      title: "Академия знаний",
      description:
        "Ежедневные уроки Торы, женский клуб, курсы и лекции. Мудрость тысячелетий, доступная каждому.",
      skeleton: <SkeletonThree />,
      className: "col-span-1 lg:col-span-3 border-r dark:border-neutral-800",
    },
    {
      title: "Хесед и помощь",
      description:
        "Мы поддерживаем тех, кто нуждается. Продуктовые наборы, помощь пожилым и волонтерские программы.",
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3",
    },
  ];
  return (
    <div className="relative z-20 py-10 lg:py-40 overflow-hidden">
      <Heading as="h2">Больше, чем просто синагога</Heading>
      <Subheading className="text-center max-w-2xl mx-auto">
        Menora Center — это экосистема еврейской жизни. Мы объединяем
        духовность, образование и социальную помощь в одном современном
        пространстве.
      </Subheading>

      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-6 mt-12">
          {features.map((feature) => (
            <FeatureCard key={feature.title} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className="h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>

        {/* Сетка декоративная */}
        <GridLineHorizontal
          style={{
            top: 0,
            left: "-10%",
            width: "120%",
          }}
        />

        <GridLineHorizontal
          style={{
            bottom: 0,
            left: "-10%",
            width: "120%",
          }}
        />

        <GridLineVertical
          style={{
            top: "-10%",
            right: 0,
            height: "120%",
          }}
        />
        <GridLineVertical
          style={{
            top: "-10%",
            left: 0,
            height: "120%",
          }}
        />
      </div>
    </div>
  );
};

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn(`p-4 sm:p-8 relative overflow-hidden`, className)}>
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Heading as="h3" size="sm" className="text-left mb-2">
      {children}
    </Heading>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Subheading className="text-left max-w-sm mx-0 lg:text-sm my-2 mb-8">
      {children}
    </Subheading>
  );
};
