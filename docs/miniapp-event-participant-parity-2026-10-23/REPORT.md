# Telegram Mini App — website participant parity и общий performance checkpoint

Дата: **23 октября 2026**. Выполнены регистрация из дополнения и сохранённый performance pass одним общим локальным checkpoint. Реальные оплаты/Telegram sends, push и deployment не выполнялись.

## WEBSITE PARITY / PARTICIPANT MODEL

Mini App использует прежний `prepareEventRegistration()` через `calculateEvent()` и `checkoutEvent()`. Второго калькулятора нет. Website component/actions, canonical pricing/child policy, schema и payment confirmation/return не переписаны. Участники: self всегда true; saved spouse по выбору; только свои saved child IDs при `canRegisterChildren`; extra adults0..20; `extraKids=0` всегда. Max гостей сервер берёт из существующей `registrationInput.shape.extraAdults`, клиент — из detail DTO. Strict input не принимает actor/parent IDs, prices/amount/total, payment URL, family map или extra kids. Duplicate children отвергаются до calculation.

Detail дополнен только `firstName`, `spouseName` и canonical adult maximum; child DTO остаётся id/name, цены — event price/childPrice. Прежние `canRegisterChildren` и `needsGiyurClarification` сохранены. Email, phone, role, birth dates и полный profile в detail не добавлены. Current canonical session user и ownership всегда проверяются сервером; client flags не дают права на детей.

## CALCULATOR / SERVER QUOTE

По «Записаться» раскрывается «Кто идёт?»; просмотр detail не отправляет quote. Self checkbox имеет имя и disabled/checked, spouse показывается только при saved name. Дети и новые Plus/Minus controls используют существующий navy/gold design, keyboard labels и44px targets. Отдельного extra kids counter нет.

После selection change — только один POST quote после200ms debounce. AbortController и request sequence/key исключают stale repaint, в том числе при закрытии формы. StrictMode/быстрые taps coalesce; повторный render не перезапрашивает profile или detail. При смене selection прежняя сумма сразу скрывается. UI показывает adults/children × unit prices и grand amount из server `breakdown`; локальной формулы total/subtotals нет. Retry quote сохраняет selection и делает только quote. Для amount0 — «Бесплатно»/«Записаться», для paid — «Перейти к оплате».

## SHUTAFIM AMOUNT FLOW / PENDING PROTECTION

Selection → server quote → register selection only → fresh `checkoutEvent()` → повторный canonical расчёт текущих участников/цен → сохранённые registration/attempt `amountAgorot` → прежний `shutafimUrl()`. Query price=amountAgorot/100, quantity=1, cur=ILS, payments=1, lang=ru, custom1=registrationId. Клиентская сумма не принимается. После paid register остаётся pending receipt с серверной суммой и «Оплатить участие»; URL берётся только из server registration/attempt. Free confirms без attempt/URL.

Существующий pending selectionHash/amount не меняется. Для валидного pending attempt с другим составом добавлен только тип `EventSelectionConflictError`; прежнее website message/поведение сохранены. Mini App получает409 `pending_selection_conflict`, показывает точное RU recovery message из задания и существующий WhatsApp contact. При повторе прежнего состава возвращается тот же immutable attempt, включая прежний amount после изменения event price. При новом checkout цена пересчитывается заново; это отдельно проверено.

## TEST COUNT

**36 актуальных групп, 923/923 проверки в итоговых прогонах.** Повторные/ошибочные запуски не прибавлены; shared cases в PGlite и native PostgreSQL считаются отдельными исполнениями и перечислены раздельно. Добавлены27 server parity cases в обоих SQL engines и11 browser cases. [Полный машинный manifest](evidence/checks.json), [PGlite153](evidence/server.json), [native154](evidence/native.json), [browser11](evidence/browser.json).

Для всех строк ниже source command — `node tests/community/<имя>.cjs`:

