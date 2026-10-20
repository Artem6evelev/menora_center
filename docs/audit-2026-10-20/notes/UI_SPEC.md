# UI, маршруты и соответствие новому ТЗ — рабочие доказательства аудита

Дата: 20.10.2026, Asia/Jerusalem. Проверен локальный `main`, commit `c43b0d54a84038b257aa1ef7b151942d95baa629`; продуктовые файлы агентом не изменялись. Номера строк относятся к этим файлам. Это вспомогательная записка для сведения в пять итоговых отчётов; номера UI-* не заменяют общую нумерацию замечаний/MC-*.

Источники: полностью прочитаны `evidence/document.xml.txt`, `comments.xml.txt`, `pdf-text.txt` (семь страниц); визуально просмотрены оба встроенных скриншота DOCX. Скриншот раздела «САЙТ» показывает страницу, совпадающую с текущей `/events` (два заголовка «Ближайшие События», «События Menorah», фильтры), хотя URL в ТЗ не указан. Поэтому исключать каталог `/events` из проверки было бы неправильно. Разделы про гостя следует проверять и на `/`, и на `/events`. Комментарий к полу поясняет сценарий записи ребёнка; второй комментарий отмечает добавление раздела «ДЕТИ». Комментарии не снимают конфликта допуска категорий гиюра.

## Выполненная изолированная проверка

Команда: `node docs/audit-2026-10-20/diagnostics/ui-render-audit.cjs`. Итог — 14/14 проверок воспроизводят текущее поведение. Это **выполненный изолированный component-render test**, а не успешные проверки соответствия ТЗ. Данные синтетические; сеть, реальные Clerk/Google, БД, регистрации и уведомления не вызываются.

Реальные TSX-компоненты трансформируются TypeScript и выполняются с React 19.1.0 `renderToStaticMarkup`. Замоканы источники данных, auth, Next Link/Image/router, анимация и не относящиеся к событиям секции главной. Открытый mobile drawer проверен принудительным начальным состоянием компонента, без клика. Полученные HTML не являются ответом реального Next-сервера; `event-client-props.json` — props React element, не перехваченный RSC payload. Настоящие SSR/гидратация/mobile viewport/OAuth остаются для отдельной проверки. Первоначальный запуск диагностического harness потребовал добавить отсутствующий mock `usePathname`; продуктовых ошибок этот служебный сбой не доказывал.

Сохранено в `evidence/ui-render/`: `home-guest.html`, `event-guest.html`, `event-client-props.json`, `event-metadata.json`, `navbar-guest.html`, `navbar-mobile-open-guest.html`, `onboarding-initial.html`, `paid-ticket.html`, `results.json`.

Подтверждено выполненной проверкой:

- Гостевая Home содержит название и URL изображения синтетического события, заголовок «Ближайшие события» до какой-либо гидратации.
- Гостевой `SingleEventClient` скрывает видимый текст описания, но сохраняет фоновый URL изображения и старый текст с единственной кнопкой Google.
- Серверная функция страницы передаёт клиенту полный объект события, включая описание; `generateMetadata` возвращает то же описание гостю. Это не только краткая вспышка контента до эффекта.
- Navbar гостя содержит desktop menu; Desktop «Регистрация» выбирает Clerk `SignUpButton`, а не анкету. Открытый mobile drawer содержит «Регистрация», но не «Войти».
- Начальная анкета сразу содержит поля имени/города/старого jewishStatus и не содержит нового вопроса/пола.
- Реальный `StatusBadge`, вызванный через `MyEventsClient`, показывает для `status=paid` «Ожидает».

## Покрытие маршрутов и модулей

В таблице «чтение» означает просмотр server route, используемого client component, значимых действий/состояний. Работоспособность в реальном браузере не утверждается.

