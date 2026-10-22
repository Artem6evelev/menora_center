# Menorah Kids в Telegram Mini App — 22.10.2026

База: `main`, `c673ac342d841e8333604fa95dc651be8c84e9d8`, исходное дерево CLEAN. Коммиты `9a6a00e` и `c673ac3` сохранены без amend. Подготовлен новый локальный коммит; push/deploy не выполнялись. Полная сводка, среды и SHA256 проверенных изменённых исходников: [evidence/checks.json](evidence/checks.json).

## Архитектура и переиспользование сайта

Новой детской системы или модели подписок нет. Используются существующие `users.childrenData`, `kidsApplications`, `profileChildren`, `ChildEditor`, canonical profile writer и неизменённая `communityAccess`.

- `lib/kids/applications.ts` содержит общий `createKidsApplicationForUser(tx, actor, input)`: строгая проверка canonical программы и 1–20 уникальных child IDs; fresh user row lock; повторная проверка `canManageChildren` / `canRegisterChildren`; проверка каждого ребёнка и установленного `parentId`; snapshot ребёнка и контакты родителя только из БД. Ошибки не раскрывают SQL или чужие данные.
- Website `submitKidsApplication` сохраняет Clerk `requireCommunityUser()` и вызывает этот helper. Старые передаваемые сайтом контактные поля игнорируются, legacy children-вход преобразуется только в IDs; чужие identity/access поля запрещены. Mini App не импортирует Clerk server action: его route получает actor через `withMiniAppSession()` и вызывает тот же helper.
- Блокировка одного профиля сериализует заявки с обеих поверхностей. Существующая пара ребёнок/программа не создаётся заново при повторном tap, изменении порядка/состава выбора или retry. Если добавлен новый ребёнок, создаётся заявка только для него. Pending/approved/rejected история и snapshots не переписываются. Rejected не превращается обратно в pending; пользователь видит статус и контакт.
- Найден и исправлен пробел optimistic protection: website `saveOwnChildren` теперь увеличивает существующий `filterRevision` при сохранении семьи. Поэтому старый snapshot Mini App конфликтует с реальным изменением детей на сайте. Это не новая версия/схема, и технический Telegram sync по-прежнему не увеличивает эту revision.

## Программы

