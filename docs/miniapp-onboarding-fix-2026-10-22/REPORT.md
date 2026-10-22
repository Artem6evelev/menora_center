# Mini App onboarding conflict — 22.10.2026

Локальный hotfix поверх `cd5ca459748a2f956c7e267c3035ae47ec764188`, ветка `main`.
Push, deploy, изменения Supabase, Vercel env и Telegram configuration не выполнялись.

## Причина и границы доказательства

`profile_changed` формируется только при несовпадении переданного тега с
`sha256(user.id + ':' + user.filterRevision)` в `saveMiniAppProfile`.
RU/HE/EN сообщения определены в `lib/telegram/miniapp-i18n.ts`, отображаются через
`requestMessage` в `components/miniapp/profile-form.tsx` и `FilterForm` в `components/miniapp/app.tsx`.

До исправления единственным транспортом версии были HTTP `ETag` ответа и `If-Match`
запроса. Клиент передавал полученную строку без отдельной версии в JSON; сервер
сравнивал её буквально. Отсутствующий, weakened или заменённый транспортом validator
давал409 даже при неизменённой `filter_revision`. На исходном коде настоящий клиент,
routes, HMAC/session и SQL воспроизводят **первый save →409/profile_changed**, когда
тестовый транспорт удаляет эти заголовки. Первые31 прежних проверок при этом проходили.
[Состояние до исправления](evidence/before-fix.json).

Это доказанный дефект передачи версии и воспроизведение того же сообщения, а не
полученный production network trace. Конкретный production-прокси/слой, изменивший
или потерявший заголовок в запросе пользователя, **не подтверждён**. Реальные identity,
профили и религиозные/семейные сведения для диагностики не запрашивались и не менялись.

Проверен полный путь:

1. SDK signed launch → session/resume либо bootstrap → canonical identity/user под locks.
2. Bootstrap обновляет технические identity/contact metadata; существующие canonical
   ответы и `filterRevision` не изменяет. Session lastSeen также не меняет эту revision.
3. GET profile возвращает снимок canonical user и его версию в одной locked transaction.
4. Filter save проверяет версию, сохраняет affiliation/gender, увеличивает revision,
   возвращает новый снимок. `giyur/male` идёт на profile без уточнения стадии.
5. Profile save сравнивает версию под тем же user lock, затем shared website writer
   повторно проверяет числовую revision. Ответ возвращает `nextStep=home`.
6. Клиент принимает только успешный ответ, обновляет token/data и автоматически меняет
   экран. При409 input остаётся; автоматического принятия свежей версии и overwrite нет.

В этом flow нет SWR/Zustand. Startup AbortController/sequence и session retry сохранены;
browser-проверки подтверждают один bootstrap и корректный resume после reload.

## Исправление

- `lib/telegram/miniapp-profile.ts`: opaque `profileVersion` добавлен в JSON того же
  снимка. Из write payload извлекается только этот служебный token; оставшиеся поля
  по-прежнему проходят прежнюю strict validation.
- `lib/telegram/miniapp-client.ts`: версия читается прежде всего из JSON и передаётся
  в JSON write payload, независимо от HTTP cache validators.
- Exact comparison и транзакционные locks сохранены. Невалидный/stale body token
  не заменяется свежим `If-Match`. Missing token и wildcard не разрешают запись.
- Legacy strong `If-Match` запросы прежних клиентов продолжают проверяться сервером.
- Числовые revision остаются серверными; schema, миграции, категории, права детей,
  основная анкета без стадии гиюра и Shutafim не изменены.

## Проверки текущего кода

**576/576 PASS,23 группы:** весь прежний production candidate regression560 +12 новых
серверных проверок +4 новых browser journeys.
[Полный список, среды и hashes проверенных продуктовых файлов](evidence/checks.json).

- [Сервер43/43](evidence/miniapp-ui-server-results.json): RU/HE/EN × missing/weak/replaced
  cache validators; первый giyur/male filter/profile save; технический Telegram resync
  после открытия формы; home/reload; реальные competing filter и website writer requests;
  strict malformed/stale version rejection и сохранение winning profile.
- [Новый Chromium4/4](evidence/miniapp-onboarding-browser-results.json): RU/HE/EN,
  реальный UI→HTTP→SQL, отсутствие стадии в основной анкете, city/consent/reload,
  настоящий competing request →409 с сохранением несохранённого текста.
- Старые Mini App browser39; Telegram browser32; website HTTP11, callback10,
  website browser32; production browser2 и JS boundary1 — PASS.
- Auth87, identity23, shared community/website writers и все прежние native/PGlite
  migration/adoption suites — PASS. SQL выполнялся только на disposable local synthetic DB.
- `npm run typecheck`: exit0.
- `npm run lint`: exit0,0 errors/30 прежних `no-img-element` warnings.
- `npm run build`: exit0 в `/tmp/menora-production-build`, без реальных env и remote DB.
  Два продуктовых файла в build copy побайтно совпадают с рабочей копией.

Полные временные logs/screenshots находятся в `/tmp/menora-onboarding-fix-evidence`;
коммит содержит компактный отчёт и доказательства, без дублирования старых screenshots.
Команды целевых проверок добавлены в `tests/community/README.md`.

## Ограничения

Chromium использует явный synthetic Telegram SDK/HMAC, website suites — mock Clerk.
Это не повторная приёмка физического production Telegram WebView или настоящего Google OAuth.
После разрешённого владельцем push/deploy нужен контроль исходного сценария в Telegram.
Новый общий аудит не проводился; прежние production findings этим исправлением не закрыты.
