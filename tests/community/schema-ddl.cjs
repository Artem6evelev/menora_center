/* drizzle-kit 0.31 orders compound referenced unique indexes after FKs. */
function orderSchemaDdl(statements) {
  const result = [...statements];
  const index = result.findIndex(statement => statement.startsWith('CREATE UNIQUE INDEX "user_identities_id_user_id_idx"'));
  if (index >= 0) {
    const [create] = result.splice(index, 1);
    const fk = result.findIndex(statement => statement.includes('ADD CONSTRAINT "telegram_miniapp_sessions_identity_owner_fk"'));
    if (fk < 0) throw new Error('Missing session owner FK in generated schema');
    result.splice(fk, 0, create);
  }
  return result;
}
module.exports = { orderSchemaDdl };
