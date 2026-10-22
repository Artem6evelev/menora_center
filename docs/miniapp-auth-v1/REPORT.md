# Telegram Mini App — Шаг 3, локальная серверная аутентификация

22.10.2026. Серверная часть реализована и проверена локально. Это не подтверждение запуска внутри настоящего Telegram или общей готовности к production.

## Контрольная точка и состав

Исходная ветка `main`, HEAD `6bd190107a5c7a2776e737255fe70520b7efb906`. Все 28 незакоммиченных файлов Шага 2 сверены с [его manifest](../miniapp-identity-v1/evidence/checkpoint.json): изменённых относительно manifest, пропущенных или посторонних файлов не обнаружено. На новой локальной ветке **`feat/miniapp-auth-v1`** создан checkpoint **`39ef782cceeefb3a7767ac61c9590a9f3b09fd25`** (`chore: checkpoint miniapp identity layer v1`).

Итоговый HEAD остаётся **`39ef782cceeefb3a7767ac61c9590a9f3b09fd25`**. Шаг 3 находится в незакоммиченном рабочем дереве поверх checkpoint; проверена именно эта рабочая копия. Исходная реализация анкеты, фильтра, детей, Clerk/Google и Shutafim сохранена. [Итоговый состав и SHA-256 файлов](evidence/checkpoint.json).

Добавлены:

- `lib/telegram/miniapp-{config,errors,init-data,user,session,http}.ts` — только серверные модули.
- `app/api/telegram/miniapp/bootstrap/route.ts`, `logout/route.ts`, `session/route.ts`.
- `drizzle/0010_telegram_miniapp_sessions.sql`, `drizzle/meta/0010_snapshot.json`.
- `scripts/build-miniapp-manual-sql.cjs`.
- `tests/community/miniapp-auth.cjs`, `tests/community/schema-ddl.cjs`, этот отчёт и локальные evidence.

Изменены `.env.example`, `lib/db/schema.ts`, `drizzle/meta/_journal.json`, единые `MANUAL_SQL.sql` / `POSTCHECK.sql`, `tests/community/README.md`, identity-schema / migrations / regression harness. Изменения harness сохраняют прежние проверки, добавляют объединённый SQL и учитывают зависимость составного FK от unique index при генерации эталонной DDL. Dependencies и lockfile не менялись. Миграции `0000–0009`, snapshot `0009` и PRECHECK не менялись.

## Проверка Telegram и HTTP

Алгоритм сверён с [официальной документацией Telegram](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app). Проверяется raw `initData`, а не `initDataUnsafe`: строгое однократное URL-декодирование, отказ на duplicate keys/неоднозначных переводах строк; исходные декодированные значения сортируются по ключу. В bot-token HMAC исключён только `hash`; дополнительные поля, включая `signature`, участвуют в подписи. JSON пользователя не пересобирается для подписи.

Секрет HMAC-SHA256 вычисляется с ключом `WebAppData` и сообщением bot token; следующий HMAC подписывает data-check-string. Сравнение 32 байт — `timingSafeEqual`. Только после подписи и проверки времени разбирается `user`. Положительный безопасный Telegram ID хранится строкой; поддержаны имя, фамилия, username, язык, HTTPS photo URL, PM permission и premium flag. Группа/канал из signed `chat` не трактуется как private chat. Значение user ID никогда не записывается как chat ID.

Обязательный `auth_date`: default 900 секунд, будущий skew до 60 секунд. `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS` принимает целые 1–86400; некорректное значение возвращает default 900. Истёкшая/неверная подпись — 401; malformed — 400; отсутствующий bot token — безопасный 503. У validator-returned объекта есть runtime proof; произвольный DTO не проходит bootstrap.

Signed `start_param` допускается как campaign code `[A-Za-z0-9_-]{1,64}`. 64 — выбранный предел приложения, не заявление о пределе всех Telegram launch modes. Некорректный код игнорируется. `first_start_param` заполняется один раз, `last_start_param` обновляется следующим валидным кодом. Эти поля не дают прав и должны использоваться для campaign identifiers без персональных сведений.

Все routes — Node runtime, `no-store`, минимальный JSON без token, email, children/family, внутренних IDs или ошибок драйвера:

| Route | Поведение |
|---|---|
| `POST /api/telegram/miniapp/bootstrap` | `{initData: string}`; потоковый предел JSON body 16 KiB, включая контроль фактических байт при ложном Content-Length; validation → bootstrap → новая session → HttpOnly cookie. |
| `GET /api/telegram/miniapp/session` | Текущая Mini App session → минимальный профиль/nextStep; без сессии 401. |
| `POST /api/telegram/miniapp/logout` | Отзыв только текущего token hash и очистка cookie; повтор без cookie допустим. |

