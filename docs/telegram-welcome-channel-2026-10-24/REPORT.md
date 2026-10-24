# Telegram welcome channel — 24 October 2026

Base: `ec0029768ea22b710fd6dd8db40e0541c9f3d9da`.
Branch: `feat/payment-intent-crm-20261023`.

The welcome keyboard adds one ordinary Telegram URL button,
`📣 Telegram-канал Menorah Center` → `https://t.me/menorah_rishon`,
after Kids and before the existing WhatsApp contact. The generic order is Open,
Events, Kids, Channel, Contact. Event-aware `/start` retains the event/campaign
Mini App CTA first and the channel secondary. All displayed copy remains Russian.
No bot configuration, subscription, consent, identity, payment or migration code changes.

Five new shared regressions verify exact generic order/locales, the URL-only
button shape, the actual event webhook response and primary CTA, the actual generic
webhook response and all three Mini App destinations, and the unchanged WhatsApp
phone/prefilled RU text. Existing tests now locate the contact as the final row;
their contact assertions remain. Bot API calls use the existing strict stub only.

Validation:216/216 PGlite release checks and218/218 independent native PostgreSQL
checks PASS; five new cases execute on each engine. `npm run lint` PASS with30
existing image warnings; `npm run typecheck` PASS; actual `npm run build` PASS in a
current isolated copy with synthetic env and an unavailable loopback DB. No real
payment/message, production change, push, deployment or configuration change was
performed by this welcome patch. The earlier authorized production Payment Intent
migration is documented separately in the private rollout report outside Git.

[Exact checks and proof hashes](checks.json). One new local commit is made above
the feature base; its final SHA and clean worktree status are reported on delivery.
