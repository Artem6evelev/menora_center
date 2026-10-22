# Локальная интеграция Шага 2 — 22.10.2026

## Контрольная точка

- Ветка `main`, HEAD **`6bd190107a5c7a2776e737255fe70520b7efb906`**. На старте `git status`: `nothing to commit, working tree clean`; `HEAD...origin/main` — **0 / 0**. Позднейший read-only `git ls-remote` подтвердил тот же SHA настоящего remote main.
- Создана локальная резервная ветка `safety/miniapp-step2-2026-10-22-6bd1901` на исходный HEAD. Checkout/reset/clean не выполнялись.
- Выполнен `git fetch origin feat/miniapp-identity-v1`; фактический remote HEAD **`cf1a4de86bdc45dcec38c1c6159219a85374b370`**.
- Diff от `6bd1901` содержит ровно пять разрешённых файлов: `lib/db/schema.ts`, `DESIGN.md`, `MANUAL_SQL.sql`, `PRECHECK.sql`, `POSTCHECK.sql` в этой папке. Все перенесены в текущую рабочую копию. Неожиданных remote-файлов нет.
- Локальный HEAD в этом запуске совпал с базой ветки; конфликтов с более новым локальным кодом не было. Существующие изменения предыдущих этапов, включая исправленный Google callback, сохранены. Нового коммита нет; итоговые правки находятся в незакоммиченном рабочем дереве. [Хеши и состав](evidence/checkpoint.json).

## Перенесено и адаптировано

Сохранены каноническая `users`, прежний PK/ID и все старые FK. Добавлены четыре identity-таблицы и связи ORM; `users.email` теперь nullable. Анкета, категории, пол, стадия, фильтр, семья/дети и город остаются только в `users`.

SQL удалённой ветки не был принят без проверки: исправлен некорректный `DO $`, убрана небезопасная стратегия обновления legacy-данных при повторе. Скрипт теперь проверяет реальные определения колонок/defaults/FK/checks/индексов и политики, прекращает транзакцию при несовместимости, а не считает `IF NOT EXISTS` доказательством совместимости. Для native Drizzle расставлены границы statement-breakpoint. Сгенерированы `0009_miniapp_identity_v1.sql`, snapshot и запись journal; прежние миграции не менялись.

Backfill допускает только строгие Clerk-shaped ID и однозначные положительные legacy Telegram ID/private chat. Неоднозначные Telegram-случаи блокируют транзакцию; неизвестные website IDs остаются без угаданной Clerk identity. Исторический импорт не считается свежей аутентификацией: `verified_at=NULL`, provenance — в metadata. Очищается только email, точно равный `tg_<id>@telegram.bot` у соответствующей legacy-строки. Пользователи, дети, связи, оплаты/регистрации и ответы фильтра не удаляются и не переписываются.

Повтор не меняет существующее владение identity/contact, блокировку, metadata, timestamps, primary, attribution или маркетинговое согласие. Проверен будущий сценарий, где обе Telegram identities/contacts уже принадлежат одному survivor: импорт не возвращает их старому `tg_` профилю. Это моделирование состояния БД, не реализация merge service.

Backend-only защита: RLS включён, public policies не создаются, права `PUBLIC`/`anon`/`authenticated`, включая column grants, отзываются; оставшиеся наследуемые права приводят к отказу транзакции. Merge audit защищён от UPDATE/DELETE/TRUNCATE. [Точная модель и границы](DESIGN.md).

Nullable email потребовал четыре минимальных адаптации текущего приложения: `actions/kids.actions.ts`, `actions/community-admin.ts`, `actions/event.ts`, `store/useUserStore.ts`. В профиле сохраняется NULL; старые NOT NULL снимки заявок получают пустую строку для отсутствующего email, без fake mailbox. Правила допуска и оплаты не менялись. Telegram webhook, реализация рассылок и Shutafim не менялись.

## Итоговая модель

