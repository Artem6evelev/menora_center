/* Local UI/session/SQL with synthetic Telegram SDK; no native device claim. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/tmp/menora-browser-runtime/node_modules/playwright');
const {installSdk}=require('./miniapp-ui-sdk.cjs');
const base='http://127.0.0.1:3342',out=process.env.COMMUNITY_TEST_OUTPUT||'/tmp/menora-bottom-nav-evidence/nav-browser';
const checks=[],errors=[],layouts=[];let browser,id=789500;
const labels=['Главная','Мероприятия','Мои записи','Menorah Kids','Профиль'];
async function test(name,run){await run();checks.push({name,status:'PASS'});console.log('PASS '+name);}
async function setup({width=390,kind='home',query=''}={}){
 const subject=id++,context=await browser.newContext({viewport:{width,height:844},locale:'he-IL',reducedMotion:'reduce'});
 await installSdk(context,{id:subject,language:'he',start:''});
 await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
 if(kind)assert.equal((await context.request.post(base+'/api/test-miniapp-state',{data:{id:subject,kind}})).status(),200);
 const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/miniapp'+query);await page.locator('.miniapp-nav').waitFor();return{context,page};
}
function tab(page,name){return page.locator('.miniapp-nav').getByRole('button',{name,exact:true});}
async function active(page,name){await page.waitForFunction(name=>document.querySelector('.miniapp-nav [aria-current="page"]')?.textContent===name,name);assert.equal(await page.locator('.miniapp-nav [aria-current=page]').count(),1);}
async function fit(page){
 const m=await page.locator('.miniapp-nav').evaluate(nav=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,navWidth:nav.getBoundingClientRect().width,columns:getComputedStyle(nav).gridTemplateColumns.split(' ').map(Number.parseFloat),tabs:[...nav.querySelectorAll('button')].map(button=>{const label=button.lastElementChild,box=button.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(label);return{width:box.width,height:box.height,left:box.left,right:box.right,whiteSpace:getComputedStyle(label).whiteSpace,fontSize:getComputedStyle(label).fontSize,textWidth:range.getBoundingClientRect().width,labelWidth:label.getBoundingClientRect().width,lineHeight:Number.parseFloat(getComputedStyle(label).lineHeight),heightLabel:label.getBoundingClientRect().height};})}));
 assert.equal(m.overflow,false);assert.equal(m.columns.length,5);assert.ok(Math.max(...m.tabs.map(t=>t.width))-Math.min(...m.tabs.map(t=>t.width))<1);
 for(const t of m.tabs){assert.ok(t.left>=0&&t.right<=m.width+1);assert.ok(t.width>=44&&t.height>=44);assert.equal(t.whiteSpace,'nowrap');assert.ok(t.heightLabel<=t.lineHeight+1);assert.ok(t.textWidth<=t.width-2,'label clipped or overlapping: '+JSON.stringify(t));}
 assert.equal(await page.locator('.miniapp').getAttribute('lang'),'ru');assert.equal(await page.locator('header select').count(),0);return m;
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});assert.equal((await(await fetch(base+'/api/test-miniapp-state')).json()).testDatabase,'isolated-pglite');await fetch(base+'/api/test-state',{method:'POST'});
 browser=await chromium.launch({headless:true});
 for(const width of [320,390,1280]){
  await test(width+' five equal single-line tabs, Baby icon, internal Kids and stable active gold/navy state',async()=>{const{context,page}=await setup({width});try{
   assert.deepEqual(await page.locator('.miniapp-nav button').allTextContents(),labels);assert.equal(await tab(page,'Menorah Kids').locator('svg.lucide-baby').count(),1);assert.equal(await tab(page,'Menorah Kids').locator('svg').getAttribute('width'),'21');
   const before=await fit(page);let navigations=0;page.on('request',r=>{if(r.isNavigationRequest())navigations++;});
   await tab(page,'Menorah Kids').click();await page.locator('[data-kids-family]').waitFor();await active(page,'Menorah Kids');const after=await fit(page);assert.deepEqual(after.tabs.map(t=>t.width),before.tabs.map(t=>t.width));
   assert.equal(await tab(page,'Menorah Kids').evaluate(b=>getComputedStyle(b).backgroundColor),'rgb(255, 243, 209)');assert.equal(await tab(page,'Menorah Kids').locator('svg').evaluate(b=>getComputedStyle(b).color),'rgb(2, 0, 34)');
   assert.equal(new URL(page.url()).pathname,'/miniapp');assert.equal(new URL(page.url()).searchParams.get('section'),'kids');assert.equal(navigations,0);assert.equal(await page.evaluate(()=>window.__miniappFixture.calls.links.length),0);
   layouts.push(after);await page.screenshot({path:path.join(out,width+'-kids-nav.png'),fullPage:true});await page.evaluate(()=>window.__miniappFixture.back());await page.locator('[data-screen=home]').waitFor();await active(page,'Главная');
  }finally{await context.close();}});
  await test(width+' all four existing tabs and bottom Home work without navigation or width changes',async()=>{const{context,page}=await setup({width});try{
   for(const[name,screen]of[['Мероприятия','events'],['Мои записи','registrations'],['Профиль','profile'],['Menorah Kids','kids'],['Главная','home']]){await tab(page,name).click();await page.locator('[data-screen='+screen+']').waitFor();await active(page,name);await fit(page);}
  }finally{await context.close();}});
 }
 await test('direct section=kids is active immediately; bottom Home clears destination and reload stays Home',async()=>{const{context,page}=await setup({query:'?section=kids'});try{await page.locator('[data-kids-family]').waitFor();await active(page,'Menorah Kids');await tab(page,'Главная').click();await active(page,'Главная');assert.equal(new URL(page.url()).searchParams.has('section'),false);await page.reload();await page.locator('[data-screen=home]').waitFor();await active(page,'Главная');}finally{await context.close();}});
 await test('SDK safe areas and reduced viewport keep navigation above the bottom inset',async()=>{const{context,page}=await setup({width:320});try{await page.setViewportSize({width:320,height:480});await page.evaluate(()=>{const app=window.Telegram.WebApp;app.viewportStableHeight=480;app.safeAreaInset={top:12,bottom:34,left:0,right:0};app.contentSafeAreaInset={top:8,bottom:10,left:0,right:0};window.__miniappFixture.emit('safeAreaChanged');window.__miniappFixture.emit('contentSafeAreaChanged');window.__miniappFixture.emit('viewportChanged');});await tab(page,'Menorah Kids').click();await page.locator('[data-kids-family]').waitFor();await fit(page);const box=await page.locator('.miniapp-nav').boundingBox();assert.ok(box.y+box.height<=480-34-10-8+1);assert.equal(await page.locator('.miniapp').evaluate(n=>getComputedStyle(n).getPropertyValue('--tg-safe-bottom')),'34px');}finally{await context.close();}});
 for(const kind of ['male','giyur-male','giyur-unknown','giyur-advanced','giyur-completed'])await test(kind+' always sees Kids tab and retains existing permission UI',async()=>{const{context,page}=await setup({kind});try{assert.equal(await page.locator('.miniapp-nav button').count(),5);await tab(page,'Menorah Kids').click();await active(page,'Menorah Kids');await page.locator(kind==='giyur-completed'?'[data-kids-family]':'[data-kids-gate]').waitFor();if(kind.includes('male'))await page.getByRole('link',{name:'Связаться с Menorah Center',exact:true}).waitFor();else if(kind!=='giyur-completed')assert.equal(await page.locator('[name=kids-giyur-stage]').count(),2);}finally{await context.close();}});
 await test('none sees all tabs and active Kids but remains resources without protected API access',async()=>{const{context,page}=await setup({kind:'resources'});try{assert.equal(await page.locator('.miniapp-nav button').count(),5);for(const name of ['Menorah Kids','Мероприятия','Мои записи','Профиль','Главная']){await tab(page,name).click();await page.locator('[data-screen=resources]').waitFor();assert.equal(await page.locator('[data-miniapp-kids],[data-event-detail],[data-miniapp-form]').count(),0);}await tab(page,'Menorah Kids').click();await active(page,'Menorah Kids');assert.equal((await context.request.get(base+'/api/telegram/miniapp/kids')).status(),403);}finally{await context.close();}});
 await test('new user chooses Kids before completion, cannot skip filter, and returns to active Kids after profile/reload',async()=>{const{context,page}=await setup({kind:null});try{
  await tab(page,'Menorah Kids').click();await active(page,'Menorah Kids');await tab(page,'Профиль').click();await page.locator('[data-screen=filter]').waitFor();assert.equal(await page.locator('[data-miniapp-form=profile]').count(),0);await tab(page,'Menorah Kids').click();
  await page.locator('[name=affiliation][value=maternal]').check();await page.locator('[name=gender][value=female]').check();await page.locator('[data-miniapp-form=filter] button[type=submit]').click();await page.locator('[data-screen=profile]').waitFor();await active(page,'Menorah Kids');
  for(const[key,value]of Object.entries({firstName:'Synthetic Navigation',lastName:'Fixture',phone:'+972501234567',dateOfBirth:'1990-01-01'}))await page.locator('#profile-'+key).fill(value);
  await page.locator('#profile-city').fill('Ришон');await page.getByRole('option').filter({hasText:'Ришон ле-Цион'}).first().click();await page.locator('#profile-marital').selectOption('single');await page.locator('input[type=checkbox][required]').check();await page.locator('[data-miniapp-form=profile] button[type=submit]').click();await page.locator('[data-kids-family]').waitFor();await active(page,'Menorah Kids');await page.reload();await page.locator('[data-kids-family]').waitFor();await active(page,'Menorah Kids');
 }finally{await context.close();}});
 assert.deepEqual(errors,[]);console.log('TOTAL '+checks.length+' PASS');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'miniapp-bottom-nav-browser-results.json'),JSON.stringify({environment:'Local Chromium + actual Mini App session/routes/SQL; synthetic Telegram SDK, blocked external requests',checks,errors,layouts,exitCode:process.exitCode||0,realTelegramWebView:'NOT VERIFIED',productionChanged:false},null,2)+'\n');});
