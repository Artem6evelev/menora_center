# Целевые проверки фильтрации

Запуск из корня проекта. Тесты используют синтетические данные и mock Clerk/уведомления; они не являются настоящим Google OAuth/платёжным/browser E2E. Зависимости приложения и lockfile не обновлялись: установка дополнительной dev-зависимости встретила существующий peer conflict React/Clerk, поэтому test-only PostgreSQL/WASM установлен вне проекта.

```sh
npm install --prefix /tmp/menora-filter-test-runtime --save-exact --ignore-scripts --no-audit --no-fund @electric-sql/pglite@0.5.10
node tests/community/regression.cjs
node tests/community/render.cjs
npm run db:test
npm run typecheck
npm run lint
```

`COMMUNITY_TEST_RUNTIME` может указывать другую папку с `node_modules/@electric-sql/pglite`. Regression harness исполняет исходные TypeScript actions с настоящими SQL/транзакциями Drizzle, отсекает внешние imports/effects, проверяет совместимую миграцию на synthetic baseline и сохранение старых детей/оплат.

HTTP SSR/RSC стенд (Node >=22, нужен `process.getBuiltinModule`) создаётся отдельно. `.env*`, `.git`, `.next`, реальные данные не копируются. Fixture заменяет identity, БД, middleware и внешние сообщения **только в /tmp-копии**, создаёт собственные фиктивные env. Никогда не разворачивать эту копию как приложение.

```sh
node tests/community/http-fixture.cjs
cd /tmp/menora-filter-http
NODE_PATH=/tmp/menora-filter-test-runtime/node_modules NEXT_PUBLIC_APP_URL=http://127.0.0.1:3327 NEXT_PUBLIC_SUPABASE_URL=https://synthetic.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=synthetic npm run dev -- --hostname 127.0.0.1 --port 3327
```

Во втором терминале из корня исходного проекта:

```sh
node tests/community/http.cjs
```

`COMMUNITY_HTTP_FIXTURE` и `COMMUNITY_HTTP_URL` позволяют переопределить каталог/URL стенда. Identity-cookie `_community_fixture` имеет смысл исключительно в disposable-копии, в продукте обхода авторизации нет. Удаление `.next` при повторной проверке допустимо только внутри копии.

`tests/community/check-environment.cjs` теперь только read-only; прежний `--apply-current-environment` отклоняется до подключения. Для актуального metadata/ledger отчёта предусмотрен `scripts/production-database-readonly.cjs` (только READ ONLY transaction). Удалённые изменения — исключительно вручную владельцем через один `docs/production-readiness-2026-10-20/SUPABASE_MANUAL_MIGRATION.sql`.

Штатный `npm run lint` использует полный прямой ESLint с прежними правилами и Next/Core Web Vitals; исходники и исторические диагностические скрипты не исключаются. Результат исходной приёмки: exit0, 243 файла, 0 ошибок/30 предупреждений `no-img-element`. Typecheck проходит. Подробности и все пути предупреждений: `docs/implementation-2026-10-20/acceptance/REPORT.md`.

`npm run db:test` проверяет полную нативную Drizzle-цепочку на пустой PGlite, обновление старой synthetic схемы с сохранением данных, настоящий ledger, повторный no-op и отказы migration preflight. Результат8/8. `regression.cjs` дополнительно сохраняет прежнюю прямую SQL-проверку идемпотентности0004/0005; она сама по себе не доказывает native chain. [Процесс и внешние ограничения](../../docs/implementation-2026-10-20/acceptance/MIGRATIONS.md). `npm run db:migrate` не читает реальные env-файлы автоматически и не выполняет adoption смешанной истории.


Подготовка production-кандидата дополнительно:

```sh
node tests/community/production.cjs
node tests/community/build.cjs
```

Первый suite исполняет реальные actions/ручной SQL на PGlite, с injected identity/cookies и заблокированной доставкой. Второй запускает именно `npm run build` на текущей копии без реальных env/внешней БД. Актуальные числа и ограничения — в новом REPORT, старые результаты выше исторические.

