# Menorah Center — Mini App UI, Шаг 4

22.10.2026. Шаг 4 реализован и проверен локально. Настоящий Telegram WebView — **NOT VERIFIED**; опубликованной Mini App эта работа не объявляется.

## Ветка и checkpoint

На старте: `feat/miniapp-auth-v1`, HEAD `39ef782cceeefb3a7767ac61c9590a9f3b09fd25`, 38 изменённых/новых файлов Шага 3. Проверены все SHA-256 из [manifest Шага 3](../miniapp-auth-v1/evidence/checkpoint.json): изменённых относительно manifest, пропущенных и посторонних файлов — **0**.

Создан только локальный checkpoint commit **`cd2493ead3043250bd3c90fa7b673a0bbb798eed`**, `feat: add telegram miniapp authentication`. Итоговая ветка та же, **HEAD `cd2493ead3043250bd3c90fa7b673a0bbb798eed`**. Новые правки Шага 4 остаются незакоммиченными поверх него. Проверена текущая рабочая копия. [Состав и хеши](evidence/checkpoint.json).

## Интерфейс и общие компоненты

До реализации изучены homepage, `/register`, `/events`, `public-event-card`, `Logo`, Tailwind, globals.css, onboarding/community components и доступные UI primitives. Использованы прежние Geist, `#020022`, золотой `#FFB800`, белые карточки, мягкие нейтральные borders, радиусы 16/32px и существующий SVG. Фон новой области кремовый `#f8f7f3`. Логотип показан в светлом варианте; рядом читаемое название Menorah Center. Новых logo assets, шрифтов или design dependencies нет.

Добавлены `app/miniapp/{layout,page,loading,error}.tsx`, scoped `miniapp.css`, `components/miniapp/app.tsx`, `profile-form.tsx`, `lib/telegram/miniapp-client.ts`, `miniapp-i18n.ts`. Это одна область `/miniapp` с работающими состояниями splash, filter, profile, resources, home и редактированием профиля.

Переиспользованы `Logo`, `CityPicker`, `ChildEditor`, `ResourceMessage`. Из website onboarding вынесены `Community FilterFields` и `ProfileFields`; форма сайта использует те же presentation components. Для общих компонентов добавлены необязательные переводы с прежними русскими defaults. Website draft/OAuth adapter сохранён. Категории, schemas, city directory, подготовка детей и история записей остаются общими.

Новая `SiteProviders` сохраняет website Clerk/theme/loading/analytics и исключает их из `/miniapp`. Navbar/footer находятся в marketing layout и в Mini App не попадают. Middleware пропускает Mini App/API без Clerk; общий публичный `GET /api/community/cities` тоже не требует Clerk. Защита website dashboard/admin не менялась. Production `/miniapp` и поиск городов проверены при пустых runtime Clerk keys.

## Telegram bridge и safe areas

