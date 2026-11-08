"use client";
import { useEffect, useRef } from "react";

/** Reveal a requested section once it is rendered, without stealing scroll on later edits. */
export function useSectionReveal(ready: boolean, key = "") {
  const target = useRef<HTMLDivElement>(null);
  const revealed = useRef(false);
  useEffect(() => {
    revealed.current = false;
  }, [key]);
  useEffect(() => {
    if (!ready || revealed.current) return;
    const frame = requestAnimationFrame(() => {
      if (!target.current) return;
      revealed.current = true;
      target.current.scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, key]);
  return target;
}
