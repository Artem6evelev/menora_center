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
