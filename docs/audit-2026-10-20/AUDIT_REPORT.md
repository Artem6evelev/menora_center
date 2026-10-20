# Технический и функциональный аудит Menorah Center

**Проверенная версия:** `main@c43b0d54a84038b257aa1ef7b151942d95baa629`, репозиторий `Artem6evelev/menora_center`, remote `https://github.com/Artem6evelev/menora_center.git`. Дата: **20 октября 2026, Asia/Jerusalem**. Последний commit датирован 11 октября 2026. Исходная рабочая директория была чистой. По окончании добавлены только материалы и диагностика этого аудита в `docs/audit-2026-10-20`; продуктовый код, зависимости, конфигурация и реальные данные не менялись.

Система существенно развита, но в проверенном коде есть критические пропуски серверной авторизации и серьёзные ошибки оплаты. Новое ТЗ фильтрации в основном ещё не реализовано. Его включение поверх нынешних UI-проверок не закроет прямые действия, альтернативные пути и старые семейные данные.

Матрица содержит **66 атомарных требований, проверок и явно обозначенных вопросов**: **VERIFIED 0, PARTIAL 6, FAIL 42, AMBIGUOUS 14, NOT VERIFIED 4, N/A 0**. Это не процент готовности и не число отдельных дефектов. Неоднозначности не засчитаны как соответствие. Изолированные 47 диагностических проверок воспроизводят текущие сценарии и дефекты; они не означают 47 успешных E2E-проверок.

## Что проверено и к чему относятся выводы

Прочитаны README, package manifest/lock, конфигурации, схема, все 4 SQL-миграции Drizzle и 17 Supabase, журналы/snapshots, все 18 actions-модулей и 4 API routes, публичные/auth/dashboard/admin entrypoints, их компоненты и stores. Применимых `AGENTS.md` в репозитории и проверенных родительских каталогах не обнаружено. README — исходная инструкция create-next-app, собственного runbook/CI/test suite в tracked файлах нет. Это не доказывает отсутствие настроенного CI или резервирования у провайдера.

Оба оригинала ТЗ найдены в `~/Downloads`: DOCX и PDF, 7 страниц. Прочитаны весь текст, два скриншота, два комментария Word; все страницы PDF отрисованы и визуально просмотрены. Бизнес-текст совпадает; различается нумерация/вёрстка. Комментарии уточняют необходимость пола для записи ребёнка и добавление раздела детей, но не разрешают конфликт прав гиюра. Содержательных внешних URL нет. Выписки, изображения, SHA256: [evidence](evidence/), [spec-sources.json](evidence/spec-sources.json).

| Область | Выполнено | Граница достоверности |
|---|---|---|
| Локальный код | Статический аудит, typecheck, штатные lint/build, dependency audit, изолированные functions/components | Все ссылки на строки относятся к указанному commit. Чтение кода не названо E2E |
| Подключённая БД | Метаданные/constraints/indexes/RLS/storage policies и агрегаты в транзакции READ ONLY | БД из `.env.local`; соответствие production/commit неизвестно. Строки пользователей/контакты не включены в результаты |
| Изолированная сборка | HEAD archive без реальных env, синтетические ключи, прежние node_modules | Компиляция и TypeScript успешны, prerender падает на недоступной тестовой БД; сборка с production credentials не запускалась |
| Публичное развёртывание | Гостевой GET `https://menorah-rishon.com/` → `https://www.menorah-rishon.com/` и одной прямой ссылки на событие, HTTP200 | Server=Vercel, private/no-store, guest старые блоки/экран. SHA deployment **NOT VERIFIED**; остальные локальные findings на production автоматически не переносятся |
| Браузер/Google/платёж/сообщения | Синтетический React render и моки внешних эффектов | Browser controls iab/chrome unavailable, E2E suite/тестовые tenants нет; реальные OAuth/платежи/уведомления не запускались |

Основные доказательства: [baseline.json](evidence/baseline.json), [db-readonly.json](evidence/db-readonly.json), [public-http.json](evidence/public-http.json), [build.log](evidence/build.log), [TEST_MATRIX](TEST_MATRIX.md). Секреты не выведены и не копировались в test sandbox. Только отдельный read-only script использовал ключ подключения в памяти; mocked tests вообще не читали реальные env.

## Фактическая архитектура

Одно приложение Next.js App Router, без обнаруженного monorepo. Серверный доступ к PostgreSQL через Drizzle/postgres-js; Clerk отвечает за вход/сессии. Supabase используется для PostgreSQL и публичного Storage, а не как основной UI-auth. Clerk ID текстовый; Telegram также создаёт отдельные `tg_` профили. Применять Supabase Auth UUID-политику к ним без интеграционной модели нельзя.

