/* Actual local UI -> HMAC/session -> production routes -> isolated SQL. No real sends/identity. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/tmp/menora-browser-runtime/node_modules/playwright');
const {installSdk,openEventRegistration}=require('./miniapp-ui-sdk.cjs');
const base='http://127.0.0.1:3342',out=process.env.COMMUNITY_TEST_OUTPUT||'/tmp/menora-ui-polish-evidence/polish-browser';
const checks=[],errors=[],shots=[],metrics=[];let browser,id=787000;
async function test(name,fn){await fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}
async function setup({width=390,language='ru',kind=null,start='',query='',slow=false,subscriptionFailure=false}={}){
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'}),subject=id++;
 await installSdk(context,{id:subject,language,start});
 await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
 if(subscriptionFailure)await context.route('**/api/telegram/miniapp/start',async route=>{const response=await route.fetch(),data=await response.json();data.announcementStatus=null;await route.fulfill({response,json:data});});
 if(slow)await context.route('**/api/telegram/miniapp/start',async route=>{await new Promise(r=>setTimeout(r,500));const response=await route.fetch(),data=await response.json();if(data.homeEvents?.length>=2){data.homeEvents[0].imageUrl='/test-missing-event-image.png';data.homeEvents[1].imageUrl=null;}await route.fulfill({response,json:data});});
 if(kind)assert.equal((await context.request.post(base+'/api/test-miniapp-state',{data:{id:subject,kind,language}})).status(),200);
 const page=await context.newPage();page.setDefaultTimeout(40000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/miniapp'+query);return{context,page,subject};
}
async function fit(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');}
async function shot(page,name){await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});shots.push(name+'.png');}
async function finishProfile(page){
 for(const[key,value]of Object.entries({firstName:'Synthetic Ad',lastName:'Entry',phone:'+972501234567',dateOfBirth:'1990-01-01'}))await page.locator('#profile-'+key).fill(value);
 await page.locator('#profile-city').fill('Ришон');await page.getByRole('option').filter({hasText:'Ришон ле-Цион'}).first().click();
 await page.locator('#profile-marital').selectOption('single');await page.locator('input[type=checkbox][required]').check();
 await page.locator('[data-miniapp-form=profile] button[type=submit]').click();
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});assert.equal((await(await fetch(base+'/api/test-miniapp-state')).json()).testDatabase,'isolated-pglite');await fetch(base+'/api/test-state',{method:'POST'});
 browser=await chromium.launch({headless:true});
 for(const language of ['ru','he','en']){
  await test(language+' new ad entrant: event preview -> gate -> filter -> profile -> edit filter -> same event -> registration -> reload',async()=>{
   const{context,page,subject}=await setup({language,start:'event_fixture-event'});
   try{
    await page.locator('[data-event-entry=fixture-event]').waitFor();assert.equal(await page.locator('[data-screen=home]').count(),0);
    assert.equal(await page.locator('.miniapp').getAttribute('dir'),'ltr');
    assert.equal(await page.locator('[data-miniapp-form]').count(),0);await fit(page);await shot(page,language+'-ad-preview');
    await page.locator('[data-entry-register]').click();await page.locator('[data-onboarding-gate]').waitFor();await shot(page,language+'-ad-gate');
    await page.locator('[data-onboarding-gate] button').click();await page.locator('[data-screen=filter]').waitFor();
    await page.locator('[name=affiliation][value=giyur]').check();await page.locator('[name=gender][value=male]').check();assert.equal(await page.locator('[name=giyurStage]').count(),0);
    await page.locator('[data-miniapp-form=filter] button[type=submit]').click();await page.locator('[data-screen=profile]').waitFor();
    assert.equal(new URL(page.url()).searchParams.get('event'),'fixture-event');assert.equal(await page.locator('[name=giyurStage]').count(),0);
    await page.locator('main > section > button.miniapp-text-action').last().click();await page.locator('[data-screen=filter]').waitFor();await page.locator('[data-miniapp-form=filter] button[type=submit]').click();await page.locator('[data-screen=profile]').waitFor();
    await finishProfile(page);await page.locator('[data-event-detail=fixture-event]').waitFor();await page.locator('[data-onboarding-complete]').waitFor();
    const profile=await(await context.request.get(base+'/api/telegram/miniapp/profile')).json();assert.equal(profile.summary.nextStep,'home');assert.equal(profile.profile.agreedToPrivacy,true);assert.equal(profile.profile.cityId,'8300');assert.equal(profile.profile.gender,'male');
    await openEventRegistration(page);assert.equal(await page.locator('#miniapp-participants input[type=checkbox]').count(),1);

    await openEventRegistration(page);await page.locator('[data-calculated-total] button').click();await page.locator('[data-payment-handoff]').waitFor();await shot(page,language+'-ad-registered');
    await page.reload();await page.locator('[data-event-detail=fixture-event]').waitFor();await page.locator('[data-payment-handoff]').waitFor();
    const state=await(await context.request.get(base+'/api/test-miniapp-state')).json(),contact=state.contacts.find(c=>c.telegram_user_id===String(subject));
    assert.equal(contact.first_start_param,'event_fixture-event');assert.equal(contact.last_start_param,'event_fixture-event');assert.equal(contact.marketing_status,'subscribed');
    assert.equal(await page.locator('[data-miniapp-form]').count(),0);await fit(page);
   }finally{await context.close();}
  });
  await test(language+' returning ad entrant opens detail directly and retains registered state',async()=>{
   const{context,page}=await setup({language,kind:'home',start:'event_fixture-event'});
   try{await page.locator('[data-event-detail=fixture-event]').waitFor();assert.equal(await page.locator('[data-onboarding-gate],[data-miniapp-form],[data-upcoming-events]').count(),0);await openEventRegistration(page);await page.locator('[data-calculated-total] button').click();await page.locator('[data-payment-handoff]').waitFor();await page.reload();await page.locator('[data-payment-handoff]').waitFor();assert.equal(await page.locator('a[href="#miniapp-receipt"]').count(),1);await fit(page);}finally{await context.close();}
  });
 }
 await test('legacy completed profile from an ad requires only the new filter and returns with confirmation',async()=>{const{context,page}=await setup({kind:'legacy',start:'event_fixture-event'});try{await page.locator('[data-entry-register]').click();await page.locator('[data-onboarding-gate] button').click();await page.locator('[data-screen=filter]').waitFor();await page.locator('[name=affiliation][value=giyur]').check();await page.locator('[name=gender][value=male]').check();await page.locator('[data-miniapp-form=filter] button[type=submit]').click();await page.locator('[data-event-detail=fixture-event]').waitFor();await page.locator('[data-onboarding-complete]').waitFor();assert.equal(await page.locator('[data-miniapp-form]').count(),0);const data=await(await context.request.get(base+'/api/telegram/miniapp/profile')).json();assert.equal(data.summary.nextStep,'home');assert.equal(data.profile.cityId,'8300');assert.equal(data.profile.agreedToPrivacy,true);}finally{await context.close();}});
 for(const width of [320,390,1280])await test(width+' generic home is events-first, fixed icons/ratio, stable fallback, no opt-in card',async()=>{
  const{context,page}=await setup({width,kind:'home',slow:true});try{
   await page.locator('[data-screen=loading] [data-skeleton]').first().waitFor();await page.locator('[data-screen=home]').waitFor();
   await page.locator('[data-upcoming-events] [data-event-card]').first().waitFor();
   const positions=await page.evaluate(()=>{const card=document.querySelector('[data-upcoming-events] [data-event-card]'),status=document.querySelector('[data-profile-status]');return{card:card.getBoundingClientRect().top,status:status.getBoundingClientRect().top,height:innerHeight};});
   assert.ok(positions.card<positions.height/2);assert.ok(positions.card<positions.status);
   assert.equal(await page.locator('.miniapp-nav button svg').count(),5);
   assert.equal(await page.locator('[data-announcement-status] button,[data-announcement-status] input').count(),0);
   assert.equal(await page.getByRole('button',{name:/Подписаться|Получать анонсы/}).count(),0);
   const image=page.locator('[data-upcoming-events] .miniapp-event-image').first(),box=await image.boundingBox();assert.ok(Math.abs(box.width/box.height-16/9)<.02);
   await page.waitForFunction(()=>document.querySelectorAll('[data-upcoming-events] [data-image-fallback=true]').length===2);assert.equal(await page.locator('[data-upcoming-events] [data-image-fallback=true]').count(),2);assert.deepEqual(await image.boundingBox(),box);
   for(const button of await page.locator('.miniapp-nav button').all()){const b=await button.boundingBox();assert.ok(b.height>=44);assert.ok(b.y+b.height<=844);}
   const motion=await page.locator('main').evaluate(node=>getComputedStyle(node).animationName);assert.equal(motion,'none');
   metrics.push({width,...positions,ratio:box.width/box.height});await fit(page);await page.evaluate(()=>window.scrollTo(0,0));await shot(page,width+'-home');
  }finally{await context.close();}
 });
 await test('reduced viewport preserves focus and separates the form CTA, bottom navigation and safe area',async()=>{const{context,page}=await setup({kind:'home'});try{await page.locator('[data-screen=home]').waitFor();await page.locator('.miniapp-nav button').last().click();await page.locator('#profile-phone').focus();await page.setViewportSize({width:390,height:480});await page.evaluate(()=>{window.Telegram.WebApp.viewportStableHeight=480;window.__miniappFixture.emit('viewportChanged');});await page.locator('#profile-phone').scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const input=document.querySelector('#profile-phone').getBoundingClientRect(),submit=document.querySelector('[data-miniapp-form=profile] button[type=submit]').getBoundingClientRect();return input.bottom<=submit.top+1;});const input=await page.locator('#profile-phone').boundingBox(),submit=await page.locator('[data-miniapp-form=profile] button[type=submit]').boundingBox(),nav=await page.locator('.miniapp-nav').boundingBox();assert.equal(await page.evaluate(()=>document.activeElement.id),'profile-phone');assert.ok(submit.y+submit.height<=nav.y+1);assert.ok(nav.y+nav.height<=480);assert.ok(input.y+input.height<=submit.y+1);await fit(page);}finally{await context.close();}});
 await test('announcement status failure is clear, secondary and offers no opt-in control',async()=>{const{context,page}=await setup({kind:'home',subscriptionFailure:true});try{await page.locator('[data-announcement-status]').getByText('Не удалось узнать статус анонсов. Откройте приложение ещё раз.',{exact:true}).waitFor();assert.equal(await page.locator('[data-announcement-status] button,[data-announcement-status] input').count(),0);await page.locator('[data-upcoming-events] [data-event-card]').first().waitFor();await fit(page);}finally{await context.close();}});
 await test('invalid ad link offers a clear error without bypassing filter',async()=>{const{context,page}=await setup({start:'event_missing'});try{await page.locator('[data-screen=filter]').waitFor();await page.locator('.miniapp [role=alert]').waitFor();assert.equal(await page.locator('[data-event-detail]').count(),0);await fit(page);}finally{await context.close();}});
 await test('third category remains resources even with event ad hint',async()=>{const{context,page}=await setup({kind:'resources',start:'event_fixture-event'});try{await page.locator('[data-screen=resources]').waitFor();assert.equal(await page.locator('[data-event-entry],[data-event-detail],[data-upcoming-events]').count(),0);}finally{await context.close();}});
 assert.deepEqual(errors,[]);console.log('TOTAL '+checks.length+' PASS');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'miniapp-polish-browser-results.json'),JSON.stringify({environment:'Local Chromium + actual HTTP/session/SQL, synthetic signed Telegram SDK; no real Telegram sends or payments',checks,errors,shots,metrics,realTelegramWebView:'NOT VERIFIED',exitCode:process.exitCode||0},null,2)+'\n');});
