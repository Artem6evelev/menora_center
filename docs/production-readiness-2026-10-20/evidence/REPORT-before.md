# Приёмка Menorah Center 20.10.2026

Этап **не принят полностью**: согласованная реализация, полный lint, typecheck, сборка, все существующие suites и воспроизводимая локальная миграция проходят. Браузерные desktop/mobile и настоящий Google OAuth остаются непроверенными: после выдачи доступа Computer Use остановился на внутренней ошибке захвата macOS ScreenCaptureKit −3811. Владелец сообщил, что сейчас не может перезапустить сервер. Деплой, реальные платежи и уведомления участникам не выполнялись; публичная версия не обновлялась. Shutafim iframe/настройка webhook остаются следующим этапом.

## Версия и сохранность работы

Ветка `main`, HEAD `c43b0d54a84038b257aa1ef7b151942d95baa629`, рабочее дерево **незакоммиченное**. Проверено именно оно: HEAD не содержит эту реализацию. Reset/clean/checkout не выполнялись; прежние изменения и OD-01–OD-06 сохранены. Полный манифест проверенного кода: **`24317fb81c171ba10681e3ac67a76c35d2756e1bfab73a5fc06a706c3368a588`**,336 файлов. [Все SHA и версии](evidence/code-checkpoint.json), [git status](evidence/git-status-final.txt), [изменения этого продолжения](evidence/followup-code-changes.json).

Начальная контрольная точка до правок совпала с предыдущей: `d7a68a3e13aa8e194a2531dadda4980ce41de4d6e5153d95a3e63ac1ee7d32c0`. [Сохранённый checkpoint](evidence/checkpoint-followup-before.json). Новый алгоритм v2 дополнительно включает исполняемые JS/TS/SQL исторической документации и SQL-эталон теста; env, зависимости, build output и prose/JSON evidence не входят. Алгоритм определён в checkpoint; хеш не является хешем одного HEAD.

Актуальные REPORT/SPEC_COMPLIANCE/SPEC_DECISIONS/MANUAL_CHECKLIST перечитаны. Фактические PDF7 страниц и DOCX с комментариями из Downloads прочитаны повторно; [пути/SHA](evidence/source-review.json). Применимых AGENTS.md в репозитории и цепочке родителей не найдено. Новые решения владельца от 20.10.2026 записаны как **OD-07** (самоответ без документов/ручного одобрения) и **OD-08** (третья ветка без анонимного лида/рассылок, signed choice только в своём профиле). Прежние рекомендации не выдаются за утверждённые правила.

## Исправления

| Файлы | Изменение и назначение |
|---|---|
| `components/dashboard/authors/admin-authors-client.tsx`, `components/testimonials.tsx` | Экранированы JSX-кавычки с сохранением отображаемого текста; компонент переименован в TestimonialCard, устранив конфликт имени типа/функции |
| `components/ui/infinite-moving-cards.tsx` | Устранено присваивание вместо сравнения скорости, восстановлена ветка slow; эффекты имеют полные зависимости, клоны очищаются при cleanup и не множатся при Strict Mode |
| `components/dashboard/notification-bell.tsx` | Запрос и подписка привязаны к userId; старый ответ не записывает состояние после cleanup, при смене пользователя список очищается |
| `components/dashboard/applications/application-client.tsx`, `components/dashboard/users/crm-table.client.tsx`, `components/dashboard/users/user-slider.tsx`, `mdx-components.tsx` | Декоративным аватарам рядом с именами задан пустой alt; MDX Image явно передаёт уже обязательный alt из ImageProps |
| `docs/audit-2026-10-20/diagnostics/ui-render-audit.cjs`, `docs/audit-2026-10-20/scripts/server-actions-isolated.cjs` | Только исправления harness для lint: имя возвращаемого компонента, один безусловный useState, VM module binding. Старые выводы/доказательства аудита не перегенерированы и не объявлены исправленными |
| `drizzle/0004_community_filtering.sql` | Разделены отдельные SQL-команды для штатного мигратора; нормализованный SQL совпадает с v1. Старый checksum учтён для совместимости |
| `drizzle/0006_reconcile_existing_schema.sql`, snapshot/journal, `lib/db/schema.ts` | Добавлена недостающая additive миграция семейных/payment полей и kids_applications; существующие данные не переписываются; RLS соответствует закрытой схеме всех 17 таблиц |
| `scripts/migrate.cjs`, `scripts/migration-history.cjs`, `package.json`, `tests/community/migrations.cjs` | Воспроизводимые db:generate/db:migrate/db:test; native ledger и no-op; отказ для чужой/неучтённой истории. Автоматического adoption внешней БД нет |

