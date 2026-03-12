// heading.tsx
import { cn } from "@/lib/utils";
import React from "react";
import Balancer from "react-wrap-balancer";

export const Heading = ({
  className,
  as: Tag = "h2",
  children,
  size = "md",
  ...props
}: any) => {
  const sizeVariants = {
    sm: "text-xl md:text-2xl",
    md: "text-3xl md:text-5xl",
    xl: "text-4xl md:text-6xl",
    "2xl": "text-5xl md:text-7xl",
  };

  return (
    <Tag
      className={cn(
        "leading-tight max-w-5xl mx-auto text-center tracking-tight font-semibold text-neutral-900",
        sizeVariants[size as keyof typeof sizeVariants],
        className,
      )}
      {...props}
    >
      <Balancer>{children}</Balancer>
    </Tag>
  );
};

// subheading.tsx
export const Subheading = ({
  className,
  as: Tag = "h2",
  children,
  ...props
}: any) => {
  return (
    <Tag
      className={cn(
        "text-sm md:text-base max-w-4xl my-4 text-neutral-500 font-normal leading-relaxed",
        className,
      )}
      {...props}
    >
      <Balancer>{children}</Balancer>
    </Tag>
  );
};

// grid-lines.tsx
// 🚀 Если styles.common.module.css содержал только цвета, проще использовать Tailwind
export const GridLineHorizontal = ({ className, ...props }: any) => (
  <div
    className={cn("absolute h-[1px] bg-neutral-200/50 w-full", className)}
    {...props}
  />
);

export const GridLineVertical = ({ className, ...props }: any) => (
  <div
    className={cn("absolute w-[1px] bg-neutral-200/50 h-full", className)}
    {...props}
  />
);