| Suite | Проверки | Результат |
|---|---:|---|
| `regression` | 36/36 | PASS |
| `render` | 21/21 | PASS |
| `migrations` | 8/8 | PASS |
| `production` | 28/28 | PASS |
| `sso-callback` | 10/10 | PASS |
| `identity-schema` | 23/23 | PASS |
| `miniapp-auth` | 87/87 | PASS |
| `miniapp-ui-server` | 57/57 | PASS |
| `miniapp-ui-bridge` | 8/8 | PASS |
| `miniapp-cache` | 6/6 | PASS |
| `miniapp-query-plans` | 2/2 | PASS |
| `event-share` | 3/3 | PASS |
| `telegram-migrations` | 10/10 | PASS |
| `telegram-tools` | 5/5 | PASS |
| `spec-update` | 17/17 | PASS |
| `telegram-release` | 153/153 | PASS |
| `telegram-native` | 154/154 | PASS |
| `adoption-native` | 28/28 | PASS |
| `telegram-release-browser` | 32/32 | PASS |
| `miniapp-payment-ux-browser` | 15/15 | PASS |
| `miniapp-performance-browser` | 14/14 | PASS |
| `miniapp-ui-browser` | 39/39 | PASS |
| `miniapp-polish-browser` | 14/14 | PASS |
| `miniapp-image-share-browser` | 21/21 | PASS |
| `miniapp-russian-ux-browser` | 10/10 | PASS |
| `miniapp-onboarding-browser` | 4/4 | PASS |
| `miniapp-kids-browser` | 21/21 | PASS |
| `miniapp-kids-entry-browser` | 16/16 | PASS |
| `miniapp-bottom-nav-browser` | 15/15 | PASS |
| `miniapp-images-browser` | 4/4 | PASS |
| `callback-browser` | 10/10 | PASS |
| `spec-browser` | 32/32 | PASS |
| `miniapp-participant-parity-browser` | 11/11 | PASS |
| `miniapp-ui-production` | 2/2 | PASS |
| `telegram-bundle` | 1/1 | PASS |
| `miniapp-performance-bundle` | 6/6 | PASS |

В browser runs использован private runner, меняющий только loopback3342/3343 на3352/3353 и временные fixture/build paths; assertions выполнялись из текущих source files. Фактические wrapper commands и adjustment записаны в manifest. Запуск стандартными командами на свободных3342/3343 описан в `tests/community/README.md`; новая browser parity suite также поддерживает `MINIAPP_BROWSER_BASE`.

### Покрытие24 требований

| № из дополнения | Проверка / evidence |
|---|---|
| 1–4 | self / spouse /2 guests /spouse+2 guests: quote1/2/3/4 adults, canonical website preparation, checkout и website action |
| 5–6 | selected1/2 own children: child price, snapshot и каждый child один раз |
| 7–8 | duplicate ID400; существующий ID другого canonical profile409 в quote/register |
| 9–10 | male и giyur unknown/advanced не регистрируют детей; completed female может; прежний policy без изменений |
| 11 | spouse без saved spouseName409 из canonical preparation; UI не рисует fake spouse |
| 12–14 | client total/adultPrice/childPrice отвергаются strict schema; website clientAmount игнорируется |
| 15–16 | quote=checkout=registration/attempt amount при неизменённой цене/selection; price change до нового checkout пересчитывается |
| 17–20 | price/quantity/cur/custom1, также payments/lang проверены в SQL и actual browser handoff |
| 21 | полный composition на free event:0, confirmed, no attempt/URL |
| 22 | spouse/children/guests меняют hash →409 без изменения сохранённого amount/URL; прежний selection resumes |
| 23–24 | canonical website action,36 action regressions,32 website spec browser,32 release browser,15 payment UX и11 новых Mini App browser checks |

## LINT / TYPECHECK / BUILD

- `npm run typecheck`: **exit0**, strict TypeScript, installed/lock versions сверены; новых зависимостей нет.
- `npm run lint`: **exit0**,0 errors/30 existing `no-img-element` warnings.
- `npm run build`: **exit0**,42/42 static pages. Выполнен через существующий `tests/community/build.cjs` с отдельным target и scrubbed synthetic env, без проектных `.env` и реальных credentials. [Build result](evidence/build-result.json), [log](evidence/build.log).
- Все293 product code/config source files в app/components/actions/lib/messages побайтово совпали с build copy; [safety proof](evidence/source-safety.json). Browser production server также запускался с whitelist env и недоступной synthetic DB127.0.0.1:1.

Build sitemap query получает ожидаемый ECONNREFUSED из намеренно недоступной synthetic DB и использует fallback; availability production data этим не проверялась. Middleware/images.domains и webpack cache warnings неблокирующие. Runtime DB/payment confirmation rules не изменены.

