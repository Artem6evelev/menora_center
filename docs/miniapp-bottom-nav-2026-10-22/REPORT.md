# Menorah Kids в постоянной навигации Mini App

База: `main`, `2c4584eb852f9f77a72aad5c21e34dddf3bcbf97`, чистое дерево перед изменениями. Новый локальный commit поверх этой версии; push/deploy не выполнялись.

## Изменения

BottomNav: «Главная», «Мероприятия», «Мои записи», «Menorah Kids», «Профиль». Иконка Kids — `Baby` из существующего lucide-react, 21px. Активные иконка и подпись используют прежние gold/navy цвета, `aria-current="page"`; Kids больше не подсвечивает Home.

Пять равных grid-колонок, полные однострочные подписи. У всех пунктов одинаковый шрифт 9–10px и одинаковый font-weight в выбранном и обычном состоянии. Панель использует доступную ширину, не меняя ширину выбранной колонки. Существующий нижний offset с Telegram safe-area/content-safe-area сохранён. [Измерения](evidence/layout.json), [320px](evidence/320-kids-nav.png), [390px](evidence/390-kids-nav.png).

Kids использует прежний `view="kids"` и intended section, общий с `/miniapp?section=kids`. Нажатие обновляет navigation hint через history.replaceState, без browser navigation; старый event/campaign hint при явном переходе в Kids удаляется. Back из корня Kids и нижний Home возвращают на Home; вложенное подтверждение сохраняет прежний Back для закрытия диалога. Ссылка и завершение onboarding открывают Kids с активным табом.

Навигация видна всем пользователям после успешного Telegram bootstrap, включая незавершённый профиль и none. Видимая панель не даёт admission: незавершённый профиль остаётся на обязательной анкете, none — на resources. Guard отображения не допускает открытия profile/events/registrations/Kids в обход обязательного этапа. Выбор Kids сохраняется через анкету и reload. У допущенных пользователей Kids использует прежние family/permission UI: eligible mother, giyur gate при детском действии, male → WhatsApp. Пол, affiliation и stage не скрывают сам таб.

Изменены только `components/miniapp/ui.tsx`, `app.tsx`, Mini App CSS, соответствующие browser expectations и тесты/документация. Серверная авторизация и правила детей остаются прежними.

## Проверки

**823/823 PASS, 31 группа** — [полная матрица и SHA256 проверенных исходников](evidence/checks.json). Все группы выполнены заново на текущей рабочей копии.

- Новый `miniapp-bottom-nav-browser.cjs`: **15 PASS**. 320/390/1280, пять равных табов и полных подписей, Baby 21px, active цвета, внутренний переход без navigation/external calls, Back и Home, оставшиеся четыре таба, reload, safe-area 34+10px при viewport480, все permission категории и Kids destination через обязательный onboarding. Измерены ширина текста, однострочная высота, hit targets >=44px и отсутствие горизонтального overflow/изменения ширины выбранного таба.
- Прежние browser cohorts: **12/12 PASS**, включая 16 Kids-entry, 21 Kids, 15 payment UX, 32 Telegram release UI, 39 profile/UI, website desktop/mobile, анкеты, Share и callback fixtures. Прежние ожидания четырёх табов и отсутствия панели при onboarding/resources обновлены согласно новому продуктовому правилу; assertions прав/API и mandatory questionnaire сохранены.
- Все **15 server groups PASS**: PGlite, отдельный native PostgreSQL, auth/session/profile concurrency, pricing/idempotency, Kids access и migrations на изолированных fixture-БД. Production DB не использовалась.
- `npm run lint`: **PASS**, exit0, 0 ошибок / 30 прежних `no-img-element` предупреждений вне изменённых файлов; новых предупреждений нет. [Лог](evidence/lint.log).
- `npm run typecheck`: **PASS**, exit0. [Лог](evidence/typecheck.log).
- `npm run build`: **PASS**, exit0 через существующий build harness на актуальных исходниках в `/tmp` без настоящих `.env`. Недоступная synthetic loopback DB вызывает прежний sitemap fallback; production sitemap/DB этим не проверены. [Лог](evidence/build.log).
- Production-build browser **2 PASS**, JS boundary **1 PASS**: website Clerk runtime в Mini App отсутствует.

Браузер — локальный Chromium с эмуляцией размеров экрана, синтетическими Telegram HMAC/SDK и Clerk adapters; внешняя навигация блокируется. Измерения safe-area используют подставленные SDK callbacks. Это не проверка физического Telegram WebView. После публикации владельцем остаётся короткий smoke-test пяти табов на телефоне.

## Границы

DB schema, migrations/SQL, auth/identity, optimistic profile locking, категории и серверные права, payment architecture/iframe, event/share links и Bot welcome не изменены. Новых зависимостей/env нет. Supabase, Vercel env, Telegram webhook/menu/BotFather не менялись. Реальные платежи и сообщения, push/deploy не выполнялись.
