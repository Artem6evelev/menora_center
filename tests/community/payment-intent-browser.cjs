/* Browser -> actual action/route -> isolated SQL -> CRM. External services are blocked. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/tmp/menora-browser-runtime/node_modules/playwright');
const {installSdk,openEventRegistration}=require('./miniapp-ui-sdk.cjs');
const base=process.env.COMMUNITY_BROWSER_BASE||'http://127.0.0.1:3372',out=process.env.COMMUNITY_TEST_OUTPUT||'/tmp/menora-payment-intent-browser';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const checks=[],errors=[];let browser,subject=785600;
async function test(name,fn){await fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}
const row=(page,kind)=>page.locator('tr').filter({hasText:'INTENT_'+kind.toUpperCase()});
const inspect=async context=>(await context.request.get(base+'/api/test-payment-intent')).json();
async function contextFor(width=1280){
 const context=await browser.newContext({viewport:{width,height:1000},locale:'ru-RU',reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write']});
 await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
 assert.equal((await inspect(context)).testDatabase,'isolated-pglite');assert.equal((await context.request.post(base+'/api/test-state')).status(),200);
 const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));return{context,page};
}
async function crm(width=1280){const pair=await contextFor(width);await pair.context.request.post(base+'/api/test-payment-intent',{data:{mode:'seed'}});await pair.context.addCookies([{name:'_community_fixture',value:'fixture-admin',url:base}]);await pair.page.goto(base+'/dashboard/applications');await row(pair.page,'opened').waitFor();return pair;}
async function filter(page,name){await page.getByRole('group',{name:'Фильтр заявок'}).getByRole('button',{name:new RegExp('^'+name)}).click();}
(async()=>{
 fs.mkdirSync(out,{recursive:true});browser=await chromium.launch({headless:true});
 for(const width of [390,1280])await test(width+' CRM renders honest opened/unopened/legacy/paid/confirmed states and composition',async()=>{
  const{context,page}=await crm(width);try{
   assert.match(await row(page,'opened').innerText(),/🔥 Оплата открыта/);assert.match(await row(page,'opened').innerText(),/Оплата пока не подтверждена/);assert.match(await row(page,'opened').innerText(),/Первый переход:.*Последний переход:.*Открывал: 2 раза/s);
   assert.match(await row(page,'opened').innerText(),/2 взрослых \+ 1 ребёнок/);assert.match(await row(page,'opened').innerText(),/150/);assert.match(await row(page,'opened').innerText(),/Telegram/);
   assert.match(await row(page,'unopened').innerText(),/Ссылка на оплату ещё не открывалась/);
   assert.match(await row(page,'legacy').innerText(),/Нет данных об открытии оплаты/);assert.doesNotMatch(await row(page,'legacy').innerText(),/ещё не открывалась/);
   assert.match(await row(page,'paid').innerText(),/✅ Оплачено/);assert.match(await row(page,'confirmed').innerText(),/✅ Подтверждено/);
   assert.doesNotMatch(await page.locator('main').innerText(),/не оплатил|бросил оплату/i);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:path.join(out,width+'-crm.png'),fullPage:true});
  }finally{await context.close();}
 });
 await test('CRM opened and awaiting filters show correct independent row sets and badge counts',async()=>{
  const{context,page}=await crm();try{
   await filter(page,'🔥 Открыли оплату');await row(page,'opened').waitFor();await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===1);assert.equal(await page.locator('tbody tr').count(),1);
   await filter(page,'Ожидают оплаты');await row(page,'unopened').waitFor();await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===2);assert.equal(await page.locator('tbody tr').count(),2);assert.equal(await row(page,'opened').count(),0);
   await filter(page,'Оплачено');await row(page,'paid').waitFor();await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===1);assert.equal(await page.locator('tbody tr').count(),1);
   await filter(page,'Подтверждено');await row(page,'confirmed').waitFor();await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===1);assert.equal(await page.locator('tbody tr').count(),1);
   await filter(page,'Новые');await row(page,'opened').waitFor();await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===3);assert.equal(await page.locator('tbody tr').count(),3);
   await filter(page,'Все');await row(page,'paid').waitFor();await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===5);assert.equal(await page.locator('tbody tr').count(),5);
  }finally{await context.close();}
 });
 await test('CRM technical details copy the same registration ID used as Shutafim custom1',async()=>{
  const{context,page}=await crm();try{await row(page,'opened').getByText('Данные регистрации',{exact:true}).click();await row(page,'opened').getByRole('button',{name:'Copy',exact:true}).click();await row(page,'opened').getByRole('button',{name:'Скопировано',exact:true}).waitFor();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'intent-ui-opened');}finally{await context.close();}
 });
 await test('CRM Telegram reminder sends once through actual staff action and retains canonical registration and consent',async()=>{
  const{context,page}=await crm();try{
   const before=await inspect(context);await row(page,'opened').getByRole('button',{name:'Напомнить',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Telegram',exact:true}).click();await dialog.getByText('Напоминание отправлено в Telegram',{exact:true}).waitFor();assert.equal(await dialog.getByRole('button',{name:'Telegram',exact:true}).isDisabled(),true);
   const after=await inspect(context);assert.equal(after.calls.length,1);assert.equal(after.calls[0].body.reply_markup.inline_keyboard[0][0].url,'https://t.me/menorah_center_rishon_bot?start=event_intent-ui-event');assert.deepEqual(after.contacts,before.contacts);assert.deepEqual(after.registrations,before.registrations);
   await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  }finally{await context.close();}
 });
 await test('CRM website-only WhatsApp reminder is a manual encoded link and sends no Bot API call',async()=>{
  const{context,page}=await crm();try{
   await row(page,'unopened').getByRole('button',{name:'Напомнить',exact:true}).click();const dialog=page.getByRole('dialog');const link=dialog.getByRole('link',{name:'WhatsApp',exact:true});await link.waitFor();assert.equal(await dialog.getByRole('button',{name:'Telegram',exact:true}).count(),0);
   const url=new URL(await link.getAttribute('href'));assert.equal(url.pathname,'/972501234567');assert.match(url.searchParams.get('text'),/Если оплата ещё не завершена/);assert.ok(url.searchParams.get('text').includes(base+'/events/intent-ui-event'));assert.equal((await inspect(context)).calls.length,0);
  }finally{await context.close();}
 });
 await test('CRM blocked contact has no Telegram reminder option and consent is untouched',async()=>{
  const{context,page}=await crm();try{await context.request.post(base+'/api/test-payment-intent',{data:{mode:'blocked'}});await row(page,'opened').getByRole('button',{name:'Напомнить',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByRole('link',{name:'WhatsApp',exact:true}).waitFor();assert.equal(await dialog.getByRole('button',{name:'Telegram',exact:true}).count(),0);assert.equal((await inspect(context)).calls.length,0);}finally{await context.close();}
 });
 await test('CRM lost staff permission reports reminder rejection and sends nothing',async()=>{
  const{context,page}=await crm();try{await row(page,'opened').getByRole('button',{name:'Напомнить',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Telegram',exact:true}).waitFor();await context.request.post(base+'/api/test-payment-intent',{data:{mode:'demote'}});await dialog.getByRole('button',{name:'Telegram',exact:true}).click();await dialog.getByRole('alert').filter({hasText:'Действие доступно только администратору'}).waitFor();assert.equal((await inspect(context)).calls.length,0);}finally{await context.close();}
 });
 await test('CRM deleting a warm pending registration removes its row, attempt and warm selector count',async()=>{
  const{context,page}=await crm();try{page.once('dialog',d=>d.accept());await row(page,'opened').getByRole('button',{name:'Удалить заявку',exact:true}).click();await row(page,'opened').waitFor({state:'hidden'});const after=await inspect(context);assert.ok(!after.attempts.some(a=>a.registration_id==='intent-ui-opened'));assert.equal(after.attempts.length,3);assert.doesNotMatch(await page.getByRole('button').filter({hasText:'PAYMENT_INTENT_UI_EVENT'}).innerText(),/🔥/);}finally{await context.close();}
 });
 for(const width of [390,1280])await test(width+' Mini App pay waits for validated server response, tracks one click and resumes the same attempt',async()=>{
  const{context,page}=await contextFor(width);const id=subject++;await installSdk(context,{id,start:''});await context.request.post(base+'/api/test-miniapp-state',{data:{id,kind:'home'}});
  try{
   await page.goto(base+'/miniapp?event=fixture-paid');await openEventRegistration(page);await page.locator('[data-calculated-total]').waitFor();await page.locator('[data-calculated-total] button').click();await page.locator('[data-payment-handoff]').waitFor();
   let state=await inspect(context);const item=state.attempts[0];assert.equal(item.opened_at,null);assert.equal(item.open_count,0);
   let held,calls=0;await context.route('**/api/telegram/miniapp/payments/open',route=>{calls++;held=route;});
   const pay=page.getByRole('button',{name:'Оплатить участие',exact:true});await pay.click();await page.waitForFunction(()=>document.querySelector('#miniapp-receipt button')?.disabled);
   for(let i=0;!held&&i<100;i++)await new Promise(r=>setTimeout(r,20));assert.ok(held);assert.deepEqual(JSON.parse(held.request().postData()),{registrationId:item.registration_id});assert.equal(await page.evaluate(()=>window.__miniappFixture.calls.links.length),0);await pay.dispatchEvent('click');assert.equal(calls,1);
   await held.continue();await context.unroute('**/api/telegram/miniapp/payments/open');await page.waitForFunction(()=>window.__miniappFixture.calls.links.length===1);
   state=await inspect(context);assert.equal(state.attempts[0].open_count,1);assert.equal(state.attempts[0].last_opened_source,'telegram');assert.equal(state.attempts[0].status,'pending');assert.equal(state.attempts[0].confirmed_at,null);
   const first=state.attempts[0].opened_at;await pay.click();await page.waitForFunction(()=>window.__miniappFixture.calls.links.length===2);state=await inspect(context);assert.equal(state.attempts[0].open_count,2);assert.equal(state.attempts[0].opened_at,first);
   await page.reload();await page.getByRole('heading',{name:'Осталось оплатить участие',exact:true}).waitFor();assert.equal((await inspect(context)).registrations.length,1);
  }finally{await context.close();}
 });
 await test('Mini App payment endpoint rejection displays retryable error and opens no cached URL',async()=>{
  const{context,page}=await contextFor();const id=subject++;await installSdk(context,{id,start:''});await context.request.post(base+'/api/test-miniapp-state',{data:{id,kind:'home'}});
  try{await page.goto(base+'/miniapp?event=fixture-paid');await openEventRegistration(page);await page.locator('[data-calculated-total]').waitFor();await page.locator('[data-calculated-total] button').click();await page.locator('[data-payment-handoff]').waitFor();await context.route('**/api/telegram/miniapp/payments/open',route=>route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({ok:false,error:'payment_unavailable'})}));await page.getByRole('button',{name:'Оплатить участие',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.evaluate(()=>window.__miniappFixture.calls.links.length),0);assert.equal((await inspect(context)).attempts[0].open_count,0);}finally{await context.close();}
 });
 for(const width of [390,1280])await test(width+' website opens iframe only from tracked server handoff and retains custom1',async()=>{
  const{context,page}=await contextFor(width);await context.addCookies([{name:'_community_fixture',value:'fixture-mom',url:base}]);await context.route('https://shutaf.im/**',route=>route.fulfill({contentType:'text/html',body:'Synthetic provider; no payment'}));
  try{await page.goto(base+'/events/fixture-paid');await page.getByRole('button',{name:'Записаться на мероприятие',exact:true}).click();await page.getByRole('button',{name:'Оплатить',exact:true}).click();const iframe=page.locator('iframe[title="Оплата Shutafim"]');await iframe.waitFor();const state=await inspect(context);assert.equal(state.attempts.length,1);assert.equal(state.attempts[0].open_count,1);assert.equal(state.attempts[0].last_opened_source,'website');assert.equal(state.attempts[0].status,'pending');assert.equal(new URL(await iframe.getAttribute('src')).searchParams.get('custom1'),state.registrations[0].id);await page.getByRole('button',{name:'Закрыть окно оплаты',exact:true}).click();assert.equal((await inspect(context)).attempts[0].open_count,1);}finally{await context.close();}
 });
 assert.deepEqual(errors,[]);console.log('TOTAL '+checks.length+' PASS');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'payment-intent-browser-results.json'),JSON.stringify({checks,errors,exitCode:process.exitCode||0,environment:'Playwright actual local UI/actions/SQL; mock identity/Bot API/provider; no real delivery or payment'},null,2)+'\n');});