`node tests/community/oauth-fixture.cjs` готовит `/tmp/menora-acceptance-oauth` и launcher `/tmp/menora-acceptance-oauth-launcher.cjs`: только реальные **TEST** Clerk keys из локального окружения в памяти, native PGlite, отключённые notifications/analytics. Не выводит ключи, не копирует env и не использует внешнюю БД. Запуск launcher поднимает **localhost:3330**, а не 127.0.0.1; для Clerk важен совпадающий origin. Реальный вход выполняется только разрешённым тестовым аккаунтом, секреты не передаются в чат. Это отдельный стенд от HTTP mock fixture3327.

Проверки страницы callback после `MENORAH_LOGIN_FIX.patch`:

```sh
npm install --prefix /tmp/menora-callback-test-runtime --ignore-scripts --no-audit --no-fund react@19.1.0 react-test-renderer@19.1.0
node tests/community/sso-callback.cjs
```

Версии временного renderer и React приложения должны совпадать; зависимости проекта не меняются. Набор исполняет установленный SDK и React lifecycle с подставленными ресурсом Clerk/URL, без настоящего OAuth. На старой странице воспроизводится незапуск callback при холодной загрузке SDK.

Шаг 2 identity layer: `node tests/community/identity-schema.cjs` проверяет SQL/ограничения/RLS/ACL, сохранность legacy-данных, повторное применение и моделируемое состояние после будущего merge на локальной PGlite. Это не Mini App auth/bootstrap и не merge service. `npm run db:test` проверяет штатную Drizzle-цепочку до `0009`; прежняя NOT NULL email-модель явно сохраняется в historical fixture до перехода к nullable email. `COMMUNITY_TEST_OUTPUT` задаёт папку результатов. Реальные env не загружаются и удалённые подключения не используются. Итог Шага 2: [REPORT](../../docs/miniapp-identity-v1/REPORT.md).

`callback-browser.cjs` проверяет только затронутые переходы на desktop/mobile: актуальный, старый и новый профили, повтор callback/reload, отсутствие исходного события и третью категорию. Подготовить отдельный стенд через `COMMUNITY_HTTP_FIXTURE=/tmp/menora-login-fix-http node tests/community/http-fixture.cjs`, запустить его на `http://127.0.0.1:3341` с синтетическими env из примера выше и выполнить `node tests/community/callback-browser.cjs`. Состояние фикстуры должно быть свежим; повторный запуск требует её перезапуска с новой локальной БД. `CALLBACK_BROWSER_BASE` позволяет выбрать другой локальный порт. Подставленная identity не доказывает настоящий Google callback.

`node tests/community/browser.cjs` — настоящий локальный Chromium/Playwright (runtime вне product dependencies: `/tmp/menora-browser-runtime/node_modules/playwright` или `COMMUNITY_BROWSER_RUNTIME`). Публичные сценарии на3330 используют реальный Clerk TEST; приватные на3327 явно используют mock identity и настоящие actions/SQL. Это не доказательство завершённого Google OAuth. Требуются оба изолированных стенда; они никогда не публикуются. Viewports1440/390/320 — эмуляция размеров, не физические устройства. `api/test-state` создаётся только в mock /tmp-копии и отсутствует в приложении.

## Telegram Mini App server auth (Step 3)

`node tests/community/miniapp-auth.cjs` uses synthetic env, production modules, real Node crypto,
NextResponse cookies and a disposable PGlite database with the native migration chain.
It never loads `.env`, calls Telegram/Clerk or connects to Supabase. `COMMUNITY_TEST_OUTPUT`
can override the default `docs/miniapp-auth-v1/evidence` output directory.
The existing PGlite runtime is selected with `COMMUNITY_TEST_RUNTIME` (default
`/tmp/menora-filter-test-runtime`). Concurrent calls share PGlite's serial scheduler;
an additional injected stale lookup exercises a real PostgreSQL unique violation,
transaction rollback and retry. This does not replace a race test on independent PostgreSQL connections.

To regenerate the unified Step 2+3 owner SQL without connecting to a database:
`node scripts/build-miniapp-manual-sql.cjs`. Historical `0009` is unchanged.

## Telegram Mini App UI (Step 4)

Только изолированная локальная копия, без `.env` проекта, реальной БД, Google и Bot API:

```sh
node tests/community/miniapp-ui-fixture.cjs
cd /tmp/menora-miniapp-ui
NODE_PATH=/tmp/menora-filter-test-runtime/node_modules npm run dev -- --hostname 127.0.0.1 --port 3342
```

Из корня исходного проекта:

