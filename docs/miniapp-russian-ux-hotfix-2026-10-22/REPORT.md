# Финальный UX hotfix Telegram / Mini App — 22.10.2026

База — `main`, `9a6a00e18fb767d8aef0c1d0bd18b088a5e77e69`, исходное рабочее дерево CLEAN. Подготовлен новый локальный коммит поверх этой базы; amend, push и deploy не выполнялись. Исходники и полный перечень проверок: [evidence/checks.json](evidence/checks.json).

## Утверждённое правило языка

Последнее уточнение владельца заменяет первоначальное условие о сохранённом EN/HE: **бот и Mini App всегда RU**, включая старые аккаунты с EN/HE metadata. Telegram `language_code`, browser/device locale и прежние browser preferences не определяют интерфейс. Переключатель удалён; отдельного языкового шага нет. Onboarding, профиль, события, запись/оплата, Share/copy, подтверждения и ошибки выбирают только русский текст. Error boundary и loading также русские с первого рендера.

Старые translation maps и совместимые типы оставлены технически; Mini App и бот не выбирают их EN/HE-ветки. Техническая Telegram metadata сохраняется прежним образом, без миграции или массового изменения данных. Названия и описания событий используются как сохранены в БД. Основной website, его локализация и `next-intl` не менялись.

## Welcome, контакт и анкета

