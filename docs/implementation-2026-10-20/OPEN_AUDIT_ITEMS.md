# Общие находки аудита, остающиеся вне текущего этапа

Это перенос открытого долга из исторического [плана R01–R18](../audit-2026-10-20/REMEDIATION_PLAN.md), а не повторный аудит. Реализация фильтрации не объявляет исправленными весь доступ, все интеграции и все данные сайта.

| Исходный пункт | Что остаётся |
|---|---|
| R01 | Tracked env/секреты, ротация у провайдеров и согласованная очистка истории. Значения не публиковались; ротации/переписывания Git не выполнялись |
| R02–R03 | Нерелевантные фильтрации CRUD/read endpoints сервисов, задач, контента, сообщений, тегов, бота, upload. Защищены event CRUD/loaders, собственный профиль/дети, manual workflow, найденный role escalation delegate и CRM user lists, необходимые для этого этапа |
| R04 | Настройка/подлинность/idempotence webhook Shutafim, order ledger, сверка платежей/refund. В этом этапе только server validation/расчёт до прежнего iframe; исторические paid не менялись |
| R05 | Общий журнал остальных административных действий. Новый community_audit покрывает именно ручные детские исключения |
| R06 | Existing dependency advisories/совместимость Next/React/Clerk и typings; массового обновления пакетов не было |
| R07 | PARTIAL: восстановление пустой изолированной среды штатной цепочкой0000–0006 и безопасный synthetic upgrade/no-op подтверждены8 проверками. Внешняя БД по-прежнему имеет старую цепочку17 записей и неучтённые0004/0005; adoption/ledger и прочие schema differences не исправлялись. [Протокол и план](acceptance/MIGRATIONS.md) |
| R08 | Полная реляционная семейная модель/опека/общие профили родителей остаются отдельным дизайном. Текущий этап сохраняет JSON и вводит собственные стабильные ID/ownership/history snapshots |
| R09 | Нагрузочная multi-connection проверка, database unique/order constraints и согласование payment concurrency. Транзакции/сериализация по профилю+event и повтор обычной записи проверены локально; существующие дубли не удалялись |
| R14 | Общий review Clerk/Telegram/cron/WhatsApp/Storage contracts и доступа. Welcome после сохранения отделён от успешности профиля; внешние доставки не запускались |
| R15 | Общие HTML/XSS/moderation/draft/author-data projections остальных content loaders. Video author projection исправлен только в затронутом запросе |
| R16 | Поиск/пагинация событий за пределами первой страницы, прочие старые UX/contact/welcome дефекты. 404 dark logo исправлен в этом этапе |
| R17 | Полная миграция lint/CI, dependency install peer conflict, hosting cron/config, release/backup/monitoring. Целевые тесты/typecheck/build добавлены/выполнены; команда исправлена на полный ESLint; остаются 9 прежних ошибок/36 warnings, см. acceptance/REPORT.md |
| R18 | Измерения p95/EXPLAIN/объёма и оптимизация; такие гарантии не выводятся из текущих тестов |
| Storage / публичные файлы | Известный прямой URL публичного event image по-прежнему доступен; signed image URLs/bucket migration вне этого этапа. Новые guest pages/metadata не раскрывают события/их изображения |

R10–R13 реализованы по ТЗ и решениям владельца с перечисленными в [отчёте](REPORT.md) ограничениями визуальной/OAuth-приёмки. Ни browser E2E, ни webhook, ни hosting release не объявляются выполненными.
