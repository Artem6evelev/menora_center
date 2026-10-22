# Mini App: полная афиша и Share — 22.10.2026

Проверена текущая рабочая копия на `main`, база — `97e2f8cf692506187d3f9581f79cfa5acf8b9df0`. Локальный hotfix готов к коммиту; push и публикация в этом запуске не выполнялись. Состав проверок и SHA256 изменённых исходников до коммита: [evidence/checks.json](evidence/checks.json).

## Изменения

- Общий `EventImage` используется через `EventMedia` на Home, в списке, деталях и рекламном превью. `next/image`: передний слой `object-contain`, исходные пропорции, вся афиша; задний слой той же картинки с cover/blur/darken. Контейнер заранее резервирует 16:9. Ошибка загрузки и отсутствие изображения сохраняют размеры и брендовый fallback.
- Share расположен физически справа сверху, включая HE/RTL. Под кнопку 44×44 px оставлена отдельная полоса внутри медиа: она не закрывает исходную афишу. В деталях есть второе действие Share. Кнопки не вложены друг в друга; Share не открывает карточку. Сохранены keyboard focus и доступные названия/tooltip.
- Нативный `navigator.share` получает название, локализованный RU/HE/EN текст и серверный URL. Отсутствие API, отказ, отмена и неподдерживаемый формат переходят к Clipboard API. Toast показывается только после успешного копирования. Если Clipboard недоступен/запрещён, появляется модальный диалог с выделяемой публичной ссылкой. `alert`, чтение clipboard и deprecated copy-команды не используются. Повторное нажатие во время Share блокируется; таймер и асинхронное продолжение очищаются при уходе.

## Канонические ссылки: уточнение владельца

Применено решение владельца: короткий event ID сохраняет `https://t.me/menorah_center_rishon_bot?start=event_<eventId>`; для ID, который не помещается в Telegram start parameter, используется существующая `telegram_campaigns`.

Единая серверная реализация — `lib/telegram/event-share-server.ts`: batch `canonicalTelegramEventShareLinks` и single `canonicalTelegramEventShareLink`, доступные также будущему CRM-коду. Проверяется фактическое planned-событие. Прямой формат допустим для 1–58 символов `A–Z a–z 0–9 _ -`; остальные ID получают стабильный 44-символьный key `evs_` + первые 40 hex-символов SHA256 ID. Повторные и параллельные запросы переиспользуют одну запись. Конфликт key с другим событием и отключённый campaign не перезаписываются/не включаются; Share для такого конфликта не предлагается. Resolver сохраняет запрет открытия отключённого campaign.

Ссылка готовится сервером вместе с DTO списка/деталей/превью, до нажатия кнопки, чтобы сохранить user activation для Web Share. **После публикации загрузка DTO длинного planned-события может создать одну alias-запись в существующей таблице.** Это согласованное уточнение; новой таблицы/миграции нет. Во время этой работы такие записи создавались исключительно в изолированных тестовых БД.

URL содержит только публичный start key, без идентификаторов пользователей, регистраций и платежей. Campaign остаётся navigation/attribution hint. Анкета, optimistic locking, self/child access, Clerk/Telegram identity, серверные guards и iframe/расчёт Shutafim не изменены. Отмена/закрытие оплаты по-прежнему не подтверждает `paid`.

## Проверки

**664/664 PASS, 26 групп**, заново на текущих исходниках. Каждая проверка перечислена в [evidence](evidence/checks.json).

| Набор | PASS |
| --- | ---: |
| Mini App auth / UI server / SDK bridge | 87 / 43 / 6 |
| Mini App UI browser / onboarding / прежний UI polish | 39 / 4 / 14 |
| Canonical links + Telegram release, PGlite / native PostgreSQL | 86 / 87 |
| Новые image/Share browser / локализация | 21 / 3 |
| Telegram release browser / migrations / configuration tools / adoption | 32 / 10 / 5 / 28 |
| Website identity schema / migrations / regression / render / spec / production SQL | 23 / 8 / 36 / 21 / 17 / 28 |
| Website HTTP / callback browser / spec browser / callback component | 11 / 10 / 32 / 10 |
| Production-build browser / JS bundle boundary | 2 / 1 |

Команды: `node tests/community/event-share.cjs`, `node tests/community/telegram-release.cjs`, `node tests/community/telegram-native.cjs`, `node tests/community/miniapp-image-share-browser.cjs`; остальные существующие группы из таблицы — соответствующие `tests/community/*.cjs`. Вывод направлялся через `COMMUNITY_TEST_OUTPUT` в `/tmp/menora-image-share-evidence`. Браузерные группы с reset общей тестовой БД выполнялись последовательно.

Новые проверки подтверждают contain и все края portrait/wide афиш, зарезервированную геометрию до/после загрузки, fallback, Share во всех четырёх местах, RU/HE/EN и RTL, native/cancel/unsupported/rejected/missing API, Clipboard и selectable fallback, отсутствие двойного запуска и перехода карточки. Серверные проверки покрывают границу 64 символа, безопасный алфавит, стабильность alias, параллельные запросы на независимых native connections, disabled/collision и отсутствие новых прав. Длинная ссылка прошла локальный flow alias → ограниченное превью → обязательные filter/profile → исходное событие → бесплатная регистрация → reload.

Среды: изолированные PGlite 17/18, disposable native PostgreSQL 18, Chromium desktop/mobile viewports. Browser SDK/identity, Bot API и методы Share/Clipboard — синтетические адаптеры. API/SQL для alias и регистрации выполнялись настоящим локальным кодом. Внешние браузерные запросы блокировались. Примеры: [RU Home](evidence/ru-home.png), [HE detail](evidence/he-detail.png), [EN Home](evidence/en-home.png); [геометрия](evidence/layout.json).

- `npm run typecheck`: **PASS**, exit 0.
- `npm run lint`: **PASS**, exit 0; 0 ошибок, 30 прежних `@next/next/no-img-element` предупреждений в других файлах, новых предупреждений нет. Область и правила не ослаблены. [Лог](evidence/lint.log).
- `npm run build`: **PASS**, exit 0, через существующий `tests/community/build.cjs`, который запускает штатную команду в копии текущих исходников без настоящих `.env`. БД — заведомо недоступная synthetic loopback; sitemap пишет ожидаемую ошибку соединения и использует свой прежний fallback. Это не проверка production-наполнения sitemap. [Лог](evidence/build.log).
- Реальная локальная production-сборка в браузере: 2/2 PASS; initial JS без website Clerk runtime: PASS. 500701 bytes JS, gzip 155946 bytes — локальная оценка, не замер устройства.

## Границы

Схема/миграции, production Supabase, env, Telegram webhook/menu/BotFather не менялись. Реальных отправок, платежей, push и deploy не было. Анкета не получила вопрос о стадии гиюра. Прежние production-аудиты этим hotfix не закрываются.

После публикации владельцем остаётся короткая ручная проверка в настоящем Telegram iOS/Android: отображение реальной афиши, нативный share sheet, copy/cancel, переход получателя по короткой и длинной ссылке с сохранением event context. Локальные адаптеры не подтверждают системный Share/Clipboard конкретного WebView или настоящий Telegram callback. Новых секретов или реальных персональных данных в коммит не включено. Точный SHA и конечное состояние рабочего дерева сообщаются после локального коммита.
