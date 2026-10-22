const { readMigrationFiles } = require('drizzle-orm/migrator');
const baseline = require('./adoption-baseline.json');

// 0004 v1 was applied manually in the inspected environment. Only statement
// boundaries changed in v2; keep already registered v1 histories compatible.
const equivalent0004 = '34124c4a9c89a348323b834556d45e41c7d2d2f1364c1e96e9f9a27b99f3a7bb';

function validateHistory(rows, migrations, publicTableCount) {
  if (!rows.length && publicTableCount) {
    throw new Error('Existing public schema has no canonical ledger. Reconcile a verified clone before adoption.');
  }
  const fail = () => { throw new Error('Migration history mismatch. No migrations applied; reconcile a verified clone.'); };
  const matches = (row, expected, equivalent = false) => row && expected &&
    String(row.created_at) === String(expected.created_at ?? expected.folderMillis) &&
    (row.hash === expected.hash || (equivalent && row.hash === equivalent0004));
  // Pin the adopted release, not merely whichever legacy files happen to be on disk.
  for (let i = 0; i < Math.min(migrations.length, baseline.canonical.length); i++)
    if (!matches({ hash: migrations[i].hash, created_at: migrations[i].folderMillis }, baseline.canonical[i])) fail();
  const markerIndex = baseline.canonical.length;
  if (migrations.length > markerIndex && !matches(
    { hash: migrations[markerIndex].hash, created_at: migrations[markerIndex].folderMillis },
    { hash: baseline.marker.hash, created_at: baseline.marker.when })) fail();
  for (let i = 1; i < migrations.length; i++)
    if (migrations[i].folderMillis <= migrations[i - 1].folderMillis) fail();
  const legacy = matches(rows[0], baseline.legacy[0]);
  if (legacy) {
    if (rows.length < baseline.legacy.length + 1 || migrations.length <= markerIndex) fail();
    for (let i = 0; i < baseline.legacy.length; i++) if (!matches(rows[i], baseline.legacy[i])) fail();
    // Exactly one real marker, followed exclusively by the common future suffix.
    const suffix = rows.slice(baseline.legacy.length);
    const expected = migrations.slice(markerIndex);
    if (suffix.length > expected.length) fail();
    for (let i = 0; i < suffix.length; i++) if (!matches(suffix[i], expected[i])) fail();
    return 'adopted-legacy';
  }
  if (rows.length > migrations.length) fail();
  for (let i = 0; i < rows.length; i++) if (!matches(rows[i], migrations[i], i === 4)) fail();
  return 'canonical';
}

module.exports = { validateHistory, readMigrationFiles };