POST требует `Origin`, совпадающий с `NEXT_PUBLIC_APP_URL`, и отклоняет cross-site запросы. В production необходим явно настроенный HTTPS origin; отсутствие/ошибка конфигурации закрывает доступ. В локальной разработке без URL допускается только loopback origin. CORS credentials не открываются. Никаких bot-token/raw-initData/hash/session-token logs в новых модулях нет.

## Bootstrap и сохранность данных

Поиск — строго `(telegram, primary, String(user.id))`. Активная identity возвращает текущего canonical owner. Contact без identity получает identity того же владельца. Дополнительно распознаётся однозначный точный legacy `tg_<verified ID>` / `users.telegram_chat_id`; совпадения по username, имени или email не используются. Несовместимые owners, неоднозначный legacy mapping, отключённая identity или canonical user завершают запрос без записи и без раскрытия IDs. Merge не выполняется.

Только совершенно новый субъект создаёт `users.id=mnr_<crypto UUID>`, `email=NULL`, роль client, source `telegram_miniapp`, incomplete profile, consent false, affiliation/gender/giyur/filter NULL. Затем создаются Telegram identity и contact с marketing unknown и chat NULL. PM permission не означает marketing consent.

У существующих users не обновляются анкета, согласие, город, роли, дети, семья, история, фильтр и даты профиля. Identity получает verified/last-seen timestamps и только безопасный premium flag с сохранением остальной metadata. Contact получает Telegram metadata/last-seen; отсутствующие optional поля сохраняют прежние известные значения. Marketing status/opt-in/unsubscribe/blocked/delivery/chat/primary не перезаписываются.

Одна транзакция охватывает user, identity, contact и session. Advisory transaction lock сериализует наших writers одного verified subject. Unique provider subject — окончательная защита. PostgreSQL 23505 по subject/contact, serialization failure и deadlock приводят к откату всей попытки и повторному lookup, максимум три попытки. При неуспехе session insert новый person тоже откатывается. Проверены последовательный повтор, восемь параллельных вызовов на PGlite и настоящий unique violation после намеренно устаревшего lookup: tentative user не остаётся в БД.

## Сессия и следующий шаг

Токен — `randomBytes(32)` → base64url. В БД только SHA-256 и UUID owner/identity, expiry/revoked/created/last-seen. Raw token доступен клиенту только через HttpOnly cookie: Path `/`, SameSite Lax, Secure в production, без Domain. Production имя `__Host-menorah_miniapp_session`; локальное HTTP имя `menorah_miniapp_session`. Токен не сохраняется в localStorage или JSON.

TTL default 86400 секунд. `TELEGRAM_MINIAPP_SESSION_TTL_SECONDS` принимает 60–604800, invalid → 86400. Cookie max-age согласован с expiry. `currentMiniAppUser` / `requireMiniAppUser` проверяют cookie → hash → session → активную Telegram primary identity → активного canonical user. После взятия блокировок состояние сессии повторно проверяется; expired/revoked/disabled/wrong provider не аутентифицируют. Logout сохраняет user, identity и marketing, а другие сессии остаются действующими. Clerk resolver и существующие actions не объединялись с Mini App auth.

`miniAppProfile` использует действующий `hasFilterProfile` / `FILTER_VERSION=2`: stale/missing → `filter`; актуальный `none` → `resources`; допустимый актуальный incomplete → `profile`; иначе `home`. В API только подсказка следующего экрана; существующие правила доступа и детей не менялись.

## Миграция и единый SQL

Проверен фактический journal до `0009`; штатным `npm run db:generate -- --name=telegram_miniapp_sessions` сгенерирован следующий `0010`, затем SQL проверен/адаптирован: порядок зависимостей, повтор, schema compatibility и backend-only security. Добавлены таблица `telegram_miniapp_sessions`, unique hash, lifetime checks, индексы, users FK и составной FK `(identity_id,user_id)` → `user_identities(id,user_id)`. Составной FK не позволяет прикрепить сессию к чужому owner. RLS включён, публичных policies нет, table/column grants PUBLIC/anon/authenticated отзываются; оставшиеся inherited grants блокируют транзакцию.

