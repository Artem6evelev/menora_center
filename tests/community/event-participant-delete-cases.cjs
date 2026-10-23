/* Real action/authorization/RESTRICT FK on both disposable SQL engines. */
const assert = require('node:assert/strict');
const { eq } = require('drizzle-orm');

module.exports = async ({ test, source, db, pg, login, get, post, setActor }) => {
  const actions = source('actions/event.ts');
  const route = source('app/api/telegram/miniapp/events/route.ts');
  const owner = await login(897100);
  const admin = 'delete-fixture-admin';
  await pg.query("update users set is_profile_complete=true,filter_version=2,filter_completed_at=now(),affiliation='maternal',gender='female',agreed_to_privacy=true where id=$1", [owner.id]);
  await pg.query("insert into users(id,first_name,role,affiliation,gender,is_profile_complete,filter_version,filter_completed_at) values($1,'Delete fixture admin','admin','maternal','female',true,2,now())", [admin]);
  let sequence = 0;
  let removed;
  const paidMessage = 'Оплаченную регистрацию нельзя удалить. Сначала необходимо корректно обработать платёж.';
  const rows = async id => ({
    participants: Array.from((await pg.query('select * from event_participants where id=$1', [id])).rows),
    attempts: Array.from((await pg.query('select * from event_payment_attempts where registration_id=$1', [id])).rows),
  });
  async function event(free = false) {
    const eventId = 'delete-fixture-' + ++sequence;
    await pg.query("insert into events(id,title,status,is_free,price,payment_url) values($1,'Synthetic delete fixture','planned',$2,'100.25','https://pay.shutafim.org.il/synthetic')", [eventId, free]);
    return eventId;
  }
  async function registration(free = false) {
    const eventId = await event(free);
    const registration = (await post(route, { action: 'register', eventId })).registration;
    return { eventId, ...registration };
  }
  async function remove(id, actor = admin) {
    setActor(actor);
    try { return await actions.deleteEventParticipant(id); }
    finally { setActor(null); }
  }
  await test('staff deletes pending checkout registration with its real RESTRICT payment FK', async () => {
    const fixture = await registration(), control = await registration();
    const controlBefore = await rows(control.registrationId);
    const fk = await pg.query("select confdeltype from pg_constraint where conrelid='event_payment_attempts'::regclass and confrelid='event_participants'::regclass");
    assert.equal(fk.rows[0].confdeltype, 'r');
    const errors = source('lib/community/errors.ts'), original = errors.communityErrorMessage;
    let databaseError;
    errors.communityErrorMessage = (error, fallback) => { databaseError = error; return original(error, fallback); };
    let result;
    try { setActor(admin); result = await actions.deleteEventParticipant(fixture.registrationId); }
    finally { errors.communityErrorMessage = original; setActor(null); }
    const after = await rows(fixture.registrationId);
    assert.equal(result.success, true, JSON.stringify({ result, sqlState: databaseError?.cause?.code ?? databaseError?.code, participantRows: after.participants.length, attemptRows: after.attempts.length }));
    assert.equal(after.participants.length, 0); assert.equal(after.attempts.length, 0);
    assert.deepEqual(await rows(control.registrationId), controlBefore);
    removed = fixture;
  });
  await test('staff deletes a confirmed free registration with no payment attempt', async () => {
    const fixture = await registration(true);
    assert.equal((await rows(fixture.registrationId)).attempts.length, 0);
    assert.equal((await remove(fixture.registrationId)).success, true);
    assert.deepEqual(await rows(fixture.registrationId), { participants: [], attempts: [] });
  });
  await test('staff deletes website-created pending registration without a payment attempt through the same action', async () => {
    const eventId = await event();
    setActor(owner.id);
    try {
      const result = await actions.registerForEvent(eventId, owner.id, null, { family: { self: true }, childIds: [], extraAdults: 0, extraKids: 0 });
      assert.equal(result.success, true); assert.ok(result.paymentUrl);
    } finally { setActor(null); }
    const [participant] = (await pg.query('select * from event_participants where event_id=$1', [eventId])).rows;
    assert.equal(participant.status, 'pending'); assert.equal((await rows(participant.id)).attempts.length, 0);
    assert.equal((await remove(participant.id)).success, true);
    assert.deepEqual(await rows(participant.id), { participants: [], attempts: [] });
  });
  await test('staff deletes pending registration and cancelled attempt together', async () => {
    const fixture = await registration();
    await pg.query("update event_payment_attempts set status='cancelled' where registration_id=$1", [fixture.registrationId]);
    assert.equal((await remove(fixture.registrationId)).success, true);
    assert.deepEqual(await rows(fixture.registrationId), { participants: [], attempts: [] });
  });
  for (const kind of ['participant', 'attempt']) await test('paid ' + kind + ' rejects deletion and preserves all payment history', async () => {
    const fixture = await registration();
    await pg.query(kind === 'participant' ? "update event_participants set status='paid' where id=$1" : "update event_payment_attempts set status='paid',confirmed_at=now() where registration_id=$1", [fixture.registrationId]);
    const before = await rows(fixture.registrationId);
    const payments = source('lib/community/payments.ts'), original = payments.requirePaymentConfirmationReady;
    let calls = 0;
    payments.requirePaymentConfirmationReady = message => { calls++; return original(message); };
    try {
      const result = await remove(fixture.registrationId);
      assert.equal(result.success, false); assert.equal(result.error, paidMessage); assert.equal(calls, 1);
    } finally { payments.requirePaymentConfirmationReady = original; }
    assert.deepEqual(await rows(fixture.registrationId), before);
  });
  await test('paid deletion remains forbidden even if confirmation readiness later becomes available', async () => {
    const fixture = await registration();
    await pg.query("update event_payment_attempts set status='paid' where registration_id=$1", [fixture.registrationId]);
    const payments = source('lib/community/payments.ts'), original = payments.requirePaymentConfirmationReady;
    payments.requirePaymentConfirmationReady = () => {};
    try { const result = await remove(fixture.registrationId); assert.equal(result.success, false); assert.equal(result.error, paidMessage); }
    finally { payments.requirePaymentConfirmationReady = original; }
    assert.equal((await rows(fixture.registrationId)).attempts[0].status, 'paid');
  });
  await test('historical paid participant without any attempt cannot be deleted', async () => {
    const fixture = await registration(true);
    await pg.query("update event_participants set status='paid' where id=$1", [fixture.registrationId]);
    const result = await remove(fixture.registrationId);
    assert.equal(result.success, false); assert.equal(result.error, paidMessage);
    assert.equal((await rows(fixture.registrationId)).participants.length, 1);
  });
  await test('anonymous and ordinary users cannot delete a registration or its attempt', async () => {
    const fixture = await registration(), before = await rows(fixture.registrationId);
    for (const actor of [null, owner.id]) assert.equal((await remove(fixture.registrationId, actor)).success, false);
    assert.deepEqual(await rows(fixture.registrationId), before);
  });
  await test('disabled staff and staff without the current filter cannot delete registrations', async () => {
    const fixture = await registration(), before = await rows(fixture.registrationId);
    try {
      await pg.query('update users set identity_disabled_at=now() where id=$1', [admin]);
      assert.equal((await remove(fixture.registrationId)).success, false);
      await pg.query('update users set identity_disabled_at=null,filter_version=1 where id=$1', [admin]);
      assert.equal((await remove(fixture.registrationId)).success, false);
    } finally { await pg.query('update users set identity_disabled_at=null,filter_version=2 where id=$1', [admin]); }
    assert.deepEqual(await rows(fixture.registrationId), before);
  });
  await test('superadmin uses the same source-independent deletion action', async () => {
    const fixture = await registration();
    await pg.query("update users set role='superadmin' where id=$1", [admin]);
    try { assert.equal((await remove(fixture.registrationId)).success, true); }
    finally { await pg.query("update users set role='admin' where id=$1", [admin]); }
    assert.equal((await rows(fixture.registrationId)).participants.length, 0);
  });
  for (const table of ['event_payment_attempts', 'event_participants']) await test(table + ' delete failure rolls back participant and dependent attempt without leaking SQL', async () => {
    const fixture = await registration(), before = await rows(fixture.registrationId);
    await pg.exec("create function delete_fixture_failure() returns trigger language plpgsql as $$ begin raise exception 'PRIVATE_SYNTHETIC_DELETE_FAILURE'; end; $$; create trigger delete_fixture_failure before delete on " + table + ' for each row execute function delete_fixture_failure()');
    try {
      const result = await remove(fixture.registrationId);
      assert.equal(result.success, false); assert.equal(result.error, 'Не удалось удалить заявку');
      assert.deepEqual(await rows(fixture.registrationId), before);
    } finally { await pg.exec('drop trigger delete_fixture_failure on ' + table + '; drop function delete_fixture_failure()'); }
  });
  await test('missing or already deleted registration returns the explicit not-found error', async () => {
    for (const id of ['delete-fixture-nonexistent', removed.registrationId]) {
      const result = await remove(id); assert.equal(result.success, false); assert.equal(result.error, 'Запись не найдена');
    }
  });
  await test('old Shutafim URL, return hints and disabled callback cannot resurrect a deleted registration', async () => {
    const id = new URL(removed.paymentUrl).searchParams.get('custom1'); assert.equal(id, removed.registrationId);
    const detail = await get(route, '?id=' + removed.eventId + '&paid=true&return=success&custom1=' + id);
    assert.equal(detail.registration, null);
    const list = await get(source('app/api/telegram/miniapp/registrations/route.ts'), '?return=success&registrationId=' + id);
    assert.ok(!list.registrations.some(row => row.id === id));
    const callback = await source('app/api/webhooks/shutafim/route.ts').POST(); assert.equal(callback.status, 503);
    assert.deepEqual(await rows(id), { participants: [], attempts: [] });
    await assert.rejects(pg.query("insert into event_payment_attempts(registration_id,user_id,event_id,amount_agorot,selection_hash,payment_url) values($1,$2,$3,10025,$4,$5)", [id, owner.id, removed.eventId, '0'.repeat(64), removed.paymentUrl]));
    assert.deepEqual(await rows(id), { participants: [], attempts: [] });
  });
  await test('a deliberate new checkout gets a new immutable ID rather than reviving the deleted URL', async () => {
    const next = (await post(route, { action: 'register', eventId: removed.eventId })).registration;
    assert.notEqual(next.registrationId, removed.registrationId);
    assert.equal(new URL(next.paymentUrl).searchParams.get('custom1'), next.registrationId);
    assert.deepEqual(await rows(removed.registrationId), { participants: [], attempts: [] });
  });
  if (process.env.MENORAH_NATIVE_PG_TEST === '1') await test('native concurrent paid attempt writer is serialized before deletion and payment history survives', async () => {
    const fixture = await registration(), schema = source('lib/db/schema.ts');
    let locked, release;
    const acquired = new Promise(resolve => { locked = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    const writer = db.transaction(async tx => {
      await tx.select().from(schema.eventPaymentAttempts).where(eq(schema.eventPaymentAttempts.registrationId, fixture.registrationId)).for('update');
      locked(); await gate;
      await tx.update(schema.eventPaymentAttempts).set({ status: 'paid' }).where(eq(schema.eventPaymentAttempts.registrationId, fixture.registrationId));
    });
    await acquired;
    const deleting = remove(fixture.registrationId);
    try { await new Promise(resolve => setTimeout(resolve, 30)); }
    finally { release(); }
    await writer;
    const result = await deleting; assert.equal(result.success, false); assert.equal(result.error, paidMessage);
    assert.equal((await rows(fixture.registrationId)).attempts[0].status, 'paid');
  });
  setActor(null);
};
