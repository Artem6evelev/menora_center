# Публичные мероприятия и мягкий вход, 02.11.2026

Реализовано локально на `main` поверх фактического чистого HEAD `908d73ce385e53822e59ebedec040fac1108e3c2`, а не поверх устаревшего ориентира `c5fd402`. Последующие исправления участников, оплаты/CRM и кнопки Telegram-канала сохранены. Проверена рабочая копия с перечисленными ниже изменениями; её точные хеши содержатся в [source-checkpoint.json](evidence/source-checkpoint.json). SHA созданного после проверок локального коммита сообщается в итоговом ответе. Push/deploy/production SQL не выполнялись.

[Решения и приоритет нового ТЗ](DECISIONS.md).

## Реализация

- Homepage, `/events`, публичный event detail и публичные Mini App Home/list/ad/detail доступны до анкеты. Закрытые, invite-only, удалённые и неопубликованные события отсекаются также по прямому ID, title lookup, metadata, share и sitemap. Публичные поля явно перечислены в `lib/events/public.ts`; payment URL, контакты, дети и регистрации туда не входят. Собственные персональные данные Mini App возвращаются только проверенной сессии.
- Единственный расчёт допуска — `lib/events/eligibility.ts`. Web intake и Mini intake используют его, как и общий `prepareEventRegistration`, checkout и повторное открытие платежа. `eligible / needs_review / not_eligible` отделены от необходимости входа и завершения профиля. Текущий канонический статус имеет приоритет над входным самоответом.
- После «Хочу прийти» неизвестному статусу ограниченного события задаётся один вопрос с пятью вариантами. Для актуального статуса повторного вопроса нет. Другой этап гиюра и корни ведут к уточнению, `none` не записывается на ограниченное событие. Можно оставить контакт, перейти к открытым событиям, продолжить просмотр или написать в WhatsApp. Открытые события не спрашивают религиозную категорию: обычные обязательные сведения заполняются отдельно.
- Обычное сохранение не меняет affiliation/filter/stage. Анонимный черновик не перезаписывает уже сохранённый профиль после входа. Optimistic revision и непрозрачный Mini App profileVersion остаются обязательными; нет blind retry после конфликта. Event target сохраняется в привязанном черновике, Kids target — во внутреннем состоянии. Home/Telegram Back очищают завершённую рекламную цель, не возвращая пользователя в цикл анкеты.
- `event_interests` — отдельные явные обращения, без фиктивного аккаунта/билета. Источник, безопасные UTM, самоответ, результат, обработка, добровольный контакт, версия/время согласий и проверенная связь с человеком хранятся отдельно от регистраций. Уникальность owner/event, idempotency UUID, HttpOnly capability, строгая схема и лимит 10 отправок/15 минут защищают endpoint. Подмена userId/decision/processing/status не принимается. Username Telegram не заменяет реально доступный чат.
- В существующем People CRM добавлен блок обращений: поиск, источник, событие, самоответ, допуск, обработка, приглашения, наличие отдельной регистрации, даты согласий и история. Доступ и изменения повторно проверяют staff. Безопасное объединение гостевого обращения с уже существующим интересом сохраняет append-only аудит. Событие с обращениями архивируется вместо удаления истории.
- Предварительное обращение не запускает сообщения/оплату. Отдельная необязательная подписка выключена по умолчанию; /start/bootstrap её не создают. Capability-ссылка, Mini App unsubscribe и `/unsubscribe` отключают будущие приглашения. При массовой доставке сохраняются существующие chat/consent/block guards и повторная проверка event eligibility.
- Детские ограничения, канонический город, семьи и история сохранены. Открытый admission не даёт отцу/неуточнённому гиюру детских прав. Существующие калькулятор, website iframe, Mini App handoff, неизменяемая сумма, повторный платёжный вход и pending/confirmed разделены как прежде. Возврат/закрытие оплаты не подтверждает `paid`.
- Все новые способы связи и прежние шаблонные website contact/footer ведут на WhatsApp **+972 50-670-0779**. Фальшивая форма контакта с console logging заменена настоящей ссылкой.