- Generic `/start`: приветствие по имени, Menorah Center в Ришон-ле-Ционе, миссия общины, связь с Торой/традицией, объяснение галахических программ и короткой анкеты, «Анкету нужно заполнить только один раз», дальнейшая запись и анонсы. Сохранены прозрачное пояснение анонсов и `/unsubscribe`, а также текст об отключённых анонсах для отписавшихся. Основная кнопка — «Открыть Menorah Center», вторая — «Мероприятия».
- Рекламный welcome по-прежнему ставит исходное событие главным CTA. Экранирование имени, безопасное фото, fallback, дедупликация и отсутствие повторов при неизвестном результате доставки сохранены. Новая подпись проверена на лимит Telegram с максимальным именем, HTML entities и emoji. Реальные welcome-сообщения не отправлялись.
- Единый публичный контакт бота и Mini App: **+972 50 670 0779**, `https://wa.me/972506700779` с URL-encoded текстом «Шалом! Пишу из приложения Menorah Center.». Старый `t.me/menorah_center` не используется этим действием. Mini App вызывает `Telegram.WebApp.openLink` непосредственно при нажатии; при отсутствии/ошибке API использует HTTPS `window.open` с `noopener,noreferrer`. Контракт сверён с [официальной документацией Telegram](https://core.telegram.org/bots/webapps#initializing-mini-apps).
- Внешний запуск WhatsApp нельзя подтвердить из WebView. После нажатия остаётся запасной номер, кнопка копирования и ручное выделение при отказе Clipboard. Номер прокручивается выше нижней навигации с учётом reduced motion. Нет ложного сообщения об успешном копировании. Общий компонент используется на Home, информационной странице третьей категории и экранах восстановления/выхода. Inline contact бота ведёт на тот же WhatsApp URL.
- Удалён большой серый блок о недоступности самостоятельного добавления детей. Внизу анкеты — согласие с политикой, сохранение, «Изменить ответы». В пользовательском RU-тексте нет термина «фильтр»; обязательная предварительная анкета так и называется анкетой. Внутренние `filter*` поля, коды, маршруты и optimistic locking не переименованы.

## Файлы

| Область | Файлы |
| --- | --- |
| RU runtime / recovery | `components/miniapp/app.tsx`, `ui.tsx`, `event-card.tsx`, `event-entry.tsx`, `event-list-section.tsx`, `events.tsx`, `event-share.tsx`, `subscription.tsx`; `app/miniapp/error.tsx`, `loading.tsx` |
| Контакт | `lib/telegram/contact.ts`, `components/miniapp/contact.tsx`, `app/miniapp/miniapp.css` |
| Welcome / copy / форма | `lib/telegram/bot.ts`, `bot-welcome.ts`, `miniapp-i18n.ts`, `miniapp-ui-copy.ts`, `components/miniapp/profile-form.tsx` |
| Регрессии | `tests/community/miniapp-russian-ux-browser.cjs`, `telegram-release.cjs`; обновлённые browser/copy ожидания RU вместо прежнего EN/HE |

## Проверки и доказательства

**686/686 PASS, 27 групп**: прежние 664 проверки с ожиданиями нового RU-правила + 6 новых bot cases на PGlite и те же 6 на native PostgreSQL + 10 новых браузерных UX cases. Удаление EN/HE-переключения не убрало проверки safe areas, viewports, возврата к событию и регистрации: EN/HE device metadata теперь должна оставлять UI русским/LTR.

- `telegram-release.cjs`: **92 PASS**, `telegram-native.cjs`: **93 PASS**. Включены русские `/start`, generic и subscribe/unsubscribe ответы при EN/HE metadata, миссия, галахические программы, однократная анкета, WhatsApp, event-aware CTA и длина подписи.
- `miniapp-russian-ux-browser.cjs`: **10 PASS**. Новый и возвращающийся пользователь EN/HE → RU; нет selector/технического «фильтра»/серого блока; русский Share-toast; privacy → save → изменение ответов; WhatsApp через SDK/отсутствующий API/ошибку API, номер и Clipboard deny; контакт на resources/outside. После найденного при просмотре скриншота перекрытия номера нижней навигацией добавлены scroll и проверка геометрии, затем эти 10 проверок повторены.
- Остальные существующие группы пройдены полностью: auth/identity, community/child rules, optimistic conflicts, website/Clerk callback fixtures, рекламный deep link, canonical Share alias/collision/disabled campaign, расчёт/регистрация/pending и Shutafim. Закрытие платежа не делает запись `paid`. Image/Share browser: **21 PASS**, без обрезки афиши и со всеми fallback. Сводка каждого сценария — в `evidence/*.json`.
- `npm run lint`: **PASS**, exit 0, 0 ошибок / 30 прежних `@next/next/no-img-element` предупреждений вне изменённых файлов; новых предупреждений нет. Правила не ослаблялись. [Лог](evidence/lint.log).
- `npm run typecheck`: **PASS**, exit 0. [Лог](evidence/typecheck.log).
- `npm run build`: **PASS**, exit 0, повторён после исправления прокрутки контакта через существующий `tests/community/build.cjs`: текущие исходники без настоящих `.env`, недоступная synthetic loopback DB. Sitemap пишет ожидаемую ошибку соединения и использует прежний fallback; production-данные sitemap этим не проверены. [Лог](evidence/build.log).
- Production-build browser **2 PASS**, JS без website Clerk runtime **1 PASS**. Байты и оценка gzip — в `checks.json`, это не измерение Telegram-устройства.

Среды: изолированные PGlite 17/18, disposable native PostgreSQL 18, Chromium desktop/mobile; подписанная identity/SDK/Clerk и Bot API — явные синтетические adapters/stub. Браузерные группы с общим reset выполнялись последовательно. Первый запуск стенда без `NODE_PATH` не смог загрузить локальную PGlite-зависимость; это исправлено в запуске временного сервера, не в production-коде. Неуспешная попытка не засчитана. Пример [RU contact](evidence/russian-contact.png); [афиша](evidence/ru-home.png). `he-detail.png` относится к устройству с HE metadata, UI на нём русский.

## Сохранённые границы

Схема, migrations, security/RLS, auth/identity, серверные правила детей и событий, оптимистическая защита, event/share architecture и расчёт/подтверждение платежей не изменены. Старый коммит `9a6a00e` сохранён. Production Supabase, Vercel env и Telegram webhook/menu/BotFather не затрагивались. Реальных сообщений, платежей, push/deploy не было; публичная версия этим запуском не обновлена.

После публикации владельцем остаётся короткая проверка нового `/start` и WhatsApp-перехода в настоящем Telegram Android/iOS. Локальные адаптеры подтверждают корректный URL/API вызов и fallback, но не открытие установленного WhatsApp или системный share sheet на устройстве. Новый общий production-аудит не выполнялся. SHA нового коммита, последние три коммита и конечный статус дерева сообщаются после коммита.
