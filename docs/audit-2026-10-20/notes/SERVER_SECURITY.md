# Сервер, модель прав и целостность регистраций

Дата аудита: 20.10.2026. Объект: локальный commit `c43b0d5` ветки `main`; продуктовые файлы не изменялись. Результаты не устанавливают состояние production или факт эксплуатации. Применимых AGENTS.md в репозитории/родительских каталогах данным направлением не обнаружено.

Проверены все exports в `actions/{user,role,event,event-registration,service,kids.actions,kids-profile,task,dashboard,news,video,authors.actions,author-profile.actions,moderation.actions}.ts`, соответствующие страницы кабинета, middleware, схема и миграции на ограничения, вызывающие клиентские компоненты. Telegram/WhatsApp/notifications/bot-settings/webhooks разобраны другим направлением. Тексты нового ТЗ сверяет отдельная матрица; ссылки на страницы ТЗ ниже — требования задания и их подтверждение общим направлением, а не заявление о самостоятельном чтении PDF/Word данным агентом.

## Доказательства и границы

- Чтение исходного кода с актуальными номерами строк; не E2E.
- `node docs/audit-2026-10-20/scripts/server-actions-isolated.cjs`: **23/23** изолированных проверок завершились с exit 0. Файл вывода: `notes/SERVER_SECURITY_TEST_OUTPUT.txt`. PASS означает, что названное текущее поведение воспроизведено, включая небезопасное; это не 23 успешных security-регрессии.
- Скрипт исполняет реальные тела actions через `typescript.transpileModule` и VM; все импорты перехватываются. DB, auth, SMTP, Telegram и Storage заменены синтетическими mock-объектами. Окружение внутри VM пустое; реальные подключения отсутствуют. Отдельные negative controls подтверждают отказ защищённых handlers обычному пользователю и ограничение самостоятельного kids update ID из сессии.
- Mock DB не заменяет Postgres, RLS, constraints, HTTP action transport или браузер. Конкурентные проверки доказывают race в алгоритме при допущенных interleavings; отсутствие уникальности отдельно установлено в версии схемы/миграций. Основной аудит отдельно выполнил read-only introspection подключённой БД: `evidence/db-readonly.json`. Он подтвердил отсутствие pair uniqueness у eventParticipants при 0 фактических дублей; этот агент к DB не подключался. Связь БД с production commit не установлена.
- Next.js Server Actions считаются внешним входом: client action reference можно вызвать отдельно от UI; проверка роли в странице не защищает тело action. Это соответствует [официальному руководству Next.js](https://nextjs.org/docs/app/guides/data-security). Middleware защищает аутентификацией только `/admin*`, `/dashboard*`, а публичные пути тоже могут принимать Server Action POST. HTTP-достижимость конкретного action в production и action ID здесь не тестировались; build/dev manifest может отличаться.

## Карта текущих прав

| Вход | Аутентификация в handler | Проверка роли/ownership | Что фактически разрешено |
|---|---|---|---|
| middleware.ts:5–10 | `/admin*`, `/dashboard*` через Clerk `auth.protect()` | Нет роли или статуса профиля | Только защита маршрута, не каждого action |
| dashboard/layout.tsx:18–38 | Обязательный Clerk | Онбординг только для `role === client` | Другие роли обходят gate завершённости; проверки пола/связи с еврейством нет |
| user.ts:11–337 | Нет, кроме чтения `currentUser()` в completeUserProfile, без обязательности | Нет | Читать users, менять любую роль, чужую анкету/семью/теги |
| role.ts:updateUserRole:9–46 | Да | Только superadmin по свежей DB, защита одного аккаунта | Есть правильный отдельный handler, обходится user.ts:updateUserRoleAction |
| event.ts:80–191 CRUD | Нет | Нет | Любой вызывающий создаёт/меняет/удаляет события и категории |
| event.ts:106–303 чтение | Нет | Нет | Каталог, скрытые статусы, регистрации и полные users участников |
| event.ts:353–524 семья/регистрация | Нет | `userId` целиком из запроса | Читать чужую семью, изменять её и записывать владельца; цена/дети из запроса |
| event.ts:305–351 статус/удаление заявки | Да | admin/superadmin, роль из DB; также отдельный email-override | Обычный client блокируется, но роли можно поднять через SEC-01 |
| event-registration.ts:7–46 | Нет | Нет | Второй handler регистрации без gates/дедупликации и чтение полного users |
| service.ts:17–251 | Нет | Нет | Любые CRUD, чтение всех заявок+users, регистрация под чужим userId |
| kids-profile.ts:9–28 / kids.actions.ts:34–53 | Да | WHERE users.id = session.userId | Другого пользователя этим входом не изменить, но право родителя не проверяется |
| kids.actions.ts:10–31 | Сессия опциональна | Нет | Заявка гостя, произвольные родитель/дети, userId привязан к текущей сессии либо null |
| kids.actions.ts:56–129 | Да | admin/superadmin из DB + email-override | Реальное ограничение списков/статуса/удаления |
| task.ts:19–98 | Нет | Нет | Все задачи, CRUD, произвольные creatorId/assigneeId и `.set(data)` |
| dashboard.ts:7–42 | Нет | Нет | Счётчики users/news/events и статический график |
| news.ts:createNews:60–100 | Да | Нет author/admin; принимает targetAuthorId/status/isPinned | Обычный client создаёт опубликованный материал от другого автора |
| news.ts:updateNews/deleteNews:103–189 | Да | authorId текущего пользователя либо admin/superadmin | Базовый ownership есть; update принимает data spread, управление публикацией/автором не разделено |
| news.ts:getAdminNews/getNewsBySlug/comments/categories/upload | Нет | Нет | Черновики, полные users вложенных связей, подмена автора комментария, удаление, категории, privileged upload |
| video.ts:9–101 | Нет | Нет | Любые CRUD; getVideos не фильтрует публикацию |
| authors.actions.ts:makeUserAuthor:60–112 | Да | Только superadmin по DB | Корректная отдельная операция назначения автора |
| authors.actions.ts:createProfile/getAdminAuthorsList/deleteAuthorProfile | Нет | Нет | Создать/удалить чужой author profile, получить полные users авторов |
| author-profile.actions.ts:10–38 | Да | WHERE authorProfiles.userId = session.userId | Чужой профиль не изменяется; URL не валидируются |
| moderation.actions.ts:getAuthorContent/getPendingContent/getPendingCount | Нет | Нет | Черновики/очередь модерации, users авторов |
| moderation.actions.ts:submitForReview:25–71 | Да | Нет author ownership/роли | Любой client снимает публикацию чужого материала |
| moderation.actions.ts:moderateContent:91–122 | Да | admin/superadmin по DB | Прямая проверка есть |
| moderation.actions.ts:authorCreateVideo/authorDeleteContent | Да | Создание с own authorId; удаление с own authorId | Удаление чужого контента этим входом блокируется; роль author при создании не требуется |

Правила «Google-вход», «профиль завершён», «связь с еврейством», «пол», «подтверждение родительства», «административное исключение» отдельными разрешениями не представлены. В schema есть только `role`, `isProfileComplete`, свободный `jewishStatus`, `childrenData` JSON и технические сведения. Поле пола отсутствует. Отдельный статус ручного допуска/семейная связь/детская сущность с ID не найдены. Отсутствие обязательной ручной модерации анкеты само по себе не дефект: ТЗ этот механизм ещё не утвердило.

## Подтверждённые замечания

### SEC-01 — смена произвольной роли без полномочий

**P0; уверенность высокая; исправление обнаруженного дефекта.**

Факт: `actions/user.ts:updateUserRoleAction:15–22` сразу выполняет `UPDATE users SET role = newRole WHERE id = userId`, не читая сессию/роль. Этот action используется в `store/useUserStore.ts:2,27–36`, который подключён в client `components/dashboard/team-table.tsx:4`. Защищённый `actions/role.ts:updateUserRole:9–46` существует параллельно, но не покрывает этот вход.

Воспроизведение: изолированный SEC-01 вызывает handler с `actor=null`, ID синтетического клиента и `superadmin`; возвращается success и DB-модель содержит superadmin; auth ни разу не вызван. Для HTTP-регрессии: на тестовом build получить используемую ссылку action, повторить запрос на публичный путь без сессии и с client-сессией — оба должны отказать, DB неизменна.

Влияние: присвоение/снятие административной роли любому известному ID; далее обход реально защищённых moderation/Kids/participant handlers. Middleware/скрытие кнопки не являются проверкой action. Причина: два независимых handler с разными правилами. Минимум: оставить один валидируемый серверный путь, требовать свежую superadmin-роль, allowlist ролей; журналировать actor/target/old/new. Тест: guest/client/admin получают отказ; superadmin — разрешённый переход, защищённые ограничения действуют на всех входах. Новых бизнес-решений не требует.

### SEC-02 — чувствительные профили и семьи возвращаются без права чтения

**P0; уверенность высокая; исправление обнаруженного дефекта.**

`actions/user.ts:getAllUsers:11–13`, `getUsersPaginated:196–265`, `actions/event.ts:getEventParticipantsList:292–303`, `getUserFamilyData:353–371`, `getUserRegisteredEvents:274–290`, `actions/event-registration.ts:getUserFamilyData:43–46`, `actions/service.ts:getServiceApplications:99–118`, `getUserRegisteredServices:222–241`, `actions/authors.actions.ts:getAdminAuthorsList:125–158` не проверяют сессию/роль/ownership. Часть селектов возвращает полную `users`, где `lib/db/schema.ts:21–44` включает контакты, дату рождения, религиозный статус, имя супруга, сведения о детях, telegram ID. Пагинированный users и списки участников/услуг прямо импортированы client-компонентами CRM/заявок; семейный getter импортирован публичной карточкой события. Прямая HTTP-достижимость неиспользуемых exports отдельно не утверждается.

Воспроизведение: SEC-02 без actor возвращает синтетический `childrenData`; точное место — немодифицированное тело handler. Для дочерних списков code review подтверждает тот же отсутствие gate. Влияние: системное чтение чувствительных данных общины и детей, ID для последующей подмены объектов. Причина: права стоят в страницах, getters являются самостоятельными actions. Минимум: requireAdmin на CRM/списки и own ID из сессии для семьи/личной истории; минимальные DTO вместо `select(*)`/полного `user`. Тест: матрица guest/client/owner/other/admin на каждом входе, проверить отсутствие закрытых ключей, а не только визуального отображения. Права доступа к исторической регистрации следует сохранить по согласованной переходной политике.

### SEC-03 — IDOR записи чужой анкеты/семьи, завершение неполной анкеты

**P1; уверенность высокая; исправление обнаруженного дефекта + требование ТЗ о серверной валидации.**

`actions/user.ts:completeUserProfile:25–80`, `updateUserTags:268–279`, `updateFamilyProfile:284–309`, `updateUserProfile:313–337` принимают `userId`, но не сравнивают с Clerk; completeUserProfile допускает `currentUser() === null`. Поля `any`, без runtime schema; `jewishStatus` свободный, согласие безусловно true, `isProfileComplete` безусловно true. `completeUserProfile` может создать строку с произвольным ID или обновить чужой существующий профиль; остальные операции произвольно изменяют известный профиль.

Проверки SEC-03: guest записывает ребёнка чужому пользователю; guest completeUserProfile с `{}` возвращает success, `isProfileComplete=true`, `agreedToPrivacy=true`, `jewishStatus=undefined`. Изменение статуса религии/полей семьи возможно через profile update. Причина: доверие ID из client props и только клиентская валидация. Минимум: own ID из обязательной сессии, отдельный admin handler для чужого профиля; строгая Zod schema, явное согласие, allowlist значений, флаг завершённости после валидной ветки. Запрет мужского self-service должен действовать во всех этих путях. Тест: подмена target userId, отсутствующее/неизвестное поле, смена ветки, несогласие и незавершённость не записываются; чужой профиль неизменен. Политику допуска объединённой группы гиюра не додумывать.

Дополнительная проблема согласованности: `completeUserProfile:36–80` пишет БД до `sendMail:181`; ошибка SMTP даёт `success=false` (`187–192`) при уже сохранённой анкете. Повтор снова посылает письмо. Это подтверждено порядком кода, отказ SMTP не исполнялся (SMTP mock безопасно перехвачен).

### SEC-04 — CRUD событий/услуг/категорий без auth и массовое назначение полей

**P1; уверенность высокая; исправление обнаруженного дефекта.**

`actions/event.ts:createEventCategory:80–89`, `deleteEventCategory:91–103`, `deleteEvent:118–126`, `createEvent:142–166`, `updateEvent:168–191`; `actions/service.ts:createServiceCategory:24–29`, `deleteServiceCategory:31–44`, `createService:55–70`, `updateService:72–86`, `deleteService:88–96` не проверяют auth/role. create/update распространяют `...data` в DB payload (`event:146,171`, `service:59,75`), разрешая все известные Drizzle-колонки, включая id/статус/дату создания. Это mass assignment в пределах колонок ORM, не доказанная SQL-инъекция.

SEC-04 без actor меняет event.paymentUrl на синтетический чужой origin. Дополнительно deleteEvent каскадно удаляет историю eventParticipants (`schema:122–124`), deleteService — serviceParticipants (`170–172`). Влияние: порча расписания, платежных ссылок/цен, потеря исторических заявок; вредоносная подмена платежной ссылки. Минимум: requireAdmin до чтения/записи, explicit schemas/allowlist, серверные ID/createdAt; soft-delete/архивирование при необходимости сохранения истории, транзакция для nullify category+delete. Тест: guest/client не могут любой CRUD, произвольные поля отклоняются; удаление события с регистрациями соответствует явной политике сохранения. Production-счета/данные не менялись.

### SEC-05 — платное событие можно записать как paid без оплаты; обычный кабинет тоже не передаёт сумму

**P1; уверенность высокая; исправление обнаруженного дефекта.**

`actions/event.ts:registerForEvent:375–524` не требует сессию, принимает чужой userId. `initialStatus = totalAmount && totalAmount > 0 ? pending : paid` (`452`), при этом стоимость/число участников не пересчитываются по DB. Не переданная, нулевая либо отрицательная сумма даёт paid; положительная произвольная сумма попадает в платежную ссылку (`497–514`). `eventData.isFree`, `price`, `childPrice` не проверяются.

Реальный штатный caller `components/dashboard/events/event-card.tsx:109–114` передаёт лишь четыре аргумента; `components/dashboard/auto-register.tsx:29–34` также не передаёт сумму. Поэтому проблема затрагивает обычную запись в кабинете, а не только ручную подмену запроса.

Проверка SEC-05: guest регистрирует synthetic-victim с незавершённым профилем на synthetic event с `isFree=false, price=100, isRegistrationClosed=true, status=completed`; без суммы возвращается success, создаётся paid и auth не вызывается. Не проверяются регистрационное закрытие, дата/время/статус события, допуск, принадлежность userId. Для закрытия есть лишь UI `single-event-client.tsx:178–180`, что не защищает handler.

Минимум: session userId, свежий профиль/независимая policy допуска; валидировать открытость события; серверный расчёт количества/цены по безопасным данным, paid только для действительно бесплатного итога или проверенного платежного подтверждения. Все callers привести к одному контракту. Regression: платное событие с `undefined/0/-1/NaN/0.01` и altered family не получает paid; закрытое/завершённое отказывает; обычная карточка кабинета проходит оплату. Нужные бизнес-решения по гиюру/старым профилям вынести отдельно; целостность оплаты от них не зависит.

### SEC-06 — отсутствует единое правило детского self-service и проверяемая принадлежность ребёнка

**P1; уверенность высокая; требование ТЗ + исправление обнаруженного дефекта.**

Профиль ребёнка — JSON `users.childrenData` (`schema:34–37`), заявка Kids — JSON `kidsApplications.children` (`384`), регистрация события — произвольный `eventParticipants.extraData` (`130–131`). Нет отдельных childId/parentId/FK и пола пользователя. Серверные пути создания/изменения: user.ts:completeUserProfile/updateFamilyProfile/updateUserProfile; оба `updateUserChildren` (`kids-profile:9–28`, `kids.actions:34–53`); event.ts:registerForEvent profileUpdates.newChild (`410–430`). Ни один не проверяет «мужчина не добавляет детей» или самостоятельные права мамы. `kids.actions:submitKidsApplication:10–31` допускает гостя.

При записи event extraData сохраняется без валидации (`461,474`): `family.child_999`, старые дети отца, отрицательные extraKids и любые JSON-копии не сопоставляются разрешённому набору семьи; newChild добавляется любому переданному userId. Изолированные SEC-06 подтвердили создание guest Kids заявки; оба own-update под пользователем-отцом; регистрацию с несуществующим индексом `child_999` и добавлением ребёнка; free payload без каких-либо половых/религиозных gates.

Подтверждённое: проверки пола/допуска/объектной принадлежности нет. Не утверждается, что arbitrary childId даёт cross-table IDOR, поскольку такого поля/таблицы сейчас не существует. Классический чужой owner ID уже доказан SEC-03/05. JSON по индексу не даёт надёжной исторической идентичности при редактировании массива.

Минимум: единая server policy для создания и записи ребёнка, own ID из сессии, валидируемая семейная ссылка/стабильный child ID либо минимально защищённая серверная проекция JSON со стабильным ID; не доверять переданным именам/индексам/статусу/полу. Для новых пользователей точно запретить male self-service; разрешения категории гиюра и переходный режим старых/null-профилей решить отдельно. Административное исключение — отдельный защищённый путь с actor/target/reason и достоверными исходными данными. Тест: мужчина UI/direct, отец с историческим ребёнком, допущенная мать со своим/чужим ребёнком, обычный client вызывает manual exception, неизвестные ID/пол/статус, смена прав между page load и submit. Не присваивать пользователям пол/статус по косвенным данным и не выполнять миграцию в аудите.

### SEC-07 — заявки на услуги можно создавать от чужого пользователя и неактивной услуги

**P1; уверенность высокая; исправление обнаруженного дефекта.**

`actions/service.ts:registerForService:171–220` берёт serviceId/userId/phone из запроса, не вызывает auth и не проверяет `services.isActive`. FK защищает лишь существование строк; дубль проверяется без блокировки. SEC-07 без actor создаёт заявку на inactive synthetic service за synthetic-victim. Побочный эффект — отправка уведомления интеграцией, в изолированной проверке перехвачена.

Минимум: session owner ID, загрузка услуги перед записью, валидация активности/телефона, отдельные административные полномочия. Применимость нового религиозного допуска именно к услугам требует бизнес-решения, поэтому отсутствие такого gate услугам здесь не объявлено однозначным нарушением ТЗ. Тест: guest/other userId/inactive service отклоняются, разрешённый owner создаёт ровно одну заявку.

### SEC-08 — конкурентные дубли в регистрациях событий и услуг

**P1 для event-регистраций, P2 для services; уверенность высокая для кода/локальной схемы; исправление обнаруженного дефекта.**

`event.ts:387–400,440–475` и `service.ts:177–187` делают SELECT, затем INSERT, без транзакции/lock/уникального eventId+userId/serviceId+userId. `schema:118–138,168–181` и доступные migrations не задают парных unique indexes. Legacy `event-registration.ts:24–30` вообще не проверяет дубль. Две concurrent mocked-проверки создали по две строки; соответствующие проверки в Postgres не проводились.

Влияние: две регистрации/платёжные ссылки/уведомления, возможные неоднозначные статусы и неверный учёт участников. Вместимость/лимит мест в модели не существуют; тест «последнее место» N/A для текущей функции, нельзя утверждать overbooking несуществующего лимита или производительность production.

Минимум: после согласованной очистки дублей unique key, atomic insert/upsert/idempotency и определённый active/history контракт. Не удалять исторические/оплаченные дубли автоматически. Regression: barrier-тест двух транзакций в локальном Postgres на один user+event/service, одна логическая регистрация, повтор возвращает тот же ID; сверить действующие оплаты. Миграция нужна; dry-run и сохранение историй обязательны.

### SEC-09 — обновление семьи коммитится до проверки события/создания заявки

**P2; уверенность высокая; исправление обнаруженного дефекта.**

`event.ts:410–430` изменяет профиль до загрузки события (`434–438`) и создания participant (`468–475`); transaction отсутствует. SEC-09: отправка newChild с отсутствующим event возвращает error, но ребёнок остаётся в profile. Другой isolated probe искусственно бросает ошибку записи eventParticipants: регистрация error, семья уже изменена. При повторе запроса newChild может добавиться второй раз; конкурентное read/modify/write массива также рискует потерей обновлений.

Минимум: сначала загрузить и валидировать все сущности/правила; связанный профиль+регистрацию сохранять атомарно с устойчивым child ID и ключом повтора. Regression: fault injection после обновления профиля и параллельные добавления; состояние откатывается либо возвращается чёткое независимо успешное сохранение семьи по явному UX-контракту. Новых религиозных решений не требует.

### SEC-10 — CRM/видео/профили авторов/комментарии управляются без полномочий

**P1; уверенность высокая; исправление обнаруженного дефекта.**

В `task.ts:getAllTasks/createTask/updateTaskStatusAction/deleteTaskAction/updateTaskAction:19–98` нет auth; creatorId/assigneeId из клиента, update `.set(data)` (`92`). `createTask:28–35` отправляет уведомление до try/создания записи, что даёт несуществующую задачу при последующем отказе DB.

`video.ts:addVideo/updateVideo/deleteVideo:38–101` нет auth/ownership. `authors.actions.ts:createProfile:114–119`, `deleteAuthorProfile:160–178` нет auth; последняя меняет author на роль `user` (`168`), отличную от основного `client`. `news.ts:addNewsComment/deleteNewsComment:267–281` не проверяет сессию или ownership, userId комментария произволен; `createNewsCategory/deleteNewsCategory:301–318` также открыты. Изолированная SEC-10 подтвердила guest delete video/task. Остальные — подтверждённое чтением кода отсутствие checks.

Минимум: requireAdmin для CRM/категорий/управления автором; role+own object для авторских действий; comment author из сессии и явная delete-policy; строгие поля; привести обычную роль к единому значению, не делая массовую миграцию вслепую. Тест: каждый вход guest/client/author/admin, подмена creator/author/assignee, side effect не появляется при отказе. Несоответствие роли `user` может открыть admin-view чата (`app/dashboard/chat/page.tsx:18–52` принимает все не-client); смежные chat handlers оценивает направление интеграций.

### SEC-11 — обычный клиент обходит модерацию и сохраняет raw HTML в публичную статью

**P1; уверенность высокая по цепочке кода; исполнение JS в браузере не проводилось; исправление обнаруженного дефекта.**

`news.ts:createNews:70–88` требует только logged-in userId, не роль author/admin; принимает `status=published`, `targetAuthorId` чужого пользователя, `isPinned=true`. Введённый `content` сохраняется без sanitizer (`82`). Публичная статья выводит его через `components/news/article-content.tsx:25` в `dangerouslySetInnerHTML`, sanitizer/CSP не найден в `next.config.mjs`/middleware/пути. Поэтому доступная цепочка stored XSS; реактовское обычное экранирование текстовых узлов здесь не применяется. SEC-11 воспроизводит принятие сырого HTML с безвредным синтетическим event handler и опубликованным статусом от чужого автора, без реального браузерного выполнения.

`updateNews:149–159` допускает `...data` после общей edit-permission, не отделяя привилегированное переопределение автора/публикации/статуса от прав автора; runtime лишние известные DB-поля могут пройти. Изменение isPublished не синхронизирует status, что также расходится с public author pages, где читается status=published.

Минимум: политика create/update role+ownership; автор создаёт draft/pending, администратор меняет публикацию/автора; allowlist богатого HTML на сервере с проверенным sanitizer и сохранением полезного форматирования, безопасные URL; не полагаться на editor или CSP как единственный барьер. Regression: client не публикует/не подменяет автора, чужой контент недоступен; `<img onerror>`, SVG handlers, javascript/data URL удаляются; легальное форматирование сохраняется. Браузерная локальная проверка безвредным DOM-marker после исправления обязательна. Это существующий defect, не новое требование ТЗ.

### SEC-12 — черновики/отклонённый контент доступны публичными getters; comments сериализуют полный профиль

**P1; уверенность высокая; исправление обнаруженного дефекта.**

`news.ts:getNewsBySlug:239–265` ищет лишь slug (`247`), без `isPublished/status` и без auth. По прямому URL `app/(marketing)/news/[slug]/page.tsx:18–35,38–46` тот же getter используется в metadata и странице: черновик/отклонённый материал виден, если известен slug. `getAdminNews:55–57` без auth, `moderation.actions:getAuthorContent:11–23` по чужому authorUserId без auth, `getPendingContent:74–88` также без auth и включает полных authors.

`getNewsBySlug` включает comments.user=true (`249–251`) и author с authorProfile (`254–256`). `CommentsSection` — client-компонент (`components/dashboard/news/comments-section.tsx:1`), а `app/(marketing)/news/[slug]/page.tsx` передаёт `initialComments={article.comments}`. Следовательно полные records комментариев пользователей попадают в client props; нужно проверить и убрать контакты/религиозный статус/детей, даже если UI рисует лишь имя/фото. `video.ts:getVideos:9–35` выбирает все статусы, затем публичная lessons page использует этот getter; draft/pending видео оказываются в публичном списке (проекция не возвращает status, что затрудняет downstream-фильтрацию).

SEC-12 mock getter возвращает draft и синтетические childrenData в comments; это демонстрация отсутствия фильтра и DTO. Публичное использование и client boundary подтверждены кодом; HTTP/браузерный payload не снимался. Минимум: public getters только published, отдельные owner/admin preview, DTO comments `{id,content,createdAt,user:{id,firstName,lastName,imageUrl}}`, author публичные поля; одинаковый фильтр metadata/page. Тест: каждый статус по slug/list/metadata/action, ни один закрытый ключ в Flight/client serialization. У автора не должно теряться право preview собственного черновика.

### SEC-13 — submitForReview снимает публикацию чужого контента

**P1; уверенность высокая; исправление обнаруженного дефекта.**

`moderation.actions.ts:submitForReview:25–39` проверяет login, затем `UPDATE ... WHERE id`, не проверяя authorId и роль. Любой client может назначить pending/isPublished=false любому материалу по ID, сгенерировав модераторам уведомления. SEC-13 под synthetic-client передаёт ID статьи другого автора, получает success, публикация снята.

Минимум: загрузка объекта, own author+author role либо явный admin workflow; WHERE id AND authorId; проверенные переходы статуса; повтор не плодит уведомления. Regression: guest/client/чужой author отказывают без изменений/уведомлений, собственный допустимый draft отправляется один раз. ТЗ не требуется для исправления.

### SEC-14 — привилегированная загрузка файла без auth и валидации содержимого

**P1; уверенность высокая для handler, непроверенная эксплуатация Storage; исправление обнаруженного дефекта.**

`news.ts:uploadImageAction:207–235` проверяет только наличие `file`, создаёт Supabase client с server service-role (`211–214`), extension берёт из file.name, отправляет любой File в `images/news/*` (`217–227`), возвращает publicUrl. Нет auth/role, size/MIME/signature allowlist. Пользовательский file.name не применяется как полный путь, поэтому path traversal по нему не доказан; используемый extension всё же не проверяется. Сам service key в client bundle/ответ не выводится: подтверждён privileged confused-deputy вход, не утечка ключа.

SEC-14 без actor передаёт fake `.html`, upload mock принимает его, auth не вызван. Основное направление подтвердило metadata Storage в `evidence/db-readonly.json`: buckets `events` и `images` публичны, `file_size_limit=null`, `allowed_mime_types=null`; для `events` есть PUBLIC INSERT/SELECT policy без owner-предиката. Это отсутствие bucket-specific лимитов, а не доказательство отсутствия платформенных общих лимитов. Реальный upload/HTTP response MIME и выполнение активного содержимого не проверялись. Основное направление отдельно подтвердило RLS=true на всех 16 public-таблицах и 0 публичных policies; data API leak/выключенный RLS не утверждаются. Прямое серверное DB-соединение имеет bypass_rls=true (`evidence/db-readonly.json`), поэтому RLS не компенсирует пропущенные проверки handlers. [Документация Supabase Storage](https://supabase.com/docs/guides/storage/security/access-control) подтверждает, что service key обходит RLS; это не исправляется одной anon-policy. Возможное воздействие: несанкционированное размещение/расход квоты; same-origin XSS на домене приложения не утверждается, поскольку public URL Storage имеет отдельный origin.

Минимум: auth/role и лимит до privileged call, реальная проверка MIME/сигнатуры/размера, безопасная перекодировка допустимых raster или отдельная строгая политика SVG; rate/quota control по фактическому трафику; безопасная обработка error. Regression: guest/client без upload-right, HTML/SVG с активным содержимым, маскированное расширение, большой файл — отказ без Storage call; разрешённое изображение успешно в test bucket. Сеть с записью в аудите не использовалась.

### SEC-15 — pending-заявка с бесплатным итогом сообщает успех, но не становится зарегистрированной

**P2; уверенность высокая; исправление обнаруженного дефекта.**

`event.ts:452–475`: initialStatus рассчитывается, но при existingPending handler обновляет только extraData/phone (`458–464`), оставляя pending. Если сумма 0 или у события нет payment URL, возвращается success/paymentUrl=null (`496–521`), UI ставит isRegistered=true (`single-event-client.tsx:227–230`), а `checkRegistration:256–267` считает зарегистрированными только paid. После reload регистрация исчезает с точки зрения UI, хотя row остаётся.

Изолированный SEC-15: existing pending + isFree + total=0 -> success, null paymentUrl, status остаётся pending. Минимум: явная модель переходов pending/paid с серверным пересчётом суммы и корректным возвратом текущего статуса; на отсутствие URL платного события возвращать управляемую ошибку, не фиктивный успех. Тест: pending бесплатного/ставшего бесплатным события, повтор paid, платное событие без URL, reload показывает тот же факт регистрации.

## Дополнительные подтверждённые наблюдения и риски

1. **SEC-16, P2, высокая уверенность: нет структурированного аудита ручных изменений.** Схема `lib/db/schema.ts` не содержит audit trail, а прямые role/participant status/delete/Kids status/manual-like register handlers его не пишут; console.error и обычные notifications не фиксируют actor/target/old/new/reason. ТЗ требует проверить аудит административного исключения; отдельного защищённого exception workflow с причиной не найдено. Минимум: добавить явный exception contract с записью аудита в одной транзакции; не фальсифицировать исходный религиозный статус отца. Проверить admin allowed/client denied и историю без непредусмотренной смены профиля. Детали публичных прав группы гиюра — AMBIGUOUS, а не повод добавить молча религиозные проверки.
2. **SEC-17, P2, высокая уверенность: статистика активности фиктивная.** `actions/dashboard.ts:21–35` возвращает константные массивы по дням вместо реальных метрик, при этом другие счётчики реальны; это риск управленческих выводов. Минимум: пометить демонстрационные данные либо вычислять из согласованного источника; regression — синтетические записи меняют реальный график, либо видимый demo-label.
3. **Невалидируемые пагинации/неограниченные выборки (риск, P2 после измерения).** getUsersPaginated(page,limit) принимает произвольные limit; другие getAll/list делают полные выборки, авторская админка N+1 по двум count на профиль (`authors.actions:133–143`). Измерений задержки/DB load нет; отсутствие auth подтверждено отдельно, DDoS или конкретная пропускная способность не заявлены. Минимум — upper bound limit после auth, пагинация только для реально растущих списков, измерение plans/latency перед оптимизацией.
4. **Errors/logging (подтверждён код, влияние зависит от окружения).** `user.ts:85–92` логирует email получателя/отправителя (значения здесь не воспроизводятся), `187–192` возвращает raw `error.message`; `updateFamilyProfile:305–307` тоже возвращает DB error. Пароль выводится только как наличие, не секретное значение. Минимум: production-логи без контактов и внутренних error details, correlation ID; не объявлять найденный вывод значением пароля.
5. **HTML письма (риск).** `user.ts:146` вставляет userFirstName в HTML без escaping. Возможна email markup injection; выполнение JS в почтовом клиенте не доказано и не приравнивается к browser XSS. Исправление: escaping шаблонных данных, проверка кода письма на синтетической строке.
6. **URLs профиля автора (риск).** `author-profile.actions:18–24` сохраняет произвольные URL; sidebar использует href напрямую. Протоколы и допустимые провайдеры не проверяются; фактическая обработка React/браузером и CSP не тестировалась. Ограничить http(s), отдельно Telegram/social по требованиям, проверить URL до сохранения.
7. **Публикация/изменение кеша.** event mutations revalidatePath, protected handlers читают роли из DB при каждом вызове — это положительно для актуальности роли; профиль/статус допуска в регистрации вообще не читаются. News content update не синхронизирует status/isPublished, moderation revalidate не покрывает явно `/news`, `/lessons`, `/authors/*`; UI freshness после этих операций без browser/production cache не проверена. Не делать вывод «права немедленно отозваны» по наличию revalidate.
8. **Скрытые серверные данные через альтернативные пути событий.** getEvents/getEventById/getPublicEventsPaginated/getLatestEvents не требуют сессию/допуск; прямой event page использует public data/metadata. Это подтверждённое отсутствие нового server gate; точный состав допустимого public preview требует SPEC_DECISIONS. Нельзя классифицировать каждое название/дату как конфиденциальное без решения, но полный body должен подчиняться утверждённой политике.
9. **Две реализации event-registration.** Legacy file ещё импортируется `components/events/single-event-action.tsx`, но сам компонент не найден в актуальных page entrypoints. Handler с дефектами присутствует в source, production reachability этого legacy пути NOT VERIFIED. Удаление/объединение — минимальное устранение дублированного правила после проверки callers; нельзя считать все экспортированные неиспользуемые actions обязательно опубликованными.
10. **CSRF/SQL injection.** Не найдено собственного GET mutation route в данном направлении. Server Actions используют framework transport и Drizzle parameterization; отсутствие custom CSRF токена не объявлено дефектом, SQL injection по текущим eq/ilike/sql-template не подтверждена. Origin/Host конфигурация и сторонние webhooks — отдельные области. Открытые actions уязвимы к same-origin прямому запросу независимо от CSRF.
11. **Payment/отмена/ёмкость.** Платёж существует как внешняя URL/iframe и webhook другого направления; настоящие платежи/возвраты не выполнялись. End-user cancel action не найден; delete participant доступен admin, исторические права отмены/редактирования и правила удержаний должны быть решены владельцем. Поля вместимости/очереди/возрастного лимита event отсутствуют, поэтому тест последнего места/возраста не может требовать несуществующий необязательный функционал. Существующий client price расчёт не заменяет server validation.

## Минимальный порядок работ по серверу

1. Закрыть SEC-01 и все независимые административные CRUD/read/ownership входы; не ждать решения гиюра. Общий маленький guard + явные schemas, убрать параллельные unsafe альтернативы. Проверить direct Server Action POST guest/client по локальному build. Нужна полноценная baseline сборка/транспортный тест после исправлений; mocked probes не доказывают HTTP policy.
2. Исправить серверную стоимость/статусы/закрытие события и все callers (SEC-05/15), не делать миграцию статусов оплаченных строк автоматически; отдельно подготовить dry-run сверки неправомерных paid/дублей, недостающие реальные оплаты не определять по косвенным данным.
3. DTO и published filters для public content; исправить публикацию и sanitizer (SEC-02/11/12/13/14). После закрытия auth выполнить browser XSS-marker regression в изолированной среде и audit serialized payload без PII.
4. Ввести независимые понятия пола/связи/готовности профиля/допуска; единая детская server policy, защищённое административное исключение/аудит. Сначала согласовать допуск гиюра, старых/null профилей и исторических детей/регистраций. Никаких религиозных/половых default assumptions.
5. Атомарность, идемпотентность, уникальность регистраций; миграции только после snapshot/backup/dry-run и согласованной стратегии дублей, с планом отката кода отдельно от данных. Затем fault/concurrency tests на локальном Postgres, session change/cache reload, production read-only verification соответствия commit и инфраструктурных ограничений.

## Покрытие файлов и оставшиеся проверки

Чтение целиком: 14 actions-модулей, middleware.ts, app/dashboard/layout.tsx, app/admin/page.tsx, lib/db/schema.ts, lib/db/index.ts; все page gate в `app/dashboard/*/page.tsx`; публичные news/article/author paths; клиентские entrypoints для roles, семей, событий, services, comments, moderation; поиск sanitizer/CSP и unique/RLS в обеих ветках миграций. Точные exports и результаты roles приведены выше. Основное направление дополнило локальную schema read-only introspection `evidence/db-readonly.json`; provenance/соответствие DB проверенному deployment неизвестно. В подключённой DB: 175 users, 121 без jewishStatus, 54 завершённых профиля, 15 профилей с 28 записями childrenData; поля пола нет; 42 исторические eventParticipants. Эти агрегаты требуют переходного плана; сами null-статусы при неутверждённой политике не объявлены дефектом старых пользователей. Pair unique в live eventParticipants отсутствует, фактических дублей 0. Массовых изменений не выполнялось.

Изолированно исполнялись: guest role escalation/list/foreign family/completion; CRUD event/payment URL; event registration amount/status/closed/profile; детские профиль/заявка/event index; service impersonation/inactive; две concurrent регистрации каждого типа; отсутствующий event и DB failure после изменения семьи; guest video/task deletion; client news raw HTML публикация/чужой author; unpublished article/comment projection; foreign submitForReview; guest Storage call; pending-free retry. Negative controls: secure role отказ guest/client, protected participant/Kids отказ client, own children scope.

NOT VERIFIED: настоящий HTTP action transport/достижимость отдельных unused exports, Clerk login/role refresh E2E, production deploy commit, реальный Storage upload/HTTP file behavior и платформенные общие лимиты (bucket metadata/policies проверены read-only), Postgres concurrency/deadlocks/планы, browsers/действительное выполнение XSS, полный shutdown SMTP/платежа в реальном staging. Причина — задача запрещает реальные мутации и не предоставлен изолированный DB+Clerk/payment test tenant; VM выбрана для безопасных локальных доказательств. Read-only DB-метаданные проверены основным направлением; они не заменяют сценарии записи на синтетическом tenant. Это не снимает доказанные дефекты в исходном коде.

Сопутствующая документация: применён Supabase skill по обнаруженному Storage path; changelog fetched 20.10.2026 в `/tmp/menora-audit-supabase-changelog.md`, найденные инфраструктурные breaking-change записи не меняют вывод об отсутствии handler auth. Документация Next.js и Supabase выше подтверждает модель границы доверия, а факты о данном проекте установлены кодом/изолированными проверками.
