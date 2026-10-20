"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

export const InfiniteMovingCards = ({
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  children,
}: {
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  children: React.ReactNode;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const [start, setStart] = useState(false);
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const copies = Array.from(scroller.children).map((item) => {
      const copy = item.cloneNode(true);
      scroller.appendChild(copy);
      return copy;
    });
    setStart(true);
    return () => copies.forEach((copy) => scroller.removeChild(copy));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.setProperty(
      "--animation-direction", direction === "left" ? "forwards" : "reverse"
    );
    container.style.setProperty(
      "--animation-duration", speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s"
    );
  }, [direction, speed]);
  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 group max-w-7xl overflow-hidden  [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]"
      )}
    >
      <div
        ref={scrollerRef}
        className={cn(
          " flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap",
          start && "animate-scroll [animation-play-state:running]",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
      >
        {children}
      </div>
    </div>
  );
};