## Инвентаризация границ

| Область | Публичный просмотр | Защищённое действие |
|---|---|---|
| Web | marketing homepage/catalog/detail, GET `/api/events` | Clerk canonical identity; actions registration/payment; shared final eligibility |
| Mini App | данные опубликованного события после обычного проверенного SDK startup | HMAC initData, session/user/revocation, profileVersion, общий checkout |
| Intake | POST `/api/events/intake`, `/api/telegram/miniapp/intake` | Предварительная оценка; не credential и не изменение категории |
| Контакт | POST `/api/events/interests`, Mini App `/interests` | Same-origin, <=8192 байта, rate limit, explicit consent, owner/visitor scope |
| Отписка | POST `/api/events/interests/unsubscribe` | Непрозрачная capability, без выдачи контактных данных |
| CRM | Нет публичного доступа | Существующие requireStaff + history/processing actions |
| Kids | Существующий отдельный экран и постоянный tab | Прежние canonical child permissions/stage gate/admin exception |

## Схема и будущий SQL владельца

Новая схема **нужна**: два event-поля и две закрытые таблицы интересов/лимитов. Миграция `20261102190245_public_event_intake` создана локально Supabase CLI 2.121.0 и согласована с ORM/Drizzle journal/snapshot. Копии в `drizzle/` и `supabase/migrations/` идентичны. Исторические миграции не переписаны. Предыдущие payment-intent поля включены в новый snapshot как уже существующая схема, а не повторный DDL.

1. Владелец выбирает правильный Supabase project, проверяет backup и выполняет [READ_ONLY_PRECHECK.sql](READ_ONLY_PRECHECK.sql).
2. До новой миграции нужны `ledger_ready_for_migration=true`, `payment_baseline_ready=true`, обе новые таблицы отсутствуют. Поддерживается точная каноническая история (и совместимый 0004v1) либо доказанная legacy17 + adoption marker + payment migration. Совпадения только по количеству недостаточно.
3. Только после успешного precheck владелец применяет единый [MANUAL_SQL.sql](MANUAL_SQL.sql). SQL выполняется до публикации кода, который читает новые event-поля. Транзакция, таймаут блокировки, проверка ledger/типов/полного нового shape/RLS/grants, fingerprints старых людей/детей/билетов/оплат/событий. Старые события получают `restricted`. Категории и семейные записи не изменяются.
4. При `ledger_already_applied=true` и существующих таблицах повторный manual проверяет совместимость и не повторяет DDL. Неизвестная история, неполный rollout, несовместимые поля или открытые policies/grants — **BLOCKER**. Скрипт не переписывает чужой ledger и откатывает изменения при ошибке.

RLS: новые `event_interests`/`event_interest_limits` имеют RLS, без anon/authenticated/PUBLIC grants и без public policies, даже при небезопасных default privileges. Существующие users/events/participants/kids/contacts/payment tables остаются под прежними RLS/серверными guards; native migration oracle сравнивает весь каталог ORM, FK/checks/indexes/RLS. Новых public policies нет. Это локальное доказательство, не проверка текущих production policies или возможных внешних GRANT — production в этом запуске не читалась и не менялась.

## Проверки

**407/407 проверок PASS** в выполненных наборах; это число текущего целевого прогона, а не повтор всех исторических аудитов. Итоговые результаты, команды и границы среды — [checks.json](evidence/checks.json). Записи тестов содержат только синтетические данные.

