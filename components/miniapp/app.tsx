"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Home as House,
  LogOut,
  MessageCircle,
  UserRound,
  ArrowRight,
  Check,
  HeartHandshake,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import FilterFields from "@/components/community/filter-fields";
import ResourceMessage from "@/components/community/resource-message";
import type { Affiliation, Gender } from "@/lib/community/policy";
import type { MiniAppProfileData } from "@/lib/telegram/miniapp-profile";
import {
  miniAppDictionaries,
  miniAppLanguage,
  type MiniAppLanguage,
  type MiniAppCopy,
} from "@/lib/telegram/miniapp-i18n";
import {
  connectMiniAppBridge,
  loadTelegramWebApp,
  miniAppRequest,
  MiniAppRequestError,
  type MiniAppBridge,
} from "@/lib/telegram/miniapp-client";
import MiniAppEvents from "./events";
import { eventCopy } from "@/lib/telegram/event-copy";
import Subscription from "./subscription";
import MiniAppProfileForm, { requestMessage } from "./profile-form";

// Existing Menorah contact destination from the website contact page.
const contactUrl = "https://t.me/menorah_center";
type ProfileResponse = MiniAppProfileData & { ok: true };

export function MiniAppSplash({
  copy = miniAppDictionaries.ru,
}: {
  copy?: MiniAppCopy;
}) {
  return (
    <div className="miniapp-splash" role="status">
      <Logo linked={false} appearance="light" />
      <div className="miniapp-spinner" aria-hidden="true" />
      <p>{copy.loading}</p>
    </div>
  );
}