```sh
node tests/community/miniapp-ui-browser.cjs
node tests/community/miniapp-ui-server.cjs
node tests/community/miniapp-ui-bridge.cjs
```

Browser suite сначала доказывает `isolated-pglite`, затем сбрасывает только эту синтетическую БД.
Она использует настоящие product routes/services, HMAC с отдельным синтетическим ключом,
HttpOnly sessions и SQL; Telegram JS/native API подставлены только через Playwright.
Это не real Telegram WebView. Обычная вкладка без adapter остаётся на экране открытия через Telegram.
Для ручной визуальной разработки: `node tests/community/miniapp-ui-preview.cjs` открывает headed Chromium
с синтетическим аккаунтом. Оба fixture/preview генератора отклоняют `NODE_ENV=production`;
preview дополнительно проверяет изолированную БД. Эти файлы не импортируются приложением и не попадают в release behavior.
`MENORAH_MINIAPP_PREVIEW=1` в development включает только заметную тестовую подпись, не identity или обход подписи.
Production игнорирует этот флаг и query params для входа.

После `node tests/community/build.cjs` production-копию можно запустить на loopback:3343 с синтетическими
или пустыми runtime Clerk keys; `node tests/community/miniapp-ui-production.cjs` проверяет обычный браузер,
отсутствие dev-входа и доступность общего публичного city directory без Clerk. Никакой remote DB там нет.

Существующие website browser suites используют ту же fixture с mock Clerk. Запускайте отдельной
когортой после завершения Mini App browser suite, без параллельного reset. Для чистой когорты перезапустите
только временный dev server, прогрейте нужные routes и выполните:

```sh
CALLBACK_BROWSER_BASE=http://127.0.0.1:3342 COMMUNITY_TEST_OUTPUT=docs/miniapp-ui-v1/evidence node tests/community/callback-browser.cjs
COMMUNITY_BROWSER_BASE=http://127.0.0.1:3342 COMMUNITY_HEADLESS=1 COMMUNITY_BROWSER_OUTPUT=docs/miniapp-ui-v1/evidence/website-spec-browser node tests/community/spec-browser.cjs
```

Evidence и границы: [REPORT](../../docs/miniapp-ui-v1/REPORT.md). Схема и SQL Шага 3 не изменялись.

## Telegram production release candidate

Release: [RELEASE.md](../../docs/production-candidate-telegram/RELEASE.md). All fixtures are local synthetic copies;
never deploy them. No Bot API call uses a real token in tests. Browser fixture hard-disables outbound Bot API.

```sh
npm install --prefix /tmp/menora-pg17-runtime --save-exact --ignore-scripts --no-audit --no-fund @electric-sql/pglite@0.3.10
COMMUNITY_TEST_OUTPUT=docs/production-candidate-telegram/evidence node tests/community/telegram-release.cjs
COMMUNITY_TEST_OUTPUT=docs/production-candidate-telegram/evidence node tests/community/telegram-tools.cjs
COMMUNITY_TEST_OUTPUT=docs/production-candidate-telegram/evidence node tests/community/telegram-migrations.cjs
NODE_PATH=/tmp/menora-filter-test-runtime/node_modules node tests/community/telegram-release-fixture.cjs
# In the generated /tmp/menora-miniapp-ui directory:
NODE_PATH=/tmp/menora-filter-test-runtime/node_modules npm run dev -- --port 3342 --hostname 127.0.0.1
# From the source repository, after the fixture is ready:
COMMUNITY_TEST_OUTPUT=docs/production-candidate-telegram/evidence node tests/community/telegram-release-browser.cjs
```

Run browser cohorts sequentially; restart only the temporary server between suites if necessary.
Current regression includes miniapp-auth, miniapp-ui-server, miniapp-ui-bridge, miniapp-ui-browser,
miniapp-ui-production (production build on 3343), identity-schema, migrations, regression, render,
production, spec-update, sso-callback, HTTP, callback-browser, spec-browser, telegram-bundle, and the three Telegram server/tool/migration suites.
`node tests/community/miniapp-onboarding-browser.cjs` runs against the same isolated fixture on3342,
sequentially with the other browser cohorts. It resets only the proven synthetic PGlite fixture.
RU/HE/EN first-save journeys remove/weaken/replace ETag and remove If-Match at the transport boundary;
the actual client, routes and SQL must advance giyur/male from filter to profile to home and retain data on reload.
An independent competing profile request must still return409 without losing unsaved UI input.
`miniapp-ui-server.cjs` also covers technical Telegram resync, exact body-version comparison,
legacy If-Match compatibility and cross-channel optimistic locking with the website Clerk writer.
The opaque `profileVersion` now travels with the JSON snapshot and write payload; numeric revisions remain server-owned.
`spec-browser` also exercises a denied late notification request after changing synthetic account.
The HTTP expectations now reflect the existing click-to-open child clarification and approved dashboard-events fallback.
`production.cjs` uses a real historical NOT NULL email baseline for the legacy SQL checks and the current unified manual SQL after identity migration.
Assertions were preserved, including rollback and rejection checks.

