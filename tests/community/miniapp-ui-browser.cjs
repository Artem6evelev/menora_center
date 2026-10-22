/* Local Chromium E2E. Actual Mini App UI + API + HMAC + sessions + SQL.
 * Telegram SDK/native chrome are explicit synthetic adapters, not real WebView acceptance. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/tmp/menora-browser-runtime/node_modules/playwright');
const {installSdk}=require('./miniapp-ui-sdk.cjs');
const base='http://127.0.0.1:3342',out=process.env.COMMUNITY_TEST_OUTPUT||path.resolve(__dirname,'../../docs/miniapp-ui-v1/evidence');
const checks=[],errors=[],shots=[];let browser,id=760010;
async function test(name,fn){await fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}
async function shot(page,name){await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});shots.push(name+'.png');}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');}
async function setup(viewport,kind,language='ru',options={}){
 const subject=id++,context=await browser.newContext({viewport,locale:'ru-RU'});await installSdk(context,{id:subject,language,...options});
 await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
 if(kind){const result=await context.request.post(base+'/api/test-miniapp-state',{data:{id:subject,kind,language}});assert.equal(result.status(),200);}
 const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',error=>errors.push(error.message));
 return{context,page,subject};
}
async function state(context){const result=await context.request.get(base+'/api/test-miniapp-state');const value=await result.json();assert.equal(value.testDatabase,'isolated-pglite');return value;}
async function fields(page){
 for(const [name,value] of Object.entries({firstName:'Visual',lastName:'Synthetic',phone:'+972501234567',dateOfBirth:'1990-02-03'}))await page.locator('#profile-'+name).fill(value);
 await page.locator('#profile-city').fill('Ришон');await page.getByRole('option').filter({hasText:'Ришон ле-Цион'}).first().click();await page.locator('#profile-marital').selectOption('single');
 await page.getByRole('checkbox',{name:/Я соглашаюсь/}).check();
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});browser=await chromium.launch({headless:true});
 const probe=await (await fetch(base+'/api/test-miniapp-state')).json();assert.equal(probe.testDatabase,'isolated-pglite');
 const reset=await (await fetch(base+'/api/test-state',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).json();assert.equal(reset.testDatabase,'isolated-pglite');assert.equal(reset.reset,true);
 for(const [name,width,height] of [['390',390,844],['320',320,700],['desktop',1280,1000]]){
  const {context,page,subject}=await setup({width,height});let bootstraps=0;
  page.on('request',request=>{if(request.url().endsWith('/bootstrap'))bootstraps++});
  await context.route('**/api/telegram/miniapp/session',async route=>{await new Promise(resolve=>setTimeout(resolve,500));await route.continue()});
  await page.goto(base+'/miniapp');
  await test(name+' splash uses brand and loading before API response',async()=>{await page.getByRole('status').filter({hasText:'Загружаем ваш кабинет'}).waitFor();await shot(page,name+'-splash');});
  await page.locator('[data-screen=filter]').waitFor();
  await test(name+' new subject filter: three choices, initially no gender or stage, no website navigation/footer',async()=>{
   assert.equal(await page.locator('[name=affiliation]').count(),3);assert.equal(await page.locator('[name=gender]').count(),0);assert.equal(await page.locator('[name=giyurStage]').count(),0);assert.equal(await page.locator('footer').count(),0);assert.equal(await page.locator('nav').count(),0);await noOverflow(page);await shot(page,name+'-filter');
  });
  await test(name+' maternal/giyur reveal gender; none hides it; changing choices retains correct state',async()=>{
   for(const affiliation of ['maternal','giyur']){await page.locator(`[name=affiliation][value=${affiliation}]`).check();assert.equal(await page.locator('[name=gender]').count(),2);assert.equal(await page.locator('[name=giyurStage]').count(),0);}
   await page.locator('[name=affiliation][value=none]').check();assert.equal(await page.locator('[name=gender]').count(),0);
   await page.locator('[name=affiliation][value=maternal]').check();await page.locator('[name=gender][value=female]').check();await page.getByRole('button',{name:'Продолжить',exact:true}).click();await page.locator('[data-screen=profile]').waitFor();
  });
  await test(name+' questionnaire has canonical CityPicker and no email; consent is required',async()=>{
   assert.equal(await page.locator('input[type=email]').count(),0);assert.equal(await page.locator('[name=giyurStage]').count(),0);assert.equal(await page.getByRole('checkbox',{name:/Я соглашаюсь/}).getAttribute('required'),'');
   await fields(page);const font=await page.locator('#profile-firstName').evaluate(node=>getComputedStyle(node).fontSize);assert.ok(parseFloat(font)>=16);await noOverflow(page);await shot(page,name+'-profile');
  });
  await test(name+' maternal female child editor validates gender and supports local save/edit/delete',async()=>{
   await page.getByRole('checkbox',{name:'Есть дети',exact:true}).check();await page.getByRole('button',{name:'Добавить ребёнка',exact:true}).click();
   await page.getByLabel('Имя ребёнка',{exact:true}).fill('Synthetic child');await page.getByLabel('Дата рождения ребёнка',{exact:true}).fill('2020-01-01');
   await page.getByRole('button',{name:'Сохранить',exact:true}).click();await page.getByRole('alert').filter({hasText:'пол ребёнка'}).waitFor();
   await page.getByLabel('Девочка',{exact:true}).check();await noOverflow(page);await shot(page,name+'-child-editor');
   await page.getByRole('button',{name:'Сохранить',exact:true}).click();await page.getByRole('button',{name:'Изменить',exact:true}).click();await page.getByLabel('Имя ребёнка',{exact:true}).fill('Edited synthetic child');await page.getByRole('button',{name:'Сохранить',exact:true}).click();
   await page.getByText('Edited synthetic child',{exact:true}).waitFor();await page.getByRole('button',{name:'Удалить',exact:true}).click();assert.equal(await page.getByText('Edited synthetic child',{exact:true}).count(),0);
   await page.getByRole('checkbox',{name:'Есть дети',exact:true}).check();await page.getByRole('button',{name:'Добавить ребёнка',exact:true}).click();await page.getByLabel('Имя ребёнка',{exact:true}).fill('Saved synthetic child');await page.getByLabel('Дата рождения ребёнка',{exact:true}).fill('2020-01-01');await page.getByLabel('Мальчик',{exact:true}).check();await page.getByRole('button',{name:'Сохранить',exact:true}).click();
  });
  await test(name+' save failure preserves entered fields/child and allows retry',async()=>{
   let fail=true;await context.route('**/api/telegram/miniapp/profile',route=>{if(fail&&route.request().method()==='POST'){fail=false;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:'temporarily_unavailable'})})}return route.continue()});
   await page.getByRole('button',{name:'Сохранить анкету',exact:true}).click();await page.getByRole('alert').filter({hasText:'Не удалось сохранить'}).waitFor();assert.equal(await page.locator('#profile-firstName').inputValue(),'Visual');await page.getByText('Saved synthetic child',{exact:true}).waitFor();
   await page.getByRole('button',{name:'Сохранить анкету',exact:true}).click();await page.locator('[data-screen=home]').waitFor();
  });
  await test(name+' home persists profile, child, city and consent after reload without repeated bootstrap',async()=>{
   await noOverflow(page);await shot(page,name+'-home');const before=await state(context),owner=before.identities.find(i=>i.provider_user_id===String(subject)).user_id,user=before.users.find(u=>u.id===owner);
   assert.equal(user.email,null);assert.equal(user.city_id,'8300');assert.equal(user.agreed_to_privacy,true);assert.equal(user.children_data[0].gender,'male');assert.equal(user.first_name,'Visual');assert.ok(user.date_of_birth.startsWith('1990-02-03'));assert.equal(before.users.filter(u=>u.id===owner).length,1);assert.equal(before.identities.some(i=>i.provider_user_id==='999999'),false);
   const initial=bootstraps;await page.reload();await page.locator('[data-screen=home]').waitFor();assert.equal(bootstraps,initial);assert.ok(!await page.evaluate(()=>document.cookie.includes('menorah_miniapp_session')));
   assert.ok(!(await page.evaluate(()=>Object.keys(localStorage))).some(key=>/session|initData/i.test(key)));
  });
  await test(name+' own profile edit and native BackButton are functional',async()=>{
   await page.locator('.miniapp-action-card').filter({hasText:'Мой профиль'}).click();await page.locator('#profile-firstName').waitFor();assert.equal(await page.getByRole('checkbox',{name:/Я соглашаюсь/}).isChecked(),true);await noOverflow(page);await shot(page,name+'-profile-edit');
   assert.equal(await page.evaluate(()=>window.__miniappFixture.calls.backVisible),true);await page.evaluate(()=>window.__miniappFixture.back());await page.locator('[data-screen=home]').waitFor();
   await page.locator('.miniapp-action-card').filter({hasText:'Мой профиль'}).click();await page.locator('#profile-firstName').fill('Edited');await page.getByRole('button',{name:'Сохранить изменения',exact:true}).click();await page.locator('[data-screen=home]').waitFor();await page.getByRole('heading',{name:/Шалом, Edited/}).waitFor();
  });
  await test(name+' controls remain touch accessible and logout clears only the session',async()=>{
   const sizes=await page.locator('.miniapp button').evaluateAll(buttons=>buttons.filter(b=>b.getBoundingClientRect().width>0).map(b=>({text:b.textContent,height:b.getBoundingClientRect().height})));assert.ok(sizes.every(size=>size.height>=43),JSON.stringify(sizes));
   await page.getByRole('button',{name:'Выйти',exact:true}).click();await page.locator('[data-screen=logout]').waitFor();assert.equal(await page.getByText('Edited',{exact:true}).count(),0);const response=await context.request.get(base+'/api/telegram/miniapp/profile');assert.equal(response.status(),401);
  });
  await context.close();
  const resources=await setup({width,height});await resources.page.goto(base+'/miniapp');await resources.page.locator('[data-screen=filter]').waitFor();await resources.page.locator('[name=affiliation][value=none]').check();await resources.page.getByRole('button',{name:'Продолжить',exact:true}).click();await resources.page.locator('[data-screen=resources]').waitFor();
  await test(name+' resources show exact approved links, no event/profile booking actions and fit viewport',async()=>{
   for(const href of ['https://noahideworldcenter.org/ru','https://www.gov.il/ru/departments/conversion_authority','https://nativhagiur.org.il/ru/'])assert.equal(await resources.page.locator(`a[href="${href}"]`).count(),1);
   assert.equal(await resources.page.locator('a[href^="/events"]').count(),0);assert.equal(await resources.page.locator('[name=gender]').count(),0);await noOverflow(resources.page);await shot(resources.page,name+'-resources');await resources.page.reload();await resources.page.locator('[data-screen=resources]').waitFor();
  });await resources.context.close();
 }
 await test('bootstrap error has branded recovery and retry completes the same synthetic identity',async()=>{
  const {context,page}=await setup({width:390,height:844});let fail=true;await context.route('**/api/telegram/miniapp/bootstrap',route=>{if(fail){fail=false;return route.fulfill({status:503,contentType:'application/json',body:'{"ok":false,"error":"temporarily_unavailable"}'})}return route.continue()});
  await page.goto(base+'/miniapp');await page.locator('[data-screen=error]').waitFor();await shot(page,'390-bootstrap-error');await page.getByRole('button',{name:'Попробовать ещё раз',exact:true}).click();await page.locator('[data-screen=filter]').waitFor();await context.close();
 });
 for(const kind of ['male','giyur-unknown','giyur-advanced','giyur-male','giyur-completed'])await test(kind+' existing profile enforces child editor visibility and retains stored children',async()=>{
  const {context,page}=await setup({width:390,height:844},kind);await page.goto(base+'/miniapp');await page.locator('[data-screen=home]').waitFor();await page.locator('.miniapp-action-card').filter({hasText:'Мой профиль'}).click();await page.locator('#profile-firstName').waitFor();assert.equal(await page.getByRole('button',{name:'Добавить ребёнка',exact:true}).count(),kind==='giyur-completed'?1:0);assert.equal(await page.locator('[name=giyurStage]').count(),0);await noOverflow(page);await shot(page,'390-'+kind);await context.close();
 });
 await test('Hebrew uses validated language, RTL logical safe areas, preserves brand through theme/viewport events',async()=>{
  const {context,page}=await setup({width:390,height:844},'home','he',{platform:'android',safeArea:{top:10,bottom:12,left:6,right:8},contentSafeArea:{top:20,bottom:4,left:2,right:4}});await page.goto(base+'/miniapp');await page.locator('[data-screen=home]').waitFor();await page.getByRole('heading',{name:/שלום, Synthetic/}).waitFor();
  const before=await page.locator('.miniapp').evaluate(element=>({dir:element.dir,lang:element.lang,start:getComputedStyle(element).paddingInlineStart,end:getComputedStyle(element).paddingInlineEnd,top:getComputedStyle(element).paddingTop,bg:getComputedStyle(element).backgroundColor}));assert.equal(before.dir,'rtl');assert.equal(before.lang,'he');assert.equal(before.start,'28px');assert.equal(before.end,'24px');assert.equal(before.top,'46px');assert.equal(before.bg,'rgb(248, 247, 243)');
  await page.evaluate(()=>{const app=window.Telegram.WebApp;app.viewportStableHeight=700;app.safeAreaInset.bottom=24;app.isActive=false;window.__miniappFixture.emit('deactivated');window.__miniappFixture.emit('viewportChanged');window.__miniappFixture.emit('safeAreaChanged');window.__miniappFixture.emit('contentSafeAreaChanged');window.__miniappFixture.emit('themeChanged')});
  assert.equal(await page.locator('.miniapp').getAttribute('data-active'),'false');assert.equal(await page.locator('.miniapp').evaluate(e=>e.style.getPropertyValue('--menorah-viewport-height')),'700px');
  assert.equal(await page.evaluate(()=>window.__miniappFixture.calls.header.at(-1)),'#f8f7f3');assert.equal(await page.evaluate(()=>window.__miniappFixture.calls.bottom.at(-1)),'#ffffff');
  await noOverflow(page);await shot(page,'390-hebrew-home');await page.locator('nav button').last().click();await page.locator('#profile-firstName').waitFor();await noOverflow(page);await shot(page,'390-hebrew-profile');assert.equal(await page.locator('#profile-firstName').evaluate(e=>getComputedStyle(e).fontSize),'16px');assert.equal(await page.locator('#profile-dateOfBirth').inputValue(),'1990-01-01');
  await page.locator('header select').selectOption('en');await page.getByRole('heading',{name:'My profile',exact:true}).waitFor();await shot(page,'390-english-profile');await context.close();
 });
 await test('a cookie from another Telegram account never exposes its profile on a new launch',async()=>{
  const a=await setup({width:390,height:844},'home');await a.page.goto(base+'/miniapp');await a.page.locator('[data-screen=home]').waitFor();
  const cookies=await a.context.cookies();const b=await setup({width:390,height:844},'resources');await b.context.addCookies(cookies);
  const responses=[];b.page.on('response',async response=>{if(response.url().endsWith('/profile')&&response.request().method()==='GET'&&response.status()===200)responses.push((await response.json()).summary.nextStep)});
  await b.page.goto(base+'/miniapp');await b.page.locator('[data-screen=resources]').waitFor();assert.deepEqual(responses,['resources']);assert.equal(await b.page.locator('.miniapp-action-card').count(),0);await a.context.close();await b.context.close();
 });
 await test('ordinary browser has no synthetic login and shows Telegram entry screen',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'ru-RU'});await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());const page=await context.newPage();await page.goto(base+'/miniapp?dev=1&userId=760000');await page.locator('[data-screen=outside]').waitFor();await page.getByRole('heading',{name:'Откройте приложение через Telegram',exact:true}).waitFor();assert.equal(await page.locator('[name=affiliation]').count(),0);await shot(page,'390-browser-outside');await context.close();
 });
 assert.deepEqual(errors,[]);console.log(`${checks.length}/${checks.length} Mini App browser checks passed`);
})().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>{await browser?.close();fs.writeFileSync(path.join(out,'miniapp-ui-browser-results.json'),JSON.stringify({environment:'Chromium + local Next HTTP + real API/services/SQL; synthetic Telegram SDK/HMAC and isolated PGlite',realTelegramWebView:'NOT VERIFIED',checks,errors,screenshots:shots,exitCode:process.exitCode||0},null,2)+'\n')});
