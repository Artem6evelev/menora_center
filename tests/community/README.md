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

`node tests/community/browser.cjs` — настоящий локальный Chromium/Playwright (runtime вне product dependencies: `/tmp/menora-browser-runtime/node_modules/playwright` или `COMMUNITY_BROWSER_RUNTIME`). Публичные сценарии на3330 используют реальный Clerk TEST; приватные на3327 явно используют mock identity и настоящие actions/SQL. Это не доказательство завершённого Google OAuth. Требуются оба изолированных стенда; они никогда не публикуются. Viewports1440/390/320 — эмуляция размеров, не физические устройства. `api/test-state` создаётся только в mock /tmp-копии и отсутствует в приложении.
