# Данные, миграции, интеграции и эксплуатация

Дата: 2026-10-20 (Asia/Jerusalem). Источник кода: `main`, `c43b0d5`; рабочие продуктовые файлы не изменялись. Это специализированные доказательства к общему аудиту, а не отдельная матрица полного ТЗ. Документы ТЗ и остальные направления сводятся в основных материалах аудита.

Проверены все 4 SQL-файла `drizzle`, все 17 SQL-файлов `supabase/migrations`, оба журнала и конечные snapshots, актуальная `lib/db/schema.ts`, DB-клиент, все 4 API routes, Telegram/WhatsApp/notification/bot-settings actions, SMTP в профиле, оба пути загрузки Storage, связанные места регистрации и чтения семейных данных. Продуктовый код, реальные данные, внешние сообщения и настройки сервисов не изменялись. Внешняя сеть использовалась только для чтения официальной документации.

## Границы доказательств

- Анализ кода и изолированные тесты относятся к указанному commit; соответствие production этому commit неизвестно.
- Этот исполнитель не подключался к БД/провайдерам. После первичного анализа основной исполнитель предоставил `evidence/db-readonly.json`: метаданные и агрегаты подключённой через локальный `.env.local` БД, прочитанные в транзакции `READ ONLY` (режим `on`). Эти результаты сверены ниже отдельно. Принадлежность этой БД production/конкретному deployment **не установлена**. Доставляемость, внешние callbacks, cron, бэкапы и реальные загрузки не проверялись.
- Секреты и персональные данные здесь не приводятся. Наличие tracked `.env`/`.env.local` рассматривается в общем отчёте, изолированные тесты их не загружают; read-only script использует DATABASE_URL только в памяти для подключения, не выводя его.
- Скрипт `diagnostics/data-integrations.cjs` транспилирует реальные тела TS-функций и подставляет in-memory DB, auth, Storage, Telegram, SMTP и fetch. Ни один тест не обращается к действующей БД/провайдерам. Его 10 результатов `CONFIRMED_IN_ISOLATED_MOCK` подтверждают наличие дефектного поведения в функциях, не успешность защиты и не HTTP/E2E-проходимость в production. Клиентское получение action ID и действующие deploy middleware не тестировались.
- Сопоставление схемы выполняется `diagnostics/schema-diff.cjs`, результат сохранён в `diagnostics/schema-diff.result.json`; SQL дополнительно прочитан целиком. Скрипт сравнивает оба snapshots и отдельно предоставленные live metadata, не подключается к БД. PostgreSQL DDL не применялся.

## Карта модели данных

| Сущность | Структура и связи | Существенные ограничения |
|---|---|---|
| `users` | PK текст: Clerk ID либо `tg_<chat>`; email, role, профиль, nullable `jewish_status`; `children_data` JSONB | Нет пола, подтверждения/версии анкеты, отдельного допуска, типизированного статуса; email не unique; только декларация unique `telegram_chat_id_idx` без SQL-миграции |
| `author_profiles` | UUID PK; `user_id` FK users cascade + unique; slug unique | Явные FK/unique есть в Drizzle-ветке; отсутствует в Supabase-ветке |
| `events`/`event_categories` | Текстовые PK; category FK `NO ACTION`; даты, время и цены как text | Нет числового денежного поля/валюты, ограничений диапазона, вместимости, occurrence ID для повторяющегося события; `is_registration_closed` nullable |
| `event_participants` | PK текст; event/user FK cascade; nullable JSONB `extra_data`; статус text | Нет unique `(event_id,user_id)`/occurrence, payment/order ID, amount/currency snapshot, идемпотентности или истории переходов |
| Семья/дети | `users.children_data` массив `{name,dateOfBirth}`; выбор `extra_data.family.child_<index>` | Нет child PK/FK, family membership, verified ownership, истории идентичности; выбор привязан к позиции в изменяемом массиве |
| `kids_applications` | UUID PK; nullable user FK `SET NULL`; parent/contact snapshot, JSONB детей, status text | Таблица вообще отсутствует в обеих SQL-историях; anonymous заявки разрешены текущим action; это не нормализованные профили детей |
| `services`/`service_categories` | Текстовые PK; category FK `SET NULL`; `is_active` | Цена text; регистрация не проверяет активность услуги |
| `service_participants` | PK текст; service/user FK cascade; телефон/status | Нет unique service/user и индекса FK/времени; check-then-insert вне транзакции |
| `tasks` | PK текст; creator/assignee users FK, event FK, все `NO ACTION` | Нет справочника/CHECK status; индексов для доски нет |
| `notifications` | PK текст; recipient users cascade, sender users `SET NULL`; произвольные type/link/text | Совмещает CRM chat и системные уведомления; нет DB ограничений отправителя/владельца и индексов на recipient/sender/time/read |
| `news`/`news_categories`/`news_comments` | UUID PK; slug unique; news author/user comment FK `NO ACTION`; категории и комментарии связаны | `status` и `is_published` — два источника состояния; varchar enum в TS не создаёт PostgreSQL CHECK; moderation поля не мигрированы |
| `videos` | UUID PK; nullable author FK `SET NULL`, status + is_published | moderation/category поля не мигрированы; в Supabase-ветке нет всей таблицы |
| `bot_settings` | Текст PK, сообщения/ссылки/группа/topics | Не singleton в БД; `findFirst()` без порядка, update без where; group/topics не мигрированы |