Версии зависимостей и lockfile не менялись. Installed Node22.20.0, Next16.1.7, ESLint8.57.1, eslint-config-next14.2.3, TypeScript5.8.3, Drizzle ORM0.45.1/Kit0.31.10. Прямой ESLint совместим с установленным Next; сохранены прежние содержательные правила и Next/Core Web Vitals. Исключены только generated directories, исходники/изменённые файлы и исторические scripts проверяются. Новых eslint-disable, отключений правил и принудительного успешного exit нет.

## Фактические проверки

| Команда | Итог | Среда и доказательство |
|---|---|---|
| **`npm run lint`** | **PASS exit 0:243 файла,0 ошибок,30 предупреждений** | [Полный штатный вывод](evidence/lint-followup.log), [JSON](evidence/lint-followup.json), [каждый оставшийся путь/правило/причина](evidence/lint-followup-summary.json). Все 9 прежних ошибок исправлены |
| `npm run typecheck` | PASS exit 0 | [Лог](evidence/typecheck-followup.log), текущая рабочая копия |
| `npm run build` | PASS exit 0 | [Фактический результат и проверка исходников](evidence/build-followup-result.json). `/tmp/menora-followup-build`, те же исходники/зависимости, без реальных env. Build с dummy settings; обработанный sitemap ECONNREFUSED127.0.0.1:1 — не проверка живой БД. Сохраняются прежние Next deprecations images.domains/middleware и cache warning |
| `node tests/community/regression.cjs` | **26/26 PASS** exit 0 | [Лог](evidence/regression-followup.log), [сценарии](evidence/regression-results.json); real actions/Drizzle SQL, synthetic PostgreSQL/WASM, mock identity, внешние доставки отключены |
| `node tests/community/render.cjs` | **12/12 PASS** exit 0 | [Лог](evidence/render-followup.log), [сценарии](evidence/render-results.json); React SSR, не браузер |
| `node tests/community/http.cjs` | **11/11 PASS** exit 0 | [Лог](evidence/http-followup.log), [сценарии](evidence/http-results.json); Next SSR/RSC, synthetic DB + mock Clerk на 3327, не настоящий OAuth |
| `npm run db:test` | **8/8 PASS** exit 0 | [Лог](evidence/migrations-followup.log), [native schema/ledger/fingerprints](evidence/migration-results.json); пустая БД, upgrade и повторный no-op |
| `npm run db:generate -- --name=schema_check` | PASS:No schema changes | [Вывод](evidence/generate-followup.log); snapshot соответствует ORM, новая миграция не создана |
| `node scripts/migrate.cjs --help`; запуск без DATABASE_URL | Help PASS; отсутствующий URL корректно отклонён | Без подключения к внешней БД; реальные env не подхватываются автоматически |
| `git diff --check` | PASS | Текущее дерево |

Нативного npm test script в исходном проекте не было. Повторены все три существовавшие целевые suites, добавлена meaningful migration suite. Из 36 warnings исправлены 3 декоративных alt, явная передача обязательного MDX alt и оба эффекта. Оставшиеся 30 — исключительно `@next/next/no-img-element`: рекомендации по image optimization, все перечислены в JSON. Массовая замена remote/blob изображений потребовала бы отдельной проверки размеров, loader/remote patterns и поведения; ради нулевого числа предупреждений такой рефакторинг не выполнялся. Новых a11y/hooks warnings нет. Это не доказательство всей визуальной доступности.

