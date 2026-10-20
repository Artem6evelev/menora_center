const { readMigrationFiles } = require('drizzle-orm/migrator');

// 0004 v1 was applied manually in the inspected environment. Only statement
// boundaries changed in v2; keep already registered v1 histories compatible.
const equivalent0004 = '34124c4a9c89a348323b834556d45e41c7d2d2f1364c1e96e9f9a27b99f3a7bb';

function validateHistory(rows, migrations, publicTableCount) {
  if (!rows.length && publicTableCount) {
    throw new Error('Existing public schema has no canonical ledger. Reconcile a verified clone before adoption.');
  }
  if (rows.length > migrations.length) throw new Error('Migration history belongs to another chain.');
  for (let i = 0; i < rows.length; i++) {
    const expected = migrations[i];
    const equivalent = i === 4 && rows[i].hash === equivalent0004;
    if (Number(rows[i].created_at) !== expected.folderMillis || (rows[i].hash !== expected.hash && !equivalent)) {
      throw new Error(`Migration history mismatch at position ${i}. No migrations applied; reconcile a verified clone.`);
    }
  }
}

module.exports = { validateHistory, readMigrationFiles };
