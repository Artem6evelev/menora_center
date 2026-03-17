import { cn } from "@/lib/utils";
import { MotionProps } from "framer-motion";
import React from "react";
import Balancer from "react-wrap-balancer";

// Снова используем type + Omit для решения конфликта
type SubheadingProps = {
  className?: string;
  as?: any;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
} & Omit<
  React.HTMLAttributes<HTMLElement>,
  "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
> &
  MotionProps;

export const Subheading = ({
  className,
  as: Tag = "h3",
  children,
  size = "md",
  ...props
}: SubheadingProps) => {
  const sizeVariants = {
    sm: "text-sm md:text-base",
    md: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
    xl: "text-xl md:text-2xl",
  };

  return (
    <Tag
      className={cn(
        "max-w-3xl mx-auto text-center tracking-tight text-neutral-500 dark:text-neutral-400 font-medium",
        sizeVariants[size as keyof typeof sizeVariants] || sizeVariants.md,
        className,
      )}
      {...props}
    >
      <Balancer>{children}</Balancer>
    </Tag>
  );
};