Historical `browser.cjs`, `targeted-browser.cjs`, `browser-review.cjs` are one-off artifacts for superseded form layouts;
their active journeys are covered by spec-browser/callback-browser. Remote diagnostic scripts (`check-environment`, `production-database-readonly`) are excluded under the local-only boundary. The historical `checkpoint.cjs` writes into an older report directory and is superseded here by the release manifest.

Independent PostgreSQL connections (temporary native cluster, optional local test runtime):

```sh
npm install --prefix /tmp/menora-native-postgres-runtime --save-exact --no-audit --no-fund embedded-postgres@18.4.0-beta.17
COMMUNITY_TEST_OUTPUT=docs/production-candidate-telegram/evidence node tests/community/telegram-native.cjs
```

The native runner reserves loopback port35432, creates a fresh `/tmp/menora-pg-*` cluster/database,
uses the real postgres-js pool with max10 connections, runs the release suite, stops the cluster and deletes its data.
It never accepts `DATABASE_URL`, never creates an OS user/service, and refuses to use an existing database.
Postinstall of the test-only runtime creates its packaged binary symlinks; no project dependency/lockfile changes.
The native suite verifies distinct backend PIDs, concurrent bootstrap/bot bootstrap, registration and worker idempotency.


## Truthful production adoption (0013)

`node scripts/build-adoption-artifacts.cjs` reproduces the real custom marker and all three self-contained owner SQL artifacts. `scripts/adoption-baseline.json` freezes the proven historical17 tuples, canonical release13 source hashes, schema contract, marker hash/when and owner-reported production baseline. Do not change historical migration bodies or ledger records to satisfy the guard. Canonical installs execute all migration bodies; legacy installs require explicit owner adoption before the ordinary runner is permitted.

```sh
COMMUNITY_TEST_OUTPUT=docs/production-candidate-telegram/evidence/adoption node tests/community/adoption-native.cjs
```

This starts disposable native PostgreSQL on loopback35433, accepts no external DATABASE_URL, uses independent connections, copies the ordinary project runner into a temporary folder, and generates the synthetic next migration only in that copy. Tests cover both histories, concurrent adoption, one-time future execution, ledger corruption, schema mismatch/rollback,111 synthetic legacy profiles,43 registrations, family/filter preservation, and repeat after modeled ownership merge. It stops/removes its cluster. The production fingerprint is an owner-provided anchor; a synthetic fingerprint is substituted only in memory to exercise the POSTCHECK PASS branch. The real POSTCHECK keeps the production anchor unchanged.

The historical identity and17/18 SQL suites now attach an explicitly synthetic legacy ledger to their already-generated baseline fixture. Their PRECHECK/POSTCHECK assertions use the anonymized JSON contract. No real account data is used.

## Welcome Kids destination and payment UX hotfix

After preparing `telegram-release-fixture.cjs` and starting the isolated dev server on3342, run sequentially:

```sh
node tests/community/miniapp-kids-entry-browser.cjs
node tests/community/miniapp-payment-ux-browser.cjs
```

The first covers `/miniapp?section=kids`, onboarding/reload/Back and existing permission gates. The second covers free/pending/confirmed receipts, immutable server totals, payment resumption, WhatsApp recovery and safe external-link fallback. Its `test-payment-state` endpoint exists only in the disposable fixture, requires development/loopback/PGlite, and changes synthetic rows only. External payment navigation is intercepted; no real payment or Telegram send is performed. Server cases also run in `telegram-release.cjs` and the disposable native PostgreSQL runner.