- Новый shared server/SQL suite: 56 PASS. Web/Mini parity восьми профилей на двух политиках; current vs self-report; все детские отрицательные случаи; точные суммы; IDOR/лимиты/consent; каноническая и adopted-legacy миграция, repeat/native no-op; сохранность истории и privacy.
- Native `npm run db:test`: 8/8 PASS. Legacy fixture явно исключает новые additive таблицы/поля; проверки FK, полных metadata и сохранности бизнес-строк сохранены.
- Существующий `telegram-release.cjs`: **216/216 PASS**, включая Kids, participant parity, payment-intent/CRM, бота, отказ от рассылки и очередь с заблокированным внешним Bot API. Ожидания closed-event preview, публичного ad detail и unknown→subscribed приведены к новому ТЗ; запреты регистраций/оплат, блокировки и дедупликация сохранены.
- Existing Mini App auth 87, cache 6, bridge 8 — PASS. Старые ожидания auto-subscribe обновлены по новому требованию явного согласия; HMAC/session/isolation/conflict guards не ослаблены.
- Браузер Web/Mini App/CRM: 17/17 PASS, 320/390/1280. RU/HE/EN contact и RTL; публичный полный event до анкеты; закрытый ID/metadata; отказ без лида; iframe correct total/pending; signed synthetic Telegram ordinary completion/reload/payment resume; advanced giyur self-only; CRM filter/history.
- Journey browser: 3/3 PASS: новый обычный Web профиль → mock Clerk callback → исходный open event/reload без дубля; старый Web account → актуализация фильтра → исходное restricted event; новый direct Kids → filter/profile → Kids active → SDK Back/Home.
- Performance browser: 5/5 PASS: Home 320/390, direct Kids, TTL и отсутствие чужой семьи при SDK account switch.
- `npm run lint`: exit0, 0 ошибок, 30 прежних `no-img-element` warnings. Новая hook-warning исправлена; правила/область ESLint не сокращались. Typecheck и изолированный штатный build — exit0. Для публичной DB-навигации marketing layout явно dynamic; build не требует production DB при prerender.

Браузерные тесты выполнялись в Chromium на реальных текущих UI/API/SQL в disposable local fixture; identity Clerk и SDK Telegram синтетические. В продуктовые пути тестовые API не добавлены. Screenshot/JSON доказывают локальные сценарии, **не настоящий Google OAuth, Telegram WebView или списание Shutafim**. Старые доказательства OAuth/production из других отчётов не переобозначаются как новые успешные проверки.

## Производительность

- Returning Home: 1 startup, 5 SELECT, 0 locks/writes. Новый Home и рекламный public preview: 1 startup. Direct Kids: 2 API attempts, без отдельного GET profile.
- Screen cache TTL30, возврат в Home/Events использует кэш; после истечения Home запрашивает только compact preview. Account switch очищает Kids/family cache. Initial Home list по-прежнему не содержит description/private fields.
- Public GET не создаёт длинные share aliases. Их создаёт только явный Share POST или административное создание события; стабильность/disabled/collision guards сохранены.
- Initial production browser JS: baseline `908d73c` **517336 bytes / estimated gzip161744**; текущий **506261 bytes / estimated gzip157910**, разница −11075 bytes (−2,14%). Полный результат записан в [current-bundle.json](evidence/current-bundle.json), baseline — [baseline-bundle.json](evidence/baseline-bundle.json). Оба замера выполнены одинаковым `telegram-bundle.cjs`; framework/shared включены, внешние запросы заблокированы, 0 Clerk markers. Gzip — локальная оценка, не переданные байты реального телефона.
- Code splitting, `/_next/image` оптимизация афиш и session cache сохранены; сами механизмы изображений не менялись. Снижение задержки настоящего Telegram не заявляется.

## Оставшиеся действия и ограничения

Production не обновлена; удалённые БД, Telegram webhook/menu, Vercel env и платежи не трогались. Новый полный аудит не проводился. До rollout владелец применяет проверенный additive SQL к подтверждённой среде, затем отдельно push/deploy. После публикации нужны реальный TEST Google callback и smoke на телефоне в Telegram, включая open/ restricted, Kids и pending payment; настоящее списание для этой задачи не требуется.

RU/HE/EN подтверждены для нового мягкого входа/контакта и включены для существующих словарей анкеты/навигации. Глобальная website localization и прежние RU Kids/payment captions не подвергались большому рефакторингу; это не заявление о полной трёхъязычности всего сайта. Новые поля админки русские как существующая CRM. Production RLS/configuration и внешний Google branding этим локальным запуском не подтверждаются.
