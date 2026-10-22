# Mini App performance pass — 22.10.2026

Дата ТЗ: 22.10.2026, завершение проверок: 23.10.2026. База: `main`, `b2ebdb37970df29eb6a5614fe0e766b889c81baf`, исходное дерево CLEAN. Один локальный performance-коммит; push/deploy не выполняются. Production остаётся на базе b2ebdb3. [Baseline до правок](BASELINE.md).

## Изменения и причины

`POST /api/telegram/miniapp/start` заменяет runtime-цепочку session → bootstrap при401 → profile → launch → Home events/subscription. Ответ содержит канонические анкету/opaque profileVersion, статус анонсов, destination, bounded launch preview и максимум две компактные Home-карточки. Существующие endpoints сохранены для совместимости. Порядок карточек сохранён из существующей реализации (`createdAt DESC, id`); новый порядок событий в этом performance pass не вводится.

HMAC проверяется до работы с сессией. Cookie resume привязан к подписанному Telegram subject. Отсутствующая, истёкшая или чужая cookie допускает создание сессии только по свежему подписанному proof. Собственная отозванная сессия и отключённая identity/user отклоняются. Старый подписанный launch годится только для resume своей действующей сессии; expiry не продлевается. Навигационные hints не дают прав.

GET authorization получает session + identity + canonical user одним SELECT/JOIN. Из session/identity выбираются только поля проверки, без metadata/token hash в результате. На обычных GET нет FOR UPDATE, транзакции авторизации или lastSeen UPDATE. Startup touch выполняется не чаще раза в5 минут; security от него не зависит. Mutation-путь сохраняет identity → user → session locks, повторные проверки и optimistic version comparison; его helpers явно принимают LockedTransaction.

Home использует startup events/status и не делает initial events/subscription GET. Preview DTO не содержит full description, childPrice и status; detail DTO сохраняет необходимые данные. Existing ad-entry показывает публичную афишу/название до получения защищённых данных detail; checkout/дети/регистрация по-прежнему требуют отдельного авторизованного detail-запроса.

Кэш создаётся внутри одного mounted MiniApp через factory, TTL30s, без module/global cache или localStorage. Events/registrations/detail и Home preview переиспользуются между табами. Выход, retry/bootstrap, смена signed subject и unmount очищают кэш и отменяют его запросы. Generation guard не допускает поздний ответ предыдущей сессии. При смене subject сразу отменяются незавершённые startup и родительские mutations, до следующего React effect. Epoch guard не принимает поздний profile/giyur snapshot от прежнего аккаунта; busy/dirty state сбрасывается, старый finally не меняет состояние нового пользователя. Register показывает ответ сервера без list/detail refetch; invalidation после register/payment/profile/giyur откладывает нужное чтение до открытия экрана. Истёкший Home preview обновляется компактным GET.

Kids получает канонические fields + version, permissions, children, applications/programs в одном ответе, без последующего profile GET. Родитель принимает согласованный полный snapshot: новый version никогда не приклеивается к старым полям. Kids объединяет одновременные readers, но при повторном входе всегда обновляет editable snapshot и заявки. Child save/clarification сохраняют общую серверную проверку прав и409 при competing edit.

Events, Kids, profile/ChildEditor и resources вынесены в dynamic chunks; Home остаётся eager. Events/Kids preload запускается в idle после Home. У каждого ленивого экрана есть своя Suspense-граница: обнаруженный повтор startup при загрузке resources устранён. Кэшированный экран не начинает с искусственного loading flash. Общий currency formatter создаётся один раз; массовые memo/virtualization не вводились. Список Events сохраняет pagination20; для восьми Kids programs необходимость виртуализации/content-visibility не подтверждена. SDK listeners/idle timers и запросы имеют cleanup.

Официальный async SDK включён в SSR layout только `/miniapp`, до React effects. Outside-Telegram fallback сохранён. Performance marks имеют только пять фиксированных имён: sdk-ready, start-request, start-response, ready, home-content. Console/telemetry с аккаунтами или семейными данными не добавлены.

## До и после

[Browser counts и marks](evidence/performance-browser.json), [исходные наблюдения](baseline/browser.json), [SQL counts](evidence/query-counts.json).

| Сценарий | До | После |
| --- | --- | --- |
| Returning Home | 2 API до ready DOM,6 attempts до содержимого/settle | 1 startup, сразу2 карточки |
| Новый пользователь | 3 последовательных API | 1 startup до filter |
| Existing event ad | 3 API до launch,5 attempts до полного detail/settle | 1 startup с public preview, затем1 защищённый detail GET |
| Новый event ad | Отдельно не замерен | 1 startup до bounded preview |
| Прямой Kids | 5 attempts: session/profile и Kids→profile с StrictMode-дублем | 2: start + Kids |
| Home→Events | 2 GET attempts | 1 первый раз,0 при возврате в TTL |
| Detail→Back | 1 list GET | 0 в TTL ранее открытого списка |
| Мои записи | 2 GET attempts | 1 первый раз,0 при возврате в TTL |
| Home→Kids после готового Home | 2 Kids attempts + profile | 1 Kids GET |
| Возврат Home | 4 events/subscription attempts | 0 в TTL; после TTL1 compact preview GET |
| Logout / login снова | 1 / 7 attempts | 1 / 1 |

