import { cn } from "@/lib/utils";
import type { MotionProps } from "framer-motion";
import React from "react";
import Balancer from "react-wrap-balancer";

type SubheadingProps = {
  className?: string;
  as?: React.ElementType;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLHeadingElement> &
  MotionProps;

export const Subheading = ({
  className,
  as: Tag = "h2",
  children,
  ...props
}: SubheadingProps) => {
  return (
    <Tag
      className={cn(
        "text-sm md:text-base max-w-4xl text-left my-4 mx-auto",
        "text-muted text-center font-normal dark:text-muted-dark",
        className,
      )}
      {...props}
    >
      <Balancer>{children}</Balancer>
    </Tag>
  );
};