Единственная точка обращения к `window.Telegram.WebApp` — client adapter. Он загружает [официальный Telegram Web App JS](https://core.telegram.org/bots/webapps#initializing-mini-apps), вызывает ready/expand, предоставляет platform/version/theme/viewport/insets, подписывается на theme, viewport, обе safe areas, activated/deactivated и fullscreenChanged. BackButton работает для вложенного профиля/фильтра. Cleanup снимает все SDK/native callbacks и свои CSS variables. Старые версии получают только поддерживаемые chrome calls.

Chrome синхронизирован с Menorah: header/background кремовые, bottom bar белая там, где API поддерживается. Telegram theme не перекрашивает контент. Установлены `--tg-safe-{top,bottom,left,right}`, `--tg-content-safe-{top,bottom,left,right}` и стабильная viewport height. CSS использует logical padding/start/end, меняет привязку боковых insets при RTL, имеет env(safe-area-inset-*)/100svh fallback. Хрупкого `100vh` нет. Поля минимум 16px; интерактивные строки/кнопки рассчитаны на touch около 44px и выше.

## Bootstrap, повторное открытие и смена аккаунта

Raw `initData` передаётся серверу; `initDataUnsafe` не используется. На открытии сначала выполняется `POST /api/telegram/miniapp/session`: сервер сверяет подпись launch subject с владельцем активной cookie. При отсутствии/несоответствии сессии вызывается существующий bootstrap, затем загружается собственный профиль. Поэтому reload активной своей сессии не создаёт новые sessions/users, а cookie другого Telegram-аккаунта не показывает его профиль.

Для resume уже действующей cookie допустим её старый подписанный launch того же subject: это не новый authentication grant, не продление expiry и не выпуск token. Новый bootstrap по-прежнему требует свежесть 900 секунд и future skew максимум 60. Resume verifier возвращает только subject, не branded bootstrap proof. Без действующей cookie или при другом owner старый payload не создаёт человека/сессию. Дополнительно сохранён прежний `GET /session` для собственных authenticated запросов. Проверены mismatch, tampering, expired bootstrap и отсутствие продления сессии.

Токены остаются только HttpOnly cookie/SHA-256 в БД. UI не читает token, не хранит initData/session в browser storage и не передаёт body в analytics/logs. Mini App не монтирует website Analytics. [Проверка client assets и обзор компонентов](evidence/client-boundary.json).

## Языки

Новые тексты, ошибки, ресурсы, filter/profile/child/city labels находятся в RU/HE/EN dictionaries. Язык сначала определяется для presentation по browser language, после загрузки приоритет получает сохранённый validated Telegram language_code. Неизвестный язык → RU. Ручной выбор языка действует в текущем интерфейсе и не сбрасывает введённую анкету. Для HE установлены lang/dir на области и document, logical spacing, bidi-safe имя; при уходе document attributes восстанавливаются. External resource URLs одинаковы для трёх языков.

## Filter, questionnaire и дети

Фильтр содержит ровно три утверждённых категории. До выбора gender скрыт; `none` не спрашивает его и ведёт на resources с тремя утверждёнными URL и контактом Menorah. Событий и кнопок записи там нет. Maternal/giyur требуют gender и ведут к профилю, если он ещё incomplete. Stage block нигде в основной анкете не добавлен.

Questionnaire внутри Mini App: имя, фамилия, телефон, дата рождения, canonical city autocomplete, семейное положение, имя супруга/и, hasChildren, допустимые дети и privacy consent. Email не нужен и не запрашивается. Редактор ребёнка поддерживает name/date/gender, save/edit/delete; изменения явно сохраняются вместе с анкетой. После ошибки введённые данные остаются в форме, повторное сохранение работает. При уходе с изменённой анкеты есть подтверждение.

Разрешение редактора приходит от server community policy: maternal female и известный completed-giyur female допускаются; male, unknown/advanced-giyur female не получают child editor. Сервер независимо повторяет проверку. Существующие дети ограниченных родителей сохраняются. Нет автоматического присвоения статуса матери детям. При изменении/удалении разрешённого ребёнка общий writer сохраняет исторические снимки регистраций; paid status/amount не меняются.

Home показывает логотип, приветствие по имени, welcome card, статус анкеты и только работающие «Мой профиль», «Связаться с Menorah», «Выйти». Нижняя навигация содержит Home/Profile. Контакт взят из существующей website contact page: `https://t.me/menorah_center`. События, калькулятор и платежи в Mini App не добавлялись.

## Серверное сохранение и БД

Добавлены `GET/POST /api/telegram/miniapp/profile`, `POST /api/telegram/miniapp/filter`, `lib/telegram/miniapp-profile.ts`. Profile DTO содержит только собственные редактируемые данные и derived permissions; внутренних user/Clerk/Telegram IDs, роли, стадии, revision, email и audit metadata в форме нет. Детские IDs нужны для редактирования собственных детей и не отображаются пользователю.

Вынесен общий `writeCanonicalCommunityProfile`; прежний `writeCommunityProfile` остаётся website Clerk adapter. Mini App не придумывает email, не вызывает welcome notifications, не меняет marketing. Schema validation, `FILTER_VERSION`, city canonicalization, child ownership/history используются повторно. Новая UI не дублирует authorization rules.

Session/identity/user проверяются и блокируются в той же транзакции, где выполняется запись. Версия данных передаётся opaque ETag/If-Match; stale update — 409. POST имеют same-origin guard и потоковый предел 16 KiB. Affiliation/gender можно сохранять только через строгий filter input. Произвольные email/role/userId/revision/giyurStage/source не принимаются. `none` не может обойти filter и отправить full questionnaire. Ошибки локализуются по безопасным codes, без SQL/IDs.

**Новых schema fields и миграций нет. `lib/db/schema.ts`, вся Drizzle history до `0010`, MANUAL_SQL/PRECHECK/POSTCHECK не изменялись. Удалённые SQL/данные не читались и не изменялись.**

## Local development mechanism

`miniapp-ui-fixture.cjs` создаёт отдельную `/tmp/menora-miniapp-ui` копию без `.env` проекта: только синтетическая PGlite, synthetic bot key и test-only state endpoints. Product routes/services/HMAC/sessions/SQL настоящие. Telegram/native SDK подставляется только Playwright adapter из test files. Dev/test identity явно подписана в UI. Для ручного визуального просмотра есть `miniapp-ui-preview.cjs`, открывающий headed Chromium.

Генератор/preview отвергают production; preview проверяет isolated-pglite. Test routes и identity adapter отсутствуют в product app. `MENORAH_MINIAPP_PREVIEW=1` добавляет только dev badge и не меняет authentication. В production он и query params не включают test login. [Команды запуска](../../tests/community/README.md).

## Проверки текущей рабочей копии

| Набор | Результат | Доказательство |
|---|---:|---|
| Mini App UI browser | **39/39 PASS** | [JSON](evidence/miniapp-ui-browser-results.json), [лог](evidence/miniapp-ui-browser.log) |
| Mini App profile/filter/resume server | **31/31 PASS** | [JSON](evidence/miniapp-ui-server-results.json), [лог](evidence/miniapp-ui-server.log) |
| Bridge lifecycle/version/insets/cleanup | **6/6 PASS** | [JSON](evidence/miniapp-ui-bridge-results.json), [лог](evidence/miniapp-ui-bridge.log) |
| Настоящая production-сборка, обычный browser | **2/2 PASS** | [JSON](evidence/miniapp-ui-production-results.json), [лог](evidence/miniapp-ui-production.log) |
| Mini App auth Шага 3 | **87/87 PASS** | [JSON](evidence/miniapp-auth-results.json), [лог](evidence/miniapp-auth.log) |
| Identity/schema | **23/23 PASS** | [JSON](evidence/identity-results.json), [лог](evidence/identity.log) |
| `npm run db:test` | **8/8 PASS** | [JSON](evidence/migration-results.json), [лог](evidence/migrations.log) |
| Community regression | **36/36 PASS** | [JSON](evidence/regression-results.json), [лог](evidence/regression.log) |
| Website React SSR | **21/21 PASS** | [JSON](evidence/render-results.json), [лог](evidence/render.log) |
| Website spec/server | **17/17 PASS** | [JSON](evidence/spec-results.json), [лог](evidence/spec-update.log) |
| Clerk callback component lifecycle | **10/10 PASS** | [лог](evidence/sso-callback.log) |
| Website callback browser, desktop/mobile | **10/10 PASS** | [JSON](evidence/callback-browser.json), [лог](evidence/website-callback-browser.log) |
| Website актуальный spec browser, desktop/mobile | **30/30 PASS** | [JSON](evidence/website-spec-browser/results.json), [лог](evidence/website-spec-browser.log) |

**Итого 320/320.** [Команды и exit codes](evidence/checks.json). Website identity в browser suites — mock Clerk, callbacks не объявляются настоящим Google OAuth; внешние сообщения отключены, Shutafim requests перехвачены. Первые website browser запуски встретили timeouts dev-стенда; окончательные green результаты получены после прогрева routes и перезапуска временного сервера между когортами. Ни одного assertion для этого не отключали.

`npm run typecheck` — **exit 0**, [лог](evidence/typecheck.log). `npm run lint` — **exit 0, 0 ошибок, 30 прежних no-img-element warnings**, [лог](evidence/lint.log). `npm run build` — **exit 0**, [результат](evidence/build-result.json), [лог](evidence/build.log): текущий код в отдельной production-копии без реальных env; БД — недоступный loopback `127.0.0.1:1`, ожидаемый sitemap fallback. Production browser поверх этой сборки не потребовал Clerk, не создал fake session, не загрузил Analytics/Clerk и нашёл canonical city через общий endpoint.

Изменения test harness: общий dependency-order helper для generated ORM DDL; поддержка вынесенного provider в synthetic website fixture; configurable local base/headless у актуального spec-browser. Checks сохранены. Старые исторические `browser.cjs`/`targeted-browser.cjs`, рассчитанные на отменённые stage block/старые selectors, не переобъявлены зелёными: здесь выполнены актуальные `spec-browser.cjs` и `callback-browser.cjs`.

## Скриншоты и визуальная приёмка

Созданы **32 Mini App PNG**: splash, filter, resources, profile, child editor, home, profile edit на **390×844, 320×700, desktop 1280×1000**; bootstrap error, restricted child cases, Hebrew/English и ordinary/production browser. [Полный inventory](evidence/screenshots.json). Website spec-browser дополнительно создал свои evidence.

Визуально просмотрены мобильные filter/home/profile/child editor, узкий child editor, Hebrew profile, desktop resources и production fallback. Исправлен слишком мелкий показ квадратного SVG; после выбора child gender убирается уже исправленная ошибка. Нет horizontal overflow в проверенных состояниях. Touch controls/font size и сохранение полей после network/server failure подтверждены browser assertions.

Примеры: [390 home](evidence/390-home.png), [320 child editor](evidence/320-child-editor.png), [Hebrew profile](evidence/390-hebrew-profile.png), [desktop resources](evidence/desktop-resources.png), [production fallback](evidence/production-browser-outside.png). В dev screenshots видны synthetic badge и штатный Next dev indicator; production screenshot их не содержит.

## Что остаётся непроверенным

- **Real Telegram WebView на физических iPhone/Android, Telegram Desktop/Web — NOT VERIFIED.** SDK/native events, safe areas и platform в local harness синтетические; Chromium viewport — не устройство. После отдельного deploy нужна проверка настоящего launch/initData/cookie, notch/system bars, keyboard, fullscreen/non-fullscreen и BackButton на этих клиентах.
- Фактическая удалённая Supabase, её migration/privileges и production domain/bot configuration не проверялись. SQL Шагов 2–3 остаётся прежним подготовленным artifact; этот запуск не означает его применения.
- Пределы Шага 3 (независимые PostgreSQL connections и совместная дедупликация со старым `/start` writer) остаются: [его отчёт](../miniapp-auth-v1/REPORT.md). Linking/merge не реализованы.
- Настоящий Google OAuth, внешние платежи, доставка сообщений и прежние общие production-находки не закрываются локальными fixtures. Полного нового аудита не проводилось.

**Supabase remote не запрашивалась и не изменялась. Push/deploy не выполнялись. BotFather и старый Telegram bot/webhook/menu/broadcast не менялись. Shutafim и правила записи на мероприятия не менялись. Реальные платежи/уведомления не выполнялись. Шаг 5 не начинался.**
