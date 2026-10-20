# Приёмка Menorah Center — 20.10.2026, Asia/Jerusalem

Приёмка **не завершена**: согласованная фильтрация реализована и проходит локальные серверные проверки, но desktop/mobile и настоящий Google OAuth не выполнены из-за отказа Computer Use. Общая production readiness также не подтверждена. Деплой и реальные платежи не выполнялись; публичная версия в этом запуске не обновлялась. Shutafim/настройка webhook остались следующим этапом.

## Проверенная контрольная точка

Ветка `main`, HEAD `c43b0d54a84038b257aa1ef7b151942d95baa629`. Проверено **текущее незакоммиченное дерево**, включающее реализацию предыдущего этапа и текущие lint/hook/test-loader исправления. Проверка одного HEAD не подтвердила бы реализацию: в HEAD её нет. [Начальная точка](evidence/checkpoint-before.json), [точная версия проверенного кода](evidence/code-checkpoint.json), [изменения именно этой приёмки](evidence/acceptance-code-changes.json). Утверждённые OD-01–OD-06 в SPEC_DECISIONS.md сохранены, бизнес-правила не менялись.

БД: удалённый hosted Supabase-проект **`gwuzekpkfrkmgluzblty`**, API `gwuzekpkfrkmgluzblty.supabase.co`, БД `postgres`, регион подключения eu-central-1. Этот проект используется локальными `.env`/`.env.local`, обе настройки БД совпадают. Это не synthetic PGlite и не автоматически выделенный тестовый проект. Метка production/staging и понятное имя проекта не установлены: в доступном Supabase-коннекторе перечислены другие проекты. Проверяемая среда названа её точным project ref; не выдана за production или staging предположением. Пароли, usernames и connection string не публиковались.

[Read-only проверка журналов/схемы](evidence/database-checkpoint.json): пять filter-полей, три CHECK и community_audit с RLS существуют. Эффект SQL0004/0005 подтверждён, SHA256 файлов совпадает с предыдущим протоколом выполнения. В `drizzle.__drizzle_migrations` 17 прежних записей, **hash 0004/0005 отсутствуют**; `supabase_migrations.schema_migrations` пуст. Предыдущий этап применил два SQL напрямую, не добавляя записи mixed ledger. В этой приёмке выполнены только READ ONLY metadata-запросы: повторных миграций, backfill или записей в журналы не было. Нельзя утверждать, что истории миграций согласованы. Следующий шаг перед выпуском — согласовать baseline/ledger без повторного SQL и без фиктивного применения старых цепочек.

## Штатные проверки

Установлено: Node22.20.0, Next16.1.7, ESLint8.57.1, eslint-config-next14.2.3, TypeScript5.8.3. Корневой ESLint-конфигурации ранее не было; был только `tests/community/eslint.cjs`.

