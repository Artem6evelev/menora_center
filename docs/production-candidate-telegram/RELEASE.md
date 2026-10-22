# Menorah Center — Telegram production release candidate

Локальный RC завершён 22.10.2026. Готовность относится к Telegram Mini App, bot, CRM audience/broadcast queue и Shutafim handoff. Это не подтверждение готовности уже работающей production-среды, Google LIVE SSO или фактической доставки/оплаты. Новый общий аудит сайта не проводился.

## Код и контрольная точка

Ветка: `feat/miniapp-auth-v1`. Проверенный product HEAD: **`0fb18c258f51c50858b58de55d0a61217d48839b`**. Последующий `chore: prepare telegram production release` содержит тесты, отчёт и evidence; продукт после этого HEAD не изменён. Точный итоговый HEAD: `git rev-parse HEAD` (также указан в итоговом сообщении владельцу). Рабочее дерево после релизного коммита должно быть чистым.

| Коммит | Изменение |
|---|---|
| `c166aaf6d2d0310a30b04618ab720b0abf72ce70` | Запрошенный checkpoint Step4, все118 файлов совпали с его предыдущим manifest |
| `4fb9efbab80ce75f543116fc1f438bf61d0fb534` | Mini App events/family/server price/pending handoff, DB foundation, website-provider isolation |
| `0b2de846f7dd2c0f433e70d8c419b6e52d72ffe3` | Новый bot, secure webhook, consent, CRM audience, broadcast queue, конфигурационные scripts |
| `0fb18c258f51c50858b58de55d0a61217d48839b` | Обработка позднего отказа уведомлений при смене аккаунта |

Начальный HEAD был `cd2493ead3043250bd3c90fa7b673a0bbb798eed`, Step4 не был закоммичен. Посторонних последующих изменений при сверке не найдено. Никакие старые данные/оплаты/семейные связи не удалялись. [Manifest и hashes](MANIFEST.json), [точное соответствие production build текущим42 product files](evidence/client-boundary.json).

## Продукт

- `/miniapp`: четыре вкладки Home / Events / My registrations / Profile, RU/HE/EN и RTL, прежние filter/questionnaire/resources/children. Стадия гиюра не возвращена в основную анкету. Child clarification — отдельное действие. Авторизация и детские права проверяются повторно на сервере.
- Events: существующие `events`, общая community policy, bounded list20+1, detail с изображением/датой/временем/местом/описанием/ценами и закрытием регистрации. Постер3:4,32px, gradient/gold как на сайте. Поле audience не превращено в новое правило допуска: оно сохраняет прежнюю роль интерфейсного фильтра.
- Registration: canonical session owner, только собственные разрешённые дети, DB prices, целые агороты, free→confirmed, idempotent повтор. Existing children/history и административное исключение с неизменным статусом отца сохранены.
- Shutafim: существующий DB URL/параметры `price`, `quantity`, `cur`, `payments`, `lang`, `custom1`. До открытия показана сумма от backend. Telegram открывает ссылку через официальный WebApp.openLink; website iframe сохранён. Pending attempt неизменяемый, повтор возобновляет ту же оплату; иной состав не перезаписывает уже переданный заказ. Исторический website пересчёт без новой попытки сохранён.
- My registrations: только свои, confirmed/pending/paid/abandoned/cancelled при наличии соответствующих исторических состояний. Pending виден как ожидание подтверждения; возвращение/закрытие ничего не подтверждает.
- Bot: holiday flow и новый legacy fake-email writer удалены. Canonical bootstrap общий с Mini App, /start navigation/menu/contact/channel; webhook secret, atomic update dedupe. Opt-in/out явный, /start/launch не подписывают. Block/отписка сохраняются; interaction не восстанавливает маркетинговое согласие автоматически.
- Campaign: first/last key и seen timestamps, server mapping `telegram_campaigns`. Opaque key не выдаёт event access; PII в keys не допускается. /start campaign переносит marker в Web App, а mapping разрешается сервером после обязательного фильтра. Таблица mapping изначально пустая; для рекламы нужны согласованные key→event записи.
- CRM: `/dashboard/telegram`, ссылка из общей CRM людей. Фильтры категории/пола/canonical city/Telegram/consent/profile/filter и поиск имени/username.20 строк на странице, all-filtered — вся серверная аудитория, selected/excluded, count, plain text, optional event button, preview и enqueue. До enqueue повторный расчёт, до send повторная проверка согласия. Нет произвольных chat IDs и отдельной базы людей.
- Queue: durable deliveries, один in-flight, до5 за bounded invocation, rate limit, retry_after/backoff/max5, blocked/permanent failures. Uncertain send→unknown, без автоматической повторной отправки. Разрешены manual staff drain и защищённый worker route; существующий remind URL теперь только alias очереди. Автоматическая cron-рассылка не добавлена, Vercel plan/cadence не предполагается.
- Дополнительные исправления по проверкам: late notification denial обработан без page error; worker Date comparison использует Drizzle encoder (дефект воспроизведён только на native postgres-js); website providers вынесены из initial Mini App JS. [Целевой security review](SECURITY.md).