| Маршрут/модуль | Фактическая точка входа и текущая граница | Проверка/вывод |
|---|---|---|
| `/` | `app/(marketing)/page.tsx:64-198` → Hero, UpcomingEvents | Чтение + isolated render; guest events видны, UI-01 |
| Общий marketing layout/menu | `app/(marketing)/layout.tsx:37-48`, `components/navbar/index.tsx:5-60`; Desktop/Mobile | Чтение + isolated render; меню не зависит от гостя; UI-01/02 |
| `/events` | `app/(marketing)/events/page.tsx:22-93` → EventsPageClient/PublicEventCard | Чтение; каталог и JSON-LD доступны гостю; нет пагинации после 12; UI-01/08 |
| `/events/[id]` | `app/(marketing)/events/[id]/page.tsx:13-48` → SingleEventClient | Чтение + isolated render; body guest gate есть, объект/metadata полный; UI-01/02/05 |
| `/sign-in`, `/sign-up` | Catch-all pages содержат `<SignIn/>`/`<SignUp/>` | Чтение; SDK UI существует, настройки Google instance и callback runtime не проверены |
| Регистрационная анкета | `app/dashboard/layout.tsx:24-38` → OnboardingForm | Чтение + initial render; анкета только после auth на dashboard; старые поля без фильтра; UI-03 |
| `/welcome` | WelcomeClient, quick links + donation | Чтение; не анкета; `/contacts` отсутствует; UI-12 |
| `/kids` | KidsProgramsClient; общедоступная форма заявки | Чтение; guest и auth используют один submitKidsApplication, без пола/допуска; UI-04 |
| `/services` | PublicServicesPage → ServicesPageClient/PublicServiceCard | Чтение; intent сохраняется до auth, modal phone, `registerForService`; публичная область нового ТЗ прямо не определена |
| `/lessons` | `getVideos` → LessonsClient | Чтение; поиск/category/author, YouTube modal и Escape существуют; реальная сеть YouTube не проверена |
| `/news`, `/news/[slug]` | `getPublicNews/getNewsBySlug` → PublicNewsCard/ArticleContent/CommentsSection | Чтение; categories, comments, raw HTML article. Content authorization/XSS сведены в security-раздел основного отчёта |
| `/authors`, `/authors/[slug]` | active profiles; articles/videos filtered `status=published` | Чтение; directory/404 inactive/tab content/donation links существуют |
| `/about` | TeamGrid | Чтение; static team cards/modal, реальность внешних контактов не проверялась |
| `/contact` | ContactPage → ContactForm | Чтение; onSubmit только логирует, UI-11; карточка контактов скрыта на mobile |
| `/pricing` | Pricing/Companies/PricingTable | Чтение; публичный оставшийся шаблон Everything AI, UI-12 |
| `/privacy`, `/terms`, `/rules` | Static content/metadata | Чтение; юридическая содержательная экспертиза N/A, не заявляется |
| `/dashboard` | auth + self dbUser → ProfileManager | Чтение; profile/family editing, без gender, без фильтра jewishStatus; UI-03/04 |
| `/dashboard/events` | auth, `getEvents`, вычисляется isAdmin для UI | Чтение; управление событиями для admin, запись client; UI-04/06/10 |
| `/dashboard/my-events` | собственные eventParticipants/kidsApplications по session userId | Чтение + paid badge render; история есть, кнопок самостоятельной отмены нет; UI-07 |
| `/dashboard/kids` | auth + собственный профиль/заявки → KidsDashboardClient | Чтение; family save + enroll programs, UI-04 |
| `/dashboard/applications` | role admin/superadmin → все events/participants, ApplicationsClient | Чтение; статусы, удаление, контакты, WhatsApp reminder; UI-10; нет отдельной безопасной формы ручного исключения ребёнка |
| `/dashboard/kids-applications` | role admin/superadmin → KidsApplicationsClient | Чтение; фильтры/статусы/удаление/контакт, optimistic result ignored, UI-10 |
| `/dashboard/services` | layout auth, role только для UI → ServicesClient | Чтение; CRUD service/category. В sidebar сейчас отсутствует ссылка, маршрут существует |
| `/dashboard/my-services` | auth → собственные заявки + pending intent modal | Чтение; modal phone, register; durable intent без owner, UI-09 |
| `/dashboard/service-applications` | admin/superadmin → ServiceApplicationsClient | Чтение; выбор сервиса/заявки. В sidebar нет ссылки, маршрут существует |
| `/dashboard/kanban` | admin/superadmin → KanbanBoard → useTaskStore | Чтение; CRUD/drag-drop/назначение; откаты ошибок отсутствуют, UI-10 |
| `/dashboard/chat` | `role===client` → ClientView; любая иная роль → AdminView | Чтение; неправильная модель ветки для author; полномочия server actions проверяются отдельно, не считаем UI само по себе data breach |
| `/dashboard/users` | admin/superadmin → CrmTableClient | Чтение; page20/search/filters/roles/bulk message/slider tags/history; серверные permissions отдельно |
| `/dashboard/team` | superadmin → TeamTable/useUserStore | Чтение; роли optimistic, ошибка не откатывается, UI-10 |
| `/dashboard/telegram` | admin/superadmin → TelegramClient | Чтение; broadcast/settings/clear; отправки не выполнялись |
| `/dashboard/news` | author redirect на author-profile; admin/superadmin → AdminNewsClient | Чтение; create/edit/delete/categories/upload, ошибки в основном отображаются |
| `/dashboard/news/create` | author/admin/superadmin, `asAuthor=true` только понижает effectiveRole | Чтение; rich editor/image/category/submit; проверки сервера отдельно |
| `/dashboard/author-profile` | только auth, отсутствующий profile создаётся в render | Чтение; role check отсутствует, авторство не должно выдаваться по посещению URL; профиль API отдельно |
| `/dashboard/authors` | admin/superadmin → AdminAuthorsClient | Чтение; activate/delete/make author; внешние операции не выполнялись |
| `/dashboard/moderation` | admin/superadmin → ModerationClient | Чтение; approve/reject и required rejection comment; loading не сбрасывается при thrown action, UI-10 |
| `/dashboard/videos` | admin/superadmin → AdminVideosClient | Чтение; CRUD URL/category/author; реальные публикации не выполнялись |
| `/admin` | `app/admin/page.tsx:11-46` auth + только собственный профиль | Чтение; устаревший личный кабинет, не админские полномочия по одному имени маршрута |
| `/sitemap.xml`, `/robots.txt` | `app/sitemap.ts`, `app/robots.ts` | Чтение; sitemap events, robots допускает marketing; UI-01 |

