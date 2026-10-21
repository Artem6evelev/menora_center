# Google OAuth: установленная связь и подготовка брендинга

Проверено 21.10.2026 по текущим локальным настройкам и настоящему переходу в Google:

- Clerk instance: `ins_3AyxyhcUlgdOczyOnRtxh5sM7as`, `environment_type=development`.
- Frontend: `whole-bengal-70.clerk.accounts.dev`, ключи TEST (значения не публикуются).
- Google OAuth client, фактически переданный в Google: `787459168867-0v2orf3qo56uocsi84iroseoahhuovdm.apps.googleusercontent.com`.
- Экран Google достигнут; ввод аккаунта/пароля и успешный callback не выполнялись. Доказательства: [google-client.json](evidence/google-client.json), [clerk-instance.json](evidence/clerk-instance.json).
- Production instance и её Google-проект через локальные TEST-параметры не устанавливаются. Тип credentials (shared/custom) и принадлежность Google-проекта не подтверждены из кабинета. По [Clerk](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google) development обычно использует общие credentials, production требует собственные.

## Подготовленный файл

[menorah-google-oauth-512.png](branding/menorah-google-oauth-512.png), PNG512×512, белый фон. Экспорт из существующего утверждённого `public/logos/menora-logo.svg`, без перерисовки. Название приложения: **Menorah Center**. Собственные страницы входа/регистрации используют этот же утверждённый логотип; на контекстных экранах он не ведёт на homepage.

## Точные действия владельца во внешних кабинетах

1. Открыть существующее приложение Clerk, выбрать нужную **production instance**, перейти **SSO connections → Google**. Записать уже настроенный **Client ID**, состояние **Use custom credentials** и выданный **Authorized Redirect URI**. Секрет не присылать. Для TEST можно сверить фактически наблюдённый Client ID выше; общие credentials Clerk нельзя брендировать как собственный Google-проект.
2. В Google Cloud выбрать **существующий** проект, в **Google Auth Platform → Clients** найти клиент с тем же Client ID. Если проект не виден, нужен доступ владельца этого проекта; параллельный проект этой задачей не создавался.
3. В **Google Auth Platform → Branding** указать `Menorah Center`, загрузить подготовленный PNG. Проверить актуальный production homepage, privacy/terms URL из приложения и контролируемый support email; адрес почты не выдумывать. В Authorized domains использовать домен фактической production-версии. Репозиторий задаёт `menorah-rishon.com`; соответствие выбранному deployment/проекту подтверждает владелец.
4. В **Clients** сохранить текущий Clerk Authorized Redirect URI без подмены маршрутом сайта. В **Audience / Verification Center** выполнить необходимые для этого проекта публикацию и проверку бренда. [Google указывает](https://support.google.com/cloud/answer/15549049?hl=en), что отображение имени/логотипа зависит от проверки приложения. Подготовленный файл не доказывает, что Google уже показывает логотип.
5. После настройки пройти вход разрешённым тестовым Google-аккаунтом и проверить callback в приложение. Для уже подготовленного локального TEST-стенда используется `http://localhost:3334/sign-in`; исходный event-контекст можно открыть через `/events/fixture-event`. Данные стенда — изолированная PGlite, не удалённая БД. Если процесс остановлен, команда восстановления приведена в REPORT.md.

**Статус: PARTIAL.** Локальная связь TEST→Google и файл подтверждены. Изменения Google Branding/Clerk production и успешный настоящий Google callback не подтверждены и не выполнялись. Для настоящего callback недостающее действие — вход владельца разрешённого тестового аккаунта в подготовленном Google-сценарии; тестовая identity не заменяет эту проверку.

## Уточнение по опубликованному сайту, 21.10.2026

Чтением публичного HTML `https://www.menorah-rishon.com` подтверждён **LIVE** frontend `clerk.menorah-rishon.com`; это другая конфигурация относительно локального TEST. Публичный `GET https://clerk.menorah-rishon.com/v1/environment` содержит `display_config.google_one_tap_client_id = 666442068619-v9dlmortolk1p71pnsb6munrgv57lr64.apps.googleusercontent.com`. Это подтверждает объявленный клиент **Google One Tap**. Его совпадение с redirect OAuth client в SSO connections не предполагается. [Отдельные доказательства](../spec-finalization-2026-10-21/evidence/public-clerk-config.json).

Перед изменением Branding владелец сверяет именно **Google SSO Client ID** существующей LIVE instance с клиентом в существующем Google Cloud-проекте. Найденный One Tap ID — ориентир для сверки, не доказательство, что он обслуживает redirect OAuth. Production callback, принадлежность проекта и опубликованный Google-логотип по этим GET-запросам не подтверждены. На опубликованном сайте login/actions не запускались, данные в удалённую БД не записывались.

## Свежая подготовка Google-проверки, 21.10.2026

[Текущие доказательства](../google-acceptance-2026-10-21/REPORT.md) относятся к новой попытке `localhost:3337`, отдельной пустой PGlite и прежним настоящим Clerk TEST keys. Прежний стенд `3334` сохранён. Наблюдённый TEST redirect URI — `https://clerk.shared.lcl.dev/v1/oauth_callback`; внешний экран показывает **Clerk**. Этот общий TEST client не является местом установки production-логотипа Menorah Center.

Публичные LIVE GET снова подтверждают `clerk.menorah-rishon.com` и только One Tap Client ID. Кабинет LIVE/Google Cloud не достигнут; соответствие redirect Client ID, callback и разрешённых origins не проверено. Подробности в [live-public-config.json](../google-acceptance-2026-10-21/evidence/live-public-config.json). Доступ к приватной настройке не следует из наличия публичного One Tap ID.

Для владельца остаётся точная сверка:

1. **Clerk Dashboard → существующее приложение Menorah → Production → SSO connections → Google**: сверить включение sign-in/sign-up, custom credentials, **Client ID** и **Authorized Redirect URI**. Не раскрывать Client Secret.
2. **Google Cloud → существующий проект этого Client ID → Google Auth Platform → Clients → соответствующий Web client**: сравнить полный Client ID и точный Authorized redirect URI из Clerk. В Authorized JavaScript origins должны быть фактические origins используемого сайта (`https://www.menorah-rishon.com`; корневой `https://menorah-rishon.com` — если он также используется для входа). Ни frontend Clerk, ни `/sso-callback` приложения не подставлять вместо значения, выданного SSO connection. Текущие разрешённые адреса из Google Cloud пока не прочитаны.
3. **Google Auth Platform → Branding** в том же проекте: загрузить [PNG512×512](branding/menorah-google-oauth-512.png), проверить `Menorah Center`, support email, homepage `https://www.menorah-rishon.com`, privacy `/privacy`, terms `/terms` и authorized domain `menorah-rishon.com`. PNG повторно проверен, SHA256 в [branding-file.json](../google-acceptance-2026-10-21/evidence/branding-file.json).
4. Проверить **Audience / Verification Center**, выполнить требуемую проверку. По [документации Google](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification) изменения могут остаться **Draft Branding**; для внешнего экрана требуется **Publish branding** после необходимых проверок. Сохранение PNG в Git или черновике кабинета не подтверждает публикацию. После публикации проверить свежий **LIVE redirect**-вход: фактический логотип и возврат в приложение.

Настройки, загрузка и публикация брендинга агентом не выполнялись. LIVE Client ID нельзя считать установленным по TEST client или One Tap ID.