## База данных

Новые миграции:

- `drizzle/0011_telegram_release_candidate.sql`: `telegram_updates`, `telegram_campaigns`, `telegram_broadcasts`, `telegram_broadcast_deliveries`, `event_payment_attempts`. Payment attempt нужен для неизменяемой корреляции состава/суммы/registration при повторных открытиях и обращении из разных каналов; одних изменяемых полей participant недостаточно.
- `drizzle/0012_telegram_query_indexes.sql`: индексы списка событий и user/event registrations. Без изменения строк.

Единый owner-run production block для Step2+3+completion:

1. READ ONLY [PRECHECK.sql](../miniapp-identity-v1/PRECHECK.sql).
2. [MANUAL_SQL.sql](../miniapp-identity-v1/MANUAL_SQL.sql).
3. READ ONLY [POSTCHECK.sql](../miniapp-identity-v1/POSTCHECK.sql).

MANUAL_SQL генерируется `node scripts/build-miniapp-manual-sql.cjs`; включает0009–0012 в одной транзакции, strict compatibility/RLS/grants checks, повторное применение и сохранение истории проверены. PRECHECK выводит schema/ledger inventory и fingerprint регистраций для приватного сравнения с POSTCHECK. Не публиковать его идентификаторы/данные. Native runner не делает автоматический adoption смешанной истории.

**Обоснованное исключение для уже подготовленной истории:** в0009/0010 добавлены только6 строк нормализации redundant `contype=n` при сравнении catalog. PostgreSQL17 хранит relation NOT NULL в pg_attribute,18 также в pg_constraint; обязательность колонок по attnotnull по-прежнему строго сравнивается. DDL/backfill не переписаны. Это устраняет реальный отказ подготовленного SQL на17; полная цепочка проверена на17.5/18. Старые и новые hashes указаны в MANIFEST. По исходному заданию production ещё не получила Step2+. Если где-либо0009/0010 уже зарегистрированы со старыми checksum, остановить native migrate и сверить ledger приватно — не переписывать журнал/чужие hashes автоматически.

**Remote Supabase не запрашивалась и не изменялась.** Все DDL/DML проверки — временные синтетические PGlite/native PostgreSQL. Этот отчёт не подтверждает применение SQL в production.

## Environment и конфигурация

[Контракт и команды](ENV.md). Только имена обязательных переменных:

`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME`, `NEXT_PUBLIC_APP_URL`, `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS`, `TELEGRAM_MINIAPP_SESSION_TTL_SECONDS`, `CRON_SECRET`, `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`.