| Компонент | Фактическая версия/состояние |
|---|---|
| Runtime проверки | Node 22.20.0, npm 11.6.2 |
| Framework/UI | Next 16.1.7, React/React DOM 19.1.0, TypeScript 5.8.3 |
| Auth | `@clerk/nextjs` 7.0.4, backend 3.2.0; русская локализация Clerk |
| DB/Storage | drizzle-orm 0.45.1, postgres 3.4.8, supabase-js 2.99.1, drizzle-kit 0.31.10 |
| UI/state/forms | Tailwind 3.x, Zustand 5.x, react-hook-form 7.x, Zod 3.25.76, Motion, Radix, Quill |
| Интеграции | Nodemailer 8.0.3, Telegraf 4.16.3, Svix 1.88.0; fetch WhatsApp, Shutafim внешние URL/webhook |
| Проверки | `dev/build/start/lint`; штатных test/typecheck scripts нет, tsc вызван напрямую; ESLint 8.57.1/config-next14.2.3 при Next 16 |

Версии Next/React/Clerk/DB приведены из lock и доступных package files, не из предположения о типовом стеке. Полный manifest/lock остаются источником остальных точных версий. Installed `@types/react`/`@types/react-dom` — линия 18 при React 19; сейчас typecheck проходит, поэтому это совместимость к перепроверке, а не доказанная поломка.

### Маршруты и найденные модули

| Модуль | Entry points и функции | Вывод аудита |
|---|---|---|
| Публичный сайт | `/`, `/events`, `/events/[id]`, общий marketing layout/navbar/footer | Гостевые ограничения/новые тексты не реализованы; initial component HTML и live HTTP наблюдения приведены отдельно |
| Auth и анкета | `/sign-in/[[...]]`, `/sign-up/[[...]]`; dashboard layout → OnboardingForm; ProfileManager | Google strategy есть в direct event; отдельной новой фильтрующей анкеты нет; linking policy не задана |
| Кабинет | `/dashboard`, `/dashboard/events`, `/dashboard/my-events`, `/dashboard/my-services`, `/dashboard/kids`, `/dashboard/chat` | Собственный профиль/история/семья существуют; оплаты/дети/кеш/ошибки имеют замечания |
| CRM/админка | `/dashboard/users`, `/dashboard/team`, `/dashboard/kanban`, `/dashboard/applications`, `/dashboard/kids-applications`, `/dashboard/services`, `/dashboard/service-applications`, `/dashboard/telegram` | Page gates частично есть, handlers часто открыты; эти две границы не эквивалентны |
| Контент/авторы | `/news`, `/news/[slug]`, `/lessons`, `/authors`, `/authors/[slug]`; dashboard news/create/videos/authors/author-profile/moderation | CRUD/editor/moderation/comments/donations есть; обнаружены raw HTML, public drafts/full user projection и обходы ownership/moderation |
| Детские программы | `/kids`, KidsProgramsClient, dashboard/kids и kids-applications | Публичная заявка pending отличается от профиля ребёнка/окончательной записи; новые правила отсутствуют на независимых путях |
| Услуги | `/services`, собственные и админские заявки | Функция существует, даже если ссылки services скрыты в sidebar; auth/ownership/active service не соблюдаются в actions |
| Оплата | Event payment URL/iframe и `POST /api/webhooks/shutafim`, pending/paid/abandoned | Нет независимого order/amount ledger; сумма доверена клиенту, callback неподписан |
| Пожертвования | Внешние ссылки Shutafim в welcome/author sidebar | Есть внешняя передача пользователю; собственный действующий donation checkout/refund модуль не найден, real transaction NOT VERIFIED |
| Уведомления/общение | notifications table/actions, CRM chat, notification bell, bulk messages | Чужие сообщения/ID/sender не защищены достаточным образом |
| Бот/email/WhatsApp | Telegram webhook/actions/remind/settings; SMTP welcome; WhatsApp bulk | Внешние side effects существуют; подделка/неавторизованные вызовы и неверные результаты ошибок воспроизведены моками |
| Контакты/статические | `/about`, `/contact`, `/welcome`, `/privacy`, `/terms`, `/rules`, `/pricing` | Contact submit no-op, broken route/mobile контакты; pricing — остаток шаблона; юридическая экспертиза текста не выполнялась |
| Старые пути | `/admin` — собственный профиль после auth; legacy event action/component, login/signup/auth-layout, KidsAdminClient, UniversalPaymentForm | Название `/admin` само по себе не доказывает доступ к админским функциям. Неиспользуемые handlers не объявляются опубликованными без проверки build/action reference |
| Метаданные | metadata/OG/JSON-LD, sitemap, robots, публичные изображения | Прямые loaders/metatada отдают сведения без eligibility; robots/noindex не являются авторизацией |
| N/A | Вместимость, отдельный возрастной лимит событий, RSS/ICS, самостоятельный импорт, app-блокировка пользователя, полноценные locale/RTL маршруты, внутренний refund workflow | Реализация не найдена. Их отсутствие не объявляется дефектом обязательного нового ТЗ; next-intl dependency не означает готовую локализацию |