`lint` заменён на прямой `eslint . --ext .js,.jsx,.ts,.tsx,.mjs,.cjs`, добавлен штатный `typecheck`. `.eslintrc.cjs` сохраняет **все** прежние правила целевой конфигурации, включая eslint:recommended и hooks, и добавляет next/core-web-vitals. Новых отключений правил нет. `.eslintignore` содержит только node_modules, `.next*`, out/build/coverage. Изменённые компоненты, actions, lib, tests и даже исторические диагностические скрипты участвуют в полном запуске. Прямой ESLint вместо next lint соответствует [официальной документации Next](https://nextjs.org/docs/app/api-reference/config/eslint). Пакеты/lockfile не обновлялись.

Исправлено в текущей реализации: локальная переменная `module` тестовых VM-загрузчиков переименована без изменения контракта VM; зависимости callback/resume анкеты стабилизированы через useCallback; подавление exhaustive-deps удалено. Регрессии после этого повторены.

| Команда | Результат | Доказательство / среда |
|---|---|---|
| **`npm run lint`** | **FAIL, exit1; 240 файлов, 9 ошибок, 36 предупреждений** | [Полный вывод](evidence/lint.log), [JSON](evidence/lint-final.json), [атрибуция](evidence/lint-summary.json). Ноль новых ошибок реализации; оставшиеся ниже. Команда исправлена, проект не объявлен lint-clean |
| `npm run typecheck` | PASS, exit0 | [Лог](evidence/typecheck.log), текущая рабочая копия |
| `npm run build` | PASS, exit0 | [Лог](evidence/build.log), копия `/tmp/menora-acceptance-build` с тем же кодом/зависимостями, без реальных env. Синтетическая недоступная БД вызывает обработанное сообщение sitemap о новостях; это не DB-интеграционная сборка с живыми данными |
| `node tests/community/regression.cjs` | 26/26 PASS, exit0 | [Лог](evidence/regression.log), [результат](evidence/regression-results.json); synthetic PostgreSQL/WASM + реальные Drizzle SQL/actions, mock identity, внешние доставки отключены |
| `node tests/community/render.cjs` | 12/12 PASS, exit0 | [Лог](evidence/render.log), [результат](evidence/render-results.json); React SSR, не браузер |
| `node tests/community/http.cjs` | 11/11 PASS, exit0 | [Лог](evidence/http.log), [результат](evidence/http-results.json); реальный локальный Next HTTP SSR/RSC + synthetic DB/mock Clerk |
| `git diff --check` | PASS | Текущее рабочее дерево |

Существующего npm test script не было; повторены все три ранее добавленные целевые suites. Введённый `npm run typecheck` исполняет ту же полную TypeScript-проверку, ранее вызывавшуюся напрямую. Для сборки проверено соответствие исходных файлов копии текущей версии. Секретные env не копировались в сборку.

Оставшиеся **прежние** lint-ошибки:

| Файл | Строка / правило | Основание |
|---|---|---|
| components/dashboard/authors/admin-authors-client.tsx | 63: 2× react/no-unescaped-entities | Подтверждены на HEAD с тем же lint-конфигом |
| components/testimonials.tsx | 117: no-redeclare | Прежнее совпадение имени типа/компонента, подтверждено на HEAD |
| components/ui/infinite-moving-cards.tsx | 59: no-constant-condition | Подтверждено на HEAD |
| docs/audit-2026-10-20/diagnostics/ui-render-audit.cjs | 27 display-name, 43/44 hooks, 70 no-assign-module-variable: 4 ошибки | Старый изолированный диагностический harness; исторический снимок не переписан |
| docs/audit-2026-10-20/scripts/server-actions-isolated.cjs | 69: no-assign-module-variable | Старый диагностический harness, сохранён |

[Сравнение на HEAD](evidence/lint-head.json) выполнялось отдельно с тем же новым полным конфигом; исходники HEAD скопированы без env. На HEAD 6 ошибок/38 warnings: 4 указанные product ошибки и 2 ошибки старой EventCard, уже устранённые предыдущей реализацией. Исторические scripts не входят в HEAD, но участвовали в текущем lint. 36 текущих warnings: 30 no-img-element, 4 alt-text, 2 exhaustive-deps; все файлы/строки в lint-summary.json. Прежние нарушения не скрыты исключениями и не считаются исправленными этой приёмкой.

## Desktop/mobile и Google

**Реально пройдено браузером: 0 desktop, 0 mobile. Настоящий Google OAuth: NOT VERIFIED.** Не проверены реальный вход/новый аккаунт, отсутствие дубля после OAuth, cancel/back/logout/account-switch, визуальная читаемость/overflow и client validation. Запросы HTTP с mock identity не засчитаны как их прохождение.

Причина установлена на доступной глубине: inventory возвращает запущенные Chrome/Chrome for Testing, но `browsers: []`; `cua.getApp('com.google.chrome.for.testing')` возвращает **`Computer Use permissions are not granted`** до получения состояния приложения и до навигации. Это отказ разрешения Computer Use, не HTTP-ошибка сервера. Точный системный переключатель macOS либо внутренний permission приложения из этого сообщения определить нельзя. Обход через иной драйвер/CLI не предпринимался. [Доказательство](evidence/browser-access.json).

Подготовлены отдельные локальные стенды: 3327 — UI с mock Clerk; **3330 — настоящий Clerk test-mode + synthetic PGlite**, оригинальные auth routes/middleware, без mock identity. Ключи подтверждены только по префиксам test, значения не выведены/не скопированы в env-файлы стенда; SMTP/Telegram/analytics отключены, hosted Menorah DB не подключена. [Состояние OAuth-стенда](evidence/oauth-stand.json). Локальный сбой same-origin rewrite на временном стенде устранён согласованием bind hostname `localhost` и origin `localhost:3330`; экран /sign-in возвращает HTTP200 с кнопкой Google, оригинальный Clerk middleware сохранён. Продуктовая конфигурация не ослаблялась. HTTP-экран не равен успешному OAuth. Google test account ещё не выбран, вход не выполнялся. Личный вход/подтверждение при необходимости должен выполнить владелец после открытия экрана. На 3330 подготовка существующего synthetic профиля для выбранного Clerk ID выполняется отдельно; реальные семейные сведения менять не требуется.

[Короткий ручной чек-лист](MANUAL_CHECKLIST.md) содержит только непроверенные browser/OAuth-сценарии и ожидаемые результаты. Для продолжения инструментом нужно одно действие владельца: **разрешить Computer Use в текущей сессии ChatGPT/Codex**. Источник требования — фактический ответ инструмента, не правило SKILL.md и не предположенная проблема конфигурации сайта.

## Итог 66 пунктов

**VERIFIED42 / PARTIAL18 / FAIL0 / AMBIGUOUS2 / NOT VERIFIED4 / N/A0. Сумма66.** [Матрица с исходными ID](../SPEC_COMPLIANCE.md) указывает доказательство/среду для каждого подтверждённого пункта и причину/следующий шаг для каждого незакрытого. Линт-ошибки относятся к общей приёмке репозитория и не являются искусственно добавленными пунктами 67+ в матрицу ТЗ. Два прежних бизнес-вопроса вне утверждённых OD: основание дополнительной проверки сведений (MC-050) и сбор лида/коммуникация в третьей ветке (MC-057); непредписанная модерация/подписка не введены.

Готовность этапа ТЗ: согласованные серверные функции и экраны реализованы, **финальное принятие пока не подтверждено** без browser/OAuth. Готовность к production: **не подтверждена**; сохраняются full-lint нарушения, незарегистрированные migrations/mixed baseline и остальные [открытые находки аудита](../OPEN_AUDIT_ITEMS.md). Ничто из этого не закрыто одним только успешным build. Публичная версия не обновлялась этим запуском; реальных платежей не было.