`npm run check-production-env` проверяет present/missing и формат, не печатает значения. [Проверка локальных env](evidence/local-env-check.json) — это не конфигурация Vercel. Локально отсутствуют webhook secret/bot username/explicit TTL-age/Clerk webhook secret; APP origin/cron/Clerk keys не проходят production contract. Для age/TTL есть runtime defaults900/86400, перед rollout рекомендуется явно закрепить. Production env, фактический LIVE Google OAuth client/callback и внешний Google branding в этом локальном задании не подтверждены; прежние внешние ограничения не считаются закрытыми.

`npm run telegram:check` только читает getMe/webhook/menu. `npm run telegram:configure -- --confirm-production` — будущий apply, не выполнен. Telegram не возвращает установленный secret_token через getWebhookInfo: read-only check не может подтвердить его значение. На local tests все Bot API методы, включая apply, были stub.

## Проверки

**532/532 PASS,21 групп.** [Полный список/counts/среды](evidence/checks.json). Никакие assertions не отключены ради PASS.

- Mini App auth87; profile/filter/session31; bridge6; existing UI39; production browser2.
- Identity23; native Drizzle chain8; PostgreSQL17.5/18 compatibility10.
- Новый Telegram release61 на PGlite и62 на native PostgreSQL18 с реальным postgres-js pool max10/независимыми backend PIDs; новый browser32; scripts5; JS boundary1.
- Community regression36; SSR21; spec/server17; existing production/server28; HTTP11; SDK callback lifecycle10; browser callback10 и website spec32.

Native suite дополнительно доказал concurrent bootstrap8 запросов, совместный bot+Mini App bootstrap, duplicate free/paid registrations и parallel worker invocations. Native cluster loopback35432 остановлен, данные удалены; OS service/user не создавались. Реальная Telegram/Google identity не подменяется этим доказательством.

`npm run typecheck` — exit0. `npm run lint` — exit0,0 errors/30 прежних no-img warnings; новых Mini App warnings нет. `npm run build` — exit0, именно текущий product code в отдельной копии без реальных env. Ожидаемый sitemap fallback обращается только к недоступному synthetic127.0.0.1:1. Прежние Next middleware/images.domains deprecation warnings не объявлены устранёнными.

Production initial JS:12 файлов,483413 raw bytes, расчётный gzip150701 bytes (~147KiB), включая framework/common chunks; Clerk runtime не загружается. До разделения providers было835847/244325 bytes. Это не физическое устройство/сетевой benchmark. [Измерение](evidence/bundle.json). Client chunks проверены на server secrets/internal-table markers —0.

Browser:320/390/1000 и прежний desktop1280, RU/HE/EN, RTL, family rights, server total change, pending/close/reload/resume, retry с сохранением selection, native BackButton во время запроса, CRM25 selected beyond page20, no send. Все внешние requests блокировались. [Новые сценарии](evidence/telegram-release-browser-results.json), [UI regression](evidence/miniapp-ui-browser-results.json), [скриншоты с hashes](evidence/screenshots.json). Фото/дети/профили в evidence синтетические.

Исторические разовые browser scripts для отменённой формы не переобъявляются зелёными: актуальные journeys покрывают spec-browser/callback-browser. READ ONLY remote diagnostics не запускались. Google callbacks в website suites — mock Clerk, не настоящий Google SSO.

## Production rollout — только после проверки владельца

