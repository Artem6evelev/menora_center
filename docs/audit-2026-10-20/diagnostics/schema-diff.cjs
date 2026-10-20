/* Read-only comparison of current Drizzle declarations against both journals.
 * Instantiates table definitions only. No DB import, env loading or network.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { getTableConfig } = require('drizzle-orm/pg-core');
const { isTable } = require('drizzle-orm');
const repo = path.resolve(__dirname, '../../..');
const schema = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(repo, 'lib/db/schema.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: schema, require });
const results = [];
for (const file of ['drizzle/meta/0003_snapshot.json', 'supabase/migrations/meta/0016_snapshot.json']) {
  const snapshot = JSON.parse(fs.readFileSync(path.join(repo, file), 'utf8'));
  const missingTables = [];
  const missingColumns = {};
  const missingIndexes = {};
  for (const value of Object.values(schema)) {
    if (!isTable(value)) continue;
    const table = getTableConfig(value);
    const previous = snapshot.tables[`public.${table.name}`];
    if (!previous) { missingTables.push(table.name); continue; }
    const columns = table.columns.filter(col => !previous.columns[col.name]).map(col => col.name);
    if (columns.length) missingColumns[table.name] = columns;
    const indexes = table.indexes.filter(index => !previous.indexes[index.config.name]).map(index => index.config.name);
    if (indexes.length) missingIndexes[table.name] = indexes;
  }
  results.push({ snapshot: file, tables: Object.keys(snapshot.tables).length, missingTables, missingColumns, missingIndexes, rlsEnabledInSnapshot: Object.values(snapshot.tables).filter(table => table.isRLSEnabled).length });
}
const liveFile = path.join(repo, 'docs/audit-2026-10-20/evidence/db-readonly.json');
let observedDatabase;
if (fs.existsSync(liveFile)) {
  const live = JSON.parse(fs.readFileSync(liveFile, 'utf8'));
  const missingTables = [], missingColumns = [], extraColumns = [], typeMismatches = [], nullabilityMismatches = [], missingForeignKeys = [], missingIndexes = [];
  for (const value of Object.values(schema)) {
    if (!isTable(value)) continue;
    const table = getTableConfig(value);
    const columns = live.columns.filter(column => column.table_name === table.name);
    if (!columns.length) { missingTables.push(table.name); continue; }
    for (const column of table.columns) {
      const actual = columns.find(item => item.column_name === column.name);
      if (!actual) { missingColumns.push(`${table.name}.${column.name}`); continue; }
      let expectedType = column.getSQLType();
      if (expectedType === 'timestamp') expectedType = 'timestamp without time zone';
      if (/^varchar/.test(expectedType)) expectedType = 'character varying';
      if (expectedType !== actual.data_type) typeMismatches.push({ column: `${table.name}.${column.name}`, expected: expectedType, observed: actual.data_type });
      if (column.notNull !== (actual.is_nullable === 'NO')) nullabilityMismatches.push(`${table.name}.${column.name}`);
    }
    for (const column of columns) if (!table.columns.some(item => item.name === column.column_name)) extraColumns.push(`${table.name}.${column.column_name}`);
    for (const key of table.foreignKeys) {
      const reference = key.reference();
      const foreignTable = getTableConfig(reference.foreignTable).name;
      const wanted = `FOREIGN KEY (${reference.columns.map(item => item.name).join(', ')}) REFERENCES ${foreignTable}(${reference.foreignColumns.map(item => item.name).join(', ')})`;
      if (!live.constraints.some(item => item.table_name === table.name && item.type === 'f' && item.definition.startsWith(wanted))) missingForeignKeys.push(`${table.name}: ${wanted}`);
    }
    for (const index of table.indexes) if (!live.indexes.some(item => item.tablename === table.name && item.indexname === index.config.name)) missingIndexes.push(`${table.name}.${index.config.name}`);
  }
  observedDatabase = { source: 'evidence/db-readonly.json (read by parent agent in read-only transaction)', environment: live.environment, missingTables, missingColumns, extraColumns, typeMismatches, nullabilityMismatches, missingForeignKeys, missingIndexes, rlsEnabledTables: live.tables.filter(table => table.rls).length, publicPolicies: live.policies.length, limitation: 'Column lengths/default expression equivalence and FK delete action equivalence are separately inspected; connected DB is not proven to be production.' };
}
console.log(JSON.stringify({ limitation: 'Snapshots describe repository migration histories, not actual deployment. Observed DB metadata is compared separately when evidence is present.', results, observedDatabase }, null, 2));