function FilterForm({
  data,
  copy,
  onSave,
}: {
  data: MiniAppProfileData;
  copy: MiniAppCopy;
  onSave: (input: unknown) => Promise<void>;
}) {
  const [affiliation, setAffiliation] = useState<Affiliation | "">(
    data.summary.filterCompleted ? (data.profile.affiliation ?? "") : "",
  );
  const [gender, setGender] = useState<Gender | "">(
    data.summary.filterCompleted ? (data.profile.gender ?? "") : "",
  );
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await onSave({
        affiliation,
        ...(affiliation === "none" ? {} : { gender }),
      });
    } catch (failure) {
      setError(requestMessage(failure, copy));
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-6" data-miniapp-form="filter">
      <FilterFields
        affiliation={affiliation}
        gender={gender}
        copy={copy.filter}
        disabled={pending}
        onAffiliation={(value) => {
          setAffiliation(value);
          setError("");
        }}
        onGender={setGender}
      />
      {error && (
        <p role="alert" className="miniapp-error">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="miniapp-primary w-full"
        disabled={
          pending || !affiliation || (affiliation !== "none" && !gender)
        }
      >
        {pending ? copy.saving : copy.next}
        <ArrowRight size={18} aria-hidden="true" className="rtl:rotate-180" />
      </button>
    </form>
  );
}

export default function MiniApp({ preview = false }: { preview?: boolean }) {
  const root = useRef<HTMLDivElement>(null),
    bridge = useRef<MiniAppBridge | null>(null),
    tag = useRef<string>();
  const nestedBack = useRef<(() => void) | null>(null);
  const onNested = useCallback((handler: (() => void) | null) => {
    nestedBack.current = handler;
  }, []);
  const launchResolved = useRef(false);
  const [initialEvent, setInitialEvent] = useState<string>();
  const languageChosen = useRef(false),
    bootSequence = useRef(0);
  const [language, setLanguage] = useState<MiniAppLanguage>("ru"),
    [status, setStatus] = useState<
      "loading" | "ready" | "outside" | "error" | "logout"
    >("loading");
  const [data, setData] = useState<MiniAppProfileData | null>(null),
    [view, setView] = useState<
      "profile" | "filter" | "events" | "registrations" | null
    >(null);
  const [retry, setRetry] = useState(0),
    [bridgeVersion, setBridgeVersion] = useState(0),
    [dirty, setDirty] = useState(false);
  const [actionError, setActionError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  const copy = miniAppDictionaries[language],
    screen = view ?? data?.summary.nextStep;
  const accept = useCallback(
    (result: { data: ProfileResponse; tag?: string }) => {
      tag.current = result.tag;
      setData(result.data);
      if (!languageChosen.current && result.data.languageCode)
        setLanguage(miniAppLanguage(result.data.languageCode));
    },
    [],
  );
  const refreshProfile = useCallback(async () => {
    accept(await miniAppRequest<ProfileResponse>("profile"));
  }, [accept]);
  useEffect(() => {
    const previousLang = document.documentElement.lang,
      previousDir = document.documentElement.dir;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
    return () => {
      document.documentElement.lang = previousLang;
      document.documentElement.dir = previousDir;
    };
  }, [language]);
  useEffect(() => {
    const controller = new AbortController(),
      sequence = ++bootSequence.current;
    const timer = setTimeout(() => {
      void (async () => {
        launchResolved.current = false;
        setInitialEvent(undefined);
        setStatus("loading");
        setActionError("");
        setLanguage((previous) =>
          languageChosen.current
            ? previous
            : miniAppLanguage(navigator.language),
        );
        const app = await loadTelegramWebApp(controller.signal);
        if (controller.signal.aborted) return;
        if (!app?.initData) {
          setStatus("outside");
          return;
        }
        if (!root.current) return;
        bridge.current = connectMiniAppBridge(app, root.current, (state) => {
          if (root.current) {
            root.current.dataset.platform = state.platform;
            root.current.dataset.active = String(state.active);
          }
        });
        setBridgeVersion((previous) => previous + 1);
        try {
          await miniAppRequest("session", {
            body: { initData: bridge.current.rawInitData() },
            signal: controller.signal,
          });
        } catch (error) {
          if (!(error instanceof MiniAppRequestError) || error.status !== 401)
            throw error;
          await miniAppRequest("bootstrap", {
            body: { initData: bridge.current.rawInitData() },
            signal: controller.signal,
          });
        }
        const result = await miniAppRequest<ProfileResponse>("profile", {
          signal: controller.signal,
        });
        if (!controller.signal.aborted && sequence === bootSequence.current) {
          accept(result);
          setView(null);
          setStatus("ready");
        }
      })().catch((error) => {
        if (!controller.signal.aborted) {
          setActionError(
            error instanceof MiniAppRequestError ? error.code : "generic",
          );
          setStatus("error");
        }
      });
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
      bridge.current?.dispose();
      bridge.current = null;
    };
  }, [retry, accept]);
  useEffect(() => {
    if (
      status !== "ready" ||
      data?.summary.nextStep !== "home" ||
      launchResolved.current ||
      view
    )
      return;
    launchResolved.current = true;
    const requested = new URL(window.location.href).searchParams.get("event");
    if (requested && /^[A-Za-z0-9_-]{1,150}$/.test(requested)) {
      setInitialEvent(requested);
      setView("events");
      return;
    }
    if (
      !new URLSearchParams(bridge.current?.rawInitData()).has("start_param") &&
      !new URL(window.location.href).searchParams.has("campaign")
    )
      return;
    const controller = new AbortController();
    miniAppRequest<{ campaignEventId?: string }>("events", {
      signal: controller.signal,
    })
      .then(({ data: result }) => {
        if (result.campaignEventId) {
          setInitialEvent(result.campaignEventId);
          setView("events");
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [status, data?.summary.nextStep, view]);
  const navigate = useCallback(
    (next: "profile" | "filter" | "events" | "registrations" | null) => {
      if (busy || (dirty && !window.confirm(copy.unsaved))) return;
      setInitialEvent(undefined);
      setDirty(false);
      setView(next);
      setSaved(false);
      setActionError("");
      window.scrollTo({ top: 0, behavior: "instant" });
    },
    [busy, dirty, copy.unsaved],
  );
  const canGoBack = status === "ready" && !!view;
  useEffect(
    () =>
      bridge.current?.back(
        canGoBack
          ? () => {
              if (nestedBack.current) nestedBack.current();
              else navigate(null);
            }
          : null,
      ),
    [canGoBack, navigate, bridgeVersion],
  );
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  async function save(input: unknown, filterOnly: boolean) {
    setBusy(true);
    try {
      const persist = () =>
        miniAppRequest<ProfileResponse>(filterOnly ? "filter" : "profile", {
          body: input,
          tag: tag.current,
        });
      let result;
      try {
        result = await persist();
      } catch (error) {
        if (
          !(error instanceof MiniAppRequestError) ||
          error.status !== 401 ||
          !bridge.current
        )
          throw error;
        await miniAppRequest("bootstrap", {
          body: { initData: bridge.current.rawInitData() },
        });
        result = await persist();
      }
      accept(result);
      setDirty(false);
      setView(null);
      setSaved(!filterOnly);
      window.scrollTo({ top: 0, behavior: "instant" });
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (dirty && !window.confirm(copy.unsaved)) return;
    setBusy(true);
    setActionError("");
    try {
      await miniAppRequest("logout", { body: {} });
      setData(null);
      tag.current = undefined;
      setView(null);
      setDirty(false);
      setStatus("logout");
    } catch {
      setActionError("generic");
    } finally {
      setBusy(false);
    }
  }
  const title =
    screen === "filter"
      ? copy.filterTitle
      : screen === "profile"
        ? data?.summary.nextStep === "home"
          ? copy.editTitle
          : copy.profileTitle
        : copy.resourcesTitle;
  return (
    <div
      ref={root}
      className="miniapp"
      data-menorah-surface="miniapp"
      data-screen={status === "ready" ? screen : status}
      lang={language}
      dir={language === "he" ? "rtl" : "ltr"}
    >
      <div className="miniapp-frame">
        <header className="miniapp-header">
          <div className="miniapp-brand">
            <Logo linked={false} appearance="light" />
            <span className="miniapp-wordmark" dir="ltr" aria-hidden="true">
              Menorah<span>Center</span>
            </span>
          </div>
          <label className="miniapp-language">
            <span className="sr-only">{copy.language}</span>
            <select
              aria-label={copy.language}
              value={language}
              onChange={(event) => {
                languageChosen.current = true;
                setLanguage(event.target.value as MiniAppLanguage);
              }}
            >
              <option value="ru">RU</option>
              <option value="he">עב</option>
              <option value="en">EN</option>
            </select>
          </label>
        </header>
        {preview && <p className="miniapp-preview">{copy.preview}</p>}
        <main className="miniapp-content">
          {status === "loading" ? (
            <MiniAppSplash copy={copy} />
          ) : status === "outside" ||
            status === "error" ||
            status === "logout" ? (
            <section className="miniapp-panel miniapp-state">
              <div className="miniapp-emblem">
                <HeartHandshake size={30} aria-hidden="true" />
              </div>
              <h1>
                {status === "outside"
                  ? copy.openTitle
                  : status === "logout"
                    ? copy.loggedOut
                    : copy.errorTitle}
              </h1>
              {status !== "logout" && (
                <p className="miniapp-muted">
                  {status === "outside"
                    ? copy.openBody
                    : (copy.errors[actionError as keyof typeof copy.errors] ??
                      copy.errorBody)}
                </p>
              )}
              <button
                type="button"
                className="miniapp-primary"
                onClick={() => setRetry((previous) => previous + 1)}
              >
                {status === "logout" ? copy.loginAgain : copy.retry}
              </button>
              <a
                href={contactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="miniapp-text-action"
              >
                {copy.contact}
                <span className="sr-only">{copy.external}</span>
              </a>
            </section>
          ) : data && screen === "home" ? (
            <>
              <div className="miniapp-intro">
                <p className="miniapp-eyebrow">{copy.account}</p>
                <h1>
                  {copy.greeting}, <bdi>{data.profile.firstName}</bdi>{" "}
                  <span aria-hidden="true">👋</span>
                </h1>
                <p className="miniapp-muted">{copy.brand}</p>
              </div>
              {saved && (
                <p role="status" className="miniapp-success">
                  {copy.saved}
                </p>
              )}
              <section className="miniapp-panel miniapp-welcome">
                <HeartHandshake size={32} aria-hidden="true" />
                <h2>{copy.homeTitle}</h2>
                <p>{copy.homeBody}</p>
                <span className="miniapp-status">
                  <Check size={15} aria-hidden="true" />
                  {copy.status}
                </span>
              </section>
              <div className="miniapp-actions">
                <button
                  className="miniapp-action-card"
                  onClick={() => navigate("profile")}
                >
                  <span className="miniapp-emblem">
                    <UserRound size={22} aria-hidden="true" />
                  </span>
                  <span>{copy.profile}</span>
                  <ArrowRight
                    size={19}
                    aria-hidden="true"
                    className="ms-auto rtl:rotate-180"
                  />
                </button>
                <a
                  className="miniapp-action-card"
                  href={contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="miniapp-emblem">
                    <MessageCircle size={22} aria-hidden="true" />
                  </span>
                  <span>
                    {copy.contact}
                    <span className="sr-only">{copy.external}</span>
                  </span>
                  <ArrowRight
                    size={19}
                    aria-hidden="true"
                    className="ms-auto rtl:rotate-180"
                  />
                </a>
              </div>
              <button
                className="miniapp-text-action self-start"
                disabled={busy}
                onClick={() => void logout()}
              >
                <LogOut size={17} aria-hidden="true" />
                {copy.logout}
              </button>
              <button
                className="miniapp-primary w-full"
                onClick={() => navigate("events")}
              >
                {eventCopy[language].events}
              </button>
              <Subscription language={language} />
            </>
          ) : data && (screen === "events" || screen === "registrations") ? (
            <MiniAppEvents
              key={screen}
              initialEvent={initialEvent}
              language={language}
              mode={screen}
              onNested={onNested}
              openPayment={(url) => bridge.current?.openLink(url)}
              onProfileChanged={refreshProfile}
            />
          ) : data ? (
            <section className="miniapp-panel">
              {canGoBack && (
                <button
                  type="button"
                  className="miniapp-text-action mb-5"
                  disabled={busy}
                  onClick={() => navigate(null)}
                >
                  {copy.back}
                </button>
              )}
              <div className="miniapp-intro">
                <p className="miniapp-eyebrow">
                  {screen === "filter"
                    ? copy.stepFilter
                    : screen === "profile"
                      ? copy.stepProfile
                      : copy.brand}
                </p>
                <h1>{title}</h1>
                <p className="miniapp-muted">
                  {screen === "filter"
                    ? copy.filterIntro
                    : screen === "profile"
                      ? copy.profileIntro
                      : copy.resourcesIntro}
                </p>
              </div>
              {screen === "filter" ? (
                <FilterForm
                  data={data}
                  copy={copy}
                  onSave={(input) => save(input, true)}
                />
              ) : screen === "profile" ? (
                <>
                  <MiniAppProfileForm
                    data={data}
                    copy={copy}
                    onDirty={setDirty}
                    onSave={(input) => save(input, false)}
                  />
                  <button
                    type="button"
                    className="miniapp-text-action mt-5"
                    disabled={busy}
                    onClick={() => navigate("filter")}
                  >
                    {copy.changeFilter}
                  </button>
                </>
              ) : (
                <>
                  <ResourceMessage
                    paragraphs={copy.resourceParagraphs}
                    labels={copy.resourceLabels}
                    title={copy.resourcesLabel}
                    external={copy.external}
                  />
                  <a
                    href={contactUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="miniapp-primary mt-6"
                  >
                    {copy.contact}
                    <span className="sr-only">{copy.external}</span>
                  </a>
                  <div className="flex flex-wrap gap-4 mt-5">
                    <button
                      className="miniapp-text-action"
                      onClick={() => navigate("filter")}
                    >
                      {copy.changeFilter}
                    </button>
                    <button
                      className="miniapp-text-action"
                      disabled={busy}
                      onClick={() => void logout()}
                    >
                      {copy.logout}
                    </button>
                  </div>
                </>
              )}
            </section>
          ) : null}
          {status === "ready" && actionError && (
            <p role="alert" className="miniapp-error">
              {copy.errors[actionError as keyof typeof copy.errors] ??
                copy.errors.generic}
            </p>
          )}
        </main>
        {status === "ready" && data?.summary.nextStep === "home" && (
          <nav className="miniapp-nav" aria-label={copy.account}>
            <button
              type="button"
              aria-current={!view ? "page" : undefined}
              onClick={() => navigate(null)}
            >
              <House size={21} aria-hidden="true" />
              {copy.home}
            </button>
            <button
              type="button"
              aria-current={view === "events" ? "page" : undefined}
              onClick={() => navigate("events")}
            >
              {eventCopy[language].events}
            </button>
            <button
              type="button"
              aria-current={view === "registrations" ? "page" : undefined}
              onClick={() => navigate("registrations")}
            >
              {eventCopy[language].registrations}
            </button>
            <button
              type="button"
              aria-current={view === "profile" ? "page" : undefined}
              onClick={() => navigate("profile")}
            >
              <UserRound size={21} aria-hidden="true" />
              {copy.profile}
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