Всего актуальная декларация содержит 16 таблиц. FK связей для `children_data`/`extra_data` нет, поскольку это JSON. В SQL не найдены CHECK ограничения ролей, статусов, JSON shape, цены, количества гостей или возраста. PK, unique slug/author и FK присутствуют согласно таблице. Отсутствие дополнительных индексов — подтверждённый факт схемы; фактическая деградация производительности без объёмов и EXPLAIN не доказана.

## Обе истории миграций

`drizzle.config.ts:3-11` указывает `out: './drizzle'`; команды миграции и схема релиза в `package.json:6-11`/README отсутствуют. Ветка Supabase содержит отдельную старую последовательность; это не продолжение Drizzle-ветки. Обе начинаются с `CREATE TABLE users/events/...` без `IF NOT EXISTS`, поэтому накатывать обе подряд на одну БД нельзя.

| Файлы | Итог чтения |
|---|---|
| `drizzle/0000_sudden_living_lightning.sql:1-164` | Базовые 13 таблиц; profile поля ранней версии; базовые FK; без RLS enable/policies |
| `drizzle/0001_shallow_doctor_faustus.sql:1-2` | Добавляет `jewish_status`, `agreed_to_privacy` |
| `drizzle/0002_massive_wilson_fisk.sql:1` | Добавляет nullable `is_registration_closed` |
| `drizzle/0003_chemical_falcon.sql:1-34` | Добавляет author_profiles/videos; FK news author и comment user; итого 15 таблиц |
| `supabase/.../0000_large_magus.sql:1-47` | users/events/notifications/tasks; первоначально email unique, users.updated_at и date timestamptz |
| `0001_black_hydra.sql:1-13`; `0002_mixed_wiccan.sql:1-10`; `0003_daffy_omega_red.sql:1` | event_categories, ранние event поля и event_participants/phone |
| `0004_melodic_gamora.sql:1-20` | service_categories/services |
| `0005_demonic_hairball.sql:1-52` | Создаёт kanban и service_participants; УДАЛЯЕТ notifications/tasks CASCADE; снимает email unique, меняет FK/default/timezone |
| `0006_dear_madame_hydra.sql:1-48` | Возвращает пустые notifications/tasks; УДАЛЯЕТ kanban и service_participants CASCADE; возвращает email unique и часть прежних defaults |
| `0007_flaky_freak.sql:1-11`; `0008_steady_vargas.sql:1-8` | Возвращает пустые service_participants; меняет категории, timezone и FK SET NULL |
| `0009_freezing_kabuki.sql:1-10`; `0010_fixed_morph.sql:1-6`; `0011_greedy_rumiko_fujikawa.sql:1` | Снова снимает email unique, добавляет профиль, sender/type notifications, tags |
| `0012_worried_bedlam.sql:1-12`; `0013_smiling_the_liberteens.sql:1-24`; `0014_real_ultron.sql:1-12` | bot_settings, telegram ID, news/comments/categories |
| `0015_open_harry_osborn.sql:1-5`; `0016_lean_justice.sql:1-3` | Меняет date на text, is_free/audience, recurring; итого 13 таблиц |

Разрушительные операции 0005/0006 уже присутствуют в истории: это риск её повторного применения к данным, а не доказательство произошедшей потери production данных. Нельзя переписывать историю, предварительно не установив реальные journal IDs и состояние БД.

Конечная Drizzle snapshot отстаёт от актуальной схемы на **14 колонок**, **1 таблицу** и **1 unique index**:

| Таблица | Нет в `drizzle/meta/0003_snapshot.json` и её SQL-истории |
|---|---|
| users | spouse_name, children_data, username; unique telegram_chat_id_idx |
| events | child_price, payment_url |
| event_participants | extra_data |
| news | status, rejection_reason |
| videos | status, rejection_reason, category |
| bot_settings | notification_group_id, events_topic_id, services_topic_id |
| kids_applications | вся таблица |

Supabase snapshot также не содержит author_profiles/videos и `users.jewish_status/agreed_to_privacy`, `events.is_registration_closed`; в ней отсутствуют актуальные FK news author/comment user. У обеих конечных snapshots `isRLSEnabled=false` для всех таблиц. В SQL нет `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`, bucket setup/grants. Это отсутствие воспроизводимых мер защиты в репозитории, **не состояние подключённой БД**.

### Подключённая БД: метаданные и агрегаты READ ONLY

Источник: `evidence/db-readonly.json`, полный machine-readable diff — `diagnostics/schema-diff.result.json:observedDatabase`. Реальные строки пользователей, payloads и значения секретов не извлекались в этот отчёт.