Найденные неиспользуемые реализации: `components/login.tsx`, `signup.tsx`, `layouts/auth-layout.tsx`, `components/events/single-event-action.tsx`, `components/UniversalPaymentForm.tsx`, `app/dashboard/kids/KidsAdminClient.tsx` не импортируются активными routes (по `rg`). Не следует приписывать их текст/ошибки действующему flow. UniversalPaymentForm существует как компонент, но отдельного действующего внутреннего donation checkout не обнаружено; активные пожертвования — внешние ссылки Shutafim. RSS, calendar export, `/search` route и независимый UI импорта не обнаружены. Главная содержит JSON-LD SearchAction на несуществующий `/search` (`page.tsx:154-158`), это небольшой SEO-долг, не защита доступа.

## Подтверждённые замечания

### UI-01 — гостевой каталог, Home и технические каналы сохраняют сведения о событиях

P1, высокая уверенность. Вид доказательства: чтение кода + синтетический component render. Источник: **требование ТЗ** PDF стр.1–2; состав допустимого preview — отдельное решение по ТЗ.

`Home:64-98,135-185` всегда получает события и создаёт eventItem с title/image, затем выводит Hero и UpcomingEvents. `UpcomingEvents:13` проверяет только длину списка, `userId` не используется. `PublicEventsPage:22-29,37-63,84-89` отдаёт каталог и Event JSON-LD до auth-проверки. `NavBar:5-58` и marketing layout:44 выводят полное меню для гостя на обеих страницах. У прямого события видимый текст закрыт `SingleEventClient:238-270`, однако `SingleEventPage:39-48` отправляет полный объект клиентскому компоненту; `generateMetadata:13-33` раскрывает title/description/image. Guest body содержит исходный image URL под CSS blur (`SingleEventClient:241-246`). Sitemap:55-85 перечисляет до 100 событий. Отдельной логики допуска по профилю нет.

Повторение без real DB: выполнить diagnostic command; открыть синтетические home-guest.html/event-client-props.json/event-metadata.json. Это доказывает путь данных локального кода, не содержание production.

Минимальное исправление: согласовать минимальный публичный teaser; применить единую серверную политику к loaders/actions/metadata/sitemap и DTO, отдельно убрать guest menu/карусель/Upcoming. В клиентский guest component передавать только необходимые публичные данные. Нельзя ограничиться CSS/robots. Регрессия: guest без JS, client hydration, RSC/prefetch, metadata/sitemap, mobile, все группы допуска; права гиюра зависят от решения владельца.

### UI-02 — гостевой экран события и кнопки входа не соответствуют двум новым веткам

P2, высокая уверенность. Чтение + isolated render. Источник: **требование ТЗ** PDF стр.2–3.

`SingleEventClient:248-266` содержит «Один шаг до регистрации», старое пояснение и единственную «Продолжить с Google». Новых двух кнопок нет. В общем header остаётся SignUpButton «Регистрация» (`DesktopNavbar:168-179`, MobileNavbar:164-169), хотя на direct event ТЗ её убирает. Desktop «Войти» открывает общий Clerk SignIn modal, без явного Google-only вызова (`DesktopNavbar:170`). Mobile menu импортирует SignInButton, но **вообще не рендерит** «Войти» для гостя (`MobileNavbar:162-182`). Регистрация ведёт в Clerk signup, анкета появляется лишь после auth в `/dashboard`, а не как отдельная ветка из ТЗ.