Полная таблица каждого маршрута, активных компонентов, состояний и неиспользуемых реализаций: [UI_SPEC](notes/UI_SPEC.md). Полная карта exports/гейтов: [SERVER_SECURITY](notes/SERVER_SECURITY.md). Таблицы схемы, SQL и интеграций: [DATA_INTEGRATIONS](notes/DATA_INTEGRATIONS.md).

## Реестр подтверждённых замечаний

Все рекомендации ниже — **исправление обнаруженного дефекта**, кроме A10/A11, где явно указано **требование ТЗ**, и помеченных дополнительных предложений. Приоритет учитывает воздействие; наличие слова critical в dependency audit не превращает условный advisory в доказанную P0 эксплуатацию. Уверенность высокая для указанных кода/проб; HTTP exploitation/live account mutation не выполнялись.

Подробные карточки SEC/DI/UI в приложениях содержат факт, источник ожидания, строки/функцию, воспроизведение, влияние, причину, минимальное исправление, regression и зависимости. Номера A ниже объединяют повторяющиеся находки разных направлений: одинаковый payment/Storage/UI дефект не считается несколькими независимыми инцидентами.

| ID / приоритет | Подтверждённый факт, модуль и строки commit | Влияние / минимальное исправление | Подробное доказательство и приёмка |
|---|---|---|---|
| **A01 P0** | Секреты tracked в `.env` и `.env.local`: DATABASE_URL:4, service-role:5, Clerk secret:13, SMTP password:28, bot token:33, cron secret:38 | Любой получивший Git-копию получает credentials; ротация/удаление из отслеживания/истории и secret scan; действительность всех ключей не тестировалась | Карточка A01 ниже; R01 |
| **A02 P0** | `user.ts:updateUserRoleAction:15–22` без auth меняет любую роль; альтернативный `role.ts` защищён | Повышение до superadmin и обход реально защищённых операций; оставить один проверенный путь с allowlist/journal | SEC-01, SERVER guest→superadmin; R02 |
| **A03 P0** | `getAllUsers:11–13`, `getUsersPaginated:196–265`, event/service family/application getters, public comments.user=true возвращают полные профили | Контакты, религиозный статус, дети/семья без нужного права; server role/ownership и DTO | SEC-02/12, SERVER sensitive synthetic profile/draft/comments; R02/R03/R15 |
| **A04 P0** | `notification.ts:10–16,24–42,85–163,265–285`: чужое чтение/удаление/создание без owner/auth; bulk/activeChats — login-only | Подмена отправителя и доступ к переписке; session owner, явный staff guard | DI-02; INTEGRATION foreign read/delete/spoof; R03 |
| **A05 P0** | `bot-settings.ts:updateBotSettings:7–18` без auth меняет группу назначения, update без WHERE | Несанкционированное администрирование/перенаправление будущих контактных файлов, доставка зависит от прав бота; admin+singleton+allowlist+audit | DI-01; INTEGRATION unauth update, CODE telegram.ts:80–115,138–173; R03/R05 |
| **A06 P1** | event/service/task/video/category/author/comment CRUD без достаточных server guards, spreads/`.set(data)` | Порча/удаление событий, цен, payment URLs/истории, контента и задач; auth/role/object + input allowlist | SEC-04/07/10/13; SERVER CRUD/foreign author; R03/R15 |
| **A07 P1** | `user.ts:25–80,268–337`, `event.ts:353–475` доверяют target userId и family payload | Изменение чужой анкеты/детей, complete=true с пустыми данными/без явного согласия; own ID из сессии, строгая schema | SEC-03/06; SERVER foreign family/completion; R03/R10 |
| **A08 P1** | `event.ts:452,496–515`: новая заявка при missing/0 amount получает paid; `dashboard/events/event-card.tsx:109–114` штатно не передаёт amount | Платное событие регистрируется без оплаты; новый child/spouse также не учтён в UI total; сервер пересчитывает quote и состояние | SEC-05/15, DI-07, UI-06; SERVER/INTEGRATION; R04 |
| **A09 P1** | `webhooks/shutafim/route.ts:6–55`: body с известным participant reference и распознаваемым status меняет paid/abandoned без signature/order/amount | Поддельная оплата и поздний failed понижает paid; официальный provider contract, подтверждённый order, идемпотентные переходы | DI-05; INTEGRATION unsigned paid→failed; R04 |
| **A10 P1 — ТЗ** | Пол/eligibility/подтверждённое родительство отсутствуют; `updateUserChildren` в двух файлах auth-only, event/семья принимает arbitrary child_N | Мужчина создаёт/записывает ребёнка и может использовать старого; единая server policy, стабильный child relation, защищённый exception | SEC-06/16, UI-04, MC-038–045; R08/R10/R13; D03/D04/D06 |
| **A11 P1 — ТЗ** | Home/catalog/metadata/getters открыты; `OnboardingForm:112–366` старая анкета без трёх веток и пола; event guest старый экран | Фильтрация/информирование не реализованы; единый server gate + точные тексты/две auth ветки/новая форма | UI-01–05; RENDER14 и PUBLIC-HTTP; [SPEC_COMPLIANCE](SPEC_COMPLIANCE.md); D01/D07/D08 |
| **A12 P1** | `news.ts:createNews:70–88` client публикует raw HTML от чужого автора; `article-content.tsx:25` выводит без sanitizer; public draft/video getters | Обход модерации и цепочка stored XSS, приватные черновики/профили; роль/ownership, published filters, server HTML/URL allowlist, escape JSON-LD | SEC-11–13, UI-01; SERVER подтверждает сохранение; браузерное выполнение не запускалось; R15 |
| **A13 P1/P2** | Используемая Drizzle history не содержит 14 колонок/таблицу kids_applications/unique; две несовместимые истории; live нет 2 FK авторства, иной timestamp | Воспроизводимое создание/restore не совпадает с кодом; canonical baseline + additive reconcile; live работоспособность полей не отрицается | DI-08, schema-diff JSON, DB-RO; R07; drift FK/time P2 |
| **A14 P1** | WhatsApp без auth (`whatsapp.ts:19–85`); Telegram update без secret (`webhook:162–172`); service_role upload без auth (`news:207–235`) и PUBLIC INSERT Storage events | Злоупотребление аккаунтами, поддельные profiles/сообщения, загрузки/квота; auth/validated input/secret/dedupe/scoped upload | DI-03/04/06, SEC-14; INTEGRATION и DB-RO policies; R03/R14 |
| **A15 P1 event / P2 service** | SELECT→INSERT без unique/transaction; `event.ts:388–475`, `service.ts:177–187`, schema/live без pair uniqueness | Конкурентные дубли; mocked interleaving создаёт 2 строки, текущих live дублей 0; определить occurrence key, unique/idempotency | SEC-08, DI-09; PostgreSQL concurrency ещё не запускался; R09 |
| **A16 P1** | `child_N` в extraData; admin выводит ребёнка из текущего массива (`application-client.tsx:527–541`) | Перестановка/редактирование меняет историческую идентичность; стабильный child ID и snapshot, осторожный backfill | DI-10; CODE synthetic [A,B]→[A,C]; live child_N references0, инцидент не утверждается; R08 |
| **A17 P2** | Семья обновляется до проверки event/participant (`event.ts:410–475`), profile commit до SMTP (`user.ts:36–80,181–192`) | Частичное сохранение при ошибке/дубли retry; transaction для связанных данных, отдельный delivery result/idempotency | SEC-09, DI-13; SERVER/INTEGRATION fault injection; R09/R14 |
| **A18 P2** | Единственный cron файл `vecel.json`; remind не проверяет HTTP success, missing secret → Bearer undefined | Repo cron не распознаётся стандартным Vercel config; ложное sent при 429, условный missing-env bypass; конфигурация/честные счётчики/retry | DI-11/12; INTEGRATION; production cron неизвестен, локальный secret есть; R14/R17 |
| **A19 P2** | Clerk verify после JSON reserialize (`route:25–36`); user.deleted физически удаляет user (`82–90`) с cascade registrations/NO ACTION tasks | Валидная подпись может отказать, удаление теряет историю либо callback падает по FK; raw verify, предсказуемая retention/удаление | DI-14/15; настоящий Svix на synthetic pretty JSON + schema semantics; R14; D06/retention |
| **A20 P2** | paid билет=Ожидает; каталог обрезан 12; optimistic CRUD игнорирует false/throw; Contact submit console.log; getConversation ASC LIMIT100 | Ложный статус/успех, недоступные события/новые сообщения, потеря обращения; исправить контракты результатов/пагинацию/отображение | UI-07/08/10/11, DI-16/17; RENDER paid; остальные CODE; R16 |
| **A21 P1** | Установленные Clerk 7.0.4/Next 16.1.7 входят в опубликованные affected ranges, в т.ч. middleware защиты | Уязвимый runtime набор при наличии соответствующих путей; применимый совместимый security update и regression; эксплуатации нет | Карточка A21 ниже, npm-audit.json; R06 |
| **A22 P2** | Непривязанные labels, hover-only navigation, nested button/anchor, modal без focus/dialog семантики | Клавиатура/touch/assistive use затруднены; исправить разметку/фокус средствами существующих компонентов | UI-13; CODE, реальный keyboard/viewport NOT VERIFIED; R11/R12/R16 |
| **A23 P2/P3** | Нет структурированного журнала ручных role/status/exception операций; dashboard activity график константный | Не восстановить основание ручного действия; риск неверной аналитики. Минимальный audit, demo label либо реальные метрики | SEC-16 P2/17 P2; CODE; R05, отдельное небольшое исправление метрик |
| **A24 P3, контактный путь P2** | `/welcome` ведёт `/contacts`; mobile скрыт контактный блок; `/pricing` шаблонный; OG `/public/seo/...` и отсутствующие fallback assets | Broken navigation/preview и посторонний контент; исправить ссылки/mobile block, согласовать pricing redirect, реальные asset URLs | UI-12; CODE+file inventory, не legal review; R16 |

