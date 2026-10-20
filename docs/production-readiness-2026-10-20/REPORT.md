# Menorah Center: кандидат и приёмка20–21.10.2026

**Новые требования реализованы в локальном кандидате. Полная приёмка этапа и production readiness не подтверждены.** Владелец попросил пропустить свой Google-вход. Desktop/mobile пройдены, настоящий переход к Google подтверждён; возврат, профиль после Google и повторный Google-вход — NOT VERIFIED. Публичная версия не обновлялась. Push/deploy, удалённые миграции, реальные оплаты и уведомления людям не выполнялись.

## Точная версия и среды

Ветка **main**, HEAD **c43b0d54a84038b257aa1ef7b151942d95baa629**, плюс **незакоммиченное рабочее дерево**. Проверяли его, а не HEAD. Предыдущие изменения сохранены, reset/clean/checkout не выполнялись. Commit кандидата не создавался.

Source/config/assets/tests/manual-SQL manifest v3: **b1e64dc975bf39ae8f6ad76f2bde8f162a4955aae6b98af7d21c39792c933a06**, [все354 SHA256, git status и версии](evidence/code-checkpoint.json), [diff без env-секретов](evidence/candidate.diff). Реальные env/зависимости/build outputs исключены, безопасный .env.example включён, docs prose/evidence отдельно. Отсутствующие в текущей копии файлы не подменяются HEAD. Предыдущий v2 manifest24317fb81c171ba10681e3ac67a76c35d2756e1bfab73a5fc06a706c3368a588 и отчёты сохранены в [снимке до работы](evidence/checkpoint-before.json).

Установлены Next16.1.7, Clerk7.0.4, ESLint8.57.1, eslint-config-next14.2.3, TypeScript5.8.3, Drizzle ORM0.45.1/kit0.31.10. Штатный lint — прямой ESLint всего дерева с прежними содержательными правилами и Next/Core Web Vitals; новые файлы не исключались, правила ради успеха не отключались.

Записывающие проверки — только PGlite0.5.10 и disposable /tmp-копии текущего дерева. **localhost:3330**: настоящий Clerk TEST, native schema0000–0007, синтетические данные, доставка/analytics выключены; [сверка исходников](evidence/oauth-stand-source.json). **3327**: явно mock identity, реальные actions/Drizzle/SQL. Эта граница указана в каждом браузерном случае; она не доказывает настоящий OAuth.

Локальная конфигурация указывает на Supabase **gwuzekpkfrkmgluzblty**, БД postgres, eu-central-1; production/staging назначение **не подтверждено**. [Текущее чтение metadata/ledger](evidence/database-readonly.json) — READ ONLY transaction, без identity rows, DDL/DML или journal writes. Эффекты0004–0005 есть; старый Drizzle ledger17/17 совпадает с архивной supabase/migrations, CLI ledger пуст. Это не canonical ledger0000–0007. Новых filter_completed_at, identity_disabled_at и таблицы черновиков снаружи нет: **SQL ещё не применён**. Root dev с внешней БД для записывающих тестов не использовался.

## Изменения

**FILTER_VERSION=2** и серверная дата filter_completed_at отделяют прохождение версии от допуска и полноты анкеты. Все старые аккаунты/admin/активные сессии проходят новый фильтр явно. Старые religious ответы не предвыбраны, обычные контакты подставляются. RSC страницы защищены независимо от layout, actions читают свежую БД, private responses не кешируются. PrivateSession скрывает данные при смене identity, перегружает BFCache и обновляет права при фокусе; действует также на закрытых публичных событиях. Для старого пользователя явный /register, выход доступен.

Сохранены ровно три категории, отдельный пол и nullable stage. Advanced женщина записывает себя, не детей, включая старых; completed — себя/своих детей; combined/null не считается completed. Самоответ достаточен. Мужчина не добавляет/не записывает детей самостоятельно. Admin exception сохраняет статус отца и создаёт audit actor/reason/action/target/time; обычный пользователь и чужие ID отвергаются. Business ID, семьи, дети, snapshots, регистрации и оплаты сохраняются.