Прямой Google flow в событии действительно выбран: `handleGoogleDirectLogin:164-175` использует `oauth_google`; return path внутренний `/events/${eventData.id}`. Реальные настройки Clerk Google, новый аккаунт/перенос анкеты/callback/error/cancel не проверены. Catch пустой: ошибка просто возвращает кнопку из loading без сообщения.

Минимальное исправление: новый guest component с точным текстом и двумя destination; header guest mode для прямого event; mobile login/registration отдельно; возврат к событию после auth+анкеты хранить в проверенном внутреннем intent. Последнее — **целостность сценария/рекомендация**, детали хранения ТЗ не определяет. Регрессия: каждая кнопка с `/events/id`, новый Google account из «уже регистрировался», отмена OAuth, безопасный returnUrl, незавершённая анкета.

### UI-03 — новая фильтрующая анкета отсутствует

P1, высокая уверенность. Чтение + initial render. Источник: **требование ТЗ** PDF стр.4–6.

`OnboardingForm` state:14-25 содержит старый jewishStatus без пола. Полное приветствие заменено коротким «Добро пожаловать / Почти готово!» (`112-122`). С первого render видны имя/телефон/дата/город (`128-283`); нет обязательного вопроса под приветствием, предварительного скрытия полей и переходов трёх веток. Старое «Ваш статус» и семь вариантов остаются (`184-211`); нет нового объединённого варианта гиюра, третьей gratitude ветки/ресурсов/пояснения двух разрешающих веток. Ввод ребёнка зависит лишь от hasChildren (`308-366`). `completeUserProfile` вызывается для всех старых вариантов одинаково (`63-81`).

Существующие полезные поля: firstName,lastName,phoneCode,phone,dateOfBirth,city,maritalStatus,hasChildren,spouseName,childrenList, согласие; `source` имеется в state, но input отсутствует. Эти поля/семейные связи нужно сохранить в разрешающей ветке, не заменяя форму одной новой status-радиогруппой. ProfileManager также имеет старую модель (`71-86,325-346`) и вообще не содержит варианта «Еврей по материнской линии» в редактируемом select, хотя Onboarding его создаёт; последствия actual submit на такой форме требуют browser test, автоматическую потерю значения по одному чтению не утверждаем.

Минимальное исправление: отдельные gender и connection enum, точные тексты и branching, серверная схема и единый policy (без автоматического grant неизвестным); убрать дублирующий status только после сохранения его значения как нового answer. Выбор третьей ветки после ввода должен не отправлять скрытые family data; сохранять/очищать draft — решить владельцу. Внешние resource URL в ТЗ отсутствуют; существующих целевых ссылок этой ветки в коде нет. Новые URL здесь не предлагаются. Регрессия: initial/3 ветки/смена 1→3→2/back/reload/unknown+missing enum/direct submit/network error. Правила потери draft и сохранения lead — AMBIGUOUS.

### UI-04 — UI добавления и записи детей открыт независимо от пола и связи с еврейством

P1, высокая уверенность. Чтение. Источник: **требование ТЗ** PDF стр.1,5–7.

Независимые действующие пути: OnboardingForm `308-366`; ProfileManager `105-110,117-123,406-469`; `/dashboard/kids` пропускает любой собственный auth профиль (`page:9-23`), KidsDashboardClient `137-185` вызывает семейное сохранение/запись и не проверяет gender/jewishStatus; direct SingleEventClient `191-209,519-584` даёт выбрать старых детей и добавить нового; dashboard EventCard family map позволяет старых детей; публичный KidsProgramsClient `156-180,979-1120` принимает новые children и отправляет заявку до регистрации аккаунта (`1139-1155`).

Создание child profile и заявка в программу — разные операции; публичная заявка хранится pending/обрабатывается администратором и не обязательно равна окончательной записи. Допустимость именно публичного лидогенерирующего экрана требует уточнения, но отсутствие новой фильтрации на всех путях подтверждено. Один `female` не доказывает принадлежность child. Схема сейчас хранит массив детей, а не подтверждённую связь parent-child; серверные обходы проверяются основным security-аудитом.