### A01. Секреты находятся в отслеживаемых env-файлах

**Факт и доказательство:** `git ls-files '.env*'` возвращает `.env` и `.env.local`; начальное дерево чистое. Непустые значения обнаружены в ключах DB/service-role/Clerk/SMTP/Telegram/cron. Значения не напечатаны. Read-only подключение по DATABASE_URL успешно: как минимум конфигурация доступа к БД работоспособна. Действительность остальных ключей, публичность remote и наличие постороннего использования не проверялись.

**Ожидание/источник:** секреты доступа к данным и внешним аккаунтам не должны попадать в распространяемую Git-историю; это исправление обнаруженного дефекта безопасности, независимо от нового религиозного ТЗ. `.gitignore:5` содержит `/env.local`, что не соответствует `.env.local`, и не отменяет уже tracked состояние.

**Влияние:** доступ получателя копии репозитория к инфраструктуре/БД/отправке от имени центра в пределах ключей; чувствительность данных повышает приоритет. Причина подтверждена tracked файлами и неверным исключением, первоначальная история попадания/эксплуатации неизвестна.

**Минимум исправления R01:** ответственный владелец отдельно ротирует действующие ключи/проверяет журналы, безопасно передаёт новые env, удаляет секреты из текущего отслеживания и согласованно из истории/копий. Удаление только файла в новом commit не отзывает старый секрет. Audit не выполнял ротацию, удаление файлов, переписывание истории или изменения аккаунтов.