`node tests/community/miniapp-bottom-nav-browser.cjs` uses the same isolated3342 fixture. It verifies five equal tabs, Baby/active styles, single-line labels and hit targets at320/390/1280, safe-area updates, internal navigation/Back, all permission categories and Kids destination through onboarding. SDK/native callbacks are synthetic; no real Telegram WebView or production account is used.

## Mini App performance pass

[Baseline](../../docs/miniapp-performance-2026-10-22/BASELINE.md) and
[results](../../docs/miniapp-performance-2026-10-22/REPORT.md) distinguish request/statement counts,
local production JS bytes and generated-media optimization from real-device latency.

```sh
node tests/community/miniapp-performance-fixture.cjs
# Start the generated /tmp/menora-miniapp-ui server on3342 as above.
# From the source repository, run browser cohorts SEQUENTIALLY:
COMMUNITY_TEST_OUTPUT=/tmp/menora-performance-evidence/miniapp-performance-browser node tests/community/miniapp-performance-browser.cjs
COMMUNITY_TEST_OUTPUT=/tmp/menora-performance-evidence/miniapp-images-browser node tests/community/miniapp-images-browser.cjs
COMMUNITY_TEST_OUTPUT=/tmp/menora-performance-evidence/miniapp-ui-server node tests/community/miniapp-ui-server.cjs
COMMUNITY_TEST_OUTPUT=/tmp/menora-performance-evidence/miniapp-cache node tests/community/miniapp-cache.cjs
COMMUNITY_TEST_OUTPUT=/tmp/menora-performance-evidence/query-plans node tests/community/miniapp-query-plans.cjs
# After the isolated current production build is running on3343:
COMMUNITY_TEST_OUTPUT=/tmp/menora-performance-evidence/bundle node tests/community/telegram-bundle.cjs
COMMUNITY_TEST_OUTPUT=/tmp/menora-performance-evidence/bundle node tests/community/miniapp-performance-bundle.cjs
```

The performance fixture adds aggregate statement counters only to its disposable copy;
it exposes no SQL text/parameters and adds no route to the deployable app. Browser measurements
must not overlap other cohorts that reset that shared synthetic database. Cross-route dev counters
can miss statements; the shared-logger server test supplies authoritative local SQL counts.
Image tests generate a synthetic JPEG outside Git and exercise the actual local Next optimizer;
approved/unknown remote-host contract checks intercept media rather than downloading real posters.
Query plans use only the migrated isolated catalogue and explicitly label forced index-availability
plans; they are not production EXPLAIN ANALYZE or production latency measurements.

For long performance cohorts the disposable fixture retains compiled dev routes for one hour (`onDemandEntries`), avoiding inactive-entry recompilation during UI interaction deadlines. This does not change production config or the instance data-cache TTL. UI helpers also consume the actual website SSR response immediately before the shared website integration cases. No permission/interaction assertion is skipped; startup counts and production bundle/image measurements remain separate from dev compilation time.

## Event participant website parity (23 October 2026)

`telegram-release.cjs` and `telegram-native.cjs` now also run
`event-participant-parity-cases.cjs`: the real Mini App routes, canonical
`prepareEventRegistration` / `calculateEvent` / `checkoutEvent`, saved payment attempts,
Shutafim parameters and the unchanged website action. Foreign/duplicate children,
community restrictions, strict untrusted input, free events and immutable pending selections
are covered without a real payment or remote database.

After preparing the isolated performance fixture above, run browser cohorts sequentially:

```sh
COMMUNITY_TEST_OUTPUT=/tmp/menora-participant-parity-evidence node tests/community/miniapp-participant-parity-browser.cjs
```

`MINIAPP_BROWSER_BASE` may select another loopback fixture URL. The fixture's
synthetic `NEXT_PUBLIC_APP_URL` and server port must match. The new browser suite
checks that viewing an event sends no quote before the signup CTA, then exercises
200ms quote coalescing, stale-response cancellation, retry without profile/detail reload,
0..20 guests, saved spouse/children, free registration and pending conflict WhatsApp recovery.
Only the server quote supplies displayed totals; register submits participant selection only.
The SDK/openLink and Clerk adapters are synthetic; this is not a genuine Telegram WebView,
OAuth or payment confirmation acceptance.

## Staff deletion of event registrations (23 October 2026)

