/* Real local UI/API/SQL; synthetic SDK/identity and external-app/clipboard adapters. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/tmp/menora-browser-runtime/node_modules/playwright');
const {installSdk}=require('./miniapp-ui-sdk.cjs');
const base='http://127.0.0.1:3342',out=process.env.COMMUNITY_TEST_OUTPUT||'/tmp/menora-russian-ux-evidence/russian-ux-browser';
const checks=[],errors=[],shots=[];let browser,id=789500;
const phone='+972 50 670 0779',url='https://wa.me/972506700779?text='+encodeURIComponent('Шалом! Пишу из приложения Menorah Center.');
async function test(name,run){await run();checks.push({name,status:'PASS'});console.log('PASS '+name);}
async function setup({language='en',kind,mode='sdk',outside=false}={}){
  const context=await browser.newContext({viewport:{width:390,height:844},locale:language==='he'?'he-IL':'en-US',reducedMotion:'reduce'}),subject=id++;
  await installSdk(context,{id:subject,language,platform:'android',start:''});
  await context.addInitScript(({mode,outside})=>{
    window.__contactBrowser=[];window.__contactCopies=[];
    window.open=(...args)=>{window.__contactBrowser.push(args);return null;};
    if(mode==='browser')window.Telegram.WebApp.openLink=undefined;
    if(mode==='throws')window.Telegram.WebApp.openLink=()=>{throw new Error('Synthetic unsupported SDK');};
    if(outside)window.Telegram.WebApp.initData='';
    Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{if(mode==='denied')throw new DOMException('Synthetic denied','NotAllowedError');window.__contactCopies.push(value);}}});
    localStorage.setItem('locale','he');localStorage.setItem('language','en');
  },{mode,outside});
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  if(kind)assert.equal((await context.request.post(base+'/api/test-miniapp-state',{data:{id:subject,kind,language}})).status(),200);
  const page=await context.newPage();page.setDefaultTimeout(40000);page.on('pageerror',error=>errors.push(error.message));await page.goto(base+'/miniapp');
  return{context,page};
}
async function russian(page){
  assert.equal(await page.locator('.miniapp').getAttribute('lang'),'ru');assert.equal(await page.locator('.miniapp').getAttribute('dir'),'ltr');
  assert.equal(await page.locator('header select,.miniapp-language').count(),0);
  const text=await page.locator('.miniapp').innerText();assert.ok(!/фильтр|\bfilter\b|סינון/i.test(text));
  assert.ok(!/Welcome home|Your questionnaire|My profile|Event link copied|Связаться с Menorah|ברוכים|הפרופיל שלך/.test(text));
  assert.equal(await page.locator('a[href="https://t.me/menorah_center"]').count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
}
async function contact(page){const link=page.locator('[data-miniapp-contact] > a');assert.equal(await link.getAttribute('href'),url);assert.match(await link.innerText(),/Связаться с нами.*WhatsApp/);await link.click();await page.getByRole('textbox',{name:'Номер для связи'}).waitFor();assert.equal(await page.getByRole('textbox',{name:'Номер для связи'}).inputValue(),phone);await page.waitForFunction(()=>{const input=document.querySelector('[data-miniapp-contact] input').getBoundingClientRect(),nav=document.querySelector('.miniapp-nav')?.getBoundingClientRect();return input.top>=0&&input.bottom<(nav?.top??innerHeight);});return link;}
(async()=>{
  fs.mkdirSync(out,{recursive:true});assert.equal((await(await fetch(base+'/api/test-miniapp-state')).json()).testDatabase,'isolated-pglite');await fetch(base+'/api/test-state',{method:'POST'});
  browser=await chromium.launch({headless:true});
  for(const language of ['en','he']){
    await test(language+' Telegram/device and legacy browser locale cannot change new onboarding from Russian',async()=>{
      const{context,page}=await setup({language});try{
        await page.locator('[data-screen=filter]').waitFor();await russian(page);await page.getByRole('button',{name:'Продолжить',exact:true}).waitFor();
        await page.locator('[name=affiliation][value=giyur]').check();await page.locator('[name=gender][value=male]').check();await page.locator('button[type=submit]').click();await page.locator('[data-screen=profile]').waitFor();
        await page.getByRole('button',{name:'Сохранить анкету',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Изменить ответы',exact:true}).count(),1);await russian(page);
        await page.reload();await page.locator('[data-screen=profile]').waitFor();await russian(page);assert.equal(await page.locator('[name=giyurStage]').count(),0);
      }finally{await context.close();}
    });
    await test(language+' stored Telegram metadata keeps returning profile/events/share toast Russian',async()=>{
      const{context,page}=await setup({language,kind:'male'});try{
        await page.locator('[data-screen=home]').waitFor();await russian(page);await page.getByRole('heading',{name:'Ближайшие мероприятия',exact:true}).waitFor();
        await page.locator('[data-upcoming-events] .miniapp-share-overlay > button').first().click();await page.getByRole('status').filter({hasText:'Ссылка на мероприятие скопирована'}).waitFor();
        await page.locator('.miniapp-nav button').last().click();await page.locator('[data-miniapp-form=profile]').waitFor();await russian(page);
        assert.equal(await page.getByText('Здесь можно сохранить сведения о себе.',{exact:false}).count(),0);assert.equal(await page.locator('.miniapp-note').count(),0);assert.equal(await page.getByRole('button',{name:'Добавить ребёнка',exact:true}).count(),0);
        const order=await page.evaluate(()=>{const form=document.querySelector('[data-miniapp-form=profile]'),privacy=form.querySelector('input[type=checkbox][required]'),submit=form.querySelector('button[type=submit]'),change=[...document.querySelectorAll('button')].find(el=>el.textContent==='Изменить ответы');return{privacyBeforeSave:!!(privacy.compareDocumentPosition(submit)&4),saveBeforeChange:!!(submit.compareDocumentPosition(change)&4)};});assert.deepEqual(order,{privacyBeforeSave:true,saveBeforeChange:true});
      }finally{await context.close();}
    });
  }
  for(const mode of ['sdk','browser','throws'])await test(mode+' contact opens canonical WhatsApp safely and offers copyable public phone',async()=>{
    const{context,page}=await setup({kind:'home',mode});try{
      await page.locator('[data-screen=home]').waitFor();await contact(page);
      if(mode==='sdk')assert.deepEqual(await page.evaluate(()=>window.__miniappFixture.calls.links),[url]);
      else assert.deepEqual(await page.evaluate(()=>window.__contactBrowser),[[url,'_blank','noopener,noreferrer']]);
      await page.getByRole('button',{name:'Скопировать номер',exact:true}).click();await page.getByRole('status').filter({hasText:'Номер скопирован'}).waitFor();assert.deepEqual(await page.evaluate(()=>window.__contactCopies),[phone]);await russian(page);
      if(mode==='sdk'){await page.screenshot({path:path.join(out,'russian-contact.png'),fullPage:true});shots.push('russian-contact.png');}
    }finally{await context.close();}
  });
  await test('denied clipboard keeps the phone selectable without claiming successful copying',async()=>{
    const{context,page}=await setup({kind:'home',mode:'denied'});try{
      await page.locator('[data-screen=home]').waitFor();await contact(page);await page.getByRole('button',{name:'Скопировать номер',exact:true}).click();
      assert.equal(await page.getByRole('textbox',{name:'Номер для связи'}).evaluate(el=>el.selectionEnd-el.selectionStart),phone.length);assert.equal(await page.getByText('Номер скопирован',{exact:true}).count(),0);await russian(page);
    }finally{await context.close();}
  });
  for(const state of ['resources','outside'])await test(state+' recovery contact also uses WhatsApp and Russian copy',async()=>{
    const{context,page}=await setup({kind:state==='resources'?state:undefined,outside:state==='outside'});try{
      await page.locator('[data-screen='+state+']').waitFor();await contact(page);assert.deepEqual(await page.evaluate(()=>window.__miniappFixture.calls.links),[url]);await russian(page);assert.equal(await page.locator('[data-event-detail]').count(),0);
    }finally{await context.close();}
  });
  assert.deepEqual(errors,[]);console.log('TOTAL '+checks.length+' PASS');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  await browser?.close();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'miniapp-russian-ux-browser-results.json'),JSON.stringify({environment:'Local Chromium Android-sized viewport + actual HTTP/API/isolated SQL; synthetic SDK/identity, mocked external navigation and clipboard; no WhatsApp messages',checks,errors,shots,exitCode:process.exitCode||0,realTelegramWebView:false},null,2)+'\n');
});