## БД и миграции

Проверенная внешняя среда: hosted Supabase **`gwuzekpkfrkmgluzblty`**, database `postgres`, eu-central-1; API host `gwuzekpkfrkmgluzblty.supabase.co`. Локальные env указывают на этот проект. Production/staging назначение и friendly name не установлены; доступный Supabase connector перечисляет другие проекты. Пароли, connection strings и реальные персональные данные в отчёт не включены.

Только READ ONLY: [новые metadata/журналы](evidence/database-followup-readonly.json). Пять полей фильтра, три CHECK и community_audit существуют; все 17 public-таблиц с RLS. Все 17 journal hash относятся к **старой Drizzle-цепочке `supabase/migrations`**; Supabase CLI journal пуст.0004/0005 не зарегистрированы. Установленная причина — прежнее прямое применение SQL через разрешённый repair script без ledger. В этом запуске SQL на внешней БД повторно не применялся, journal backfill не делался.0006 там не выполнялась.

[Процесс,8 isolated native checks и конкретный план согласования](MIGRATIONS.md). На пустой PGlite текущая полная цепочка 0000–0006 воспроизводит ORM, штатно пишет 7 ledger rows; upgrade сохраняет прежние дети/связи/paid/content/NULL-ответы; повторные запуски no-op. Это не полная Supabase-интеграционная проверка. Внешние timezone/FK/extra-column расхождения и adoption baseline остаются открытыми. Новый runner не принимает чужую историю автоматически.

`videos_author` установлен как alias таблицы users в relation videos.author_id→users.id. Повторный реальный read-only запрос с ограниченной проекцией first_name/last_name/slug успешен, ошибку `videos_author.gender` не воспроизводит; [протокол](../evidence/environment-readonly.json). HTTP тёмного SVG200 подтверждён на обоих локальных стендах. Визуальная видимость тёмного логотипа ещё не подтверждена браузером.

## Computer Use и браузерная часть

**Пройдено 0 desktop,0 mobile. Настоящий Google OAuth — NOT VERIFIED.** Начальный New Tab браузера не является сценарием Menorah. Ни SSR, ни mock session, ни HTTP200 не засчитаны как browser/OAuth E2E.

[Точный протокол](evidence/computer-use-followup.json):

1. Отдельного request-permission метода в доступном CUA API нет; prompt не отправлялся, ожидание не объявлялось. Менеджер плагинов ответил not_installed, поиск каталога не нашёл точный пакет; этот ответ не доказывает состояние macOS и не отменяет наличия CUA tools.
2. После ответа владельца «Доступ включён» inventory подтвердил локальный Chrome for Testing, а `cua.getApp('com.google.chrome.for.testing')` успешно вернул accessibility tree окна New Tab. Прежний `permissions are not granted` на этом шаге устранён.
3. Первая попытка навигации и последующее чтение окна возвращают **ScreenCaptureKit internal error−3811**, outer server−10005. По локальному Apple SDK это internal video/audio capture failure; не код UserDeclined−3801 и не отдельная audio error−3818. Нельзя назвать его отказом сайта или вновь отрицать выданное разрешение. Конкретная причина внутри capture service не установлена.
4. Сброс клиентской CUA-сессии и новое связывание окна не помогли. Другой драйвер/облачный браузер/policy bypass не использовались. Запрошен перезапуск самого сервера Computer Use; владелец ответил «Сейчас перезапустить не могу». Новых повторов до изменения состояния нет.

