import { useState } from "react";
import { Heading } from "./heading";
import { Subheading } from "./subheading";
import { cn } from "@/lib/utils";
import { InViewDiv } from "./in-view-div";
import { useMemo } from "react";
import { TestimonialColumnContainer } from "./testimonial-column-container";
import Image from "next/image";

export const Testimonials = () => {
  return (
    <div className="relative z-20 py-10 md:py-40">
      <Heading as="h2">Нас любят и рекомендуют</Heading>
      <Subheading className="text-center max-w-2xl mx-auto">
        Сотни семей уже стали частью нашей большой общины. Мы гордимся тем, что
        Menorah Center становится для многих настоящим вторым домом.
      </Subheading>
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

const testimonials: Testimonial[] = [
  {
    name: "Александр Рабинович",
    quote:
      "Потрясающая атмосфера! Мы начали ходить сюда по пятницам всей семьей, и это полностью изменило наше ощущение Шаббата. Дети в восторге от детских программ.",
    src: "https://i.pravatar.cc/150?img=11",
    designation: "Прихожанин",
  },
  {
    name: "Давид Кац",
    quote:
      "Утренняя программа 'Хасидут с кофе' — это мой ежедневный заряд энергии. Невероятно удобно слушать уроки по дороге на работу. Спасибо раввинам за их труд!",
    src: "https://i.pravatar.cc/150?img=12",
    designation: "Резидент общины",
  },
  {
    name: "Сара Левинсон",
    quote:
      "Организация нашей Хупы прошла просто идеально. Раввины и администрация центра взяли на себя все заботы. Мы чувствовали колоссальную поддержку.",
    src: "https://i.pravatar.cc/150?img=5",
    designation: "Молодая мама",
  },
  {
    name: "Михаил Гольдман",
    quote:
      "Новый личный кабинет — это просто спасение. Заказать кошерное мясо на праздник или записаться на урок теперь можно за пару кликов в телефоне.",
    src: "https://i.pravatar.cc/150?img=14",
    designation: "Бизнесмен",
  },
  {
    name: "Анна Коэн",
    quote:
      "Я долго искала общину, где бы меня приняли тепло и без осуждения за то, что я пока мало знаю о традициях. Menorah Center — именно такое место. Здесь очень много света.",
    src: "https://i.pravatar.cc/150?img=9",
    designation: "Участница женского клуба",
  },
  {
    name: "Илья Бродский",
    quote:
      "Уроки Тании по вторникам стали для меня настоящим открытием. Сложные вещи объясняются настолько простым и доступным языком, что хочется изучать еще и еще.",
    src: "https://i.pravatar.cc/150?img=16",
    designation: "Студент",
  },
  {
    name: "Рахель Вейс",
    quote:
      "Фонд общины помог нашей семье в очень сложный период. Это не просто благотворительность, это искренняя забота. Мы бесконечно благодарны.",
    src: "https://i.pravatar.cc/150?img=20",
    designation: "Многодетная мама",
  },
  {
    name: "Лев Фельдман",
    quote:
      "Шикарные фарбренгены! Всегда собирается отличная компания, вкусная еда и глубокие разговоры до глубокой ночи. Лучшее место в городе.",
    src: "https://i.pravatar.cc/150?img=33",
    designation: "Резидент общины",
  },
  {
    name: "Дина Розен",
    quote:
      "Дети обожают воскресную школу. Преподаватели вкладывают всю душу, каждый праздник — это настоящий спектакль и море эмоций для ребенка.",
    src: "https://i.pravatar.cc/150?img=41",
    designation: "Родитель",
  },
  {
    name: "Григорий Шварц",
    quote:
      "Проверка мезуз и тфилина проходит очень быстро и профессионально. Очень удобно, что софер приезжает прямо к нам или можно оставить в центре.",
    src: "https://i.pravatar.cc/150?img=52",
    designation: "IT Специалист",
  },
  {
    name: "Лея Абрамович",
    quote:
      "Женский клуб — это моя отдушина. Прекрасные лекции, мастер-классы и просто теплое общение за бокалом кошерного вина. Жду каждую встречу!",
    src: "https://i.pravatar.cc/150?img=45",
    designation: "Участница общины",
  },
  {
    name: "Марк Зильбер",
    quote:
      "Отличный сервис и современный подход. Очень радует, что община не стоит на месте, а использует технологии, чтобы быть ближе к людям.",
    src: "https://i.pravatar.cc/150?img=60",
    designation: "Предприниматель",
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
        "animate-fade-in rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-8 opacity-0 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
      style={{
        animationDelay,
      }}
      {...props}
    >
      <div className="flex flex-col items-start">
        <div className="flex gap-4 items-center">
          <Image
            src={src}
            width={150}
            height={150}
            className="h-12 w-12 rounded-full object-cover"
            alt={name}
          />
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              {name}
            </h3>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {designation}
            </p>
          </div>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-6 leading-relaxed">
          &quot;{quote}&quot;
        </p>
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
  let column1 = columns[0];
  let column2 = columns[1];
  let column3 = splitArray(columns[2], 2);
  return (
    <InViewDiv className="relative -mx-4 mt-16 grid h-[49rem] max-h-[150vh] grid-cols-1 items-start gap-8 overflow-hidden px-4 sm:mt-20 md:grid-cols-2 lg:grid-cols-3">
      <TestimonialColumn
        testimonials={[...column1, ...column3.flat(), ...column2]}
        containerClassName={(tIndex) =>
          cn(
            tIndex >= column1.length + column3[0].length && "md:hidden",
            tIndex >= column1.length && "lg:hidden",
          )
        }
        shift={10}
      />
      <TestimonialColumn
        testimonials={[...column2, ...column3[1]]}
        className="hidden md:block"
        containerClassName={(tIndex) =>
          tIndex >= column2.length ? "lg:hidden" : ""
        }
        shift={15}
      />
      <TestimonialColumn
        testimonials={column3.flat()}
        className="hidden lg:block"
        shift={10}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white dark:from-neutral-950" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white dark:from-neutral-950" />
    </InViewDiv>
  );
}