Минимум: единая server policy самостоятельного create/enroll и UI её отображения; отдельное manual exception с действующим админом, reason/audit и проверкой child ownership. Недопустимо выдавать `father is non-Jewish` как техническую заготовку без решения конфликта достоверности. Мать в объединённом гиюр-ответе — AMBIGUOUS, религиозные выводы не добавлять. Регрессия: мужчина/допущенная мама/чужой child/ранее созданный отцом/все client entrypoints/админ exception.

### UI-05 — незавершённый новый профиль блокируется только внутри dashboard

P1, высокая уверенность. Чтение. Источник: **исправление дефекта целостности сценария** и требование фильтрации. `DashboardLayout:25-38` блокирует только роль client при отсутствии isProfileComplete. `/events/[id]` проверяет только userId, затем `SingleEventClient:238,315-421` сразу даёт event description+кнопку; регистрация открывается `178-180`, completion/gender/answer не проверяются. Новый аккаунт после прямого OAuth возвращается именно на event (`171`) и обходит анкету dashboard. AutoRegister дополнительно смонтирован внутри onboarding branch (`DashboardLayout:29`).

Повторение для тестовой среды: новый synthetic Clerk user без completed DB profile → открыть direct event → увидеть authenticated event form/вызвать регистрацию; real OAuth не запускался. Для старых профилей с null допустимое переходное поведение AMBIGUOUS; замечание не объявляет всех legacy пользователей недопущенными.

Минимум: отдельный admission/completion check в server entry/actions, redirect на анкету с сохранением intent; повторный check при записи. Тест: новый account direct flow и legacy null по принятой transition policy.

### UI-06 — штатная запись на платное событие из кабинета обходится без суммы

P1, высокая уверенность. Чтение client+server; реальная оплата/запись не выполнялась. Источник: **исправление обнаруженного дефекта**.

`components/dashboard/events/event-card.tsx:99-125` вызывает registerForEvent четырьмя аргументами (нет totalAmount). `actions/event.ts:452` выбирает `paid` при отсутствующей сумме; `497-515` создаёт paymentUrl лишь при положительной переданной totalAmount. Таким образом действующий client path получает success без оплаты и показывает успешную запись (`EventCard:115-121`) даже если событие платное.

В прямом event другой дефект расчёта: `calculateTotal:141-159` не учитывает добавляемого в том же modal newChild/newSpouse; они попадут в selected family только внутри `handleRegisterSubmit:191-209`, а в action передаётся ранее вычисленный totalAmount (`218`). Это даёт недоплату при добавлении родственника. Главный корень — доверие сумме клиента; учёт должен выполняться на сервере по реальному событию/участникам.

Минимум: сервер рассчитывает состав/цену и статус независимо от отсутствующего/0/отрицательного client amount; единая модель для обеих UI форм. Регрессия: dashboard paid path, tampered amount, бесплатное событие, новый супруг/ребёнок, pending retry, webhook mismatch; sandbox с synthetic payment provider.

### UI-07 — успешно оплаченный и бесплатный билет помечаются «Ожидает»

P2, высокая уверенность. Чтение + выполненный render `paid-ticket.html`. Источник: **исправление обнаруженного дефекта**.

`StatusBadge:22-51` в my-events-client знает `approved`, `rejected` и kids `in_progress`; остальное — «Ожидает». `actions/event.ts:452` выдаёт `paid` бесплатным заявкам, webhook `app/api/webhooks/shutafim/route.ts:27-36` переводит успешную оплату в `paid`; следовательно реальная успешная заявка не отображается подтверждённой. Минимум: единые event status enums/labels, отдельно payment и administrative admission, если бизнес их различает. Тест: paid/pending/abandoned/approved/rejected и Kids statuses.

### UI-08 — каталог событий обрезан первыми 12 и фильтруется неполно

P2, высокая уверенность. Чтение. Источник: **исправление обнаруженного дефекта**.

`PublicEventsPage:26-29` получает 12 и передаёт hasMore (`84-88`); `EventsPageClient:24-28` не принимает hasMore, state сохраняет initial12 (`42`), grid завершается без loadMore (`292-312`). Поиск/дата/цена выполняются локально только по этой странице (`98-150`); категория догружает максимум 100 (`47`). Мероприятие №13 не найти через «Все»/поиск по его названию. После быстрого выбора категорий старый ответ может переписать новые events: эффект `44-55` не отменяет запрос и не сверяет request/category identity; такая же гонка в ServicesPageClient `33-44`.

Минимум: проводить фильтры и пагинацию совместно на сервере, использовать hasMore/loadMore; отменять или игнорировать устаревшие ответы, отрисовать pending/error/empty. Тест: ≥13 synthetic records, поиск/дата последнего, reset category, порядок задержанных A/B-ответов.

