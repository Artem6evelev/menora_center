# Telegram welcome / Kids destination / payment UX hotfix

База: `main`, `1da1f2c1855f1fd87c997ec44b155657f1e7e54a`. До изменений дерево было чистым. Это один локальный hotfix поверх опубликованного release; push/deploy в этом запуске не выполнялись.

## Welcome и Menorah Kids

Generic `/start` содержит четыре строки: «Открыть Menorah Center», «Мероприятия», «Детские программы», «Связаться с нами». Детская кнопка — Telegram `web_app`, `/miniapp?section=kids`; website `/kids` и `/dashboard/kids` не используются. Контакт остаётся WhatsApp `+972 50 670 0779`.

После обычного bootstrap/session/profile Mini App выбирает существующий внутренний Kids screen. Назначение сохраняется в URL и локальном pending navigation ref через обязательную анкету, возврат к ответам и reload. Указание `section` не передаёт никаких прав. Back из Kids возвращает Home и удаляет использованный section hint; новый reload не возвращает пользователя в Kids против его действия.

Event-aware welcome сохраняет главное действие события с прежними event/campaign. Kids и WhatsApp — дополнительные кнопки. Явный event/campaign в URL сохраняет приоритет; отдельная Kids-кнопка не наследует старый `start_param` события из Telegram SDK. Неизвестные section игнорируются.

Мужчина видит прежний mother-profile gate и WhatsApp; женщина giyur unknown/advanced — существующий child-action stage gate; none остаётся на resources без доступа к Kids API. В основной questionnaire стадия гиюра не добавлена. Все пользовательские строки RU.

## Платная запись

Причина неверного сообщения: Event Detail показывал общий `u.already` при любой существующей регистрации, включая `pending`. «Мои записи» отображали общий статус и не имели собственной кнопки оплаты.

Теперь UI различает:

- Бесплатную успешно подтверждённую запись: «✅ Вы зарегистрированы», «Моя запись».
- Платную `pending`: жёлтая «Регистрация создана», «Осталось оплатить участие», серверная сумма и «Оплатить участие». Возврат к событию не удаляет pending receipt.
- Серверные `paid` / `confirmed` платного события: «✅ Оплата подтверждена», «Вы зарегистрированы», «Моя запись».

«Мои записи» различают «🟡 Ожидает оплаты» / «✅ Подтверждено» / «✅ Зарегистрирован». Pending имеет серверную сумму и отдельную кнопку «Оплатить». Индикатор pending жёлтый, подтверждённого состояния — зелёный.

Detail и registrations используют общий read model сохранённой записи и существующего immutable `event_payment_attempts`. LEFT JOIN ограничен registration/user/event и опирается на прежний unique registration_id; новых индексов/таблиц нет. Сумма попытки имеет приоритет над registration metadata и новой ценой события. Legacy pending без immutable handoff не получает выдуманную ссылку или заново рассчитанную цену: известная сохранённая сумма показывается, неизвестная возвращается как null, доступен WhatsApp. Данные не переписываются.

URL берётся из сохранённой серверной попытки текущей payment architecture, проходит HTTPS/credentials validation. SDK `openLink` имеет безопасный fallback `window.open(..., '_blank', 'noopener,noreferrer')` при отсутствующем/неподдерживаемом методе. Если ссылки нет или она небезопасна, кнопки оплаты нет; показаны сообщение о временной недоступности и WhatsApp.

Открытие/закрытие ссылки, activation, return URL и `paid=true` не меняют статус. Клиентские URL/amount/status отклоняются прежней strict server schema. Checkout и расчёт цен не менялись; повторный запрос возвращает существующую pending запись и попытку.

Существующий тест delayed POST + Telegram Back выявил гонку старого render-time `busy` в обработчике Back. Синхронный request ref теперь блокирует Back и повторную отправку до завершения запроса; ввод и retry после ошибки сохраняются.

## Проверки

**808/808 PASS, 30 групп** — [полная матрица и hashes исходников](evidence/checks.json). Все результаты заново получены локально; исторические JSON не засчитывались как новые проверки.

- `miniapp-kids-entry-browser.cjs`: **16 PASS**. 320/390/1280, auth → Kids, onboarding/backtracking/reload, Back → Home, male/giyur/none, event priority и старый SDK event hint.
- `miniapp-payment-ux-browser.cjs`: **15 PASS**. Free/pending/paid/confirmed, server family amount, повторная запись без дублей, изменение цены после handoff, return/paid query, My registrations, missing/unsafe URL и SDK fallback. [Pending 320](evidence/320-pending.png), [confirmed](evidence/paid-confirmed.png).
- `telegram-release.cjs`: **126 PASS**, native PostgreSQL counterpart: **127 PASS**. Прежние pricing/idempotency/security cases сохранены; добавлены welcome и payment read-model cases. Native test JSON явно сериализуется одинаково для обоих движков. Исправлено скрытие ненулевого exit code native child при остановке embedded PostgreSQL: runner теперь выбрасывает ошибку и завершает проверку с ошибкой после cleanup.
- Bridge: **8 PASS**, включая HTTPS/no-credentials и missing/throwing SDK fallback. Прежние 10 browser groups: **10/10 PASS**, включая website, profile concurrency, Share, Kids и существующую админку. Подробные имена всех сценариев находятся в evidence JSON.
- `npm run lint`: **PASS**, exit 0, 0 ошибок / 30 прежних предупреждений `no-img-element` вне изменённых файлов. Правила не ослаблялись. [Лог](evidence/lint.log).
- `npm run typecheck`: **PASS**, exit 0. [Лог](evidence/typecheck.log).
- `npm run build`: **PASS**, exit 0, через существующий `tests/community/build.cjs` на текущих исходниках в изолированной копии без настоящих `.env`. Synthetic loopback DB недоступна, поэтому sitemap использует прежний fallback; production DB/sitemap этим не проверены. [Лог](evidence/build.log).
- Production-build browser: **2 PASS**; JS boundary: **1 PASS**, website Clerk runtime в Mini App отсутствует.

Проверки используют только disposable PGlite / native PostgreSQL и локальный Chromium с синтетическими Telegram HMAC/SDK, Bot API и Clerk adapters. Внешняя навигация платежей блокируется. Confirmation в тестах выставляет только локальная fixture. Это не доказательство оплаты у Shutafim или работы физического Telegram WebView.

## Границы

Схема БД, миграции/SQL, auth/identity, optimistic profile locking, community policy, основные event access rules, canonical share links и website iframe не изменены. Новых зависимостей и env нет. Supabase production, Vercel env, Telegram webhook/menu/BotFather не трогались. Реальные платежи и сообщения не выполнялись. После публикации владельцем остаётся smoke-test кнопки Kids и pending payment UX в настоящем Telegram на телефоне.
