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
  let connection;
  try {
    connection = await client.reserve();
    connection.options = client.options;
    // Reserved postgres-js clients omit begin(); keep guard + native migrator on
    // the same physical backend and retain the advisory lock across transactions.
    connection.begin = async (options, fn) => {
      if (typeof options === 'function') { fn = options; options = ''; }
      if (!['', 'read only'].includes(options)) throw new Error('Unsupported migration transaction mode');
      await connection.unsafe('BEGIN ' + options);
      try { const result = await fn(connection); await connection.unsafe('COMMIT'); return result; }
      catch (error) { await connection.unsafe('ROLLBACK'); throw error; }
    };
    await connection.unsafe("SET lock_timeout='5s'");
    await connection`select pg_advisory_lock(7811397441042026::bigint)`;
    await connection.begin('read only', async tx => {
      const [{ ledger }] = await tx`select to_regclass('drizzle.__drizzle_migrations')::text as ledger`;
      const rows = ledger ? await tx`select hash, created_at from drizzle.__drizzle_migrations order by id` : [];
      const [{ count }] = await tx`select count(*)::int as count from pg_tables where schemaname='public'`;
      validateHistory(rows, migrations, count);
    });
    await migrate(drizzle(connection), { migrationsFolder });
    console.log('Verified Drizzle migrations complete.');
  } finally {
    try {
      if (connection) {
        try { await connection`select pg_advisory_unlock(7811397441042026::bigint)`; }
        finally { connection.release(); }
      }
    } finally {
      await client.end({ timeout: 2 });
    }
  }
}

main().catch(error => {
  // Do not print driver objects, SQL parameters, connection strings or user data.
  const known = /^(Explicit DATABASE_URL|Existing public schema|Migration history)/.test(error.message);
  console.error(known ? error.message : 'Migration failed. Inspect privately; credentials and SQL parameters omitted.');
  process.exitCode = 1;
});