### Исправления тестового стенда и отдельная архивная диагностика

Новый foreign-child test первоначально ошибочно трактовал stored parentId metadata как ownership: canonical `profileChildren` нормализует parent по владельцу saved profile. Тест исправлен на существующего ребёнка другого профиля; business policy не менялась. Legacy UI checks переведены с ручной «Рассчитать» на signup CTA + automatic quote. Giyur race test также открывает selector перед clarification. Селектор application alert уточнён против Next route announcer; selector Kids status trigger и ожидание закрытия animated menu уточнены без удаления assertions. Один промежуточный Kids run остановлен из-за unbounded `Response.finished()`; итоговый тест ждёт response и закрытие menu с bounded Playwright wait. Один bundle checker перезапущен с общей output directory для входного `bundle.json`.

Дополнительно по ошибке запущен архивный `targeted-browser.cjs`; он **FAIL / NOT APPLICABLE**, а не PASS: существующий README прямо относит его к superseded form layouts, его ожидания старой city/giyur формы и redirect устарели. Archive baseline отдельно не перезапускался. Этот неподдерживаемый diagnostic не включён в36 актуальных групп; его тест не изменялся, случайно перезаписанный artifact восстановлен из HEAD. Актуальная замена `spec-browser` прошла32/32. Все эти промежуточные результаты сохранены в `/tmp/menora-event-parity-evidence-20261023`, не скрыты прибавлением к PASS count.

## PERFORMANCE В ТОМ ЖЕ CHECKPOINT

[Performance report](../miniapp-performance-2026-10-22/REPORT.md) и текущие local proofs сохранены. Initial production JS **517336 bytes** против baseline534836 (−17500); estimated gzip161755 против165643. Events/selector, Kids/profile/resources остаются deferred; startup/request/cache/account-switch checks14/14. Quote changes не создают profile→event→quote waterfall. Синтетический image optimizer и actual SQL counts проверены отдельно; это не обещание production latency/реального WebView.

## SCOPE / MIGRATIONS / GIT

Schema, applied migrations, package/lock, canonical registration validation/policy/children, website component/actions, confirmation и return behavior сохранены. Миграция и перенос данных не нужны; финансовые записи production не затрагивались. Ошибка выбора pending получает новый transport code при той же canonical защите. Rollback source возможен обычным revert общего checkpoint; DB rollback для этого изменения не требуется.

Ветка результата: `fix/miniapp-event-participant-parity-20261023`.
Worktree: `/Users/aaronshalev/Desktop/Artcodesh WebStudio/Menorah Center - Rishon Lezion/menora_miniapp_event_parity_20261023`.
Base: `b2ebdb37970df29eb6a5614fe0e766b889c81baf`. Во время работы исходный performance pass был отдельно закоммичен в `c5fd4026471e524c9c6677aa4888447253698553`; этот внешний commit и исходная ветка сохранены, их история не переписывалась. Из него сохранены актуальные evidence и доработанный Kids test. В ветке результата подготовлен один общий commit от base со всеми performance и parity changes, как отдельно подтвердил владелец. Полный новый SHA — в финальном ответе и `git log -1 --format=%H`; сам этот отчёт входит в commit.

[Полный список изменённых файлов](evidence/changed-files.json). Core parity: `lib/telegram/miniapp-events.ts`, `lib/community/event-checkout.ts`, `components/miniapp/event-registration-form.tsx`, `components/miniapp/events.tsx`, scoped Mini App CSS, два новых parity test files, адаптированные существующие browser helpers/cohorts и docs. Inherited performance pass сохранён в общем diff.

Проверено в локальном Chromium320/390/1280, production build, PGlite и native PostgreSQL18. Реальные Telegram WebView/Google OAuth, внешняя оплата/подтверждение и production deployment **NOT RUN**. Local native clusters и собственные HTTP servers3352/3353 остановлены; исходные3342/3343 не менялись. Исходная main остаётся чистой наc5fd4026471e524c9c6677aa4888447253698553. Secrets, cookies и storage states не входят в artifacts/commit. Финальный worktree status проверяется после единственного local commit; push/deploy запрещены и не выполнялись.