Полная анкета транзакционно сохраняется в PostgreSQL и читается CRM. Различены false, omitted, [], явная очистка; скрытие блока не удаляет семью. CRM показывает категорию/стадию/прохождение и фильтрует по ним; карточка показывает все actual поля. **[Полная таблица интерфейс → контракт → БД → CRM](FIELD_MAPPING.md)**. Email не является отдельным вопросом: это email серверной Clerk identity; владелец определяется Clerk ID, объединения по email/Gmail нет.

Анонимная отправка сохраняет полный DB draft **до Google**: HttpOnly/Lax nonce, hash в БД, непрозрачный UUID в URL без PII, TTL30мин. После проверенной сессии profile+children/history+stamp+draft claim атомарны, consumed payload очищается. Replay/две вкладки/чужой owner/rollback проверены. У уже прошедшего v2 аккаунта старый anonymous draft не перезаписывает ответы автоматически: восстановленная форма требует явной проверки/сохранения. Черновик прав не даёт. До submit автосохранения нет.

После допустимой полной анкеты цель **/dashboard/events**, независимо от старого returnTo; anon continuation несёт только draft ID через force callback Clerk. Обычный вход без новой анкеты сохраняет safe event target. Signed none сохраняет минимальный выбор и v2, показывает ресурсы, не получает событий и не повторяет фильтр при каждом входе. Анонимная none — ресурсы без лида/обязательного Google.

Исправлены локальные escalation/IDOR: один superadmin-only role allowlist, без email grant; own/staff чтение профилей/семей/истории/чатов/уведомлений, запрет spoof sender. Public article/comments/authors получают только публичные user columns. Закрытые task/kids/service/admin handlers требуют свежие права/фильтр. Bot settings защищены staff, allowlist и WHERE одной записи; несколько settings требуют явного разбора. UI не показывает ложный успех. Clerk webhook проверяет raw signature, не обнуляет ответы при sync, user.deleted мягко отключает identity с сохранением истории.

**PAYMENTS_RESTRICTED=true**: платная запись блокируется до изменения семьи/участников, webhook503 не меняет финансовое состояние, ручной paid запрещён. Бесплатная новая запись — confirmed, не paid; старые paid сохраняются и защищены от правки/удаления. Shutafim iframe оставлен для следующего этапа. Это ограниченный кандидат для согласования публикации, действующий публичный сценарий не менялся.

В браузере исправлены desktop overflow CRM (двойной учёт sidebar), доступные имена фильтров/карточки и missing default-avatar fallback (общий SVG). Тёмный логотип загружается. Public video projection не запрашивает filtering columns у alias videos_author; baseline без новых колонок и реальный внешний LIMIT0 projection прошли.


Явное сохранение восстановленной анкеты, включая none, атомарно погашает исходный draft; другая identity его не присваивает. Проверено двумя browser-review cases.

## Проверки текущего кода

| Проверка | Результат | Доказательство |
|---|---|---|
| **npm run lint** | PASS, **0errors/30warnings**, exit0 | [Полный лог](evidence/lint.log) |
| **npm run typecheck** | PASS, exit0 | [Лог](evidence/typecheck.log), текущая копия |
| **npm run build** | PASS, exit0 | [Результат](evidence/build-result.json), [лог](evidence/build.log); текущий код в /tmp без реальных env/внешней БД |
| regression.cjs | **26/26 PASS** | [Cases](evidence/regression-results.json), [лог](evidence/regression.log); actions/SQL + injected identity |
| render.cjs | **13/13 PASS** | [Cases](evidence/render-results.json), [лог](evidence/render.log); React SSR, не browser |
| http.cjs | **11/11 PASS** | [Cases](evidence/http-results.json), [лог](evidence/http.log); Next SSR/RSC, synthetic DB/identity |
| **npm run db:test** | **8/8 PASS** | [Cases](evidence/migration-results.json), [лог](evidence/migrations-final.log); native0000–0007, empty/upgrade/no-op/guards |
| production.cjs | **28/28 PASS** | [Cases+SQL hash](evidence/production-results.json), [лог](evidence/newtests.log); ручной SQL, field roundtrip/CRM/v2/admin/draft/replay/rollback, реальные Svix signatures pretty raw JSON, role/privacy/settings/payment guards |
| Actual Chromium | **33/33 PASS** (31 +2 review), main pageErrors0 | [31 cases](evidence/browser/results.json), [2 review cases](evidence/browser/review-results.json), [лог](evidence/browser.log), screenshots в evidence/browser |
| git diff --check | PASS | [Лог](evidence/diff-check.log) |