Для продолжения требуется **перезапустить сервер в ChatGPT → Plugins → Computer Use**, затем повторить получение состояния окна. Источник ограничения — фактический ответ CUA/ScreenCaptureKit, не SKILL.md и не новый запрос согласования бизнес-логики. [Официальная настройка Computer Use](https://learn.chatgpt.com/docs/computer-use) отдельно описывает host app access и macOS Screen Recording/Accessibility; внутренний−3811 сам по себе не доказывает отсутствие конкретного OS-разрешения. Если после перезапуска ошибка сохранится, потребуется диагностика host capture service; молча повторять вызовы не следует.

Локальные стенды на том же Mac:3327 synthetic DB/mock Clerk для UI-ролей; **3330 настоящий Clerk test-mode + отдельная synthetic DB**, исходные Clerk imports/middleware/auth routes. Проверены test-prefix ключей без публикации значений.3330 обновлён из текущей копии, инициализируется полной native chain; Telegram/welcome/analytics отключены, внешний DATABASE_URL не используется. Подготовлено бесплатное синтетическое событие. [Stand evidence](evidence/oauth-stand-followup.json). Четыре намеренных отличия исходников только для изоляции: DB adapter, Telegram stub, welcome stub, удалённый Analytics mount; дополнительных identity bypass в 3330 нет. Реальные аккаунты/семьи ещё не создавались в synthetic DB. Безопасность внешней конфигурации самого Clerk test tenant не выдаётся за отдельную проверку провайдера.

Страница входа с контекстом события доступна HTTP: `http://localhost:3330/sign-in?returnTo=%2Fevents%2Ffixture-event`. Экран Google не открыт; OAuth остановился **до перехода к провайдеру**, личный интерактивный шаг владельцу ещё не подготовлен в браузере. После восстановления захвата использовать разрешённые тестовые аккаунты; пароль/код/consent при необходимости вводит владелец в нужном экране, не в чате. Восстановление saved profile, linking/no duplicate и account-switch требуют именно этого прогона.

## Матрица и остатки

**VERIFIED 44 / PARTIAL 18 / FAIL 0 / AMBIGUOUS 0 / NOT VERIFIED 4 / N/A 0 =66.** [Матрица с прежними 66 ID](../SPEC_COMPLIANCE.md), [машинный итог и все причины/следующие шаги](evidence/matrix-counts.json).

MC-050 «Основание подтверждения/кто определяет продвинутый этап» закрыт OD-07; MC-057 «Сохраняется ли лид третьей ветки и какая коммуникация допустима» закрыт OD-08. Новых продуктовых вопросов нет.

| Статус | Незакрытые ID | Недостающее доказательство |
|---|---|---|
| NOT VERIFIED 4 | MC-004,007,014,062 | Реальные Google transitions, mobile guest и полный OAuth/cancel/linking/replay |
| PARTIAL 18 | MC-005,015,017,021,027,028,036,038,040,041,043,052,053,054,058,064,065,066 | Browser CTA/returnTo, выбор/сохранение/ветвление анкеты, семьи/дети/admin workflow, история, reload/back/network/account-switch. Для каждого ID точная причина и следующий шаг есть в матрице |

[Ручной чек-лист](MANUAL_CHECKLIST.md) содержит только эти непроверенные UI/OAuth-пути с ожидаемыми результатами, desktop1440/mobile390 и узкий 320. Не проверены читаемость, переносы, flash закрытых элементов, overflow, фокус/клавиатура, client validation и ошибки браузера.

Готовность **этапа ТЗ**: реализация и автоматические проверки готовы; финальная browser/OAuth-приёмка остаётся открытой. Готовность **к production**: не подтверждена. [Остальные находки общего аудита](../OPEN_AUDIT_ITEMS.md) сохраняются с фактическими статусами; R07 частично закрыт только локальным воспроизведением, внешняя история остаётся открытой. Lint/build не закрывают секреты, остальные endpoints, зависимости, webhook/payment ledger и нагрузочные проверки. Публичная версия этим запуском не обновлялась.