| Таблица | Назначение и инварианты |
|---|---|
| `users` | Канонический профиль, прежний text PK, nullable email, без массового re-key. |
| `user_identities` | FK на users; уникальный `(provider, provider_instance, provider_user_id)`; максимум один активный Clerk на пользователя; несколько Telegram identities допустимы. |
| `telegram_contacts` | Отдельный Telegram-канал: IDs/metadata/PM/delivery/marketing/attribution; unique Telegram user/chat, один primary у владельца; никаких копий анкеты. |
| `user_identity_link_attempts` | FK на users, уникальный SHA-256 token hash, expiry/consumed; raw token не хранится. Сервис выдачи/потребления не реализован. |
| `user_identity_merge_log` | Append-only audit с source/target text IDs без каскадных FK, provider/reason/details/time; история переживает удаление source. |

## Проверки

| Команда | Фактический результат |
|---|---|
| `npm run typecheck` | exit 0, [лог](evidence/typecheck.log). |
| `npm run lint` | exit 0; **0 ошибок, 30 прежних no-img-element warnings**, [лог](evidence/lint.log). |
| `npm run build` | exit 0 в копии текущего кода без реальных env; синтетическая недоступная БД и ожидаемый sitemap fallback, [результат](evidence/build-result.json), [лог](evidence/build.log). |
| `npm run db:test` | **8/8 PASS**: native цепочка, соответствие ORM, upgrade с сохранностью истории и повтор без DDL, [результат](evidence/migration-results.json), [лог](evidence/migrations.log). |
| `node tests/community/identity-schema.cjs` | **23/23 PASS**: PRE/POST readonly, идемпотентность, будущий merge, ограничения/ACL/RLS/audit, атомарный отказ на несовместимостях, [результат](evidence/identity-results.json), [лог](evidence/identity-tests.log). |
| `node tests/community/regression.cjs` | **36/36 PASS**, включая новый NULL-email сценарий существующих детских заявок/исключения/записи, [результат](evidence/regression-results.json), [лог](evidence/regression.log). |

Все DB-проверки — отдельная локальная PGlite/PostgreSQL/WASM, только синтетические данные. Проверки не доказывают настоящую Telegram/Google аутентификацию, Supabase Data API configuration или production-нагрузку. Новый Mini App и его тестирование не начинались.

## PRECHECK: найденные риски и оставшееся действие

На синтетической выборке PRECHECK нашёл один неоднозначный website ID; в отдельных adversarial-наборах выявлены отрицательный group-chat ID, несовпадение `tg_` ID/chat и два legacy-профиля на один Telegram subject. Миграция отказала атомарно. Также подтверждены отказы на неверных FK/check/partial index/default/nullability, public policy и наследуемом доступе.

**На реальной Supabase PRECHECK не запускался.** Реальные количества, неоднозначные IDs, дубли и соответствие provider namespace не установлены; реальные данные не объявляются чистыми на основании fixtures. `primary` — legacy namespace, не подтверждённый ID конкретной Clerk instance/bot; будущий resolver должен использовать доверенную серверную конфигурацию.

**SQL нужен и подготовлен:** [MANUAL_SQL.sql](MANUAL_SQL.sql). Перед будущим ручным запуском владелец читает [PRECHECK.sql](PRECHECK.sql), проверяет результаты и совместимость; после — [POSTCHECK.sql](POSTCHECK.sql), включая неизменность total users и отсутствие неразрешённых прав. Скрипт не подделывает/не усыновляет remote Drizzle ledger. Подготовка не означает, что migration уже применена.

Существующий Telegram webhook по требованию оставлен без изменения: он всё ещё использует legacy writer с fake email для новых `/start` строк. Identity resolver, initData verifier, bootstrap и merge service здесь не активированы. Их переключение и устранение legacy writer — последующий отдельно согласованный серверный этап; никаких автоматических маркетинговых подписок здесь не добавлено.

**Удалённая БД Supabase не изменялась и не запрашивалась. Push не выполнялся. Deploy не выполнялся. Mini App UI не начинался.** Шаг 2 завершён локальной подготовкой и проверками; работа остановлена до отдельного задания Шага 3.