Все30 lint warnings — только **@next/next/no-img-element**, с полным перечнем путей/строк в логе: потенциальные LCP/bandwidth/размеры изображений. Это не ошибки фильтра/прав или отключённые правила. Реальные hooks/alt дефекты исправлены предыдущим этапом; сейчас устранены найденные overflow/fallback/доступные имена. Массовой замены remote/blob изображений и измерений LCP не было; performance/a11y аудит целиком этим не закрыт.

В build есть deprecation warnings images.domains/middleware. Sitemap в изолированной сборке ожидаемо сообщает ECONNREFUSED для **синтетической** недоступной127.0.0.1:1 и возвращает fallback. Это не проверка содержимого внешнего sitemap и не скрытая production DB ошибка.

## Реально пройденный браузер

**1440×1000, 390×844**, дополнительно **320×780** для публичных веток: guest home/new event branch clicks, точные тексты/скрытие элементов, тёмный логотип, три категории, отдельный пол, раскрытие/скрытие блоков,1→3→2 с сохранением ввода в вкладке, resources, advanced/completed child UI, переносы и отсутствие horizontal overflow. Локальный Chromium156.0.8078.4/Playwright1.64.1; mobile — viewport emulation, не физический телефон.

На1440/390 в **fixture с mock identity**: старая активнаяv1-сессия→/register с blank religious answers; полная анкета→реальные actions/БД→точный events/reload; мама добавляет/записывает ребёнка; отец/advanced не выбирают старых детей, advanced записывает себя; admin вручную записывает в программу, сверяются audit/статус отца; другая разрешённая сессия читает сохранённую CRM-карточку; validation/network errors сохраняют ввод, abort не завершает профиль, retry работает; logout/back/другая synthetic identity/reload не показывает прежние поля; другая вкладка сохраняет none, старый event screen при fresh request теряет доступ. Подставленная identity не засчитывается как настоящий OAuth.

**Настоящий Google OAuth: PARTIAL, возврат NOT VERIFIED.** Реальными кнопками главной/существующей ветки события/отправленной anonymous формы достигнут настоящий Google identifier screen на accounts.google.com через Clerk TEST. Отправка перед Google выдала HttpOnly attempt cookie после DB draft action. Аккаунт/пароль/код не вводились. Владелец попросил пропустить вход; окно передачи закрыто. Правильный реальный профиль, return→events/event, отсутствие дубля после настоящего login, cancel/Clerk logout/account switch не проверены. [Отдельный результат](evidence/oauth-result.json).

Последняя известная CUA-ошибка **macOS ScreenCaptureKit−3811** относится к захвату/управлению после уже выданного разрешения Chrome. Это не запрет localhost: сервер реально открыт другим разрешённым инструментом. Без перезапуска CUA захват повторно не запрашивался. Использован прямо разрешённый владельцем локальный Playwright на том же Mac, без cloud-localhost или обхода запрета системы разрешений.

## Один готовый ручной SQL

**[SUPABASE_MANUAL_MIGRATION.sql — весь файл одним блоком](SUPABASE_MANUAL_MIGRATION.sql)**, SHA256 **e2794049c0c19333d115b7de4d33cbfe05f50418b3d433adaa631ad0605f6533**. [Порядок выпуска/восстановления](RELEASE_PLAN.md). Скрипт нужен: новых полей/таблицы снаружи пока нет. Проверены семейный baseline до0004, уже0004/5, partial empty tables, repeat после новой анкеты; неправильные type/default/check (включая иное имя)/index/FK атомарно отклонены. Native empty0000–0007 проверен отдельно. Это не универсальная установка поверх произвольной неполной БД.

Подтвердить project **gwuzekpkfrkmgluzblty** как целевой и backup. В **Supabase SQL Editor → New query** вставить **весь файл** и выполнить целиком. Ожидается отсутствие ERROR и итоговый SELECT **MENORA_FILTER_V2_SCHEMA_READY / target_filter_version=2**, число сохранённых пользователей/прошедшихv2. При ошибке прислать текст, объект и project ref без секретов/PII; не запускать отдельные куски.