`lib/kids/programs.ts` — единственный каталог восьми программ с прежними названиями, возрастами и описаниями. Помимо семи из ТЗ сохранены «Совместные праздники и встречи», присутствующие на [публичной странице](https://www.menorah-rishon.com/kids). Каталог используется public `/kids`, website `/dashboard/kids` и Mini App/API. `program-cards.ts` только сопоставляет строковые имена иконкам; второго массива названий нет. Tailwind сканирует `lib/kids`, сохраняя прежние цвета website-карточек. Возраст ребёнка вычисляется только для показа, новых возрастных ограничений для заявки не вводилось.

## Mini App flow

Home: ближайшие мероприятия → карточка Menorah Kids → статус профиля и второстепенные действия. Bottom nav остаётся из четырёх вкладок. Kids открывается внутри `/miniapp`; Telegram BackButton закрывает confirmation sheet, затем возвращает на Home.

Kids: компактный hero с существующим `/kids/kids1.webp` и зарезервированными пропорциями → «Моя семья» / «Программы» → выбор одного или нескольких собственных детей → подтверждение программы и имён → «Отправить заявку». После ответа список/статусы обновляются без reload. Показаны подтверждение и информация о рассмотрении администратором. Повторный ответ `created:false` не выдаётся за новую отправку.

«Моя семья» использует общий ChildEditor для добавления, изменения и удаления. Сохранение идёт через существующий `/api/telegram/miniapp/profile` с body `profileVersion`; отдельного competing save API нет. Используется загруженный snapshot, без blind overwrite и замены stale revision свежей. Конфликт сохраняет введённое; доступно обновление после отмены редактирования. После сохранения показывается RU toast «Данные ребёнка сохранены». Удаление из семьи не удаляет прежние заявки.

Данные Kids находятся только в состоянии этого экрана. При уходе он размонтируется; запрос загрузки отменяется, а refresh профиля учитывает AbortSignal и не принимает поздний ответ размонтированного Kids. Нет глобального family cache. UI всегда RU, включая EN/HE Telegram/device metadata; selector и stage-вопрос в основной анкете не добавлены.

## Права и API

| Состояние | Результат |
| --- | --- |
| Maternal female, актуальная полная анкета | Управление своими детьми и заявки |
| Giyur female completed | Те же права |
| Giyur female unknown / advanced | Child-action gate при открытии Kids, без детских прав; completed через существующий giyur endpoint обновляет данные и открывает исходный Kids flow |
| Male, включая completed giyur | «Запись детей оформляется через профиль мамы.» и WhatsApp CTA; нет самостоятельного управления или записи |
| None / неактуальная или неполная анкета | Kids API не выдаёт доступ; сохраняется основной resources/onboarding policy |

`GET /api/telegram/miniapp/kids`: только собственные children, permissions, own application history, canonical programs и snapshot token. Parent contacts/admin-only поля не возвращаются. `POST /api/telegram/miniapp/kids/applications`: только `{programTitle, childIds}`, существующие same-origin, JSON/body-limit и Telegram session protections. Disabled identity и logout запрещают чтение/запись. Статусы: pending → «На рассмотрении», approved → «Подтверждено», rejected → «Не подтверждено» с контактом; история видима. Материнский статус не копируется детям. Старые семейные связи и административные исключения не менялись.

## Файлы

| Область | Изменения |
| --- | --- |
| Общая логика / каталог | `lib/kids/applications.ts`, `programs.ts`, `program-cards.ts` |
| Website | `actions/kids.actions.ts`, `actions/community-children.ts`, `app/(marketing)/kids/KidsProgramsClient.tsx`, `components/dashboard/kids/kids-dashboard-client.tsx`, `tailwind.config.ts` |
| Mini App | `components/miniapp/kids.tsx`, `app.tsx`, `ui.tsx`, contact label prop и `app/miniapp/miniapp.css` |
| API | `lib/telegram/miniapp-kids.ts`, `app/api/telegram/miniapp/kids/route.ts`, `kids/applications/route.ts` |
| Проверки | `kids-release-cases.cjs`, `miniapp-kids-browser.cjs`, Telegram release harness и обновлённая website regression с canonical title / fresh revision |

## Проверки

**759/759 PASS, 28 групп**: прежние 686 + 26 новых Kids cases на PGlite и те же 26 на native PostgreSQL + 21 новый браузерный Kids case. Каждая проверка записана в `evidence/*.json`.

- `node tests/community/telegram-release.cjs`: **118 PASS**; `telegram-native.cjs`: **119 PASS**, включая независимые concurrent PostgreSQL connections. Проверены ownership, явный foreign parent, запрет подмены identity/contact/status, canonical title, unique/max IDs, CSRF, disabled identity, fresh permission revocation, idempotence, все статусы, сохранение snapshots и website ↔ Mini App revision conflict.
- `node tests/community/miniapp-kids-browser.cjs`: **21 PASS**, 320/390/1280 px. Home/order/nav/Back, canonical 8 карточек, RU, single/multiple confirmation, rapid tap, CRUD, настоящий competing profile request, stage gate, male/none, retry, смена аккаунта/logout, создание с сайта и admin status updates. [Family 320](evidence/320-kids-family.png), [programs 390](evidence/390-kids-programs.png), [desktop family](evidence/1280-kids-family.png).
- Website: public каталог и цвета сопоставлены с API; Clerk dashboard отправляет заявку, подтверждает успешный action и показывает сохранённый статус при свежем открытии страницы. Прежние website alert/reload и анимации не переписывались. Действующая admin page читает заявку Mini App и меняет approved/rejected; Kids показывает оба результата и сохраняет историю. `regression.cjs`: **36 PASS**, включая старые family/manual exception scenarios.
- Прежние девять browser groups выполнены последовательно с общим reset: **9/9 PASS**. Серверные группы из базового набора также пройдены; после обновления semantic revision повторена затронутая website regression. Её старое ожидание постоянной revision заменено проверкой stale failure и последующим fresh success.
- `npm run lint`: **PASS**, exit 0; 0 ошибок / 30 прежних `no-img-element` предупреждений вне изменённых файлов, новых предупреждений нет. [Лог](evidence/lint.log). Правила не ослаблялись.
- `npm run typecheck`: **PASS**, exit 0. [Лог](evidence/typecheck.log).
- `npm run build`: **PASS**, exit 0, штатная команда через `tests/community/build.cjs` на текущих исходниках без настоящих `.env`. Недоступная synthetic loopback DB приводит к прежнему sitemap fallback и ожидаемой ошибке соединения в логе; production-данные sitemap не проверены. [Лог](evidence/build.log).
- Production-build browser: **2 PASS**, JS boundary: **1 PASS**, без website Clerk runtime в Mini App. Размер/gzip-оценка записаны в `checks.json`; это не измерение устройства.

Все БД — изолированные PGlite 17/18 или disposable loopback PostgreSQL 18. Браузер — локальный Chromium, подписанный SDK/identity и Clerk — явные синтетические adapters; Bot API stub, внешняя навигация заблокирована. Проверка native Telegram Android/iOS, настоящего Clerk/Google OAuth и реальных сообщений этим не подтверждается.

## Границы

Схема, migrations, SQL release files, RLS, identity/session model, community policy, event/share architecture, платежи и утверждённые категории не изменены. Новых пакетов и env нет. Production Supabase, webhook/menu/BotFather и Vercel не менялись. Реальные заявки/сообщения/платежи, push/deploy не выполнялись; публичная версия этим запуском не обновлена. После публикации владельцем остаётся ручной Kids smoke-check в настоящем Telegram Android/iOS, включая клавиатуру и safe areas. Новый общий production-аудит не проводился.