Обновлён [единый MANUAL_SQL](../miniapp-identity-v1/MANUAL_SQL.sql) для будущего ручного запуска владельцем Шагов 2+3, в одной транзакции. Native `0009` неизменён. Его копия внутри manual допускает ровно новый additive owner index при повторе; `0010` затем сверяет точное определение этого индекса. [Builder](../../scripts/build-miniapp-manual-sql.cjs) воспроизводит artifact детерминированно; повтор не меняет существующие sessions или revoked state. [POSTCHECK](../miniapp-identity-v1/POSTCHECK.sql) дополнен sessions RLS/table+column+effective grants, duplicate hashes, invalid owner/provider/hash/lifetime, FK definitions/validation и нормальными счётчиками active/revoked/expired. PRECHECK оставлен прежним.

SQL не применялся к удалённой БД. Результаты о чистоте реальных данных и remote ledger не заявляются.

## Фактические проверки

| Команда | Результат и доказательство |
|---|---|
| `node tests/community/miniapp-auth.cjs` | **87/87 PASS**, [результаты](evidence/miniapp-auth-results.json), [лог](evidence/miniapp-auth.log). |
| `node tests/community/identity-schema.cjs` | **23/23 PASS**, [результаты](evidence/identity-results.json), [лог](evidence/identity.log). |
| `npm run db:test` | **8/8 PASS**, native chain/ORM/legacy preservation/no-op ledger, [результаты](evidence/migration-results.json), [лог](evidence/migrations.log). |
| `node tests/community/regression.cjs` | **36/36 PASS**, прежние community/детские/оплатные ограничения, external effects disabled, [результаты](evidence/regression-results.json), [лог](evidence/regression.log). |
| `npm run typecheck` | exit 0, [лог](evidence/typecheck.log). |
| `npm run lint` | exit 0, **0 ошибок / 30 прежних no-img-element warnings**, [лог](evidence/lint.log). Первые два нарушения нового control-regex исправлены с сохранением проверки управляющих символов; правила не отключались. |
| `npm run build` через существующий isolated build harness | exit 0, [результат](evidence/build-result.json), [лог](evidence/build.log). Копия текущего исходного кода без реальных `.env`, synthetic unreachable DB `127.0.0.1:1`; ожидаемый sitemap fallback. Все три новых routes вошли в сборку. |

Итого **154/154** сценария/проверки. Все DB-тесты — отдельная PGlite 0.5.10 с синтетическими данными, настоящий SQL/Drizzle transactions/constraints и Node crypto. Cookie проверяется настоящим NextResponse, не эмуляцией его serializer. Конкретного официального bot-token HMAC test vector на Telegram validation page нет; есть официальный алгоритм и отдельный фиксированный fixture, независимо вычисленный Python stdlib. Это не живой Telegram payload.

## Оставшиеся границы и следующий этап

- Настоящий Telegram WebView → HTTPS backend → cookie/resolver не запускался. Mini App UI по заданию отсутствует. Этот E2E нужен при отдельной интеграции shell/UI; текущие синтетические подписи не объявляются доказательством реального Telegram входа.
- Два независимых PostgreSQL connections не проверены: локальных postgres/initdb/psql нет, Docker daemon недоступен. PGlite сериализует транзакции. Есть реальная проверка rollback/retry unique violation и concurrent calls, но нагрузочная multi-connection гонка остаётся отдельной проверкой на разрешённом изолированном PostgreSQL.
- Существующий `/start` webhook по заданию неизменён и всё ещё пишет legacy `tg_` users, игнорируя новую identity. Если сначала пришёл Mini App-first user, последующий `/start` может создать отдельную legacy строку. Race-гарантия этого шага относится к новым bootstrap writers; общая дедупликация старого writer с Mini App не заявляется. Согласование legacy writer и будущий linking/merge — отдельная задача перед совместным production-включением; самовольных триггеров/merge здесь нет.
- Реальная среда/данные/права Supabase, запуск owner PRECHECK/MANUAL/POSTCHECK и production deployment этим запуском не подтверждены. Общие production-находки прежних аудитов не закрывались.
- Новые Mini App operations должны вызывать отдельный resolver и действующие community policy helpers. Объединение с Clerk, linking/merge и эксплуатационная очистка истёкших сессий здесь не реализованы.

**Remote Supabase не запрашивалась и не изменялась. Push и deploy не выполнялись. Telegram bot/menu/webhook/broadcast не перенастраивались. Уведомления, реальные платежи, Shutafim и Mini App UI не выполнялись/не менялись. Работа остановлена после Шага 3; Шаг 4 не начинался.**
