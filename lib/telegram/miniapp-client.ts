"use client";
// One browser bridge. Raw initData is read only when sending bootstrap; never persisted.
type Insets = { top: number; bottom: number; left: number; right: number };
type TelegramEvent = "themeChanged" | "viewportChanged" | "safeAreaChanged" | "contentSafeAreaChanged" | "activated" | "deactivated" | "fullscreenChanged";
interface TelegramWebApp {
  openLink?: (url: string) => void;
  initData: string; platform: string; version: string; colorScheme: string; themeParams: Record<string, string>;
  viewportStableHeight?: number; safeAreaInset?: Insets; contentSafeAreaInset?: Insets; isActive?: boolean;
  ready(): void; expand(): void; isVersionAtLeast?(version: string): boolean;
  setBackgroundColor?(color: string): void; setHeaderColor?(color: string): void; setBottomBarColor?(color: string): void;
  onEvent(event: TelegramEvent, handler: () => void): void; offEvent(event: TelegramEvent, handler: () => void): void;
  BackButton?: { show(): void; hide(): void; onClick(fn: () => void): void; offClick(fn: () => void): void };
}
declare global { interface Window { Telegram?: { WebApp?: TelegramWebApp } } }
const SDK_ID = "menorah-telegram-sdk";
export async function loadTelegramWebApp(signal: AbortSignal): Promise<TelegramWebApp | null> {
  if (window.Telegram?.WebApp) return window.Telegram.WebApp;
  return new Promise((resolve, reject) => {
    let script = document.getElementById(SDK_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script"); script.id = SDK_ID;
      script.src = "https://telegram.org/js/telegram-web-app.js?64"; script.async = true;
      document.head.append(script);
    }
    const cleanup = () => { clearTimeout(timer); script?.removeEventListener("load", loaded); script?.removeEventListener("error", failed); signal.removeEventListener("abort", aborted); };
    const loaded = () => { cleanup(); resolve(window.Telegram?.WebApp ?? null); };
    const failed = () => { cleanup(); script?.remove(); resolve(null); };
    const aborted = () => { cleanup(); reject(new DOMException("Aborted", "AbortError")); };
    const timer = setTimeout(failed, 10000);
    script.addEventListener("load", loaded, { once: true }); script.addEventListener("error", failed, { once: true });
    signal.addEventListener("abort", aborted, { once: true });
    if (signal.aborted) aborted();
  });
}

export interface MiniAppBridgeState { platform: string; version: string; colorScheme: string;
  themeParams: Record<string, string>; viewportStableHeight?: number; safeAreaInset?: Insets; contentSafeAreaInset?: Insets; active: boolean }
const events: TelegramEvent[] = ["themeChanged", "viewportChanged", "safeAreaChanged", "contentSafeAreaChanged", "activated", "deactivated", "fullscreenChanged"];
const safeNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 20000;
export function connectMiniAppBridge(app: TelegramWebApp, element: HTMLElement, onState: (state: MiniAppBridgeState) => void) {
  const changed = new Set<string>();
  let backCleanup: (() => void) | undefined;
  function set(name: string, value: number) { element.style.setProperty(name, `${value}px`); changed.add(name); }
  function brandChrome() {
    try {
      if (app.isVersionAtLeast?.("6.1")) {
        app.setBackgroundColor?.("#f8f7f3");
        app.setHeaderColor?.(app.isVersionAtLeast("6.9") ? "#f8f7f3" : "bg_color");
      }
      if (app.isVersionAtLeast?.("7.10")) app.setBottomBarColor?.("#ffffff");
    } catch { /* Older Telegram clients may expose unsupported methods. UI remains usable. */ }
  }
  function update() {
    if (safeNumber(app.viewportStableHeight) && app.viewportStableHeight! > 0) set("--menorah-viewport-height", app.viewportStableHeight!);
    for (const [prefix, area] of [["safe", app.safeAreaInset], ["content-safe", app.contentSafeAreaInset]] as const) {
      for (const side of ["top", "bottom", "left", "right"] as const) {
        if (area && safeNumber(area[side])) set(`--tg-${prefix}-${side}`, area[side]);
      }
    }
    brandChrome(); onState({ platform: app.platform, version: app.version, colorScheme: app.colorScheme,
      themeParams: { ...app.themeParams }, viewportStableHeight: app.viewportStableHeight,
      safeAreaInset: app.safeAreaInset, contentSafeAreaInset: app.contentSafeAreaInset, active: app.isActive !== false });
  }
  const subscriptions = events.map(event => {
    const handler = () => update(); app.onEvent(event, handler); return { event, handler };
  });
  try { app.ready(); app.expand(); } catch { /* Browser/old SDK fallback. */ }
  update();
  return { rawInitData: () => app.initData,
    openLink(url: string) {
      const target = new URL(url);
      if (target.protocol !== "https:") throw new Error("Invalid link");
      if (app.openLink) app.openLink(target.toString());
      else window.open(target.toString(), "_blank", "noopener,noreferrer");
    },
    back(handler: (() => void) | null) {
      backCleanup?.();
      const button = app.BackButton;
      if (!button || !app.isVersionAtLeast?.("6.1")) return () => {};
      if (!handler) { button.hide(); return () => {}; }
      button.onClick(handler); button.show();
      let cleaned = false;
      const cleanup = () => { if (cleaned) return; cleaned = true; button.offClick(handler); button.hide();
        if (backCleanup === cleanup) backCleanup = undefined; };
      backCleanup = cleanup;
      return cleanup;
    },
    dispose() { backCleanup?.(); subscriptions.forEach(({ event, handler }) => app.offEvent(event, handler));
      changed.forEach(name => element.style.removeProperty(name)); app.BackButton?.hide(); },
  };
}
export type MiniAppBridge = ReturnType<typeof connectMiniAppBridge>;

export class MiniAppRequestError extends Error {
  constructor(public readonly status: number, public readonly code: string) { super(code); }
}
export async function miniAppRequest<T>(path: string, options: { body?: unknown; tag?: string; signal?: AbortSignal } = {}) {
  const response = await fetch(`/api/telegram/miniapp/${path}`, { method: options.body === undefined ? "GET" : "POST",
    credentials: "same-origin", cache: "no-store", signal: options.signal,
    headers: { ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}), ...(options.tag ? { "If-Match": options.tag } : {}) },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}) });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new MiniAppRequestError(response.status, data.error || "generic");
  return { data: data as T, tag: response.headers.get("etag") ?? undefined };
}