Returning Home SQL: **27 statements (23 SELECT/4 UPDATE,14 locked) →5 SELECT/0 UPDATE/0 locked**. Новый пользователь: **15 →10** (6 SELECT/4 INSERT,3 row-lock statements), внутри прежней защищённой bootstrap-транзакции. Existing ad с полным detail:29→10; direct Kids:25→5. Это counts fixture, не production TCP timings. На обычный GET авторизация теперь1 JOIN; все остальные statements относятся к данным/alias guards. Например Kids всего3 SELECT, profile2, Events list5 и registrations2 в shared-logger harness.

Account switch baseline без reload не запускал новый запрос и не подтверждал переход на другой профиль; теперь activation с другим signed proof запускает1 новый start и очищает прежние snapshots/cache. Новый тест дополнительно удерживает старый registrations/start ответ и доказывает, что поздние данные не возвращаются на экран другого аккаунта.

Initial production JS: **534836 →517334 bytes** (−17502,≈3.3%); estimated gzip **165643 →161743 bytes**. Основной изменившийся app/shared chunk:75903→58255 bytes. Framework/shared JS по-прежнему составляет большую часть initial payload, Clerk runtime не загружается. [Actual JS resources](evidence/bundle.json), [deferred chunk boundaries](evidence/deferred-chunks.json). Entry chunks Events/Kids/profile/resources отсутствуют в initial download; idle preload Events/Kids переносит часть JS на время после Home, не устраняет её стоимость целиком. Gzip оценён локально, не взят из CDN transfer size.

## Изображения и share

Read-only запрос к production вернул только host изображений событий: `gwuzekpkfrkmgluzblty.supabase.co`. Оптимизация включена для локальных assets и HTTPS public-storage путей этого утверждённого host, без credentials. Unknown HTTPS hosts сохраняют прежний оригинальный fallback; новые arbitrary domains не разрешались.

Foreground остаётся contain, backdrop — cover/blur; оба используют одинаковые srcset/sizes и выбранный optimized URL. Первый poster priority, остальные lazy, рамка16:9 фиксирована. Проверка реальным локальным Next optimizer на сгенерированном JPEG1800×2700: **825489 → 86784 bytes**, WebP640, **один** image resource для foreground/backdrop при320/390px (DPR1), одинаковые размеры/позиция frame до/после. Это тестовый файл, не измерение веса настоящих production-афиш. Remote-host contract проверен с перехваченными bytes, без скачивания настоящих изображений. [Измерения](evidence/images.json).

Share helper больше не блокирует events FOR UPDATE. Короткие IDs не вызывают writes. Длинные IDs сохраняют deterministic stable campaign alias с unique/on-conflict, disabled/collision guards и финальной проверкой planned/access при launch/detail/checkout. Такой alias может однажды создаваться при чтении карточки; read-only session path означает отсутствие записей авторизации, а не запрет предусмотренного alias insert. Архитектура ссылок не заменена.

## Границы измерений

Browser request counts сняты на локальном development Chromium, с synthetic signed SDK и isolated PGlite. StrictMode отменённые attempts включены в baseline; после правок coalescing устраняет дубли. Это сравнение конкретных запросов, не обещание production latency или TTI на телефоне.

SQL counts — Drizzle statements без BEGIN/COMMIT, не измеренные TCP round trips. Shared-logger server harness даёт точные локальные counts; cross-route development logger в отдельных transition samples может пропустить statements, его0 не доказывает отсутствие обращения к БД. [Авторитетные counts](evidence/query-counts.json). Изображения сравниваются на синтетическом файле. Initial JS измеряется отдельно на настоящем локальном production build; gzip оценивается локально.

## Индексы и регион

[Каталог мигрированной изолированной БД и EXPLAIN](evidence/query-plans.json) подтверждают доступные lookup indexes: session token unique, identity provider subject/PK, user PK, events status/created/id и PK, participants owner/event, payment registration unique/owner, campaign key PK. Tiny fixture planner вправе выбирать seq scan; дополнительные plans с отключённым seqscan показывают только доступность индекса, не production performance. Mixed ordering events и registrations может требовать дополнительной сортировки; без production EXPLAIN ANALYZE новый индекс не объявляется необходимым.

В канонической репозиторной схеме/изолированной БД у `kids_applications` отсутствует owner index: query `WHERE user_id = ... ORDER BY created_at DESC,id` остаётся Seq Scan + Sort даже при discouraging seqscan. При росте таблицы отдельный обоснованный кандидат — индекс `(user_id, created_at DESC, id)`, сначала проверить production plan/cardinality и подготовить отдельную concurrent index migration. В этом task схема/миграции не менялись, index не создавался.

