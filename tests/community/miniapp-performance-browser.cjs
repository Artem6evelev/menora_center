/* Aggregate measurements on real local UI/API/SQL; synthetic HMAC SDK only.
 * Run after miniapp-performance-fixture.cjs; never against production. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const{chromium}=require('/tmp/menora-browser-runtime/node_modules/playwright');const{installSdk,signedInitData}=require('./miniapp-ui-sdk.cjs');
const base='http://127.0.0.1:3342',out=process.env.COMMUNITY_TEST_OUTPUT||'/tmp/menora-performance-evidence/performance-browser';
const checks=[],measurements=[],errors=[];let browser,id=789700;
async function test(name,fn){await fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}
async function setup({kind='home',query='',cookie=true,width=390,subject=id++}={}){
 const c=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});await installSdk(c,{id:subject,start:''});
 await c.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
 if(kind)assert.equal((await c.request.post(base+'/api/test-miniapp-state',{data:{id:subject,kind}})).status(),200);
 if(cookie)assert.equal((await c.request.post(base+'/api/telegram/miniapp/bootstrap',{headers:{origin:base},data:{initData:signedInitData(subject,'ru','')}})).status(),200);
 await c.request.post(base+'/api/test-performance');const p=await c.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.message));const requests=[];
 p.on('request',r=>{if(r.url().includes('/api/telegram/miniapp/'))requests.push({path:new URL(r.url()).pathname.replace('/api/telegram/miniapp/','')+new URL(r.url()).search,method:r.method()});});
 await p.goto(base+'/miniapp'+query);return{c,p,requests,subject};
}
const settle=p=>p.waitForLoadState('networkidle');
const tab=(p,label)=>p.locator('.miniapp-nav').getByRole('button',{name:label,exact:true}).click();
const db=async c=>(await c.request.get(base+'/api/test-performance')).json();
const profile=async c=>(await c.request.get(base+'/api/telegram/miniapp/profile')).json();
(async()=>{fs.mkdirSync(out,{recursive:true});browser=await chromium.launch({headless:true});
 assert.equal((await(await fetch(base+'/api/test-performance')).json()).testDatabase,'isolated-pglite');
 await fetch(base+'/api/test-state',{method:'POST'});
 for(const width of[320,390])await test(width+' returning Home: one startup, two previews, no events/subscription waterfall, fixed RU layout and marks',async()=>{
  const{c,p,requests}=await setup({width});try{
   await p.locator('[data-upcoming-events] [data-event-card]').first().waitFor();await settle(p);
   assert.deepEqual(requests,[{path:'start',method:'POST'}]);const stats=await db(c);assert.equal(stats.locked,0);assert.deepEqual(stats.kinds,{SELECT:5});
   const marks=await p.evaluate(()=>performance.getEntriesByType('mark').filter(e=>e.name.startsWith('miniapp:')).map(e=>({name:e.name,startTime:e.startTime})));
   for(const name of['sdk-ready','start-request','start-response','ready','home-content'])assert.ok(marks.some(e=>e.name==='miniapp:'+name));
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await p.locator('.miniapp').getAttribute('lang'),'ru');
   assert.equal(await p.locator('.miniapp-nav button').count(),5);assert.equal(await p.locator('[data-upcoming-events] [data-event-card]').count(),2);
   measurements.push({scenario:'returning-home-'+width,requests:[...requests],db:stats,marks});
   if(width===390){
    const actions=[['events','Мероприятия','[data-miniapp-events=events] [data-event-card]'],['detail',null,'[data-event-detail]'],['back',null,'[data-miniapp-events=events] [data-event-card]'],['registrations','Мои записи','[data-miniapp-events=registrations]'],['kids','Menorah Kids','[data-kids-family]'],['home','Главная','[data-screen=home]'],['events-cached','Мероприятия','[data-miniapp-events=events] [data-event-card]'],['registrations-cached','Мои записи','[data-miniapp-events=registrations]']];
    for(const[action,label,selector]of actions){const before=requests.length;await c.request.post(base+'/api/test-performance');if(label)await tab(p,label);else if(action==='detail')await p.locator('[data-event-card] .miniapp-event-open').first().click();else await p.evaluate(()=>window.__miniappFixture.back());await p.locator(selector).first().waitFor();await settle(p);const delta=requests.slice(before);measurements.push({scenario:action,requests:delta,db:await db(c)});
     if(['back','home','events-cached','registrations-cached'].includes(action))assert.equal(delta.length,0,action+JSON.stringify(delta));
     if(action==='kids')assert.deepEqual(delta,[{path:'kids',method:'GET'}]);
     if(action==='events')assert.deepEqual(delta,[{path:'events?page=1',method:'GET'}]);
     if(action==='registrations')assert.deepEqual(delta,[{path:'registrations?page=1',method:'GET'}]);
    }
    await p.evaluate(()=>{const original=Date.now;Date.now=()=>original()+31_000;});const beforeExpiry=requests.length;await tab(p,'Главная');await p.locator('[data-upcoming-events] [data-event-card]').first().waitFor();await settle(p);assert.deepEqual(requests.slice(beforeExpiry),[{path:'events?preview=home',method:'GET'}]);
   }
  }finally{await c.close();}
 });
 await test('resources lazy screen has its own boundary and never restarts startup or exposes events',async()=>{const{c,p,requests}=await setup({kind:'resources',query:'?event=fixture-event'});try{await p.locator('[data-screen=resources] a[href="https://noahideworldcenter.org/ru"]').first().waitFor();await settle(p);assert.deepEqual(requests,[{path:'start',method:'POST'}]);assert.equal(await p.locator('[data-event-card],[data-event-entry]').count(),0);}finally{await c.close();}});
 await test('new subject boots to filter with one startup, no session/bootstrap/profile HTTP chain',async()=>{const{c,p,requests}=await setup({kind:null,cookie:false});try{await p.locator('[data-screen=filter]').waitFor();await settle(p);assert.deepEqual(requests,[{path:'start',method:'POST'}]);measurements.push({scenario:'new-user',requests:[...requests],db:await db(c)});}finally{await c.close();}});
 await test('new ad subject receives bounded event preview in its only startup response',async()=>{const{c,p,requests}=await setup({kind:null,cookie:false,query:'?event=fixture-event'});try{await p.locator('[data-event-entry=fixture-event]').waitFor();await settle(p);assert.deepEqual(requests,[{path:'start',method:'POST'}]);measurements.push({scenario:'new-event-ad',requests:[...requests],db:await db(c)});}finally{await c.close();}});
 await test('returning event ad keeps destination; detail authorization stays separate from launch preview',async()=>{const{c,p,requests}=await setup({query:'?event=fixture-event'});try{await p.locator('[data-event-detail=fixture-event]').waitFor();await settle(p);assert.deepEqual(requests,[{path:'start',method:'POST'},{path:'events?id=fixture-event',method:'GET'}]);measurements.push({scenario:'returning-event-ad',requests:[...requests],db:await db(c)});}finally{await c.close();}});
 await test('returning ad paints the public startup preview while protected detail is pending, without exposing checkout fields',async()=>{
  const c=await browser.newContext({viewport:{width:390,height:844}}),subject=id++;let release;try{await installSdk(c,{id:subject,start:''});await c.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());await c.request.post(base+'/api/test-miniapp-state',{data:{id:subject,kind:'home'}});
   await c.route('**/api/telegram/miniapp/events?id=*',async route=>{await new Promise(r=>{release=r;});await route.continue().catch(()=>{});});
   const p=await c.newPage();p.setDefaultTimeout(60000);await p.goto(base+'/miniapp?event=fixture-event');await p.locator('[data-event-launch-preview=fixture-event]').waitFor();
   assert.equal(await p.locator('[data-event-detail],input[type=checkbox],[data-calculated-total]').count(),0);
   await p.getByRole('heading',{name:'PRIVATE_SYNTHETIC_EVENT_TITLE',exact:true}).waitFor();await p.waitForFunction(()=>performance.getEntriesByName('miniapp:ready').length>0);
   while(!release)await new Promise(r=>setTimeout(r,10));release();await p.locator('[data-event-detail=fixture-event]').waitFor();assert.equal(await p.locator('[data-event-launch-preview]').count(),0);
  }finally{await c.close();}
 });
 await test('direct Kids startup uses one startup plus one Kids GET; never loads profile after Kids',async()=>{const{c,p,requests}=await setup({query:'?section=kids'});try{await p.locator('[data-kids-family]').waitFor();await settle(p);assert.deepEqual(requests,[{path:'start',method:'POST'},{path:'kids',method:'GET'}]);assert.equal(await p.locator('.miniapp-nav button[aria-current=page]').textContent(),'Menorah Kids');measurements.push({scenario:'direct-kids',requests:[...requests],db:await db(c)});await p.evaluate(()=>window.__miniappFixture.back());await p.locator('[data-screen=home]').waitFor();}finally{await c.close();}});
 await test('register shows returned receipt immediately, no list/detail refetch; registration cache refreshes lazily',async()=>{const{c,p,requests}=await setup({query:'?event=fixture-paid'});try{await p.locator('[data-event-detail=fixture-paid]').waitFor();await p.getByRole('button',{name:'Рассчитать стоимость',exact:true}).click();await p.locator('[data-calculated-total]').waitFor();const before=requests.length;await p.locator('[data-calculated-total] button').click();await p.locator('[data-payment-handoff]').waitFor();await settle(p);assert.deepEqual(requests.slice(before),[{path:'events',method:'POST'}]);assert.equal(await p.getByText('Вы записаны',{exact:true}).count(),0);await tab(p,'Мои записи');await p.locator('[data-miniapp-events=registrations]').waitFor();await settle(p);assert.ok(requests.at(-1).path==='registrations?page=1');}finally{await c.close();}});
 await test('logout clears cached registrations and relogin creates a fresh startup/session',async()=>{const{c,p,requests}=await setup();try{await p.locator('[data-screen=home]').waitFor();await tab(p,'Мои записи');await settle(p);await tab(p,'Главная');await p.locator('[data-screen=home]').waitFor();let before=requests.length;await p.getByRole('button',{name:'Выйти',exact:true}).click();await p.locator('[data-screen=logout]').waitFor();assert.equal((await c.request.get(base+'/api/telegram/miniapp/profile')).status(),401);measurements.push({scenario:'logout',requests:requests.slice(before)});before=requests.length;await p.getByRole('button',{name:'Войти снова',exact:true}).click();await p.locator('[data-screen=home]').waitFor();await settle(p);assert.deepEqual(requests.slice(before),[{path:'start',method:'POST'}]);measurements.push({scenario:'relogin',requests:requests.slice(before)});await tab(p,'Мои записи');await settle(p);assert.ok(requests.at(-1).path==='registrations?page=1');}finally{await c.close();}});
 await test('live SDK account switch clears old profile/cache; in-flight private response cannot repaint the next identity',async()=>{
  const{c,p,requests,subject}=await setup();try{await p.locator('[data-screen=home]').waitFor();const next=id++;await c.request.post(base+'/api/test-miniapp-state',{data:{id:next,kind:'male'}});
   let release,arrived;const waiting=new Promise(r=>{arrived=r;});await c.route('**/api/telegram/miniapp/registrations*',async route=>{const response=await route.fetch();arrived();await new Promise(r=>{release=r;});await route.fulfill({response}).catch(()=>{});});await tab(p,'Мои записи');await waiting;
   const before=requests.length;await p.evaluate(raw=>{window.Telegram.WebApp.initData=raw;window.__miniappFixture.emit('activated');},signedInitData(next,'ru',''));
   await p.locator('[data-screen=home]').waitFor();release();await settle(p);assert.deepEqual(requests.slice(before),[{path:'start',method:'POST'}]);
   const snapshot=await profile(c);assert.equal(snapshot.profile.gender,'male');assert.equal(snapshot.profile.childrenData[0].id,'synthetic-child-'+next);assert.notEqual(snapshot.profile.childrenData[0].id,'synthetic-child-'+subject);
   await c.unroute('**/api/telegram/miniapp/registrations*');const count=requests.length;await tab(p,'Мои записи');await settle(p);assert.equal(requests.slice(count).filter(r=>r.path==='registrations?page=1').length,1);measurements.push({scenario:'account-switch',requests:requests.slice(before)});
  }finally{await c.close();}
 });
 await test('account switch during the startup response rejects the old snapshot before React effect cleanup',async()=>{
  const c=await browser.newContext({viewport:{width:390,height:844}}),first=id++,second=id++;try{
   await installSdk(c,{id:first,start:''});await c.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
   for(const [subject,kind]of[[first,'home'],[second,'male']])assert.equal((await c.request.post(base+'/api/test-miniapp-state',{data:{id:subject,kind}})).status(),200);
   let release,arrived;const waiting=new Promise(r=>{arrived=r;});let held=false;
   await c.route('**/api/telegram/miniapp/start',async route=>{if(held)return route.continue();held=true;const response=await route.fetch();arrived();await new Promise(r=>{release=r;});await route.fulfill({response}).catch(()=>{});});
   const p=await c.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/miniapp');await waiting;
   await p.evaluate(raw=>{window.Telegram.WebApp.initData=raw;window.__miniappFixture.emit('activated');},signedInitData(second,'ru',''));
   await p.locator('[data-screen=home]').waitFor();release();await settle(p);assert.equal((await profile(c)).profile.gender,'male');
   await tab(p,'Menorah Kids');await p.locator('[data-kids-gate]').waitFor();assert.equal(await p.locator('[data-kids-family]').count(),0);
  }finally{await c.close();}
 });
 for(const mode of ['profile','giyur'])await test(mode+' late mutation response cannot restore the previous account snapshot or busy/dirty state',async()=>{
  const{c,p}=await setup({kind:mode==='giyur'?'giyur-unknown':'home',query:mode==='giyur'?'?event=fixture-event':''});let release;try{
   if(mode==='profile'){await p.locator('[data-screen=home]').waitFor();await tab(p,'Профиль');await p.locator('#profile-firstName').fill('DELAYED_PRIVATE_ACCOUNT_A');}
   else{await p.locator('[data-event-detail=fixture-event]').waitFor();await p.getByRole('button',{name:'Уточнить стадию гиюра для записи детей',exact:true}).click();await p.getByLabel('Гиюр завершён',{exact:true}).check();}
   let arrived;const waiting=new Promise(r=>{arrived=r;});await c.route('**/api/telegram/miniapp/'+mode,async route=>{if(route.request().method()!=='POST')return route.continue();const response=await route.fetch();arrived();await new Promise(r=>{release=r;});await route.fulfill({response}).catch(()=>{});});
   if(mode==='profile')await p.locator('[data-miniapp-form=profile] button[type=submit]').click();else await p.locator('.miniapp-stage button').click();await waiting;
   const next=id++;await c.request.post(base+'/api/test-miniapp-state',{data:{id:next,kind:'male'}});
   // Remove the old navigation hint before opening the next identity's Home.
   await p.evaluate(raw=>{history.replaceState(history.state,'','/miniapp');window.Telegram.WebApp.initData=raw;window.__miniappFixture.emit('activated');},signedInitData(next,'ru',''));
   await p.locator('[data-screen=home]').waitFor();release();await settle(p);await tab(p,'Профиль');await p.locator('#profile-firstName').waitFor();
   assert.equal(await p.locator('#profile-firstName').inputValue(),'Synthetic');assert.equal(await p.getByRole('button',{name:'Добавить ребёнка',exact:true}).count(),0);
   assert.equal((await profile(c)).profile.gender,'male');assert.equal(await p.locator('[data-miniapp-form=profile] button[type=submit]').isEnabled(),true);
  }finally{release?.();await c.close();}
 });
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({environment:'Local warmed development Chromium with synthetic signed Telegram SDK, isolated PGlite; no production latency/device claim',checks,measurements,errors,realTelegramWebView:'NOT VERIFIED'},null,2)+'\n');console.log(`${checks.length}/${checks.length} performance browser checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