### UI-09 — сохранённые intent не связаны с аккаунтом и правами

P2, высокая уверенность в механизме, влияние cross-account требует runtime проверки. Источник: **исправление обнаруженного дефекта**.

`store/useRegistrationStore.ts:17-38` сохраняет eventId/phone/extraData одним global localStorage key; owner/account/version/expiry нет. В активном коде writer setPendingEvent не найден, поэтому риск относится к старому сохранённому intent/старой реализации, а не воспроизведённому текущему клику. AutoRegister `21-39` автоматически выполняет его для любого текущего userId, включая до завершения анкеты; на success с paymentUrl просто очищает intent и не открывает оплату. `store/useServiceRegistration.ts:10-18` аналогично без владельца; этот writer активен в PublicServiceCard `57-60`. Logout sidebar `291-296` только Clerk SignOutButton; явного сброса Zustand/persisted intents нет.

Механизмы защищённого server/CDN cache не следует выводить из этих клиентских store. Большинство остальных Zustand stores неперсистентные, но живут глобально в SPA и не очищаются по account change; фактическую утечку после Clerk redirect без browser test не утверждаем.

Минимум: account-bound, short-lived intent; при смене аккаунта/выходе очистка, при replay повтор admission/ownership; после auth пользователь подтверждает актуальный состав/сумму; stale keys мигрировать/сбросить. Тест: A intent→logout→B, stale paid intent, status revoked before replay, back navigation.

### UI-10 — ошибки записи в админских UI оставляют видимость успеха/зависший loading

P2, высокая уверенность. Чтение. Источник: **исправление обнаруженного дефекта**.

Конкретный доказанный пример: EventModal `200-209` игнорирует `updateEvent` result, обновляет store и закрывается (`225-226`), хотя action возвращает `{success:false}` (`actions/event.ts:188-189`). Результат create failure также закрывает modal без ошибки (`211-226`). Заявки: ApplicationsClient `305-343,346-374` и KidsApplicationsClient `320-330` меняют local data до ответа, не проверяют результат, не откатывают. Team roles: useUserStore `27-42` сохраняет optimistic роль после failure, только console.error. TaskStore `60-82` перемещает/удаляет/редактирует без rollback. Onboarding `63-81` и SingleEventClient `183-235` сбрасывают submitting только при resolved result; thrown transport/action ошибка оставляет spinner. ModerationClient `23-37` имеет такой же отсутствующий finally; action может throw на access/DB error.

Минимум: inspect result, catch/finally, сохранять введённую форму, показывать retry и откатывать optimistic change или обновлять canonical server state. Тест: action return false, transport rejection, права отозваны в открытой вкладке; после reload UI совпадает с сервером. Не нужно тестировать каждый setter, достаточно контракта каждого mutation pattern.

### UI-11 — контактная форма не отправляет обращение

P2, высокая уверенность. Чтение. Источник: **исправление обнаруженного дефекта**.

Действующий `/contact` рендерит ContactForm (`page:87-88`). `ContactForm.onSubmit:64-68` только выводит values в browser console; backend/API/email/storage вызова нет, успешного результата/ошибки тоже нет. Форма содержит шаблонные английские labels/social links (`70-90,219-228`). Реальные сведения/аккаунты не использовались.

Минимум: подключить согласованный существующий канал обработки обращений с результатом, либо убрать рабочеподобную форму, пока канала нет. Не добавлять новый сервис без обоснования. Тест: synthetic success/failure/duplicate submit; пользователь видит результат, сообщение оказывается в test sink. Проверка реальности отображаемых адреса/телефона требует данных владельца: в ContactPage `21-27` они явно помечены комментарием как заменяемые.

### UI-12 — остаточные публичные маршруты и mobile contact navigation

P3 (сломанная `/contacts` ссылка P2 при использовании как основного пути связи), высокая уверенность. Чтение. Источник: **исправление обнаруженного дефекта**.

WelcomeClient `153` ведёт «Где мы находимся» на `/contacts`, тогда как в `app` имеется только `/contact`. ContactPage `93` прячет единственный блок адреса/телефона/часов за `hidden md:flex`, без mobile дубля; мобильному посетителю остаётся неотправляющая форма. `/pricing` остаётся общедоступной страницей шаблона Everything AI с нерелевантными тарифами/metadata (`page:10-33`). Главная metadata ссылается `/public/seo/main.webp` (`30,41`) вместо реального `/seo/main.webp` в `public/seo/main.webp`. Изображения fallback `/og-default.jpg`, `/default-event-poster.png` надо проверить наличием файлов, не считать по одному имени отсутствующими.