[Read-only metadata](evidence/region.json): Vercel functions **iad1**, подтверждено project API; production deployment базы b2ebdb3 READY. Supabase project `gwuzekpkfrkmgluzblty` отсутствует среди проектов подключённого аккаунта; get_project не дал metadata, CLI projects list не авторизован. Поэтому **DATABASE REGION: NOT VERIFIED**. Проверенная локальная project-ref connection указывает pooler hint **eu-central-1**, который не выдаётся за доказательство региона самой БД.

Если владелец подтвердит DB в AWS eu-central-1/Frankfurt, текущая конфигурация означает US East ↔ Europe; кандидат Vercel — fra1. Число миллисекунд межрегионального RTT не измерялось, окончательный регион пока не выбран. Для завершения region check нужен Region этого production проекта из Supabase Dashboard/Management API с доступом владельца. Settings/env не менялись.

## Методика регрессионной приёмки

Тесты выполняются на текущих исходниках в изолированных PGlite17/18, отдельном native PostgreSQL18 и Chromium dev/production. SDK/HMAC, Clerk и внешние handoff управляются тестовыми adapters; реальных Google-входов, Telegram отправок и оплат эти результаты не подтверждают. Все прежние31 группы сохранены; добавлены cache, query plans, performance browser, image optimizer и bundle boundaries.

После последней правки повторены затронутые Mini App browser cohorts и штатные typecheck/lint/build. В процессе один website fixture login завершился timeout; неизменённый website набор повторно прошёл32/32. На холодном dev-сервере компиляция cities API превысила клиентский timeout: UI harness теперь отдельно прогревает компиляцию этого endpoint, сохраняя проверки CityPicker/validation. Долгий Kids cohort также отдельно прогревает website routes непосредственно перед интеграционным UI-сценарием и ожидает hydration до действий с формой; Next dev успевает выгружать inactive entries. Проверка настоящего success dialog сохранена. Для финальных длительных cohorts в disposable fixture увеличено удержание compiled routes (`onDemandEntries`); это только dev-компилятор, не runtime data cache и не production config. Один платёжный cohort остановился на ожидании hydration/detail; без изменения приложения повторный полный запуск прошёл15/15. Startup/SQL/JS/image замеры выполнены отдельно; latency из этих разных dev-запусков не сравнивается. Ошибки/retry самой формы по-прежнему проверяет website spec cohort. Dev-compile time не выдаётся за production API latency; startup count benchmark измеряется отдельно.

## Итог проверок

[Полный реестр и SHA256 проверенных исходников](evidence/checks.json): **869/869 PASS, 36 групп**. Сохранены все прежние 823 проверки, добавлены 46. Изменённые runtime-файлы (29) побайтно сверены с исходниками успешной production build; последующие изменения затрагивают только тестовый harness и документацию.

| Проверка | Результат | Доказательство |
| --- | --- | --- |
| Startup/session/profile server | 57/57 PASS; включает 14 новых проверок HMAC/resume/expired/revoked/disabled, compact payload, GET locks/writes и competing edit409 | [Server](evidence/miniapp-ui-server.json) |
| Новый performance browser | 14/14 PASS;320/390, cache/TTL, ad/Kids, identity switch и запоздавшие read/mutation responses | [Browser](evidence/performance-browser.json) |
| Изолированный cache / query plans / image optimizer / deferred bundles | 6 + 2 + 4 + 6 PASS | [Cache](evidence/cache.json), [plans](evidence/query-plans.json), [images](evidence/images.json), [chunks](evidence/deferred-chunks.json) |
| Kids / Kids entry / paid UX / bottom navigation | 21 + 16 + 15 + 15 PASS | [Kids](evidence/miniapp-kids-browser.json), [entry](evidence/kids-entry-browser.json), [payment](evidence/payment-ux-browser.json), [navigation](evidence/bottom-nav-browser.json) |
| Остальные существующие группы, включая website, auth, миграции и native PostgreSQL | PASS; входят в общий итог869 | [Реестр36 групп](evidence/checks.json) |
| `npm run lint` | exit0;0 errors,30 существующих warnings,0 warnings в изменённых файлах | [Log](evidence/lint.log) |
| `npm run typecheck` | exit0 | [Log](evidence/typecheck.log) |
| `npm run build` | exit0; изолированная production-копия текущих исходников, недоступная synthetic DB вместо remote credentials | [Log](evidence/build.log) |

Все изменения и проверки локальны. Повтор на реальном production Telegram WebView остаётся отдельным smoke после публикации владельцем.

## Ограничения и следующий шаг

Production Supabase, Vercel settings/env, Telegram webhook/menu/BotFather не менялись. Реальных сообщений/платежей нет; schema migration не требуется. Website локализация, утверждённые категории/детские права, оплата и share architecture сохранены.

После публикации владельцем нужен smoke/замер на настоящем Telegram WebView и мобильной сети: cold/warm SDK→Home, afisha/Back/tabs, Kids, account switch, pending payment. Локальная эмуляция320/390 и synthetic SDK не засчитывается за такой замер. Production region остаётся отдельной неподтверждённой metadata-проверкой, а Kids owner index — отдельной задачей при подтверждённом объёме/plan. Новый общий production-аудит не проводился.