- Все 16 таблиц и все колонки актуальной декларации присутствуют; `telegram_chat_id_idx` существует. Поэтому не утверждается, что текущая подключённая БД не поддерживает kids/семейные поля: дефект DI-08 — невоспроизводимость SQL-историй и drift.
- В live отсутствуют FK `news.author_id → users.id` и `news_comments.user_id → users.id`, хотя они заданы `schema.ts` и `drizzle/0003:33-34`. Проверка сиротских строк не выполнялась. Последствия: контент допускает несуществующего автора/комментатора, удаление user не блокируется этими конкретными связями. FK tasks присутствуют.
- `videos.created_at` live = `timestamp with time zone`, декларация = `timestamp without time zone`; nullability совпадает для всех объявленных колонок. Live содержит дополнительную `bot_settings.admin_notification_chat_id`, отсутствующую в декларации. Live `notifications.id` имеет DB default `gen_random_uuid()::text`, тогда как declaration использует runtime `$defaultFn`. Сравнение varchar length не выполнено: метаданные не содержат length.
- На всех 16 таблицах RLS **включён**, `FORCE RLS=false`; public policies = 0; anon/authenticated имеют SELECT grants. Для обычных ролей включённый RLS без policies не разрешает строки; прямую утечку public таблиц через anon Data API это не доказывает. Server DB role имеет `BYPASSRLS=true`, поэтому RLS не компенсирует незащищённые server actions DI-01/02. HTTP Data API запросы не выполнялись, exposed schemas не установлены.
- Storage buckets `events` и `images` public=true, `file_size_limit=null`, `allowed_mime_types=null`. На `storage.objects` найдены PUBLIC INSERT и SELECT policies только с условием `bucket_id='events'`, без user/role/owner. Это подтверждённое разрешение anon upload/list для events при обычном API доступе; реальные файлы не загружались. Для images service_role путь DI-04 обходит RLS. Проектные/global HTTP лимиты этими null не отменяются.
- Пользователей 175, complete=54; `jewish_status` отсутствует у 121, unknown legacy статусов по проверенному списку=0; отдельной gender колонки нет. Есть 15 профилей с детьми, всего 28 JSON entries, invalid JSON container=0. Дубликатных email групп=1; это не обязательно дубликаты личности, email не unique по текущей модели.
- Регистраций событий 42: paid=11, pending=6, abandoned=0, прочие статусы=25. Групп duplicate `(event,user)`=0; child_N references по выполненному aggregate=0, поэтому историческая порча детей DI-10 в накопленных регистрациях **не подтверждена**. Kids заявок 36, service registrations0. Нельзя массово заменять прочие статусы 25 на pending или отменять paid11 при внедрении фильтрации.

Дополнительная read-only инвентаризация: public views/materialized views отсутствуют; пользовательских row triggers public не найдено. SECURITY DEFINER `public.rls_auto_enable` имеет возвращаемый тип `event_trigger` и связан с enabled DDL event trigger `ensure_rls`; это не доказанный пользовательский RPC обход, тело и исполнение функции не проверялись. Метаданные платформенных event triggers сохранены в JSON без их тел. `anon` имеет INSERT/SELECT grants на storage.objects, RLS включён — разрешающая events policy подтверждена отдельно от наличия grants. В журнале `drizzle.__drizzle_migrations`17 записей, в `supabase_migrations.schema_migrations`0; версии/хеши не сверялись с обеими SQL-ветками, по количеству нельзя выбрать каноническую историю.

Дополнительный **P2 drift**: отсутствующие live FK авторства и несовпадение типа времени требуют reconcile после orphan/timezone inventory. Минимальный fix — добавить FK после проверки/разрешения сирот и явно выбрать timezone semantics; тест удаления/создания автора и round-trip даты. Это отдельное доказательство DI-08, не основание немедленно применять сгенерированный schema diff.

## Карта интеграций

| Вход/модуль | Фактический поток и проверка |
|---|---|
| Clerk `POST /api/webhooks/clerk` | Svix headers + signature verify присутствуют; upsert user и удаление; raw body преобразуется; primary email берётся как `[0]`, не по primary_email_address_id; privileged email hardcoded; no webhook event journal/order version |
| Shutafim `POST /api/webhooks/shutafim` | body reference/status → update participant; без auth/signature/order/amount/merchant matching; GET health |
| Telegram `POST /api/telegram/webhook` | При наличии bot token любой JSON передаётся в Telegraf; /start создаёт tg_ профиль; callback «Я приду» отправляет сообщение админу, не создаёт event_participants; GET health |
| Telegram `GET /api/telegram/remind` | Bearer CRON_SECRET, чтение settings и всех telegramChatId, неограниченный Promise.all sendMessage; результаты HTTP не проверяются |
| Telegram actions | sendBroadcastMessage проверяет auth+DB role admin/superadmin; sendEvent/ServiceRegistrationNotification не проверяют caller, отправляют контактный TXT в settings group/topic; raw user/event strings в HTML |
| WhatsApp action | Caller задаёт произвольные recipients/template; сервер использует API URL/token из env; auth/role отсутствуют; 500ms delay на получателя |
| SMTP | После сохранения полной анкеты синхронный Gmail SMTP sendMail; ошибка попадает в общий catch как ошибка анкеты |
| Storage событий/услуг | Browser Supabase anon client, upload в events, затем getPublicUrl; Clerk session не передаётся как Supabase JWT; лимиты/policies не описаны |
| Storage новостей | Server action и Supabase service_role, upload в images/news; caller auth/role/type/size check отсутствуют |
| Notifications/CRM | Большинство exported actions читают/меняют произвольные переданные IDs; часть проверяет только наличие Clerk user; только sendClientMessage устанавливает sender из сессии |

`middleware.ts:5-10` вызывает `auth.protect` только для `/admin(.*)` и `/dashboard(.*)`; API выше не закрыты этой проверкой. Доступ к странице админки не заменяет проверку внутри экспортируемого server action.

## Подтверждённые замечания

### DI-01 — Настройки адресата контактных Telegram-файлов меняются без полномочий

- **P0; уверенность высокая; исправление обнаруженного дефекта.** `actions/bot-settings.ts:updateBotSettings:7-18` не обращается к auth, принимает `any`, spread всех полей и делает update без where. Админская страница `app/dashboard/telegram/page.tsx:9-16` защищена, сам action — нет.
- **Факт/воспроизведение:** `DI-BOT-UNAUTHENTICATED-UPDATE-ALL` вызывает действие без сессии, меняет synthetic notificationGroupId и получает success. `actions/telegram.ts:80-115,138-173` затем отправляет контактные файлы в этот адресат. Получение реальных данных на чужой Telegram не проверялось; доставка зависит от доступа бота к выбранной группе.
- **Влияние/причина:** несанкционированное администрирование, отключение или перенаправление будущих заявок с контактами; доверие к защите страницы, отсутствие server authorization, singleton/allowlist.
- **Минимальное исправление:** auth+DB admin/superadmin в действии, strict schema разрешённых полей/ID, update конкретного singleton ID, audit actor и before/after. Запретить смену произвольных колонок.
- **Тест/зависимости:** anonymous/client/author не могут прочитать/поменять настройки; admin меняет одну строку; неизвестные поля отклоняются; отправка использует разрешённый адресат. От решений религиозного допуска не зависит.

