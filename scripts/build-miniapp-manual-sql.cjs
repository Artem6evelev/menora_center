/* Deterministic release artifact. Does not connect to any database. */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
function buildMiniappManualSql() {
  const identity = fs.readFileSync(
    path.join(root, "drizzle/0009_miniapp_identity_v1.sql"),
    "utf8",
  );
  const sessions = fs.readFileSync(
    path.join(root, "drizzle/0010_telegram_miniapp_sessions.sql"),
    "utf8",
  );
  const release = fs.readFileSync(
    path.join(root, "drizzle/0011_telegram_release_candidate.sql"),
    "utf8",
  );
  const indexes = fs.readFileSync(path.join(root, "drizzle/0012_telegram_query_indexes.sql"), "utf8");
  const marker = "  IF actual IS DISTINCT FROM expected->table_name THEN";
  if (identity.split(marker).length !== 2)
    throw new Error("Identity schema validation marker changed");
  // Historical DDL is preserved (0009/0010 catalog-only PostgreSQL portability fix documented in RELEASE).
  // Only the unified manual COPY accepts the
  // one additive 0010 index on rerun. 0010 validates its exact definition below.
  const compatible = identity.replace(
    marker,
    `  IF table_name='user_identities' THEN
   actual := jsonb_set(actual,'{indexes}',(SELECT coalesce(jsonb_agg(item ORDER BY item->>'name'),'[]'::jsonb)
    FROM jsonb_array_elements(actual->'indexes') item WHERE item->>'name'<>'user_identities_id_user_id_idx'));
  END IF;
${marker}`,
  );
  return (
    "-- Unified Identity + Mini App + Telegram release candidate. Review READ ONLY PRECHECK before owner execution.\n" +
    "-- Transactional, repeatable artifact; native migration DDL is preserved; catalog-only compatibility correction is documented.\nBEGIN;\n" +
    compatible +
    "\n--> statement-breakpoint\n" +
    sessions +
    "\n--> statement-breakpoint\n" +
    release +
    "\n--> statement-breakpoint\n" + indexes +
    "COMMIT;\n"
  );
}
module.exports = { buildMiniappManualSql };
if (require.main === module)
  fs.writeFileSync(
    path.join(root, "docs/miniapp-identity-v1/MANUAL_SQL.sql"),
    buildMiniappManualSql(),
  );
