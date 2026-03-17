"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { isSameDay } from "date-fns";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  eventDates?: Date[];
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  eventDates = [],
  ...props
}: CalendarProps) {
  const modifiers = {
    hasEvent: (date: Date) =>
      eventDates.some((eventDate) => isSameDay(date, eventDate)),
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout="label"
      className={cn("p-4 bg-white dark:bg-neutral-950", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm font-bold tracking-tight",
        nav: "flex items-center",
        button_previous:
          "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity z-10 flex items-center justify-center",
        button_next:
          "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity z-10 flex items-center justify-center",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex justify-between",
        weekday:
          "text-neutral-400 rounded-md w-9 font-medium text-[0.7rem] uppercase tracking-tighter",
        week: "flex w-full mt-2 justify-between",
        day: "h-9 w-9 p-0 font-normal relative flex items-center justify-center",
        day_button: cn(
          "h-8 w-8 p-0 font-normal rounded-full transition-all duration-200",
          "hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center",
        ),
        selected:
          "bg-[#FFB800] !text-black font-bold hover:bg-[#FFB800] focus:bg-[#FFB800]",
        today: "text-[#FFB800] font-black underline underline-offset-4",
        outside: "text-neutral-300 opacity-50",
        disabled: "text-neutral-300 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
      }}
      modifiers={modifiers}
      modifiersClassNames={{
        hasEvent:
          "after:content-[''] after:absolute after:bottom-[2px] after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#FFB800] after:rounded-full",
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
