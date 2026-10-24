/* Same production routes/actions on isolated PGlite and independent native PostgreSQL. */
const assert = require('node:assert/strict');
module.exports = async ({ test, source, db, pg, login, get, post, setActor, calls, replies, request, cookieJar, cookie }) => {
  const route = source('app/api/telegram/miniapp/events/route.ts');
  const open = source('app/api/telegram/miniapp/payments/open/route.ts');
  const website = source('actions/event.ts'), webOpen = source('actions/event-payment.ts');
  const reminders = source('actions/event-payment-reminder.ts');
  const presentation = source('lib/community/payment-intent.ts');
  const owner = await login(899101);
  await pg.query("update users set gender='female',affiliation='maternal',is_profile_complete=true,filter_version=2,filter_completed_at=now(),first_name='Intent user',phone='+972 50 123 4567' where id=$1", [owner.id]);
  const admin = 'intent-staff';
  await pg.query("insert into users(id,role,first_name,gender,affiliation,is_profile_complete,filter_version,filter_completed_at)values($1,'admin','Intent staff','female','maternal',true,2,now())",[admin]);
  let sequence = 0;
  async function create() {
    const eventId = 'intent-event-' + (++sequence);
    await pg.query("insert into events(id,title,status,is_free,price,child_price,payment_url)values($1,'Встреча & тест','planned',false,'150.00','25','https://pay.shutafim.org.il/synthetic')", [eventId]);
    const registration = (await post(route, {action:'register',eventId})).registration;
    return { eventId, ...registration };
  }
  const attempt = async id => (await pg.query('select * from event_payment_attempts where registration_id=$1',[id])).rows[0];
  const normalized = value => JSON.parse(JSON.stringify(value));
  const snapshot = async id => normalized(await attempt(id));
  const first = await create();
  await test('intent checkout creates unopened attempt with zero count; reads/checkout retries do not count as opens', async () => {
    await get(route, '?id='+first.eventId); await post(route,{action:'register',eventId:first.eventId});
    const row=await attempt(first.registrationId); assert.equal(row.opened_at,null); assert.equal(row.last_opened_at,null); assert.equal(row.open_count,0); assert.equal(row.last_opened_source,null);
  });
  await test('intent payment open rejects anonymous and cross-origin requests before tracking', async () => {
    const token=cookieJar.get(cookie);cookieJar.delete(cookie);
    try { await post(open,{registrationId:first.registrationId},401); }
    finally { cookieJar.set(cookie,token); }
    const response=await open.POST(request({registrationId:first.registrationId},{origin:'https://evil.invalid'}));assert.equal(response.status,403);
    assert.equal((await attempt(first.registrationId)).open_count,0);
  });
  let opened;
  await test('intent Telegram pay click tracks canonical server URL/amount while leaving payment pending', async () => {
    const response=await post(open,{registrationId:first.registrationId}); assert.equal(response.amountAgorot,15000);
    assert.equal(new URL(response.paymentUrl).searchParams.get('custom1'),first.registrationId);
    opened=await attempt(first.registrationId); assert.ok(opened.opened_at); assert.ok(opened.last_opened_at); assert.equal(opened.open_count,1); assert.equal(opened.last_opened_source,'telegram'); assert.equal(opened.status,'pending'); assert.equal(opened.confirmed_at,null);
  });
  await test('intent second Telegram pay click preserves first timestamp and increases count atomically', async () => {
    await post(open,{registrationId:first.registrationId}); const row=await attempt(first.registrationId);
    assert.equal(String(row.opened_at),String(opened.opened_at)); assert.ok(new Date(row.last_opened_at)>new Date(opened.last_opened_at)); assert.equal(row.open_count,2);
  });
  await test('intent website authenticates canonical user and shares the same attempt/counter', async () => {
    setActor(owner.id); const response=await webOpen.openCurrentUserEventPayment(first.registrationId); assert.equal(response.success,true); assert.equal(response.amountAgorot,15000);
    const row=await attempt(first.registrationId); assert.equal(row.last_opened_source,'website'); assert.equal(row.open_count,3); assert.equal(String(row.opened_at),String(opened.opened_at)); setActor(null);
  });
  await test('intent simultaneous authorized opens lose no increments', async () => {
    await Promise.all(Array.from({length:4},()=>post(open,{registrationId:first.registrationId}))); assert.equal((await attempt(first.registrationId)).open_count,7);
  });
  await test('intent website initial checkout now stores the immutable common attempt and custom1', async () => {
    const eventId='intent-website-new'; await pg.query("insert into events(id,title,status,is_free,price,payment_url)values($1,'Website intent','planned',false,'101.25','https://pay.shutafim.org.il/synthetic')",[eventId]);
    setActor(owner.id); const response=await website.registerForEvent(eventId,owner.id,null,{extraAdults:1},undefined,0.01); assert.equal(response.success,true);
    const row=await attempt(response.registrationId); assert.equal(row.amount_agorot,20250); assert.equal(row.open_count,0); assert.equal(row.opened_at,null); assert.equal(new URL(response.paymentUrl).searchParams.get('custom1'),response.registrationId);
    assert.equal((await website.registerForEvent(eventId,owner.id,null,{extraAdults:2})).success,false);
    assert.equal((await attempt(response.registrationId)).amount_agorot,20250); setActor(null);
  });
  for (const key of ['userId','amount','price','paymentUrl','status','openCount','openedAt','source']) await test('intent untrusted Telegram '+key+' is rejected before tracking', async()=>{
    const before=await snapshot(first.registrationId); await post(open,{registrationId:first.registrationId,[key]:'https://evil.invalid/'},400); assert.deepEqual(await snapshot(first.registrationId),before);
  });
  await test('intent website rejects structured URL/amount injection and anonymous access',async()=>{
    setActor(owner.id); assert.equal((await webOpen.openCurrentUserEventPayment({registrationId:first.registrationId,paymentUrl:'https://evil.invalid',amount:1})).success,false);
    setActor(null); assert.equal((await webOpen.openCurrentUserEventPayment(first.registrationId)).success,false);
  });
  await test('intent other canonical accounts cannot retrieve or change owner payment state',async()=>{
    const before=await snapshot(first.registrationId),other=await login(899102); await post(open,{registrationId:first.registrationId},404);
    setActor(other.id); assert.equal((await webOpen.openCurrentUserEventPayment(first.registrationId)).success,false);
    assert.deepEqual(await snapshot(first.registrationId),before); setActor(null); await login(899101);
  });
  for (const field of ['user_id','event_id']) await test('intent mismatched attempt '+field+' is rejected',async()=>{
    const item=await create(),other=await create();
    const value=field==='user_id'?admin:other.eventId;
    await pg.query('update event_payment_attempts set '+field+'=$1 where registration_id=$2',[value,item.registrationId]);
    await post(open,{registrationId:item.registrationId},404); assert.equal((await attempt(item.registrationId)).open_count,0);
  });
  for (const url of ['http://evil.invalid','javascript:alert(1)','https://user:pass@evil.invalid/','not a url']) await test('intent unsafe stored handoff rejected: '+url.split(':')[0],async()=>{
    const item=await create(); await pg.query('update event_payment_attempts set payment_url=$1 where registration_id=$2',[url,item.registrationId]);
    await post(open,{registrationId:item.registrationId},409); assert.equal((await attempt(item.registrationId)).open_count,0);
  });
  for (const kind of ['participant-paid','attempt-paid','attempt-cancelled']) await test('intent '+kind+' cannot reopen or mutate paid history',async()=>{
    const item=await create(); await pg.query(kind==='participant-paid'?"update event_participants set status='paid' where id=$1":"update event_payment_attempts set status=$2 where registration_id=$1",kind==='participant-paid'?[item.registrationId]:[item.registrationId,kind==='attempt-paid'?'paid':'cancelled']);
    const before=await snapshot(item.registrationId); await post(open,{registrationId:item.registrationId},409); assert.deepEqual(await snapshot(item.registrationId),before);
  });
  await test('intent deleted registration and attempt cannot return a stale URL or resurrect on a return hint',async()=>{
    const item=await create(); setActor(admin); assert.equal((await website.deleteEventParticipant(item.registrationId)).success,true); setActor(owner.id);
    assert.equal((await webOpen.openCurrentUserEventPayment(item.registrationId)).success,false); setActor(null);
    await post(open,{registrationId:item.registrationId},404); assert.equal((await get(route,'?id='+item.eventId+'&paid=true')).registration,null); assert.equal(await attempt(item.registrationId),undefined);
  });
  await test('intent failed tracking update rolls back all opening fields',async()=>{
    const item=await create();
    await pg.exec("create function intent_fail_open() returns trigger language plpgsql as $$begin raise exception 'synthetic tracking failure';end$$;create trigger intent_fail_open before update on event_payment_attempts for each row execute function intent_fail_open();");
    try { await post(open,{registrationId:item.registrationId},503); assert.equal((await attempt(item.registrationId)).open_count,0); assert.equal((await attempt(item.registrationId)).opened_at,null); }
    finally {await pg.exec('drop trigger intent_fail_open on event_payment_attempts;drop function intent_fail_open();');}
  });
  await test('intent schema rejects negative counts and unsupported sources',async()=>{
    await assert.rejects(pg.query('update event_payment_attempts set open_count=-1 where registration_id=$1',[first.registrationId]));
    await assert.rejects(pg.query("update event_payment_attempts set last_opened_source='client' where registration_id=$1",[first.registrationId]));
  });
  let unopened,legacy;
  await test('intent CRM left join exposes safe tracking DTO with truthful legacy cutoff',async()=>{
    unopened=await create(); legacy=await create(); await pg.query("update event_payment_attempts set created_at='2000-01-01' where registration_id=$1",[legacy.registrationId]);
    setActor(admin); const rows=await website.getEventParticipantsList(first.eventId); assert.equal(rows.length,1); assert.equal(rows[0].paymentAttempt.openCount,7); assert.ok(!JSON.stringify(rows).includes('paymentUrl'));
    assert.equal((await website.getEventParticipantsList(unopened.eventId))[0].paymentAttempt.trackingKnown,true);
    assert.equal((await website.getEventParticipantsList(legacy.eventId))[0].paymentAttempt.trackingKnown,false); setActor(null);
  });
  await test('intent CRM states and filters never infer nonpayment or abandonment from pending/time',async()=>{
    setActor(admin);const pending=(await website.getEventParticipantsList(unopened.eventId))[0],warm=(await website.getEventParticipantsList(first.eventId))[0],old=(await website.getEventParticipantsList(legacy.eventId))[0];setActor(null);
    assert.equal(presentation.paymentIntentState('pending',pending.paymentAttempt),'waiting'); assert.equal(presentation.paymentIntentState('pending',warm.paymentAttempt),'opened');
    assert.equal(presentation.paymentIntentSecondary(old.paymentAttempt),'Нет данных об открытии оплаты');
    assert.equal(presentation.paymentIntentSecondary(pending.paymentAttempt),'Ссылка на оплату ещё не открывалась');
    assert.equal(presentation.matchesPaymentFilter('opened','pending',warm.paymentAttempt),true); assert.equal(presentation.matchesPaymentFilter('opened','pending',pending.paymentAttempt),false);
    assert.equal(presentation.matchesPaymentFilter('waiting','pending',pending.paymentAttempt),true); assert.equal(presentation.matchesPaymentFilter('waiting','pending',warm.paymentAttempt),false);
    assert.doesNotMatch(JSON.stringify(presentation.paymentIntentLabels),/не оплатил|бросил/i);
  });
  await test('intent CRM no-attempt and paid history are preserved; selector statistics count warmth separately',async()=>{
    const stats=await source('lib/community/event-payment-crm.ts').readApplicationEventStats(db);
    const warm=stats.find(row=>row.event.id===first.eventId); assert.equal(warm.totalParticipants,1); assert.equal(warm.pendingParticipants,1); assert.equal(warm.paymentOpenedParticipants,1);
    assert.equal(stats.find(row=>row.event.id===unopened.eventId).paymentOpenedParticipants,0);
    await pg.query("update event_payment_attempts set status='cancelled' where registration_id=$1",[first.registrationId]);
    const cancelledStats=await source('lib/community/event-payment-crm.ts').readApplicationEventStats(db);assert.equal(cancelledStats.find(row=>row.event.id===first.eventId).paymentOpenedParticipants,1);
    await pg.query("update event_payment_attempts set status='pending' where registration_id=$1",[first.registrationId]);
    assert.equal(presentation.paymentIntentState('confirmed',null),'confirmed'); assert.equal(presentation.paymentIntentState('paid',null),'paid');
  });
  await test('intent composition uses immutable snapshots and correct adult/child plural forms',async()=>{
    const c=presentation.applicationComposition({family:{self:true,spouse:true},childrenSnapshot:[{id:'old-child'}],extraAdults:0});assert.equal(c.summary,'2 взрослых + 1 ребёнок');
    assert.equal(presentation.applicationComposition({family:{self:true,spouse:true},childIds:['a','b'],extraAdults:2}).summary,'4 взрослых + 2 ребёнка');
    assert.equal(presentation.applicationComposition('{bad').summary,'1 взрослый');
  });
  await pg.query("update telegram_contacts set telegram_chat_id='899101',marketing_status='unsubscribed',unsubscribed_at=now() where user_id=$1",[owner.id]);
  const consent=async()=>normalized((await pg.query('select marketing_status,marketing_opt_in_at,unsubscribed_at,blocked_at from telegram_contacts where user_id=$1',[owner.id])).rows[0]);
  await test('intent reminder staff authorization and strict registration ID precede external delivery',async()=>{
    const before=calls.length; setActor(owner.id); assert.equal((await reminders.getEventPaymentReminderOptions(first.registrationId)).success,false); assert.equal((await reminders.remindEventPaymentByTelegram(first.registrationId)).success,false);
    setActor(admin); assert.equal((await reminders.remindEventPaymentByTelegram({registrationId:first.registrationId,chatId:'1'})).success,false); assert.equal(calls.length,before); setActor(null);
  });
  await test('intent transactional reminder uses canonical event deep link and preserves consent and registration count',async()=>{
    const before=await consent(),count=(await pg.query('select count(*)::int n from event_participants')).rows[0].n;
    setActor(admin);const options=await reminders.getEventPaymentReminderOptions(first.registrationId);assert.equal(options.success,true);assert.equal(options.telegramAvailable,true);
    assert.equal((await reminders.remindEventPaymentByTelegram(first.registrationId)).success,true);setActor(null);
    const sent=calls.at(-1);assert.equal(sent.method,'sendMessage');assert.equal(sent.body.chat_id,'899101');assert.match(sent.body.text,/Если оплата ещё не завершена/);assert.ok(!sent.body.parse_mode);
    assert.equal(sent.body.reply_markup.inline_keyboard[0][0].url,'https://t.me/menorah_center_rishon_bot?start=event_'+first.eventId);
    assert.equal((await pg.query('select count(*)::int n from event_participants')).rows[0].n,count); assert.deepEqual(await consent(),before);
    const detail=await get(route,'?id='+first.eventId);assert.equal(detail.registration.registrationId,first.registrationId);
  });
  await test('intent WhatsApp action is manual, normalizes phone and encodes the complete RU continuation message',async()=>{
    const link=presentation.paymentReminderWhatsApp('050 123 4567','Шалом, Тест & друг!','https://example.invalid/events/a?b=1&x=2');
    const url=new URL(link);assert.equal(url.pathname,'/972501234567');assert.equal(url.searchParams.get('text'),'Шалом, Тест & друг!\n\nПродолжить регистрацию: https://example.invalid/events/a?b=1&x=2');assert.equal(presentation.paymentReminderWhatsApp('Не указан','x','https://example.invalid'),null);
  });
  for(const mode of ['timestamp','status','no-chat','disabled-identity'])await test('intent reminder blocks unreachable canonical Telegram contact: '+mode,async()=>{
    const before=calls.length;
    if(mode==='timestamp')await pg.query('update telegram_contacts set blocked_at=now() where user_id=$1',[owner.id]);
    if(mode==='status')await pg.query("update telegram_contacts set marketing_status='blocked' where user_id=$1",[owner.id]);
    if(mode==='no-chat')await pg.query('update telegram_contacts set telegram_chat_id=null where user_id=$1',[owner.id]);
    if(mode==='disabled-identity')await pg.query("update user_identities set disabled_at=now() where user_id=$1 and provider='telegram'",[owner.id]);
    setActor(admin);assert.equal((await reminders.remindEventPaymentByTelegram(first.registrationId)).success,false);setActor(null);assert.equal(calls.length,before);
    await pg.query("update telegram_contacts set blocked_at=null,marketing_status='unsubscribed',telegram_chat_id='899101' where user_id=$1",[owner.id]);
    await pg.query("update user_identities set disabled_at=null where user_id=$1 and provider='telegram'",[owner.id]);
  });
  await test('intent provider block is persisted without changing marketing consent or retrying',async()=>{
    const before=await consent(),n=calls.length;replies.push({ok:false,error_code:403});setActor(admin);assert.equal((await reminders.remindEventPaymentByTelegram(first.registrationId)).success,false);assert.equal((await reminders.remindEventPaymentByTelegram(first.registrationId)).success,false);setActor(null);
    const after=await consent();assert.ok(after.blocked_at);delete after.blocked_at;delete before.blocked_at;assert.deepEqual(after,before);assert.equal(calls.length,n+1);
  });
  await test('intent paid and deleted reminder targets send nothing',async()=>{
    const n=calls.length,item=await create();await pg.query("update event_payment_attempts set status='paid' where registration_id=$1",[item.registrationId]);
    setActor(admin);assert.equal((await reminders.remindEventPaymentByTelegram(item.registrationId)).success,false);assert.equal((await reminders.remindEventPaymentByTelegram('deleted-intent-registration')).success,false);setActor(null);assert.equal(calls.length,n);
  });
  setActor(null);
};
