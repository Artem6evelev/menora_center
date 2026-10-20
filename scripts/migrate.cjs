// Explicit environment only: never load the repository's .env/.env.local here.
const path = require('node:path');
const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const { validateHistory, readMigrationFiles } = require('./migration-history.cjs');

async function main() {
  if (process.argv.includes('--help')) {
    console.log('npm run db:migrate — requires explicit DATABASE_URL; validates the canonical drizzle/ ledger before any DDL. No automatic adoption/backfill.');
    return;
  }
  if (!process.env.DATABASE_URL) throw new Error('Explicit DATABASE_URL required. No env files loaded.');
  const migrationsFolder = path.resolve(__dirname, '../drizzle');
  const migrations = readMigrationFiles({ migrationsFolder });
  const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 5 });
  try {
    await client.begin('read only', async tx => {
      const [{ ledger }] = await tx`select to_regclass('drizzle.__drizzle_migrations')::text as ledger`;
      const rows = ledger ? await tx`select hash, created_at from drizzle.__drizzle_migrations order by created_at, id` : [];
      const [{ count }] = await tx`select count(*)::int as count from pg_tables where schemaname='public'`;
      validateHistory(rows, migrations, count);
    });
    await migrate(drizzle(client), { migrationsFolder });
    console.log('Canonical Drizzle migrations complete.');
  } finally {
    await client.end({ timeout: 2 });
  }
}

main().catch(error => {
  // Do not print driver objects, SQL parameters, connection strings or user data.
  const known = /^(Explicit DATABASE_URL|Existing public schema|Migration history)/.test(error.message);
  console.error(known ? error.message : 'Migration failed. Inspect privately; credentials and SQL parameters omitted.');
  process.exitCode = 1;
});
