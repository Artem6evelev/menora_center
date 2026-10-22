"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LogOut,
  MessageCircle,
  UserRound,
  ArrowRight,
  HeartHandshake,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { MiniAppHeader, WelcomeCard, ProfileStatusCard, ActionCard, BottomNav, EventSkeleton } from "./ui";
import { EventListSection } from "./event-list-section";
import { EventEntry } from "./event-entry";
import { useMiniAppFocus } from "./use-miniapp-focus";
import type { MiniAppLaunch } from "@/lib/telegram/event-launch";
import { miniAppUiCopy } from "@/lib/telegram/miniapp-ui-copy";
import { Ticket } from "lucide-react";
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
      <p>{copy.loading}</p>
      <EventSkeleton label={copy.loading} />
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
      <div className="miniapp-form-actions"><button
        type="submit"
        className="miniapp-primary w-full"
        disabled={
          pending || !affiliation || (affiliation !== "none" && !gender)
        }
      >
        {pending ? copy.saving : copy.next}
        <ArrowRight size={18} aria-hidden="true" className="rtl:rotate-180" />
      </button></div>
    </form>
  );
}

export default function MiniApp({ preview = false }: { preview?: boolean }) {
  const root = useRef<HTMLDivElement>(null),
    bridge = useRef<MiniAppBridge | null>(null),
    tag = useRef<string>();
  const nestedBack = useRef<(() => void) | null>(null);
  useMiniAppFocus(root);
  const onNested = useCallback((handler: (() => void) | null) => {
    nestedBack.current = handler;
  }, []);
  const [launchEvent, setLaunchEvent] = useState<MiniAppLaunch["event"]>(null);
  const [entryGate, setEntryGate] = useState(false), [onboardingStarted, setOnboardingStarted] = useState(false);
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
    screen = launchEvent && !onboardingStarted && data?.summary.nextStep !== "home" && data?.summary.nextStep !== "resources" ? "entry" : view ?? data?.summary.nextStep;
  const uiCopy = miniAppUiCopy[language];
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
        setLaunchEvent(null);
        setEntryGate(false);
        setOnboardingStarted(false);
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
          const params = new URL(window.location.href).searchParams;
          const hasLaunch = params.has("event") || params.has("campaign") || new URLSearchParams(bridge.current?.rawInitData()).has("start_param");
          let launch: MiniAppLaunch["event"] = null;
          if (hasLaunch && result.data.summary.nextStep !== "resources") {
            const query = new URLSearchParams();
            for (const key of ["event", "campaign"]) if (params.get(key)) query.set(key, params.get(key)!);
            const resolved = await miniAppRequest<MiniAppLaunch>(`launch?${query}`, { signal: controller.signal });
            launch = resolved.data.event;
            if (launch) {
              const url = new URL(window.location.href);
              url.searchParams.set("event", launch.id);
              window.history.replaceState(window.history.state, "", url);
            }
          }
          if (controller.signal.aborted || sequence !== bootSequence.current) return;
          accept(result);
          setLaunchEvent(launch);
          setInitialEvent(launch?.id);
          setView(result.data.summary.nextStep === "home" ? (launch || params.get("view") === "events" ? "events" : null) : null);
          if (!launch && (params.has("event") || (params.get("campaign") ?? new URLSearchParams(bridge.current?.rawInitData()).get("start_param") ?? "").startsWith("event_")) && result.data.summary.nextStep !== "resources") setActionError("event_unavailable");
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
  const navigate = useCallback(
    (next: "profile" | "filter" | "events" | "registrations" | null) => {
      if (busy || (dirty && !window.confirm(copy.unsaved))) return;
      // Editing/backtracking inside onboarding must retain the ad destination.
      if (!launchEvent || data?.summary.nextStep === "home" ||
        (next !== "filter" && next !== "profile" && next !== null)) {
        setInitialEvent(undefined);
        setLaunchEvent(null);
      }
      setDirty(false);
      setView(next);
      setSaved(false);
      setActionError("");
      window.scrollTo({ top: 0, behavior: "instant" });
    },
    [busy, dirty, copy.unsaved, launchEvent, data?.summary.nextStep],
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
      if (launchEvent && result.data.summary.nextStep === "home") { setInitialEvent(launchEvent.id); setView("events"); }
      else setView(null);
      setSaved(!filterOnly || !!launchEvent && result.data.summary.nextStep === "home");
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
        <MiniAppHeader language={language} onLanguage={value => { languageChosen.current = true; setLanguage(value); }} />
        {preview && <p className="miniapp-preview">{copy.preview}</p>}
        <main className="miniapp-content miniapp-enter" key={status === "ready" ? screen : status}>
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
          ) : data && screen === "entry" && launchEvent ? (
            <><WelcomeCard language={language} /><EventEntry event={launchEvent} language={language} gate={entryGate} onRegister={() => setEntryGate(true)} onContinue={() => { setOnboardingStarted(true); window.scrollTo({ top: 0, behavior: "instant" }); }} /></>
          ) : data && screen === "home" ? (
            <>
              <WelcomeCard language={language} firstName={data.profile.firstName} />
              <EventListSection language={language} onSelect={id => { setInitialEvent(id); setView("events"); window.scrollTo({ top: 0, behavior: "instant" }); }} onAll={() => navigate("events")} />
              {saved && <p role="status" className="miniapp-success">{copy.saved}</p>}
              <ProfileStatusCard language={language} childrenAllowed={data.permissions.canEditChildren} />
              <div className="miniapp-actions">
                <ActionCard icon={UserRound} onClick={() => navigate("profile")}>{copy.profile}</ActionCard>
                <ActionCard icon={Ticket} onClick={() => navigate("registrations")}>{eventCopy[language].registrations}</ActionCard>
              </div>
              <Subscription language={language} />
              <ActionCard icon={MessageCircle} href={contactUrl}>{copy.contact}<span className="sr-only">{copy.external}</span></ActionCard>
              <button className="miniapp-text-action self-start" disabled={busy} onClick={() => void logout()}><LogOut size={17} aria-hidden="true" />{copy.logout}</button>
            </>
          ) : data && (screen === "events" || screen === "registrations") ? (
            <>
            <p className="miniapp-helper">{uiCopy.identity}</p>
            {saved && launchEvent && <p role="status" className="miniapp-success" data-onboarding-complete>{uiCopy.ready}</p>}
            <MiniAppEvents
              key={screen}
              initialEvent={initialEvent}
              language={language}
              mode={screen}
              onNested={onNested}
              openPayment={(url) => bridge.current?.openLink(url)}
              onProfileChanged={refreshProfile}
            />
            </>
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
                {data.summary.nextStep !== "home" && screen !== "resources" && <p className="miniapp-helper">{uiCopy.identity}</p>}
                <p className="miniapp-eyebrow">
                  {screen === "filter"
                    ? uiCopy.step1
                    : screen === "profile"
                      ? data.summary.nextStep === "home" ? copy.stepProfile : uiCopy.step2
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
              {actionError === "event_unavailable" ? uiCopy.unavailable : copy.errors[actionError as keyof typeof copy.errors] ?? copy.errors.generic}
            </p>
          )}
        </main>
        {status === "ready" && data?.summary.nextStep === "home" && (
          <BottomNav language={language} view={view} navigate={navigate} />
        )}
      </div>
    </div>
  );
}