**Регрессия:** `git ls-files` без env secrets, secret scan по истории/артефактам без печати значений, старые ключи отозваны, тестовый запуск получает нужные env безопасно, никаких ключей в client bundle/logs. Новых решений ТЗ не требуется.

### A21. Применимость advisory проверяется по пути исполнения

`npm audit` вернул 49 dependency records, включая 3 critical/28 high/16 moderate/2 low. Это данные registry на дату аудита, с транзитивными и dev packages; они не являются 49 независимыми уязвимостями приложения. Обновлений или `audit fix` не было.

Clerk 7.0.4 использует `createRouteMatcher` в `middleware.ts:2–10`; эта комбинация входит в affected range опубликованного middleware bypass, исправленного в 7.2.1 соответствующей линии. Собственные server checks остаются необходимыми; обход middleware не означает компрометацию сессий или impersonation. Источник: [advisory Clerk](https://github.com/clerk/javascript/security/advisories/GHSA-vqx2-fgx2-5wq9).

Next 16.1.7 также попадает в affected ranges нескольких advisory. В [AVIF image optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) исправление указано 16.3.3; в проекте есть Next Image/разрешённые remote image origins. Фактический exploit/AVIF path на развёртывании не проверялся. [Follow-up segment-prefetch advisory](https://github.com/vercel/next.js/security/advisories/GHSA-26hh-7cqf-hhc6) имеет условие Turbopack, тогда как scripts проекта явно `--webpack`: нельзя объявлять именно этот вариант доказанной эксплуатацией. Для каждого остального advisory нужно такое же сопоставление. Например, Windows-hosted RCE не переносится автоматически на проверку macOS/Vercel.

**Минимум R06:** выбрать совместимый исправленный набор по всем применимым первоисточникам на дату изменения, точечно обновить manifest/lock, проверить Clerk/Next/React/MDX/types и все auth/data flows. Минимальные версии отдельных старых advisory не считать полной текущей целью. Применение runtime auth/ownership R02–R03 выполняется независимо от обновления.

**Приёмка:** dependency audit с разбором remaining applicability, реальный test tenant, новые auth/session/metadata/direct-action negative tests, typecheck/lint/build с synthetic seed. Неприменимые opt-in Clerk frontend proxy/org billing/reverification и Next Cache Components/WebSocket/custom server условия не найдены в активном коде; их наличие в registry отмечается риском пакета, не установленной отдельной дырой проекта. CVE PoC, опасные файлы и нагрузочные атаки не запускались.

## Модель доступа и существенные разграничения

Вход через Google, профиль, самоответ, подтверждённый допуск, child ownership и роль — разные вещи. Сейчас завершённость анкеты используется только как dashboard gate, а не как общая политика. Пол отсутствует. Сущности approval/admission нет; отсутствие обязательного ручного review не является дефектом утверждённого ТЗ, поскольку процесс не задан.

| Субъект/состояние | Просмотр событий сейчас | Личная запись сейчас | Дети сейчас | Администрирование сейчас |
|---|---|---|---|---|
| Гость | Home/catalog/full loaders/metadata, визуально старый login screen на direct event | UI предлагает вход; register action не требует auth | Public kids application; другие family/register handlers принимают IDs | Page gates защищены, ряд actions открыт |
| Новый Google/неполная анкета | Direct event по userId показывает полные детали; dashboard client→анкета | Handler не проверяет завершённость | Те же самостоятельные пути без gender/eligibility | Должен быть обычным, но A02 и открытые CRUD обходят роли |
| Старый null/неизвестный профиль | Отдельного нового gate нет | Новый status не проверяется | Старые childrenData доступны | Будущее разрешение **AMBIGUOUS D06**, не объявляется defect каждого старого пользователя |
| Материнская линия, мужчина | Нет отдельных условий | Нет нового admission | UI/action позволяют создать/записать, что противоречит ТЗ | Обычные admin-page gates; открытые actions остаются |
| Материнская линия, женщина | Та же общая логика | Та же | Нет подтверждения роли мамы/child relation; server не отделяет чужого | Пол не должен определять admin роль |
| Завершённый/advanced гиюр | Отдельных новых прав нет | Нет разграничения | Нет политики мамы этих групп | Окончательные права **AMBIGUOUS D01–D03** |
| Третий новый ответ | Не существует как ветка; старое «Интересуюсь» не ограничивает getters | Запись не проверяет status | Ограничения отсутствуют | Анкета сама по себе не даёт admin роль, отдельные дыры существуют |
| Admin/superadmin | Часть page/action guards читает свежую роль из DB | Универсальный handler с теми же дефектами | Есть moderation статусов Kids, нет полного exception/audit | Некоторые guards корректны; альтернативные actions их обходят |
| Author / legacy `user` | Общая auth логика | Без отдельного допуска | Без отдельного правила | Chat UI выбирает AdminView для любой не-client роли; server notification checks недостаточны |
| App-blocked | Отдельная app-функция не найдена | N/A для отсутствующего модуля | N/A | Блокировка Clerk tenant runtime не тестировалась |

Положительные контроли: `actions/role.ts:updateUserRole` требует свежий superadmin; часть event participant/Kids moderation — admin/superadmin; два own children update ограничены session ID; author profile update и отдельные author deletes имеют ownership. Изолированные отрицательные контроли отказали гостю/обычному пользователю. Это локальные правильные участки, которые не компенсируют параллельные unsafe входы.

Роли в защищённых handlers читаются из БД на вызове, что лучше доверия устаревшим client props. Однако gender/admission там не проверяются. `deleteAuthorProfile` меняет роль на `user`, а layout onboards только `client`; полный allowlist ролей и понятная модель chat нужны до новой политики. Изменение пола/статуса/роли из общего payload должно быть разделено; spreads ограничены известными ORM колонками, подтверждённой SQL-инъекции не найдено.

## Данные, защита БД и переход

Схема содержит 16 таблиц: users/author_profiles; events/categories/participants; services/categories/participants; tasks/notifications; news/categories/comments; videos; bot_settings; kids_applications. Дети хранятся JSON-массивом в users и snapshots kids заявок; отдельной нормализованной family/child entity нет. FK существуют для основных сущностей, но каскады могут удалять историю. Роли/статусы/цены/dates в основном text/varchar; TS enum не является PostgreSQL CHECK. Email не unique; стабильных payment/order/occurrence ID нет.

Подключённая БД имеет все объявленные таблицы/колонки и telegram unique index, хотя Git SQL этого не воспроизводит. В live нет 2 декларативных FK `news.author_id→users` и `news_comments.user_id→users`; `videos.created_at` с timezone при декларации без timezone, дополнительная bot-settings колонка. Метаданные журналов прочитаны: `drizzle.__drizzle_migrations` содержит 17 записей, `supabase_migrations.schema_migrations` — 0. Версии/хеши записей с SQL-файлами не сопоставлялись; число 17 не доказывает соответствие какой-либо ветке. Применять обе SQL-истории/генерированный destructive diff нельзя. Старые Supabase 0005/0006 содержат DROP CASCADE; это риск повторного применения, не установленный исторический инцидент.

На всех 16 live public tables RLS=true, force=false, public policies=0, anon/auth SELECT grants есть. Поэтому **утечка таблиц через anon Data API не доказана**: без разрешающих policies RLS не разрешает строки обычной роли. Server connection имеет BYPASSRLS=true, и RLS не закрывает A02–A07. Storage — отдельный случай: public events/images buckets, без bucket-specific MIME/size restrictions (платформенные общие лимиты не проверены); PUBLIC INSERT/SELECT policy на events без owner/role. Дополнительно подтверждены INSERT/SELECT grants роли anon на storage.objects и включённый RLS. Публичных views/materialized views в схеме public нет; найдена SECURITY DEFINER функция `rls_auto_enable` с return type `event_trigger`, связанная с enabled DDL trigger `ensure_rls`. Её прямой RPC-обход не утверждается: тело/вызов не тестировались, тип event_trigger не равен обычной пользовательской функции. Реальных файлов audit не загружал. Это не публикация service key в браузер: привилегированный ключ в upload handler серверный, но сам handler открыт.

| Безопасные агрегаты DB-RO | Значение и применение |
|---|---|
| Пользователи | 175; complete=54; status missing=121; unknown по списку 7 legacy вариантов 0 |
| Пол | Колонки нет; число мужчин/мам/детей отцов установить нельзя |
| Дети | 15 profiles, 28 JSON entries, invalid container=0; это не подтверждённые 28 нормализованных child identities |
| Email | 1 группа повторяющихся нормализованных email; это не доказательство одной и той же личности, автоматическое слияние недопустимо |
| Events/registrations | 7 events, 42 registrations; paid=11/pending=6/abandoned=0/прочие 25; actual duplicate event/user groups=0 |
| Детские/услуги | 36 kids applications; service participants=0 |
| Исторические child_N | В event extraData текущих совпадений 0; потенциальная ошибка идентичности A16 подтверждена моделью, накопленная порча не доказана |

Нельзя выводить достоверность оплаты только из `paid`: имеются обход суммы и unsigned callback. Нельзя массово заменить 25 иных исторических статусов, отказать 121 старому профилю, угадать пол/статус по имени/email, перенести детей матери либо отметить отцов неевреями. Нужны D01–D10, сохранение истории, отдельная сверка денежных обязательств, additive schema и dry-run/backup/rollback. Подробный порядок: [REMEDIATION_PLAN](REMEDIATION_PLAN.md).

## Каналы закрытых данных, OAuth и кеш

Полный event object передаётся гостевому client boundary, metadata содержит description/image, homepage/catalog/JSON-LD/sitemap публикуют события. Это не исправляется blur, hidden class, robots или отсутствием кнопки. Точный публичный DTO/OG остаётся D08. Synthetic render проверил props и metadata, а не перехваченный Flight payload. Публичный HTTP snapshot подтверждает event links/images/meta на неизвестном SHA; actual streamed RSC/prefetch/cache cross-user не проверены. RSS/ICS/import endpoints не найдены, не предполагаются.

News getters раскрывают draft/связанные full users, видео-list не фильтрует публикацию; это отдельные существующие дефекты конфиденциальности контента, независимо от публичного preview события. Storage URL публичны, случайное имя не ограничивает чтение. Полная проверка содержимого хранилища не проводилась, файл ребёнка/чувствительная фотография в публичном bucket не утверждается без доказательства.

Next Server Actions должны повторно проверять actor/право; page gate не переносится на action. Framework предоставляет POST/origin protections, но они не заменяют авторизацию. Подтверждённой SQL-инъекции/универсальной CSRF дыры не установлено; Drizzle использует параметризацию. GET `/api/telegram/remind` имеет внешний эффект рассылки и проверяет cron Authorization, с оговорками A18; это отдельный контракт, а не отсутствие GET-действий вообще. Публичные webhooks также имеют отдельный контракт подлинности. [Официальная модель безопасности Next](https://nextjs.org/docs/app/guides/data-security) описывает эти границы.

Google strategy explicit в direct event, return URL создаётся внутренним `/events/<id>`. Desktop SignIn — общий Clerk modal, настройки провайдеров/новый аккаунт/отмена/replay/linking не проверены. Raw body defect Svix webhook не выдаётся за провал OAuth callback. Дубли email в БД требуют проверки связывания, но не доказывают взлом или неправильный linking одной личности.

Публичный HTTP home/event вернул private,no-cache,no-store; это не доказательство отсутствия всех CDN/cache рисков. `revalidatePath` используется, собственный server cache с admission key не найден. Persisted event/service intent глобальный без account/expiry/reset; event writer не найден в активном коде, поэтому его cross-account replay — риск старого localStorage. Service intent writer активен. Logout/back/account switch браузером не проверены. Отложенный replay/уведомление должен использовать текущие права там, где создаёт новое действие; уже принятый платёжный callback должен корректно финализировать существующий заказ по отдельному контракту, не создавать новый допуск.

## Надёжность, производительность и эксплуатация

Штатный lint не запускает ESLint из-за удалённой команды `next lint`. Typecheck проходит. В изолированном build код компилируется, затем статическая страница `/contact` через layout зависит от БД и падает; sitemap откатывается к static routes. Это показывает границу отказа/зависимость сборки, а не доказанную поломку production. Собственных файлов `error.tsx`/`loading.tsx`/`not-found.tsx` в найденном дереве нет; штатные Next notFound-вызовы для отсутствующего объекта имеются; соответствующие сообщения/optimistic состояния оценены в UI-10. Сборка с синтетическим seed и полноценная browser→DB проверка нужны в этапе исправлений.

Некоторые list/getAll не ограничены, authors admin делает N+1 counts; DB client использует default pool без явного бюджета и statement timeout. Применимость индексов и пагинации описана в data notes. Измерения p95/EXPLAIN/нагрузки не проводились; при текущих доступных объёмах нельзя объявить масштабный performance инцидент или готовность к тысячам пользователей. Рекомендация измерения и точечной оптимизации — **дополнительное улучшение**, не повод менять стек или вводить новый сервис.

Telegram cron задан в неправильно названном файле, фактическая настройка/история запусков Vercel неизвестны. Внешние отправки и callback retry не имеют достаточной идемпотентности/честных delivery результатов. SMTP/Telegram/payment errors могут содержать контакты/payload в логах или raw error клиенту — подтверждено местами кода, реальные логи/PII не извлекались. Нужны минимальные redacted errors и correlation, журнал административных исключений и подтверждённый процесс повторов без нового провайдера.

В репозитории нет описанных CI/deploy/migrate/backup/restore и rollback шагов. Хостинг Vercel подтверждён только публичным server header; нет подтверждения deployed SHA, environment mapping, лимитов, backups/PITR, мониторинга, восстановления и provider dashboard permissions. Отсутствие документации не означает отсутствие услуг провайдера. Восстановление/rollback данных должно проверяться отдельно от отката кода; аудит не менял внешнюю конфигурацию.

## Что мешает выпуску и порядок исправлений

До изменения бизнес-допуска необходимо устранить tracked secrets, role/data/chat/bot-setting bypass, закрыть CRUD/ownership, исправить стоимость и подлинность оплаты, воспроизводимость схемы и применимые runtime advisory. Эти работы не зависят от решения о гиюре. Выпуск только новой визуальной анкеты оставит все перечисленные обходы.

Владелец должен утвердить D01–D10: права completed/advanced гиюра по каждому действию, достаточное подтверждение, правила мам/детей, отдельное исключение вместо искажения статуса отца либо явно согласованный иной вариант, переход старых профилей/истории/оплат, Google linking/editing, публичный preview и судьбу отказного лида/draft. Модерация всех профилей не добавляется как уже принятое требование.

Затем — совместимая модель данных/стабильные дети/идемпотентность, новая анкета и guest pages, единая server policy всех путей, manual exception/audit, состояния ошибок/доступность, regression на seeded PostgreSQL/Clerk/payment sandbox и восстановление из backup. Полный план с зависимостями, критериями приёмки, миграциями и откатом: [REMEDIATION_PLAN](REMEDIATION_PLAN.md).

Для оставшейся приёмки минимально нужны deployed SHA/settings, изолированные test tenants/sinks и утверждённая матрица прав. Без этого не подтверждены OAuth/session/cache E2E, реальные платежные callbacks/delivery, PostgreSQL concurrency/restore и эксплуатационные лимиты. Проведённый аудит завершён по доступным коду, документам, read-only среде и безопасной изолированной диагностике; эти конкретные ограничения сохранены в [TEST_MATRIX](TEST_MATRIX.md).

Материалы: [SPEC_COMPLIANCE](SPEC_COMPLIANCE.md), [SPEC_DECISIONS](SPEC_DECISIONS.md), [TEST_MATRIX](TEST_MATRIX.md), [REMEDIATION_PLAN](REMEDIATION_PLAN.md); подробные доказательства — [server](notes/SERVER_SECURITY.md), [UI](notes/UI_SPEC.md), [data/integrations](notes/DATA_INTEGRATIONS.md).