1. Сделать backup/подтвердить целевой DB project и сохранить текущую конфигурацию bot/webhook/menu приватно.
2. Выполнить PRECHECK. Сверить schema/ledger/hashes, ambiguous identities, baseline registration fingerprint; остановиться на несовместимости.
3. Применить единый MANUAL_SQL0009–0012 владельцем.
4. Выполнить POSTCHECK: grants/RLS/FK/orphans/duplicates и неизменность прежних регистраций. До этого код не выкатывать.
5. Настроить production env по ENV.md и получить успешный check-production-env в соответствующем окружении. Push выполняет владелец.
6. Дождаться Vercel READY с этой версией, проверить health/guest website/обычный browser Mini App fallback. Убедиться, что server env и canonical HTTPS origin соответствуют production.
7. Выполнить read-only telegram:check. Затем отдельный owner apply webhook secret/menu/commands; повторить check. До этого новый handler отвергает webhook без secret, pending updates не сбрасываются.
8. Настоящая Mini App acceptance: iPhone/Android/Telegram Desktop/Web, signed launch/cookie/reload/account switch, safe areas/keyboard/BackButton/RTL, filter/resources/profile/city/children, events и собственные записи.
9. Один явный opt-in владельца, campaign preview/enqueue только владельцу; проверить, что в очереди только одна owner delivery, затем ручной drain тестовой рассылки. Проверить доставку, unsubscribe и отсутствие повторов. Массовую аудиторию пока не включать.
10. Одна запись на free event: confirmed, корректный состав и отсутствие дубля.
11. Один paid handoff с проверкой суммы/параметров/custom1. Не проводить оплату без отдельного решения владельца; закрытие/return должны оставить pending. Автоматическое paid confirmation пока restricted.
12. При необходимости создать только opaque campaign→event mappings, подтвердить manual drain операционный режим или отдельно согласовать cron на реальном тарифе.
13. Только после приёмки включать Telegram advertising.

## Rollback

Остановить cron/manual drains и Telegram advertising прежде отката. Сохранить queue/delivery state, особенно delivered/unknown; не переотправлять unknown автоматически.

Code rollback выполняет владелец на совместимый с nullable-email/canonical identity artifact. Step4 `c166aaf` — совместимая code checkpoint-ссылка, но её старый holiday webhook нельзя автоматически возвращать в работу. Перед откатом на старый handler отключить webhook/menu либо направить на сохранённый совместимый защищённый handler. Восстанавливать прежние webhook/menu URL/secret можно только приватно из backup и после проверки совместимости; сохранять pending updates.

Таблицы identity/session/attempts/queue, consent, registrations и history не откатывать разрушительно. Additive schema оставить; не DROP и не массово менять affiliation/paid/children. Старый artifact, предполагающий non-null email, не считается безопасным rollback для новых Telegram-first users. Если безопасного artifact нет, использовать maintenance/закрытый webhook до исправления и forward deploy. Эти действия сейчас не выполнялись.

## Оставшиеся ограничения

**BLOCKER перед rollout:** owner DB backup/PRECHECK/apply/POSTCHECK и production env ещё не подтверждены в целевой среде. Это ожидаемые внешние gates, а не незаконченный локальный код. Новый Telegram endpoint без правильно настроенного secret будет возвращать401; конфигурацию нельзя пропускать.

**POST-DEPLOY ACCEPTANCE:** настоящий Telegram launch и физические клиенты, фактический bot identity/webhook/menu/secret, owner-only доставка и отписка, реальные production DB privileges, free registration и paid pending handoff. Не выданы за пройденные локальными SDK mocks.

**Функциональные пределы:** автоматическое Shutafim payment confirmation остаётся restricted согласно прежней модели. RC реализует handoff/pending, не подтверждённую продажу билета. Для автоматического подтверждения реальных оплат нужен отдельно проверенный provider protocol/configuration; до этого нельзя обещать paid ticket confirmation. Уже переданный pending состав не меняется автоматически; разбор спорных попыток/unknown delivery выполняется оператором без предположения об оплате/доставке.

**FUTURE:** cross-provider account linking/merge UX (нет сопоставления по имени/email), интерфейс reconciliation и автоматическое расписание worker при необходимости. Initial manual drain поддерживается как production-режим этого релиза. Общие прежние audit/Google LIVE/branding находки этим контуром не закрыты.

**Не выполнялись:** remote DB reads/writes, push, deploy, Telegram setWebhook/menu/BotFather, реальные сообщения/рассылки/уведомления, платежи и реклама. Публичная версия этим запуском не обновлена. Следующий этап — отдельный owner-controlled rollout после проверки этого RC.
