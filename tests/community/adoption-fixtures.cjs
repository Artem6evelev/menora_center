/* Synthetic historical ledger only; never imported by production. */
const baseline=require('../../scripts/adoption-baseline.json');
async function seedHistoricalLedger(pg){
 await pg.exec('CREATE SCHEMA drizzle;CREATE TABLE drizzle.__drizzle_migrations(id serial PRIMARY KEY,hash text NOT NULL,created_at bigint);');
 for(const e of baseline.legacy)await pg.query('INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES($1,$2)',[e.hash,e.created_at]);
}
module.exports={seedHistoricalLedger};
