/* Isolated component rendering with synthetic data. No Next server, DB, OAuth or network.
 * Run from repository root: node docs/audit-2026-10-20/diagnostics/ui-render-audit.cjs
 * These assertions document the current defects, not the desired requirements.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');

const root = process.cwd();
const output = path.join(root, 'docs/audit-2026-10-20/evidence/ui-render');
fs.mkdirSync(output, { recursive: true });
const fixture = {
  id: 'audit-synthetic-event', title: 'AUDIT_SYNTHETIC_EVENT_TITLE',
  description: 'AUDIT_SYNTHETIC_PRIVATE_DESCRIPTION',
  imageUrl: '/audit-synthetic-event.png', date: '2026-11-01', time: '19:00',
  status: 'planned', isFree: false, price: '100', childPrice: '40',
  isRegistrationClosed: false,
};
const eventItem = { event: fixture, category: null };
const noop = () => null;
const Link = ({ children, href, ...props }) => React.createElement('a', { ...props, href }, children);
const Image = ({ src, alt, width, height, className }) => React.createElement('img', { src, alt, width, height, className });
const flowButton = (kind) => function FlowButton({ children }) {
  return React.createElement('span', { 'data-audit-clerk-flow': kind }, children);
};
const motion = new Proxy({}, { get: (_, tag) => (props) => {
  const cleaned = { ...props };
  for (const key of ['initial', 'animate', 'exit', 'transition', 'whileHover', 'whileTap', 'layout', 'layoutId', 'variants', 'viewport', 'whileInView', 'onHoverStart', 'onHoverEnd']) delete cleaned[key];
  return React.createElement(tag, cleaned, props.children);
} });
const metadata = { synthetic: true, checks: [], limitations: [
  'Component render with injected synthetic data. This is not Next SSR, hydration, RSC, OAuth or an E2E test.',
  'Animation, navigation, Clerk SDK widgets and unrelated homepage sections are mocked.',
  'Mobile drawer-open render forces initial useState; no click or browser viewport was exercised.',
] };

function loader({ openMobile = false } = {}) {
  const cache = new Map();
  let firstState = true;
  const mockedReact = openMobile ? { ...React, useState(initial) {
    const value = firstState ? true : initial;
    firstState = false;
    return React.useState(value);
  } } : React;
  const mocks = {
    react: mockedReact,
    'next/link': { __esModule: true, default: Link },
    'next/image': { __esModule: true, default: Image },
    'next-view-transitions': { Link },
    'next/navigation': { usePathname: () => '/', useRouter: () => ({ push() {}, refresh() {} }), notFound: () => { throw new Error('notFound'); } },
    '@clerk/nextjs/server': { auth: async () => ({ userId: null }) },
    '@clerk/nextjs': { useAuth: () => ({ isSignedIn: false }), useClerk: () => ({}), SignInButton: flowButton('SignIn'), SignUpButton: flowButton('SignUp'), UserButton: noop },
    'framer-motion': { motion, AnimatePresence: ({ children }) => children, useScroll: () => ({ scrollY: {} }), useMotionValueEvent() {} },
    '@/actions/event': { getPublicEventsPaginated: async () => ({ events: [eventItem], hasMore: false }), getEventById: async () => fixture, checkRegistration: async () => false, getUserFamilyData: async () => null, registerForEvent: async () => { throw new Error('Mutation forbidden in audit'); } },
    '@/actions/news': { getPublicNews: async () => [], getNavbarNewsData: async () => ({ latestArticle: null, categories: [] }) },
    '@/actions/video': { getVideos: async () => [] },
    '@/actions/user': { completeUserProfile: async () => { throw new Error('Mutation forbidden in audit'); } },
    '@/components/background': { Background: noop },
    '@/components/features': { Features: noop },
    '@/components/grid-features': { GridFeatures: noop },
    '@/components/cta': { CTA: noop },
    '@/components/sections/service-section': { ServicesSection: noop },
    '@/components/mode-toggle': { ModeToggle: noop },
    '../mode-toggle': { ModeToggle: noop },
  };
  function load(filename) {
    const full = path.resolve(root, filename);
    if (cache.has(full)) return cache.get(full).exports;
    const sourceModule = { exports: {} }; cache.set(full, sourceModule);
    const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      fileName: full,
    }).outputText;
    function localRequire(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('@/') || name.startsWith('.')) {
        const stem = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(full), name);
        const found = [stem, stem + '.ts', stem + '.tsx', path.join(stem, 'index.ts'), path.join(stem, 'index.tsx')].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
        if (found) return load(found);
      }
      return require(name);
    }
    const context = { module: sourceModule, exports: sourceModule.exports, require: localRequire, console, process: { env: {} }, URL, URLSearchParams, setTimeout, clearTimeout, setInterval, clearInterval };
    vm.runInNewContext(code, context, { filename: full });
    return sourceModule.exports;
  }
  return load;
}
function save(name, element) {
  const html = renderToStaticMarkup(element);
  fs.writeFileSync(path.join(output, name + '.html'), html);
  return html;
}
function check(name, predicate, observation) { assert.ok(predicate, name); metadata.checks.push({ name, result: 'PASS (current behavior reproduced)', observation }); }

(async () => {
  const load = loader();
  const Home = load('app/(marketing)/page.tsx').default;
  const home = save('home-guest', await Home());
  check('Guest Home contains event title before hydration', home.includes(fixture.title), 'Real Home/Hero/UpcomingEvents with synthetic action result.');
  check('Guest Home contains upcoming-events heading', home.includes('Ближайшие события'), 'No guest branch removes the section.');
  check('Guest Home contains event image', home.includes(fixture.imageUrl), 'Image is present in component HTML.');

  const SingleEventClient = load('components/events/single-event-client.tsx').default;
  const guestEvent = save('event-guest', React.createElement(SingleEventClient, { eventData: fixture, userId: null }));
  check('Guest event renders old one-button copy', guestEvent.includes('Один шаг до регистрации') && guestEvent.includes('Продолжить с Google'), 'New two-button text is absent.');
  check('Guest event omits visible description', !guestEvent.includes(fixture.description), 'The guest component body does gate visible description.');
  check('Guest event includes image source', guestEvent.includes(fixture.imageUrl), 'CSS blur does not remove the image URL.');
  const pageModule = load('app/(marketing)/events/[id]/page.tsx');
  const element = await pageModule.default({ params: Promise.resolve({ id: fixture.id }) });
  const pageMetadata = await pageModule.generateMetadata({ params: Promise.resolve({ id: fixture.id }) });
  fs.writeFileSync(path.join(output, 'event-client-props.json'), JSON.stringify(element.props, null, 2));
  fs.writeFileSync(path.join(output, 'event-metadata.json'), JSON.stringify(pageMetadata, null, 2));
  check('Guest page passes full event description to client boundary', element.props.eventData.description === fixture.description, 'This inspects React element props, not a captured Next RSC response.');
  check('Guest event metadata includes full description', pageMetadata.description === fixture.description, 'Real generateMetadata with synthetic getEventById result.');

  const { NavBar } = load('components/navbar/index.tsx');
  const nav = save('navbar-guest', await NavBar());
  check('Guest navbar includes event menu', nav.includes('Мероприятия') && nav.includes('Menorah Kids'), 'Desktop menu is unconditional; mobile is present as a closed drawer control.');
  check('Desktop registration opens Clerk SignUp', nav.includes('data-audit-clerk-flow="SignUp"'), 'Mock exposes selected authored SDK component, not real Google configuration.');
  const mobileLoad = loader({ openMobile: true });
  const MobileNavbar = mobileLoad('components/navbar/mobile-navbar.tsx').MobileNavbar;
  const mobile = save('navbar-mobile-open-guest', React.createElement(MobileNavbar, { navItems: [{ title: 'Мероприятия', link: '/events' }] }));
  check('Open guest mobile drawer has registration but no sign-in', mobile.includes('Регистрация') && !mobile.includes('Войти'), 'Forced component state, not user interaction.');

  const OnboardingForm = load('components/dashboard/main/onboarding-form.tsx').default;
  const onboarding = save('onboarding-initial', React.createElement(OnboardingForm, { userId: 'audit-synthetic-user' }));
  check('Onboarding initially shows unrelated full fields', onboarding.includes('name="firstName"') && onboarding.includes('name="city"') && onboarding.includes('name="jewishStatus"'), 'No filtering question is selected on the initial render.');
  check('Onboarding lacks gender field and required filter copy', !onboarding.includes('name="gender"') && !onboarding.includes('Пожалуйста, укажите Вашу связь с еврейством'), 'Absence in initial HTML plus code inspection.');
  const MyEventsClient = load('components/dashboard/events/my-events-client.tsx').default;
  const paidTicket = save('paid-ticket', React.createElement(MyEventsClient, { myEvents: [{ event: fixture, participant: { id: 'audit-synthetic-ticket', status: 'paid' } }], myKidsApps: [] }));
  check('Paid ticket renders waiting badge', paidTicket.includes('Ожидает') && !paidTicket.includes('Подтверждено'), 'Real StatusBadge invoked through MyEventsClient with synthetic paid status.');
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(metadata, null, 2));
  console.log(JSON.stringify({ scope: 'isolated synthetic component render', assertions: metadata.checks.length, passed: metadata.checks.length, output: path.relative(root, output), limitations: metadata.limitations }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