SQL не публикует код и не пишет фиктивный ledger. Обязательный фильтр активируется при переходе на совместимый v2-код после SQL; старые разрешающие workers нужно убрать. Rollback только совместимым v2-кодом/обслуживанием, без удаления данных/сброса отметок/старого snapshot поверх новых анкет.

## Матрица и оставшиеся условия

Исходные66 ID/формулировки сохранены: **VERIFIED59 / PARTIAL7 / FAIL0 / AMBIGUOUS0 / NOT VERIFIED0 / N/A0 =66**. Причина/следующий шаг каждого открытого пункта — [SPEC_COMPLIANCE](../implementation-2026-10-20/SPEC_COMPLIANCE.md). Открыты **MC-017/052/053/054/062/065/066**. Нулевая колонка NOT VERIFIED не означает выполненный Google return: соответствующие строки PARTIAL из-за выполненных частей и явно непроверенного остатка.

**DATA-01 PARTIAL:** все поля/DB/CRM/roundtrip подтверждены локально, настоящий Google login→logout/login→CRM ещё нет. **REONBOARD-01 VERIFIED в изолированной среде:** fixed2/server stamp, old/admin gated, none complete, SQL repeat no-reset. **REDIRECT-01 PARTIAL:** signed точный events подтверждён, настоящий anonymous Google callback ещё нет. [Только непроверенные ручные сценарии](MANUAL_CHECKLIST.md).

Общая production readiness отдельно **не подтверждена**:

- **A01/R01:** .env/.env.local сняты только с Git index; физические файлы сохранены/игнорируются, есть безопасный .env.example. История/копии содержат прежние credentials. Ротация/отзыв/переключение не выполнялись; удаление из индекса не отзывает секрет.
- **A02/A03/A04/A07:** локальные escalation/IDOR/private profile/chat/sender дефекты исправлены, direct negative/positive tests приложены. Это доказательства кандидата, а не опубликованной версии и не закрытие всего R02/R03/R15. Bot settings A05 защищены/проверены локально; аудит админдействий и доставка шире этих проверок.
- **A08/A09:** unverified paid запрещены в ограниченном кандидате. Полный Shutafim/order reconciliation/проверенный webhook — следующий этап. Прежние paid с провайдером не сверялись/не сбрасывались; порядок сверки без массовых изменений в RELEASE_PLAN.
- **A13/R07:** local native schema соответствует ORM, ручной SQL готов. Внешний project/backup, owner-run применение, дальнейшее согласование foreign ledger, два отсутствующих внешних news FK и timestamp drift не объявлены закрытыми.
- Остальные прежние **A06/A12/A14/A15/A18/A20/A21/A22/A23/A24** не закрываются этим отчётом: public content/upload/HTML sanitization, внешние WhatsApp/Telegram endpoints, service concurrency, cron/retries, полный UX/accessibility/performance/observability, security dependency update и внешняя конфигурация требуют своих доказательств. Часть event/profile transaction/history A15–A17 и raw Clerk/retention A19 проверена локально; это не закрывает все интеграции.
- Production smoke/load/security этой версии не выполнялись. Privileged PostgreSQL используется под серверными Clerk checks; public client policies/Storage этим этапом не переаудированы. Anonymous drafts ограничены строгим payload/TTL/nonce, но distributed rate limiting и фоновая очистка не реализованы: истечение проверяется, cleanup выполняется при новой отправке. Новая религиозная модерация/обязательные документы не вводились.

Публичный сайт не обновлён. После ручного SQL потребуется отдельное разрешение на выпуск совместимого приложения и ограниченного платёжного режима. Сам SQL этого не делает.

Документация: [Clerk redirect URLs](https://clerk.com/docs/guides/development/customize-redirect-urls) использована для сверки force/fallback: force имеет приоритет над прежним redirect_url; fallback такого приоритета не даёт. Проверены все локальные sign-in/sign-up/SSO/auth-complete пути. [Supabase migrations](https://supabase.com/docs/guides/deployment/database-migrations) — справочник истории; конкретный owner-run SQL Editor порядок выбран владельцем и не выдаётся за автоматическое согласование журналов.
