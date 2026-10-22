# Truthful adoption — release verification, 22.10.2026

Исходный RC: `7bb5ce3b9bec0312661e3116697077eebc6cb0b2`, ветка `feat/miniapp-auth-v1`. Этот локальный commit дополняет migration tooling и release artifacts; бизнес-код приложения сохранён. Итоговый commit SHA проверяется через `git rev-parse HEAD`.

## Подтверждённое владельцем production состояние

READ ONLY diagnostic: PostgreSQL17.6,17/17 точных hashes + journal timestamps + ordinal для `supabase/migrations/0000–0016`, unknown/ambiguous/duplicates0. Registrations43, orphan users/events0, fingerprint `f599ce780eed5cf293d9838316eb9f54`. Legacy Telegram conflicts0; ожидаемый backfill111 профилей; release tables отсутствуют. Эти сведения предоставил владелец; агент production не подключал и не изменял.

## Механизм

Настоящая custom migration `0013_adopt_legacy_production_baseline` создана штатным Drizzle Kit0.31.10: `npm run db:generate -- --custom --name=adopt_legacy_production_baseline`. Journal when: `1792667918001`; SHA256: `10192f05e7746ee3a4b31c5c2cf426f1b0ea325300ede6ccc1f6db6c768e0d9e`. SQL marker выполняет проверки core/release schema, RLS/grants и identity integrity без изменения business rows. Fresh native migrator действительно исполняет0000–0012, затем marker, и записывает обычный canonical ledger. Owner MANUAL_SQL сначала доказывает exact legacy17 и совместимость baseline, выполняет additive0009–0012/backfill, проверяет результат и сохранность бизнес-данных, затем добавляет ровно одну реальную marker-запись. Старые17 rows остаются неизменными. В production не подставляются hashes canonical0000–0012.

Drizzle0.45.1 читает последний ledger record по created_at DESC и исполняет только миграции с большим folderMillis. Marker позднее0012; общий следующий migration suffix выполняется одинаково после fresh14 или legacy17+marker. Guard читает rows по id (реальный порядок вставки), проверяет точные tuple/position, pinned source hashes и строго возрастающие timestamps. Canonical prefixes допускаются для настоящего fresh upgrade; неполная legacy history и legacy без marker ordinary runner не допускаются. Сохранено прежнее точное, документированное исключение canonical0004v1 (только statement boundaries); fuzzy matching отсутствует.

Runner использует один reserved backend и общий с MANUAL_SQL advisory lock. Зарезервированный postgres-js client получает ограниченный begin adapter; native tests выполняют именно неизменённый project runner в disposable copy. Owner SQL имеет5s lock_timeout, ledger/core table locks, одну транзакцию и checks до marker. Исключение откатывает schema/backfill/marker целиком. Snapshot-preservation проверяет user count/все profile fields кроме разрешённой нормализации exact fake email, нормализованные emails, registrations count/full-row fingerprint, events, children applications и drafts. Children/family/filter v2 входят в profile fingerprint. Повтор после modeled merge использует существующего identity owner и не перепривязывает его к stale legacy profile.

`scripts/adoption-baseline.json` — frozen schema/history contract. `node scripts/build-adoption-artifacts.cjs` локально воспроизводит marker и все три самодостаточных SQL. Исторические SQL0000–0012 не менялись этим commit. Новая синтетическая future migration существует только в удаляемой test copy; в release journal её нет.

## Результаты

[Полный текущий набор](evidence/adoption/checks.json): **560/560 PASS**,22 группы: все532 прежних +28 новых native adoption checks. Полные migrations suites: canonical8, identity23, PostgreSQL17/18 compatibility10 и adoption-native28. Все результаты созданы заново для текущей рабочей копии. Целевые проверки повторены после финальной генерации SQL.

[Native evidence](evidence/adoption/adoption-native-results.json): disposable **native PostgreSQL18.4**, отдельные соединения с различными backend PIDs, fresh + historical scenarios, concurrent owner adoption, common future once, повтор no-op, сохранение111 synthetic Telegram profiles и43 registrations. Дополнительно PostgreSQL17.5/18 на PGlite проверяет SQL/catalog compatibility. Native17.6 не запускался; его production schema остаётся owner-run PRECHECK gate.

Negative coverage: changed legacy hash, timestamp, order,16-row prefix,18 unknown rows, duplicate, legacy-no-marker runner, wrong marker hash и fake canonical append проверены guard и реальным CLI на native DB. Owner SQL отвергает все испорченные histories; exact17 без marker является его разрешённым исходным состоянием. Incompatible core schema abort проверяет отсутствие marker/release tables и сохранность данных. Legacy POSTCHECK на синтетическом fingerprint корректно выдаёт BLOCKER относительно production anchor. Только в памяти локального теста anchor заменяется synthetic fingerprint для проверки PASS branch; релизный POSTCHECK сохраняет43/production fingerprint неизменными.

`npm run typecheck`: exit0. `npm run lint`: exit0,0 errors/30 прежних no-img warnings. `npm run build`: exit0 в текущей копии без реальных env, synthetic недоступная БД127.0.0.1:1. Browser cohorts39+32 Mini App/CRM,11 HTTP,10 callback,32 website spec,2 production,1 JS boundary прошли на localhost; mocked identities/SDK, внешние запросы заблокированы. Это не настоящий Telegram/Google acceptance. App initial JS прежний:12 files,483413 raw/150701 estimated gzip bytes.

## Owner artifacts

| SQL | SHA256 |
|---|---|
| [PRECHECK.sql](../miniapp-identity-v1/PRECHECK.sql) | `d99ed53bf4de6e624fd1a6e4634d6ffbe68b0f840b6e2ba37a94a5c4a1376873` |
| [MANUAL_SQL.sql](../miniapp-identity-v1/MANUAL_SQL.sql) | `609118b59232a41afae57358d9dc79c6d9ffdb231fea0299973199a632fa2183` |
| [POSTCHECK.sql](../miniapp-identity-v1/POSTCHECK.sql) | `6be1fb5cd6da4d41106cefeb316bfeb1290a17ced7487cfc4d0454010b807330` |

PRECHECK/POSTCHECK содержат только SELECT/metadata в READ ONLY transaction. Нет DO/EXECUTE, user IDs, profile values или token/session hashes в результатах. Registration baseline — явный JSON object с count, orphans и fingerprint. PRECHECK распознаёт legacy-ready, legacy-adopted, canonical-adopted; unknown/incompatible → BLOCKER. Core validation строже прежней aggregate diagnosis, поэтому требуется именно актуальный PRECHECK этого commit. POSTCHECK требует release tables/indexes, backend RLS/grants, ownership integrity, old17+one exact marker, registration43/fingerprint/orphans0. Отдельный boolean показывает совпадение production registration anchor. Старые artifacts после неизвестных future migrations не применяются; guard ordinary runner уже поддерживает общий exact future suffix.

## Следующий порядок

Владелец: backup/recovery point → текущий PRECHECK (SAFE TO ADOPT) → reviewed MANUAL_SQL+adoption → POSTCHECK (PASS) → push/deploy → Telegram config → acceptance. При drift остановиться и обновить evidence; не править ledger/данные предположением. Ротация секретов, production env, реальный Telegram launch/config/delivery, Google LIVE/branding и payment confirmation не объявлены закрытыми этим изменением; прежние границы RELEASE.md сохраняются.

**Production DB не изменялась; production MANUAL_SQL не запускался; push/deploy, Telegram configuration, сообщения и платежи не выполнялись.**
