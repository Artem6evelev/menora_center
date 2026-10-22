# Baseline — b2ebdb37970df29eb6a5614fe0e766b889c81baf

Снят до изменений runtime. Локальный Chromium390, development StrictMode, синтетический подписанный SDK/identity, isolated PGlite; внешняя навигация блокирована. Network timings — loopback dev, не оценка production latency. [Наблюдения](baseline/browser.json).

| Сценарий | API до первого ready DOM | До содержимого/settled | Drizzle SQL statements до содержимого |
| --- | --- | --- | --- |
| Returning Home | 2: session → profile | 6, включая отменённые StrictMode events/subscription | 27: SELECT23/UPDATE4; locked14 |
| Новый пользователь | 3: session401 → bootstrap → profile | 3 | 15: SELECT10/INSERT4/UPDATE1; locked6 |
| Event ad, существующий | 3: session → profile → launch | 5, включая StrictMode detail GET | 29: SELECT25/UPDATE4; locked14 |
| Kids, существующий | 2: session → profile | 5: kids дубль + profile после kids | 25: SELECT21/UPDATE4; locked12 |

Ready boundary взята из MutationObserver и ResourceTiming; polling-time readyRequests в JSON включает уже начавшиеся запросы после ready. SQL logger считает statements без BEGIN/COMMIT и параметров, не TCP round trips. Отменённые browser requests могут всё ещё исполняться сервером. В отдельных transition DB samples бывают0 из-за cancellation/другого route compilation; эти samples не используются как точное число round trips.

Home → Events:2 GET attempts; Events → detail:1; detail Back:1 list GET; Registrations:2 GET attempts; Home → Kids:2 kids GET attempts и затем profile; возврат Home:4 events/subscription attempts. Повторный Events снова fetch. В StrictMode часть первых эффектов отменяется; отсутствие instance cache подтверждается повторным tab visit.

Initial production JS: **534836 bytes**, estimated gzip **165643 bytes**,12 script resources. Build копия и исходники соответствуют базе b2ebdb3. [Chunks/response byte evidence](baseline/bundle.json). Website Clerk runtime отсутствует.

Архитектура: все экраны импортируются eagerly; GET authorization получает session, затем identity/user/session FOR UPDATE и обновляет lastSeenAt. Home загружает до20 event DTO с description ради двух карточек. Kids последовательно загружает профиль повторно. Share link helper блокирует events даже при коротких ID. EventImage содержит два unoptimized Image с одним URL: браузер может переиспользовать resource, но скачивает исходник без responsive optimization. Нет утверждения о двух независимых загрузках одинакового URL.

Production metadata read-only: Vercel project prj_g4eRiADinsBdYSIhJGzYXUK0EXt9, deployment dpl_BDjDKfGHqpizoF7u6wkNpMpfaf1N READY / production / b2ebdb3, project function region iad1. Разрешённый READ ONLY запрос вернул только уникальные image hosts: gwuzekpkfrkmgluzblty.supabase.co. Local connection project ref проверен без вывода URL; pooler region hint eu-central-1. Регион самой БД пока не подтверждён Supabase project metadata. Настройки не менялись.

Session transitions замерены на той же неизменённой baseline-копии: logout —1 POST; повторный login —7 attempts (session→bootstrap→profile + дублируемые effects Home). Смена SDK account без reload не вызывала запросов; reload повторно установил исходный subject через fixture SDK init-script (6 запросов), поэтому он не доказывает смену аккаунта. Проверка смены SDK subject без reload добавлена в новые browser tests; baseline не засчитывается как успешный account switch. [Запросы](baseline/session-transitions.json).