Минимум: поправить route ссылки/mobile контактный блок, согласовать удаление/redirect ненужного `/pricing`, устранить неверный public prefix. Тест: route-link crawl/снимок mobile contact, HTTP asset path; не требует смены дизайна.

### UI-13 — доступность обязательной анкеты и модальных flow

P2, высокая уверенность для разметки; реальная клавиатура/скринридер NOT VERIFIED. Чтение. Источник: **исправление обнаруженного дефекта**, не отдельное правило нового ТЗ.

Onboarding labels — отдельные `<label>` без htmlFor, inputs без id (`130-140,143-153,184-211`); доступные имена обязательных полей не привязаны к visible labels. Mobile burger/close кнопки не имеют accessible label, aria-expanded/aria-controls (`MobileNavbar:62-67,91-96`). Desktop dropdown открывается только mouse enter/leave, без focus/keyboard (`DesktopNavbar:60-77`). Event registration/payment modal (`SingleEventClient:428-442,688-713`) не имеет dialog semantics/focus trap/Escape/return-focus; close иконки не подписаны. PublicEventCard вкладывает button внутрь anchor (`15-36`), title/date/buttons скрыты opacity0 до group-hover без focus-visible варианта (`24`), что ухудшает touch/keyboard experience. В KidsProgramsClient частично лучше: role dialog/aria-modal/title/close label есть (`897-899,923,933`); focus/Escape не найдены.

Минимум: label/id связи, именованные icon buttons, keyboard trigger и focus management через уже имеющиеся UI primitives; для карточки один интерактивный элемент с всегда доступной существенной информацией. Тест: keyboard-only + accessibility tree/axe + touch viewport; отсутствие автоматического теста само по себе не доказывает проблему.

Языки: весь routing и тексты русские, `<html lang="ru">` (`app/layout.tsx:50`), Clerk ruRU. next-intl установлен, но locale routes/config/messages/provider/переключатель и `dir` не обнаружены. Поддержка иврита/RTL — **N/A как действующий модуль**, поскольку функция не заявлена/не реализована, не дефект нового ТЗ. Иврит в названиях/изображениях не означает полноценную RTL-локализацию.

## Атомарные строки для общей матрицы ТЗ

Ниже нет общей MC-нумерации и подсчётов. Статусы относятся к конкретному требованию; UI render FAIL означает доказанное несоответствие, а не неудачу harness. Для связанной серверной политики добавить отдельные строки из security/data аудита.