### DI-02 — Чужая переписка и уведомления доступны по переданным ID

- **P0; уверенность высокая; исправление обнаруженного дефекта.** `actions/notification.ts:getUserNotifications:10-16`, `createNotification:24-42`, `markAsRead:85-90`, `markAllAsRead:100-105`, `deleteNotification:114-116`, `getNotificationHistory:125-138`, `getMyChatHistory:148-159`, `getConversation:265-285` не проверяют сессию/ownership. `sendBulkCrmMessages:55-72`, `getActiveChats:202-232` проверяют только login, а не role.
- **Факт/воспроизведение:** isolated `DI-NOTIFICATIONS-FOREIGN-READ-DELETE-CREATE` читает synthetic чужое сообщение, удаляет чужой ID, создаёт сообщение с подставным senderId без сессии. Источник ожидания: конфиденциальность личного/административного общения и требования пользовательского промпта к серверной модели доступа.
- **Влияние/причина:** чтение контактного/личного содержания, подделка сообщений от другого пользователя/администратора, изменение read state и удаление переписки; ID из клиента используется как полномочие.
- **Минимальное исправление:** получателя/отправителя обычного пользователя выводить из auth, SQL ограничить owner/session, staff routes защищать явной allowlist ролей; убрать публичный универсальный createNotification, выделить внутренний server helper.
- **Тест/зависимости:** Alice не читает/удаляет Bob, не подделывает sender; обычная роль не вызывает CRM bulk/activeChats; системный helper недоступен как клиентский action. Учесть роли `client/author/user/admin/superadmin`, не давать права по условию «role !== client».

### DI-03 — WhatsApp шлюз вызывается без авторизации

- **P1; уверенность высокая; исправление обнаруженного дефекта.** `actions/whatsapp.ts:sendMassWhatsApp:19-85`: нет auth/role/recipient allowlist и лимитов; автор отправки задаёт произвольные номера/текст.
- **Факт:** `DI-WHATSAPP-UNAUTHENTICATED-SEND` подтверждает попытку fetch с серверным token без сессии; fetch замокан, реальное сообщение не отправлялось. Источник: разграничение административной рассылки.
- **Влияние/причина:** злоупотребление внешним аккаунтом и рассылка от имени центра; sender доверяет клиентским recipients. Последовательный delay не ограничивает число параллельных запусков.
- **Исправление/тест:** server auth+staff allowlist, адресаты по разрешённым DB записям, ограничение размера/частоты и audit; unprivileged вызов не делает fetch, admin получает честные delivery результаты. Независимо от ТЗ.

### DI-04 — Service role Storage upload открыт без auth и ограничений файла