`deleteEventParticipant` authorizes staff through the same transaction executor,
locks the registration and its payment attempts, then deletes unpaid attempts before
the participant. The existing `ON DELETE RESTRICT` FK remains unchanged. Either a
paid participant or a paid attempt blocks deletion; the confirmation readiness guard
still runs, and paid history stays protected even if readiness later changes.
Only `pending`/`cancelled` attempts may be removed. Failed deletion preserves the
dashboard row and counters and reports a safe error; successful deletion needs no hard reload.

`event-participant-delete-cases.cjs` runs in both `telegram-release.cjs` and the
disposable native PostgreSQL suite: real Mini App checkout fixtures, no-attempt/free
registrations, cancellation, paid history, staff/filter/identity checks, unrelated rows,
dependent and parent-delete rollback, stale URLs/return hints and the disabled callback.
The native run additionally serializes a concurrent paid-attempt writer against deletion.
Rollback triggers exist only inside the disposable test database; no schema migration is added.

```sh
MINIAPP_UI_FIXTURE=/tmp/menora-event-delete-fixture node tests/community/event-participant-delete-fixture.cjs
# Start that fixture on loopback3342 using the existing NODE_PATH test runtime above.
COMMUNITY_BROWSER_BASE=http://127.0.0.1:3342 COMMUNITY_TEST_OUTPUT=/tmp/menora-event-delete-evidence/browser node tests/community/event-participant-delete-browser.cjs
```

The 10 Playwright cases exercise the real CRM page/action/SQL:390/1280 widths,
both confirmation messages, cancellation, request deduplication, successful row removal,
paid rejection, transport failure/retry, permission loss and a stale-row not-found error.
The fixture route is generated only in `/tmp`; it refuses non-development/non-loopback
or non-PGlite access. Identity is synthetic; no real payment or external service is used.
The shared HTTP Clerk adapter now reports loading until client mount. This keeps
SSR sign-in buttons disabled until their handlers hydrate, matching SDK readiness;
the website spec assertions and production authentication remain unchanged.


## Payment intent and warm event applications (24 October 2026)

The additive CLI-generated migration is mirrored byte-for-byte in the canonical
`drizzle/` journal under the same timestamped basename. Historical migrations and
owner adoption artifacts are frozen. Apply the new migration once through the
reviewed canonical runner, before deploying the application; no production rollout
is part of this change. See [report](../../docs/payment-intent-crm-2026-10-24/REPORT.md).

```sh
COMMUNITY_TEST_OUTPUT=/tmp/menora-intent-sql node tests/community/payment-intent-migrations.cjs
COMMUNITY_TEST_OUTPUT=/tmp/menora-intent-release node tests/community/telegram-release.cjs
COMMUNITY_TEST_OUTPUT=/tmp/menora-intent-native node tests/community/telegram-native.cjs
MINIAPP_UI_FIXTURE=/tmp/menora-payment-intent-fixture-20261024 node tests/community/payment-intent-fixture.cjs
# Start that disposable fixture on loopback3372; match its synthetic NEXT_PUBLIC_APP_URL.
COMMUNITY_BROWSER_BASE=http://127.0.0.1:3372 COMMUNITY_TEST_OUTPUT=/tmp/menora-intent-browser node tests/community/payment-intent-browser.cjs
```

`payment-intent-cases.cjs` is shared by both real SQL engines. It covers default
unopened state, immutable first open, repeated/concurrent openings, strict inputs,
session/origin/account isolation, deleted and paid targets, unsafe stored URLs,
rollback, honest CRM states and cutoff, canonical Telegram reminders, transport
blocks, unchanged consent and manual encoded WhatsApp links. Browser cases use the
actual dashboard and event components/actions/routes/SQL with synthetic identity,
SDK, Bot API and intercepted provider pages. No real message or payment is sent.
Run browser cohorts sequentially because their synthetic database resets are shared.

The existing payment browser assertions now wait for the new asynchronous server
open response before inspecting SDK/fallback links. The website regression now
expects immutable pending selections: a changed composition fails instead of
repricing a handed-off attempt. The no-attempt deletion fixture explicitly models
a legacy website row; new website checkout creates the common attempt. All existing
deletion safety assertions remain. Frozen adoption-SQL compatibility checks run on
the exact historical prefix, while current-ledger cases prove that the frozen tool
fails closed and preserves data. Native future-migration probes use the latest
journal timestamp rather than the historical adoption marker timestamp.
