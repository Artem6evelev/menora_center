"use client";

import { useMemo } from "react";
import { Heading } from "./heading";
import { Subheading } from "./subheading";
import { cn } from "@/lib/utils";
import { InViewDiv } from "./in-view-div";
import { TestimonialColumnContainer } from "./testimonial-column-container";
import Image from "next/image";

export const Testimonials = () => {
  return (
    <div className="relative z-20 py-12 md:py-24 lg:py-40">
      <div className="px-4 md:px-8">
        <Heading as="h2" className="text-3xl md:text-5xl">
          Слова, которые греют душу
        </Heading>
        <Subheading className="text-center max-w-2xl mx-auto text-sm md:text-base mt-4">
          Менора Центр — это не стены, это люди. Истории тех, для кого община
          стала второй семьей, источником поддержки и вдохновения.
        </Subheading>
      </div>
      <TestimonialGrid />
    </div>
  );
};

interface Testimonial {
  name: string;
  quote: string;
  src: string;
  designation?: string;
}

const testimonials = [
  {
    name: "Сара Левин",
    quote:
      "Когда мы переехали в Ришон, я боялась, что буду чувствовать себя одиноко. Но в Менора Центре нас встретили как родных. Теперь наши дети бегут сюда на праздники!",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop",
    designation: "Мама троих детей",
  },
  {
    name: "Михаэль Гринберг",
    quote:
      "Уроки Торы с Раввином открыли для меня совершенно новый взгляд на жизнь. Это не сухая теория, а живая мудрость, которая помогает мне в бизнесе и в семье.",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop",
    designation: "Предприниматель",
  },
  {
    name: "Аанна Кац",
    quote:
      "Волонтерский центр дал мне ощущение нужности. Помогать пожилым людям, видеть их улыбки — это то, что наполняет мою неделю смыслом.",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop",
    designation: "Студентка, волонтер",
  },
  {
    name: "Давид Коэн",
    quote:
      "Атмосфера на Шаббатах просто невероятная. Песни, лехаим, вкусная еда и разговоры до поздна. Это лучшая перезагрузка после рабочей недели.",
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop",
    designation: "IT Специалист",
  },
  {
    name: "Ривка Голдман",
    quote:
      "Женский клуб стал для меня отдушиной. Здесь я нашла настоящих подруг, с которыми можно обсудить всё на свете и получить поддержку.",
    src: "https://images.unsplash.com/photo-1554151228-14d9def656ec?q=80&w=100&auto=format&fit=crop",
    designation: "Дизайнер",
  },
  {
    name: "Борис Шпигель",
    quote:
      "Я никогда не думал, что синагога может быть такой современной и открытой. Здесь нет осуждения, только желание помочь тебе расти.",
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop",
    designation: "Врач",
  },
  {
    name: "Семья Фридман",
    quote:
      "Благодаря детским программам наши дети знают традиции и гордятся своим происхождением. Это лучший подарок, который мы могли им сделать.",
    src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100&auto=format&fit=crop",
    designation: "Члены общины",
  },
  {
    name: "Йосеф Берг",
    quote:
      "Миньян каждое утро дает мне заряд энергии на весь день. Это дисциплина и духовность в одном флаконе.",
    src: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop",
    designation: "Пенсионер",
  },
  {
    name: "Марина Вайс",
    quote:
      "Курс 'Еврейский дом' помог нам с мужем укрепить отношения. Мудрость наших предков актуальна как никогда.",
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop",
    designation: "Психолог",
  },
  {
    name: "Алекс Розен",
    quote:
      "Молодежные вечеринки здесь — это нечто! Весело, кошерно и со смыслом. Нашел здесь много друзей и даже бизнес-партнеров.",
    src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop",
    designation: "Стартапер",
  },
  {
    name: "Клара Зильбер",
    quote:
      "Спасибо за продуктовую помощь к Песаху. Вы делаете великое дело, не давая людям чувствовать себя забытыми.",
    src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=100&auto=format&fit=crop",
    designation: "Участница Хесед",
  },
  {
    name: "Игаль Шапиро",
    quote:
      "Раввин всегда находит время выслушать. Его советы помогли мне пройти через сложный период в жизни. Бесконечно благодарен.",
    src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=100&auto=format&fit=crop",
    designation: "Инженер",
  },
];

