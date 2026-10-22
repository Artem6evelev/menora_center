"use client";
/** Fixed names only. No account, event, family or URL data and no console/telemetry output. */
export function markMiniApp(name: "sdk-ready" | "start-request" | "start-response" | "ready" | "home-content") {
  if (typeof performance !== "undefined") performance.mark(`miniapp:${name}`);
}