- **P1; уверенность высокая; исправление обнаруженного дефекта.** `actions/news.ts:uploadImageAction:207-235` принимает произвольный file и делает upload через service_role; не проверяет сессию, авторскую роль, MIME/content/size. Не утверждается утечка самого service key в браузер: в коде он серверный.
- **Факт:** `DI-STORAGE-UNAUTHENTICATED-SERVICE-ROLE-UPLOAD` без сессии передаёт synthetic `.html` большого заявленного размера и получает success от mock Storage. Live metadata дополнительно подтверждают: images/events public, bucket size/MIME constraints=null; PUBLIC INSERT policy разрешает любому добавлять объекты в events. Для отдельного пути `supabase/storage.ts:11-16` это означает разрешённую anon загрузку без Clerk прав; реальные uploads не делались. [Supabase Storage](https://supabase.com/docs/guides/storage/security/access-control) указывает, что service key обходит RLS.
- **Влияние/причина:** storage/cost abuse, хранение произвольного контента под доменом проекта; доверие к UI и использование привилегированного client без server policy.
- **Исправление/тест:** auth+роль/право автора, лимиты фактического File, проверка сигнатуры/типа, server-generated safe extension и scoped path, частота; тест anonymous/client отказ до SDK, разрешённый image проходит, oversized/html отклоняются. Проверить bucket limits/policies в тестовом окружении отдельно.

### DI-05 — Неподписанный Shutafim JSON произвольно меняет paid/abandoned

- **P1; уверенность высокая; исправление обнаруженного дефекта.** `app/api/webhooks/shutafim/route.ts:POST:6-55` не проверяет подпись/секрет/merchant/order/currency/amount, обновляет по participant ID. Публичность API подтверждает middleware. Нет payment journal и переход paid→abandoned не запрещён.
- **Факт:** `DI-PAYMENT-UNSIGNED-PAID-THEN-DOWNGRADE`: POST без headers с synthetic reference + paid даёт update paid; повтор failed даёт abandoned, оба 200. Реальные запросы провайдеру не делались.
- **Влияние/причина:** бесплатное подтверждение оплаты, утрата подтверждения от позднего/поддельного callback, рассогласование билетов; arbitrary body считается истиной об оплате.
- **Исправление:** получить подтверждённый контракт Shutafim, валидировать подлинность callback и при необходимости перепроверять transaction через API; server order/expected amount/currency/merchant, unique provider event/transaction ID; атомарный state transition и ledger. Не придумывать неподтверждённый алгоритм подписи провайдера.
- **Тест/зависимости:** unsigned/tampered/wrong amount/unknown order отказ без update; валидный success один раз; replay безопасен; stale failure не отменяет paid. Нужны sandbox credentials и спецификация callback; решение по ТЗ не требуется.

### DI-06 — Telegram принимает поддельные webhook updates

- **P1; уверенность высокая; исправление обнаруженного дефекта.** `app/api/telegram/webhook/route.ts:POST:162-172` не проверяет secret header, источник и update ID/idempotency; наличие собственного bot token проверяет только конфигурацию сервера. /start:74-88 создаёт пользователя из входного chat/from; callback:115-142 отправляет сообщение группе.
- **Факт:** `DI-TELEGRAM-UNSIGNED-UPDATE-ACCEPTED` передаёт synthetic update без Telegram secret и достигает handleUpdate. Это доказывает принятие входа, не реальную отправку.
- **Влияние/причина:** поддельные tg_ профили, ложные отметки «приду», внешние ответы/спам в пределах прав бота; источник запроса не аутентифицирован. Даже повторная настоящая callback не имеет дедупликации.
- **Исправление/тест:** настроить и валидировать `X-Telegram-Bot-Api-Secret-Token`, strict update schema/size, dedupe update_id, связывание TG/Clerk только через одноразовый проверенный flow. [Telegram setWebhook](https://core.telegram.org/bots/api#setwebhook) документирует secret_token. Неизвестный/отсутствующий token и replay не дают DB/network side effects. Настройку провайдера делать отдельным авторизованным этапом.

### DI-07 — Штатная запись из кабинета помечает платное событие paid без оплаты

- **P1; уверенность высокая; исправление обнаруженного дефекта.** `components/dashboard/events/event-card.tsx:handleRegister:99-114` вызывает `actions/event.ts:registerForEvent` без totalAmount. В action `initialStatus:452` выбирает paid при отсутствии/нуле суммы, `paymentUrl:496-497` остаётся null. Вся сумма от клиента, сервер не пересчитывает цену/состав/количество.
- **Факт:** `DI-EVENT-OMITTED-AMOUNT-PAID-AND-PARALLEL-DUPLICATES` использует событие isFree=false/price=100, вызывает реальную функцию без totalAmount и получает paid + paymentUrl null. Это согласуется со штатным вызовом EventCard. Прямой клиент также может передать 0/отрицательную/неверную сумму.
- **Влияние/причина:** финансовый обход основного сценария; наличие суммы в необязательном параметре заменяет server quote и признак free.
- **Исправление/тест:** цена/валюта/количество и доступ рассчитываются сервером по событию и валидированным участникам; статус paid только от подтверждённой оплаты либо явно бесплатного события. Пройти оба UI пути, missing/negative/NaN/подменённая сумма не даёт paid. Минимально не полагаться на передачу totalAmount из одного UI.

### DI-08 — Текущую схему нельзя воспроизвести ни одной SQL-историей

- **P1; уверенность высокая; исправление обнаруженного дефекта.** Файлы и полный diff указаны выше; `drizzle.config.ts:4-5`, `lib/db/schema.ts:33-43,107-108,131,242-247,281-295,316-318,377-390`.
- **Факт:** schema-diff даёт 14 missing columns, kids_applications и telegram index для используемой Drizzle-ветки. В обеих ветках нет CREATE kids_applications. SELECT всех полей users/events и kids inserts после чистого применения миграций обращаются к несуществующим колонкам/таблице. Подключённая live БД содержит недостающие поля/таблицу/index, но не 2 FK авторства и отличается временем videos.created_at; её deployment identity неизвестна. Изменения явно не воспроизводятся текущими историями.
- **Влияние/причина:** развёртывание/restore из репозитория не воспроизводятся; анкета, события, moderation, kids и Telegram ломаются в окружении, созданном по миграциям. Одновременно вести две несогласованные генерации без установленной baseline опасно.
- **Исправление/тест:** read-only introspection реальной схемы/journal, выбрать canonical chain, additive reconcile migration и документировать baseline; не применять обе с нуля вместе и не запускать destructive старую цепочку на живых данных. Тест чистой БД и обновления anonymized fixture, schema diff в CI.

### DI-09 — Check-then-insert не защищает от параллельных регистраций

- **P2; уверенность высокая; исправление обнаруженного дефекта.** `actions/event.ts:388-397,440-475`, `actions/service.ts:177-187`; отсутствие unique `(event_id,user_id)`/`(service_id,user_id)` — `lib/db/schema.ts:118-138,168-181` и обе SQL-истории.
- **Факт:** упомянутый event mock запускает Promise.all двух одинаковых запросов, оба создают строку. Проверяется ветвление, а не реальная PG race; отсутствие DB unique подтверждено декларацией и live indexes. В текущих данных duplicate event/user групп=0, реальный инцидент дублей не найден. Последнее место тестировать неприменимо текущему продукту: capacity поля/контроля не найдено; необходимость вместимости не утверждается без требования.
- **Влияние/причина:** дубли участников и Telegram сообщений, неоднозначные pending/payment reference; non-atomic read+insert.
- **Исправление/тест:** выбрать бизнес-ключ (event occurrence при необходимости), сначала read-only найти/разрешить исторические дубли без удаления оплат, unique constraint + atomic upsert/transaction/idempotency. 2 параллельных транзакции на синтетической PG дают одну регистрацию и один outbox event. Решение по повторным событиям требуется до ключа.

### DI-10 — Изменение массива детей меняет идентичность в исторической записи

- **P1; уверенность высокая; исправление обнаруженного дефекта и зависимость реализации нового ТЗ.** `components/events/single-event-client.tsx:205-208`, `components/dashboard/events/event-card.tsx:197-210` сохраняют позиционные child_N; `components/dashboard/applications/application-client.tsx:527-541` восстанавливает выбранных детей из текущего массива пользователя. `actions/user.ts:updateFamilyProfile:284-300` заменяет массив полностью.
- **Воспроизведение по коду:** профиль `[A,B]`, запись `child_1:true`; заменить профиль на `[B]` — выбранный ребёнок исчезнет; заменить на `[A,C]` — историческая запись покажет C. Синтетические имена, реальные семейные данные не использовались. В подключённой БД 0 текущих event rows с child_N reference по выполненному aggregate; конкретная историческая порча не обнаружена.
- **Влияние/причина:** недостоверный список детей в оплаченной/существующей регистрации, невозможно подтвердить child ownership для новых правил; изменяемый индекс используется как идентичность.
- **Исправление/тест:** стабильные child IDs, проверяемое отношение parent/child, immutable participant snapshot на момент записи; миграция только однозначных сопоставлений, неоднозначные помечать на ручной разбор. При редактировании/удалении/смене порядка детей исторический участник остаётся тем же. Требует решения про старые записи отцов и полномочия исторического просмотра/отмены; не менять религиозный статус автоматически.

### DI-11 — Cron конфигурация названа `vecel.json`

- **P2; уверенность высокая; исправление обнаруженного дефекта.** `vecel.json:1-8` — единственный tracked файл конфигурации cron; `vercel.json`/`vercel.ts` нет, альтернативный Build Output cron в репозитории не найден.
- **Факт/источник:** Vercel читает cron из [vercel.json/Build Output API](https://vercel.com/docs/cron-jobs); `vecel.json` не является указанным контрактом. Настройки настоящего проекта/факт запусков неизвестны; не утверждается, что production cron точно отсутствует.
- **Влияние/причина:** cron из репозитория не создаётся стандартным деплоем; опечатка имени файла.
- **Исправление/тест:** после проверки live settings оформить поддерживаемую конфигурацию; проверить preview build output и production cron inventory без ручного запуска реальной рассылки. `50 5 * * *` означает 05:50 UTC: 08:50 по Израилю 2026-10-20, зимой 07:50; желаемое местное время в коде не зафиксировано, это вопрос владельцу, не доказанный дефект расписания.

### DI-12 — Напоминание считает неотправленные HTTP сообщения отправленными

- **P2; уверенность высокая; исправление обнаруженного дефекта.** `app/api/telegram/remind/route.ts:27-41` не проверяет response.ok/API JSON и возвращает sent=все подписчики; Promise.all без ограничения параллелизма. `CRON_SECRET` не проверяется на наличие: строки `'Bearer undefined'` достаточно при отсутствии env (`:8-10`).
- **Факт:** `DI-CRON-MISSING-SECRET-AND-HTTP-FAILURE-SUCCESS` с пустым env и замоканным HTTP429 возвращает HTTP200 `{success:true,sent:1}`. В текущих локальных env секрет присутствует по отдельной проверке основного аудита; missing-env обход условный, не утверждается для production.
- **Влияние/причина:** ложная успешность мониторинга и потеря напоминаний при rate limit/ошибке токена; fail-open сравнение конфигурации.
- **Исправление/тест:** fail closed при missing config, проверка HTTP/API ответа, честные success/fail/retry counters, bounded concurrency и idempotency schedule+recipient. Безобидная заглушка провайдера: 401/429/500 не считаются sent, повтор расписания не дублирует доставку. Сначала закрыть DI-01/DI-06.

### DI-13 — SMTP ошибка после записи превращает успешную анкету в ошибку

- **P2; уверенность высокая; исправление обнаруженного дефекта.** `actions/user.ts:completeUserProfile:36-80` завершает DB upsert, затем `:181` ожидает sendMail и общий catch `:187-192` отдаёт success=false с error.message.
- **Факт:** `DI-SMTP-FAILURE-AFTER-PERSISTED-PROFILE` фиксирует DB write=true, sendMail throw, result.success=false. Требование: согласованная обработка ошибок и повторной отправки анкеты.
- **Влияние/причина:** пользователь повторяет уже сохранённую анкету, welcome email отправляется повторно при каждом успешном повторном save; внешняя интеграция смешана с результатом сохранения, нет outbox/delivery idempotency. В HTML имя вставляется без escaping (`:146`); логируется email (`:86,88`), в клиент возвращается исходная ошибка (`:191`).
- **Исправление/тест:** отделить success сохранения от доставки, durable outbox с уникальным welcome event и retry; escape пользовательские значения; redact logs/errors. SMTP failure оставляет подтверждённую сохранённую анкету и pending delivery, повтор не создаёт повторный welcome. Согласовать, на каком шаге новый допуск считается выданным, по SPEC_DECISIONS.

### DI-14 — Clerk signature проверяется на изменённом JSON

- **P2; уверенность высокая; исправление обнаруженного дефекта.** `app/api/webhooks/clerk/route.ts:25-36`: req.json() → JSON.stringify → verify. Контракт [Svix](https://docs.svix.com/receiving/verifying-payloads/how) требует исходный payload; пробелы/escape/числа могут измениться.
- **Факт:** `DI-CLERK-SIGNATURE-RAW-BODY-RESERIALIZATION` реальным svix подписывает synthetic pretty JSON: verify исходного body проходит, та же подпись через route получает 400. Это не доказывает сбой текущего компактного формата Clerk; показывает потерю корректности проверки для валидного запроса.
- **Влияние/причина:** валидные callbacks могут отвергаться при изменении сериализации, пользователи не синхронизируются; parsed JSON подменяет подписанные байты.
- **Исправление/тест:** req.text(), verify raw body, затем работать с verified payload; wrong signature отказ, signed compact/pretty/unicode payload принят. Непустой CLERK_WEBHOOK_SECRET обязателен при запуске; секрет в .env.local пуст по общей проверке, его production значение неизвестно.

### DI-15 — Удаление Clerk пользователя блокируется FK либо стирает историю регистраций

- **P2; уверенность высокая для поведения схемы, фактический инцидент не доказан; исправление обнаруженного дефекта.** `app/api/webhooks/clerk/route.ts:82-90` физически удаляет users; `lib/db/schema.ts:122-127,170-175` cascade стирает event/service registrations; `:187-191,249-251,265-267` tasks/news/comments `NO ACTION` могут блокировать удаление; kids user_id SET NULL (`:386`) сохраняет parent/contact JSON.
- **Воспроизведение:** по декларации синтетический user с оплаченной регистрацией и без restrictive FK удаляется вместе с записью; user с news/comment/task остаётся и callback возвращает 500. В live restrictive FK news/comment отсутствуют, tasks FK присутствуют: для live ветка блокировки относится к связанным tasks, а авторство контента может стать orphan. Это семантика PG по метаданным, live delete не выполнялся.
- **Влияние/причина:** непредсказуемая синхронизация аккаунта и необратимое удаление учётной истории в одной ветке; в другой — пользователь удалён из Clerk, но остаётся в app DB. Не определена retention/privacy policy связанных данных.
- **Исправление/тест:** согласовать retention, soft-delete/tombstone и деидентификацию без потери платёжного ledger; предсказуемая обработка контентных ссылок. Fixture со всеми FK: webhook идемпотентен, истории оплат сохранены согласно политике, повторный login не восстанавливает старые привилегии. Бизнес-решение о retention требуется.

### DI-16 — Статус paid/abandoned показывается как «Ожидает»

- **P2; уверенность высокая; исправление обнаруженного дефекта.** `components/dashboard/events/my-events-client.tsx:StatusBadge:22-52` распознаёт approved/rejected/in_progress, все остальные возвращают «Ожидает». События создаются pending/paid/abandoned (`actions/event.ts:452-474`, Shutafim route:35,50).
- **Воспроизведение:** передать status=paid либо abandoned, type=event — попадание в default. UI/E2E не запускался в этом направлении; branch подтверждён чтением кода.
- **Влияние/причина:** оплативший видит ожидание, неуспешная корзина выглядит так же; смешаны словари статусов kids и events.
- **Исправление/тест:** раздельные типизированные state machines/labels; paid/pending/abandoned/legacy имеют явное отображение. Исторические статусы инвентаризировать, не заменять массово без решения.

### DI-17 — Переписка после 100 сообщений теряет новые сообщения

- **P2; уверенность высокая; исправление обнаруженного дефекта.** `actions/notification.ts:getConversation:284-285` использует ASC + LIMIT100, вопреки комментарию «последние 100»; возвращаются самые ранние 100, без cursor pagination.
- **Воспроизведение:** 101 synthetic сообщения с возрастающим createdAt: запрос выбирает 1..100, сообщение 101 недоступно этой функции. Запрос на реальной БД не исполнялся.
- **Влияние/причина:** долгий диалог перестаёт отображать новые сообщения; неверное направление limit. `getMyChatHistory:148-159` напротив читает без лимита, это вероятный рост памяти, не измеренный инцидент.
- **Исправление/тест:** сначала авторизация DI-02, затем DESC limit с обратной сортировкой результата и cursor на историю; test>100, одинаковые timestamps с ID tie-break, pagination без дублей.

## Риски, требующие проверки окружения, а не утверждения об инциденте

| Риск/пробел | Доказательство и следующий безопасный шаг |
|---|---|
| RLS/grants | Код/SQL не воспроизводят RLS, а live RLS включён у 16 таблиц без public policies и server role bypasses RLS. Осталось проверить exposed schemas и HTTP API поведение. Не добавлять blindly `auth.uid() = users.id`: app использует Clerk текстовые IDs, не Supabase Auth UUID; JWT integration должна соответствовать архитектуре |
| Anon uploads events | `supabase/client.ts:1-6`, `storage.ts:4-28`: нет Supabase identity, используются anon permissions. Live PUBLIC INSERT policy только bucket events подтверждена; bucket MIME/size constraints отсутствуют. Следующий этап: ограничить нужными правами и проверить синтетическим upload в sandbox |
| Публичность картинок | Live buckets public=true, случайное имя не контролирует чтение. Фактические URL и чувствительность содержимого не проверялись |
| JSON shape/status/null | Live121 пользователей без jewishStatus и 25 регистраций с иными статусами; JSON container валиден по aggregate. Детальная shape/семантика/дат/количеств не проверялась; перед CHECK/backfill выполнить дополнительные агрегаты без JSON содержимого |
| DB pool/TLS/timeout | `lib/db/index.ts:5-9` использует postgres defaults без явных лимитов/statement timeout/проверки обязательной конфигурации. Connection URL, pooler/TLS и лимиты хостинга не анализировались в этом направлении; истощение соединений не доказано |
| Повторные события | Одна event row и event/user paid check без occurrence. Повторный paid блокируется на весь recurring event; бизнес-ожидание нужно уточнить до unique index/переноса старых регистраций |
| Бот не равен регистрации | Callback «Я приду» только уведомляет группу, нет participant row и допуска. Не заявлять доказанный обход записи в БД; бот показывает иной сценарий подтверждения. Нужны решение о включении бота в новый доступ и обновление устаревшего сезонного контента |
| Чувствительные логи | Shutafim `route.ts:9` пишет body целиком, Clerk logs идентификаторы, SMTP email/user env identifier и ошибки, Telegram stack details. Нужны redaction и согласованная retention, без вывода реальных логов в аудит |
| Надёжность доставок | Нет durable queue/outbox, delivery journal, retry/dead-letter/opt-out в найденных интеграциях. Для невостребованных каналов настройки могут отсутствовать; это само по себе не дефект обязательной функции. Доставляемость не проверялась |
| CI/CD/backup/restore | `git ls-files` не нашёл workflow/test suite/backup/restore/runbook; README — create-next-app starter, package scripts только dev/build/start/lint. Отсутствие repo описания не доказывает отсутствие провайдерских backups/CI. Нужны read-only список CI/deploy configuration, backup/PITR plan, retention и доказательство isolated restore; никаких реальных restore не выполнять |

## Совместимый план миграции (не выполнялся)

1. **Установить baseline.** Зафиксировать deployed commit/schema version, read-only inventory таблиц/колонок/constraints/indexes/RLS/policies/grants, migration journal обеих систем; counts null/unknown/duplicates/orphans и агрегаты статусов/платежей без PII. Сопоставить ручные schema changes и старые цепочки. Выбрать одну canonical chain, вторую документировать как историческую; не удалять/переигрывать destructive 0005/0006 на данных.
2. **Защитить существующие входы независимо от ТЗ.** Закрыть DI-01..06 и серверный платёж DI-07; ротацию скомпрометированных tracked credentials выполнить отдельным согласованным этапом. Сначала deny unauthorized до любых DB/network вызовов; pending старые платежи продолжить обрабатывать через подтверждённые order refs.
3. **Additive schema reconciliation.** Для выбранной baseline добавить отсутствующие таблицу/колонки/индекс после duplicate check; nullable новые поля без ложного религиозного default. Добавить отдельно `gender`, versioned self-declared affiliation и факт/дату заполнения; «допуск» хранить отдельно от self-report только по согласованной политике. Не считать null/legacy автоматически допущенным либо неевреем.
4. **Стабилизировать детей/родство.** Ввести стабильный child ID, parent relation/тип и участник snapshot; временно dual-read old JSON + new ID. Backfill только однозначных соответствий; child_N исторические не превращать в предположительно подтверждённую связь. Отцовские/неоднозначные записи выделить на ручной разбор; не менять jewishStatus отца ради исключения. Additive admin exception хранит actor/reason/time и не подменяет факты профиля.
5. **Отделить платежи от регистрации.** Ввести server quote/order: amount в minor units, currency, participant/occurrence reference, provider IDs и immutable state history. Реальные historical paid не пересчитать и не отменить автоматически; пометить source=legacy и сверять с провайдером через read-only export по согласованному процессу. Webhook inbox unique providerEventId, atomic state transitions, duplicate-safe outbox.
6. **Разобрать дубли до unique.** Выбрать ключ event/occurrence/user, отчёт конфликтов и ручная сверка paid/pending; не удалять финансовые записи ради индекса. После решения backfill relations и unique; для services аналогично. CHECK валидных статусов/JSON и FK добавить с безопасной фазой NOT VALID/VALIDATE после inventory; concurrent index и lock budget подобрать под реальный PG и мигратор, не помещать CONCURRENTLY в транзакцию без поддержки.
7. **Упорядочить старые статусы/политику удаления.** Карта legacy values + UI labels; отдельные state machines, retention/tombstone и ledger для удалённых аккаунтов. Пользовательские редактирование/отмена/история сохраняют согласованные права; нельзя стирать действующие оплаты при новом допуске.
8. **Переключить чтение и убрать legacy отдельно.** Сначала читаемая новая модель и совместимость старых записей, затем наблюдение/сверка aggregate counts, только после доказанной полноты запрет старых записей/обязательность новых полей. Старые JSON/колонки сохранять до согласованного срока и backup; необратимый drop не включать в первую миграцию.
9. **Проверка и выпуск.** Чистая локальная PG с canonical migrations; anonymized populated fixture с обоими известными baselines; до/после counts/register/payment totals, FK/unique checks; параллельные регистрации, callback replay/out-of-order/failure, SMTP/Telegram/Storage сбои; browser→action→DB→response в sandbox. До production — backup и отдельный restore rehearsal, конкретные deployment/rollback шаги, feature flag безопасного переключения без автоматического массового изменения статусов.

Критерии приёмки миграции: schema воспроизводима с нуля; upgrade не теряет старые заявки/оплаты; связи детей не меняют идентичность при редактировании; unknown/legacy имеют явный статус и маршрут обработки; все write/read пути используют один серверный допуск и ownership; старые платежные callbacks коррелируют с конкретным order и идемпотентны; логи не содержат секретов/контактов. Политика гиюра/допуска, старых отцовских детей, ручного исключения, lead третьей ветки и retention остаётся решением владельца, не implicit default миграции.

## Выполненные команды

```sh
node docs/audit-2026-10-20/diagnostics/schema-diff.cjs
node docs/audit-2026-10-20/diagnostics/data-integrations.cjs
```

Обе завершились с кодом 0; результаты сохранены рядом в `.result.json`. Никаких db push/migrate/seed, настоящих upload/sendMail/sendMessage, production callback/cron вызовов или нагрузочных проверок не выполнялось. Сборка/lint/audit зависимостей выполняются основным направлением отдельно.