| PDF | Ожидаемое поведение | Текущее evidence | Статус/вид доказательства |
|---|---|---|---|
| 2 | Guest `/`/`events` без меню | marketing layout:44; NavBar:5-58; render navbar-guest | FAIL; чтение + выполненный render |
| 2 | Guest без «Ближайшие события» | Home:185/UpcomingEvents:13-28; catalog:71-77; home-guest | FAIL; чтение + render |
| 2 | Guest без картинок событий | Home:93-95/Hero; PublicEventCard:19-23; home-guest | FAIL; чтение + render |
| 2 | «Войти» ведёт Google | Desktop SignInButton generic; mobile login отсутствует | PARTIAL; чтение + render; реальная Clerk config NOT VERIFIED |
| 2 | «Регистрация» ведёт анкету | Desktop:175/Mobile:165 Clerk SignUpButton; DashboardLayout:25-34 | FAIL; чтение + render |
| 3 | Direct guest event без меню | layout:44/NavBar | FAIL; чтение + render navbar |
| 3 | Direct guest event без обычной header «Регистрация» | Desktop:175-179/Mobile:165-169 | FAIL; чтение + render |
| 3 | Заголовок точно «Один шаг до записи!» | SingleEventClient:249-250 старый | FAIL; чтение + render |
| 3 | Точное пояснение про вход/регистрацию общины | SingleEventClient:252-254 старое | FAIL; чтение + render |
| 3 | Две отдельные кнопки с точными надписями | SingleEventClient:256-266 одна кнопка | FAIL; чтение + render |
| 3 | Ветка существующего участника → Google | Только прежняя единственная Google-кнопка `164-172` | PARTIAL; чтение; real flow NOT VERIFIED |
| 3 | Ветка нового участника → анкета | Новая ветка отсутствует | FAIL; чтение + render |
| 4 | Полный пятиабзацный приветственный текст | Onboarding:112-122 короткий | FAIL; чтение + render |
| 4 | Вопрос непосредственно под приветствием | Onboarding:124-155 имя/фамилия | FAIL; чтение + render |
| 4 | Вопрос о связи обязателен | Новый вопрос отсутствует; required старый jewishStatus не эквивалентен | FAIL; чтение |
| 1,4 | Отдельный пол мужской/женский собирается | state Onboarding:14-25/ProfileManager:71-80 без gender | FAIL; чтение + render |
| 4 | Три точных варианта связи | Onboarding:198-210 семь старых | FAIL; чтение + render |
| 5 | Остальные поля скрыты до выбора | Onboarding:128-283 сразу вся форма | FAIL; чтение + render |
| 5 | Вариант 1 раскрывает полную существующую анкету | Существующая анкета есть всегда, нового выбора нет | FAIL; чтение |
| 5 | Вариант 2 раскрывает полную существующую анкету | Единого гиюр-ответа/branch нет | FAIL; чтение |
| 5 | После раскрытия точное пояснение двух абзацев | Пояснение отсутствует | FAIL; чтение |
| 5 | Повторное поле «Статус» отсутствует | Старое поле Onboarding:184-211 сохранено | FAIL; чтение |
| 5–6 | Вариант 3 вместо анкеты показывает точную gratitude ветку | Такого branch нет | FAIL; чтение |
| 6 | Ресурсы Бней Ноах, госгиюра, «Натив» | Ветка и ссылки отсутствуют | FAIL; чтение; точные URL в ТЗ не заданы |
| 5–7 | Мужчина не создаёт child самостоятельно | Все четыре UI пути доступны без пола | FAIL; чтение; server actions отдельно |
| 1,6–7 | Самостоятельная запись только с профиля допущенной мамы | Доступ только по auth; public Kids заявка ещё до auth | FAIL; чтение, окончательные границы lead требуют решения |
| 5,7 | Админ вручную обрабатывает исключение только отца | Заявки statuses/CRUD есть, manual exception child flow/audit отсутствует | FAIL; чтение; отец-status конфликт AMBIGUOUS отдельной строкой |
| 1 ↔ 4–5 | Права completed/in-progress гиюра на просмотр/взрослого/детей | Конфликт source, UI допускает любую auth роль/статус | AMBIGUOUS; source comparison + чтение |
| 5,7 | «Отмечать отца неевреем» | Реализация exception отсутствует, последствия искажения статуса не разрешены | AMBIGUOUS; source comparison |
| Не задано | Когда Google связывается с анкетой | Сейчас Google предшествует dashboard анкете | AMBIGUOUS; чтение |
| Не задано | Публичный состав event preview/metadata | Полный description/props + blur image/OG | AMBIGUOUS как состав preview; нарушение общего ограничения отдельно UI-01 |
| Не задано | Сохранение lead в третьей ветке, draft/back/reload | Третьей ветки нет; draft только React state | AMBIGUOUS; чтение |
| Целостность сценария | После анкеты возврат к исходному event | OAuth возвращает в event, анкета в dashboard, единый intent отсутствует | PARTIAL; чтение; детали реализации — дополнительная рекомендация |

## Оставшиеся проверки UI

1. Реальный Next HTML, streamed RSC и hydration guest `/`, `/events`, `/events/id`, desktop/mobile; проверить содержание preview по решению владельца.
2. Изолированный synthetic Clerk tenant: оба auth пути, новый аккаунт через «уже регистрировался», callback/cancel/replay/external returnUrl; настоящее OAuth без отдельной тестовой среды не выполнять.
3. New/legacy/null профили, право обновлено в открытой вкладке, reload/back/account switch с сохранёнными intents.
4. Клавиатура/скринридер/длинные имена/узкий экран; CSS вычисления и viewport isolated render не проверяет.
5. EventCard/SingleEventClient оплачиваемое событие на synthetic provider; не использовать live Shutafim. Показать pending/paid/abandoned, суммы новых детей/супругов, закрытие iframe и проверку server status после callback.
6. Инъекция network/DB failures в UI CRUD/contact/chat/onboarding и проверка сохранения введённых данных. Серверный action result/HTTP test не равен целому browser flow.

Основные вопросы владельцу: права completed/advanced гиюра по каждому действию; порядок Google/анкета; политика legacy/истории; состав публичного preview; обработка draft и lead третьей ветки; достоверность father status vs отдельное exception. Эти вопросы не мешают независимо закрыть отсутствие авторизации, payment trust, новые тексты и технические дефекты UI.
