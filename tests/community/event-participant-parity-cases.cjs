/* Shared by migrated PGlite and disposable native PostgreSQL release suites.
 * Actual auth routes, canonical calculator/checkout and SQL; no external payment IO. */
const assert = require('node:assert/strict');
const { eq } = require('drizzle-orm');

module.exports = async ({ test, source, db, pg, login, get, post, setActor }) => {
  const route = source('app/api/telegram/miniapp/events/route.ts');
  const schema = source('lib/db/schema.ts');
  const canonical = source('lib/community/event-checkout.ts');
  const prepare = source('lib/community/registration.ts').prepareEventRegistration;
  const website = source('actions/event.ts');
  const owner = await login(898001);
  const children = [1, 2].map(n => ({ id: `parity-child-${n}`, parentId: owner.id, name: `Synthetic parity child ${n}`, dateOfBirth: '2020-01-01', gender: 'female' }));
  await pg.query("update users set first_name='Parity',spouse_name='Synthetic spouse',is_profile_complete=true,filter_version=2,filter_completed_at=now(),affiliation='maternal',gender='female',has_children=true,children_data=$2 where id=$1", [owner.id, children]);
  const user = async () => (await db.select().from(schema.users).where(eq(schema.users.id, owner.id)))[0];
  let sequence = 0;
  async function event(free = false) {
    const id = 'participant-parity-' + ++sequence;
    await pg.query("insert into events(id,title,status,is_free,price,child_price,payment_url) values($1,'Synthetic parity','planned',$2,'100.25','40.10','https://pay.shutafim.org.il/synthetic?price=1&quantity=9&cur=USD')", [id, free]);
    return id;
  }
  const canonicalSelection = selection => ({ family: { self: true, ...(selection.spouse ? { spouse: true } : {}) }, childIds: selection.childIds ?? [], extraAdults: selection.extraAdults ?? 0, extraKids: 0 });
  const choices = [
    ['self only', {}, 1, 0, 10025],
    ['self and spouse', { spouse: true }, 2, 0, 20050],
    ['self and two adult guests', { extraAdults: 2 }, 3, 0, 30075],
    ['self spouse and two adult guests', { spouse: true, extraAdults: 2 }, 4, 0, 40100],
    ['one saved child', { childIds: [children[0].id] }, 1, 1, 14035],
    ['two saved children', { childIds: children.map(c => c.id) }, 1, 2, 18045],
  ];
  for (const [name, selection, adults, childCount, amount] of choices) {
    await test('participant parity: ' + name + ' quote equals canonical website preparation and immutable checkout', async () => {
      const id = await event(), quote = (await post(route, { action: 'quote', eventId: id, ...selection })).quote;
      assert.equal(quote.adults, adults); assert.equal(quote.children, childCount); assert.equal(quote.amountAgorot, amount);
      const person = await user();
      const direct = await db.transaction(tx => canonical.calculateEvent(tx, person, id, canonicalSelection(selection)));
      assert.deepEqual(JSON.parse(JSON.stringify(direct.breakdown)), quote);
      assert.equal(Math.round(prepare(person, direct.event, canonicalSelection(selection)).totalAmount * 100), amount);
      const registration = (await post(route, { action: 'register', eventId: id, ...selection })).registration;
      assert.equal(registration.amountAgorot, quote.amountAgorot);
      const attempt = (await pg.query('select * from event_payment_attempts where registration_id=$1', [registration.registrationId])).rows[0];
      const ticket = (await pg.query('select * from event_participants where id=$1', [registration.registrationId])).rows[0];
      assert.equal(attempt.amount_agorot, amount); assert.equal(ticket.extra_data.amountAgorot, amount);
      const url = new URL(registration.paymentUrl);
      for (const [key, value] of Object.entries({ price: String(amount / 100), quantity: '1', cur: 'ILS', payments: '1', lang: 'ru', custom1: registration.registrationId })) assert.equal(url.searchParams.get(key), value);
      assert.equal(attempt.payment_url, registration.paymentUrl);
      assert.equal(ticket.extra_data.extraKids, 0);
      // Existing website checkout resumes the exact same immutable payment, ignoring client amount.
      setActor(owner.id);
      const resumed = await website.registerForEvent(id, owner.id, null, canonicalSelection(selection), undefined, 1);
      setActor(null);
      assert.equal(resumed.success, true); assert.equal(resumed.paymentUrl, registration.paymentUrl);
    });
  }
  await test('participant detail exposes selector names and own child IDs only, with canonical adult maximum', async () => {
    const data = await get(route, '?id=' + await event());
    assert.equal(data.firstName, 'Parity'); assert.equal(data.spouseName, 'Synthetic spouse');
    assert.equal(data.canRegisterChildren, true); assert.equal(data.extraAdultsLimit, 20);
    assert.deepEqual(data.children, children.map(({ id, name }) => ({ id, name })));
    assert.equal(data.event.price, '100.25'); assert.equal(data.event.childPrice, '40.10');
    for (const field of ['userId', 'parentId', 'email', 'phone', 'dateOfBirth', 'role', 'childrenData']) assert.ok(!Object.hasOwn(data, field));
  });
  await test('participant Mini App rejects duplicate child IDs before quote or checkout', async () => {
    const id = await event();
    for (const action of ['quote', 'register']) await post(route, { action, eventId: id, childIds: [children[0].id, children[0].id] }, 400);
    assert.equal(+(await pg.query('select count(*)::int n from event_participants where event_id=$1', [id])).rows[0].n, 0);
  });
  await test('participant Mini App rejects an existing child saved under another canonical profile', async () => {
    const other = await login(898002);
    await pg.query('update users set children_data=$2 where id=$1', [other.id, [{ ...children[0], id: 'foreign-child', parentId: other.id }]]);
    await login(898001);
    const id = await event();
    for (const action of ['quote', 'register']) await post(route, { action, eventId: id, childIds: ['foreign-child'] }, 409);
  });
  await test('participant child rights remain denied for male and incomplete/advanced giyur', async () => {
    const id = await event();
    for (const [gender, affiliation, stage] of [['male', 'maternal', null], ['male', 'giyur', 'completed'], ['female', 'giyur', null], ['female', 'giyur', 'advanced']]) {
      await pg.query('update users set gender=$2,affiliation=$3,giyur_stage=$4 where id=$1', [owner.id, gender, affiliation, stage]);
      const detail = await get(route, '?id=' + id); assert.equal(detail.children.length, 0); assert.equal(detail.canRegisterChildren, false);
      for (const action of ['quote', 'register']) await post(route, { action, eventId: id, childIds: [children[0].id] }, 409);
      assert.equal((await post(route, { action: 'quote', eventId: id })).quote.adults, 1);
    }
    await pg.query("update users set gender='female',affiliation='giyur',giyur_stage='completed' where id=$1", [owner.id]);
    assert.equal((await post(route, { action: 'quote', eventId: id, childIds: [children[0].id] })).quote.children, 1);
    await pg.query("update users set affiliation='maternal',giyur_stage=null where id=$1", [owner.id]);
  });
  await test('participant spouse selection without a saved spouse is denied by canonical preparation', async () => {
    const id = await event(); await pg.query('update users set spouse_name=null where id=$1', [owner.id]);
    for (const action of ['quote', 'register']) await post(route, { action, eventId: id, spouse: true }, 409);
    assert.equal((await get(route, '?id=' + id)).spouseName, null);
    await pg.query("update users set spouse_name='Synthetic spouse' where id=$1", [owner.id]);
  });
  await test('participant strict schema bounds extra adults and spouse without coercion', async () => {
    const id = await event();
    for (const patch of [{ extraAdults: -1 }, { extraAdults: 21 }, { extraAdults: 1.5 }, { extraAdults: '2' }, { spouse: 'true' }, { childIds: [''] }, { childIds: Array.from({ length: 21 }, (_, n) => String(n)) }]) {
      for (const action of ['quote', 'register']) await post(route, { action, eventId: id, ...patch }, 400);
    }
    assert.equal((await post(route, { action: 'quote', eventId: id, extraAdults: 20 })).quote.adults, 21);
  });
  for (const [field, value] of Object.entries({ total: 1, amountAgorot: 1, adultPrice: 1, childPrice: 1, paymentUrl: 'https://evil.invalid', userId: 'foreign', parentId: owner.id, family: { self: false }, extraKids: 1 })) {
    await test('participant strict schema rejects untrusted ' + field + ' for both quote and register', async () => {
      const id = await event();
      for (const action of ['quote', 'register']) await post(route, { action, eventId: id, [field]: value }, 400);
      assert.equal(+(await pg.query('select count(*)::int n from event_participants where event_id=$1', [id])).rows[0].n, 0);
    });
  }
  await test('participant checkout recalculates current server price rather than reusing a prior quote', async () => {
    const id = await event(); assert.equal((await post(route, { action: 'quote', eventId: id, extraAdults: 2 })).quote.amountAgorot, 30075);
    await pg.query("update events set price='110.00' where id=$1", [id]);
    const registration = (await post(route, { action: 'register', eventId: id, extraAdults: 2 })).registration;
    assert.equal(registration.amountAgorot, 33000); assert.equal(new URL(registration.paymentUrl).searchParams.get('price'), '330');
  });
  await test('participant free event accepts the same full composition and creates no payment attempt or URL', async () => {
    const id = await event(true), selection = { spouse: true, childIds: children.map(c => c.id), extraAdults: 2 };
    const quote = (await post(route, { action: 'quote', eventId: id, ...selection })).quote;
    assert.equal(quote.adults, 4); assert.equal(quote.children, 2); assert.equal(quote.amountAgorot, 0);
    const registration = (await post(route, { action: 'register', eventId: id, ...selection })).registration;
    assert.equal(registration.status, 'confirmed'); assert.equal(registration.paymentUrl, null);
    assert.equal(+(await pg.query('select count(*)::int n from event_payment_attempts where event_id=$1', [id])).rows[0].n, 0);
  });
  for (const patch of [{ spouse: true }, { childIds: [children[0].id] }, { extraAdults: 1 }]) {
    await test('participant pending selectionHash blocks changed ' + Object.keys(patch)[0] + ' without mutating payment', async () => {
      const id = await event(), first = (await post(route, { action: 'register', eventId: id })).registration;
      const before = (await pg.query('select * from event_payment_attempts where event_id=$1', [id])).rows;
      const failure = await post(route, { action: 'register', eventId: id, ...patch }, 409);
      assert.equal(failure.error, 'pending_selection_conflict');
      assert.deepEqual((await pg.query('select * from event_payment_attempts where event_id=$1', [id])).rows, before);
      const repeated = (await post(route, { action: 'register', eventId: id })).registration;
      assert.equal(repeated.registrationId, first.registrationId); assert.equal(repeated.paymentUrl, first.paymentUrl);
      assert.equal(repeated.amountAgorot, first.amountAgorot);
    });
  }
  await test('participant website initial checkout retains canonical spouse guest child pricing and ignores client amount', async () => {
    setActor(owner.id);
    try {
      for (const [, selection, , , amount] of choices) {
        const id = await event();
        const registration = await website.registerForEvent(id, owner.id, null, canonicalSelection(selection), undefined, 1);
        assert.equal(registration.success, true); assert.equal(new URL(registration.paymentUrl).searchParams.get('price'), String(amount / 100));
      }
    } finally { setActor(null); }
  });
};