function Testimonial({
  name,
  quote,
  src,
  designation,
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"figure">, keyof Testimonial> &
  Testimonial) {
  let animationDelay = useMemo(() => {
    let possibleAnimationDelays = [
      "0s",
      "0.1s",
      "0.2s",
      "0.3s",
      "0.4s",
      "0.5s",
    ];
    return possibleAnimationDelays[
      Math.floor(Math.random() * possibleAnimationDelays.length)
    ];
  }, []);

  return (
    <figure
      className={cn(
        "animate-fade-in rounded-2xl bg-white dark:bg-neutral-900 p-6 opacity-0 shadow-sm border border-neutral-100 dark:border-neutral-800",
        className,
      )}
      style={{
        animationDelay,
      }}
      {...props}
    >
      <div className="flex flex-col items-start">
        <div className="flex gap-3 items-center">
          <div className="relative h-10 w-10 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-gray-100">
            <Image
              src={src}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {name}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {designation}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            <span className="text-amber-500 mr-1 text-lg leading-none">“</span>
            {quote}
          </p>
        </div>
      </div>
    </figure>
  );
}

function TestimonialColumn({
  testimonials,
  className,
  containerClassName,
  shift = 0,
}: {
  testimonials: Testimonial[];
  className?: string;
  containerClassName?: (reviewIndex: number) => string;
  shift?: number;
}) {
  return (
    <TestimonialColumnContainer className={cn(className)} shift={shift}>
      {testimonials
        .concat(testimonials)
        .map((testimonial, testimonialIndex) => (
          <Testimonial
            name={testimonial.name}
            quote={testimonial.quote}
            src={testimonial.src}
            designation={testimonial.designation}
            key={testimonialIndex}
            className={containerClassName?.(
              testimonialIndex % testimonials.length,
            )}
          />
        ))}
    </TestimonialColumnContainer>
  );
}

function splitArray<T>(array: Array<T>, numParts: number) {
  let result: Array<Array<T>> = [];
  for (let i = 0; i < array.length; i++) {
    let index = i % numParts;
    if (!result[index]) {
      result[index] = [];
    }
    result[index].push(array[i]);
  }
  return result;
}

function TestimonialGrid() {
  let columns = splitArray(testimonials, 3);
  let column1 = columns[0] || [];
  let column2 = columns[1] || [];
  // Делим 3-ю колонку пополам, чтобы раскидать её контент на планшетах (когда всего 2 колонки)
  let column3 = splitArray(columns[2] || [], 2);

  return (
    <InViewDiv className="relative -mx-4 mt-10 md:mt-16 grid h-[40rem] md:h-[49rem] max-h-[150vh] grid-cols-1 items-start gap-4 md:gap-8 overflow-hidden px-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Колонка 1 (Видна всегда)
         На мобильных (grid-cols-1): содержит ВСЕ отзывы.
         На планшетах (grid-cols-2): содержит column1 + половину column3.
         На десктопе (grid-cols-3): содержит только column1.
      */}
      <TestimonialColumn
        testimonials={[...column1, ...column3.flat(), ...column2]}
        containerClassName={(tIndex) =>
          cn(
            tIndex >= column1.length + column3[0].length && "md:hidden", // Скрыть column2 на планшетах
            tIndex >= column1.length && "lg:hidden", // Скрыть всё лишнее на десктопе
          )
        }
        shift={10}
      />

      {/* Колонка 2 (Видна на планшетах и десктопах)
         На планшетах: содержит column2 + вторую половину column3.
         На десктопе: содержит только column2.
      */}
      <TestimonialColumn
        testimonials={[...column2, ...column3[1]]}
        className="hidden md:block"
        containerClassName={
          (tIndex) => (tIndex >= column2.length ? "lg:hidden" : "") // Скрыть часть column3 на десктопе
        }
        shift={15}
      />

      {/* Колонка 3 (Видна только на десктопе)
         Содержит column3 целиком.
      */}
      <TestimonialColumn
        testimonials={column3.flat()}
        className="hidden lg:block"
        shift={10}
      />

      {/* Градиенты */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 md:h-32 bg-gradient-to-b from-white dark:from-black to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 md:h-32 bg-gradient-to-t from-white dark:from-black to-transparent" />
    </InViewDiv>
  );
}
