"use client";
import { useEffect, type RefObject } from "react";

/** Keep the focused editor above sticky controls when the WebView keyboard
 * changes the visible viewport. Geometry only; no input values are read. */
export function useMiniAppFocus(root: RefObject<HTMLElement>) {
  useEffect(() => {
    let frame = 0;
    const align = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const input = document.activeElement;
        if (!(input instanceof HTMLElement) || !root.current?.contains(input) ||
          !input.matches('input:not([type="radio"]):not([type="checkbox"]), textarea, select')) return;
        const viewport = window.visualViewport;
        const top = viewport?.offsetTop ?? 0;
        let bottom = Math.min(innerHeight, top + (viewport?.height ?? innerHeight));
        root.current.querySelectorAll(".miniapp-form-actions, .miniapp-nav").forEach(control => {
          const bounds = control.getBoundingClientRect();
          if (bounds.height && bounds.top > top && bounds.top < bottom) bottom = bounds.top;
        });
        const bounds = input.getBoundingClientRect();
        if (bottom - top < bounds.height + 32) return;
        if (bounds.top < top + 12 || bounds.bottom > bottom - 12) {
          window.scrollBy({ top: bounds.top - (top + (bottom - top - bounds.height) / 2), behavior: "instant" });
        }
      });
    };
    const element = root.current, viewport = window.visualViewport;
    element?.addEventListener("focusin", align);
    window.addEventListener("resize", align);
    viewport?.addEventListener("resize", align);
    return () => {
      cancelAnimationFrame(frame);
      element?.removeEventListener("focusin", align);
      window.removeEventListener("resize", align);
      viewport?.removeEventListener("resize", align);
    };
  }, [root]);
}
