/* Targeted real browser regression for reviewed DB drafts. Mock Clerk fixture3327 only. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/tmp/menora-browser-runtime/node_modules/playwright');
const out=path.resolve(__dirname,'../../docs/production-readiness-2026-10-20/evidence/browser'),checks=[];
let b;
(async()=>{b=await chromium.launch({headless:false});const c=await b.newContext({viewport:{width:1440,height:1000}}),p=await c.newPage();p.setDefaultTimeout(20000);
const base='http://127.0.0.1:3327';
async function fill(name){await p.locator('[name=affiliation][value=maternal]').check();await p.locator('[name=gender][value=female]').check();for(const [key,value]of Object.entries({firstName:name,lastName:'Synthetic',phone:'+972501234567',dateOfBirth:'1990-01-01',city:'Synthetic City'}))await p.locator('#profile-'+key).fill(value);await p.locator('#profile-marital').selectOption('single');await p.getByRole('checkbox',{name:/Я соглашаюсь/}).check();}
await c.addCookies([{name:'_community_fixture',value:'fixture-google',url:base}]);await p.goto(base+'/register');await fill('Original account');await p.getByRole('button',{name:'Сохранить анкету',exact:true}).click();await p.waitForURL('**/dashboard/events');
for(const resource of [false,true]){
 await p.goto(base+'/register');await p.getByRole('button',{name:'Выйти из аккаунта'}).click();await p.waitForURL(base+'/');await p.goto(base+'/register');await fill('Reviewed browser');await p.getByRole('button',{name:'Продолжить с Google',exact:true}).click();await p.waitForURL('**/register?resume=1&draft=*');const id=new URL(p.url()).searchParams.get('draft');
 await p.getByRole('alert').filter({hasText:/уже прошёл актуальный фильтр/}).waitFor();
 if(resource){await p.locator('[name=affiliation][value=none]').check();await p.getByRole('button',{name:'Сохранить выбор',exact:true}).click();await p.getByRole('status').filter({hasText:'Ваши данные сохранены.'}).waitFor();}
 else{await p.getByRole('button',{name:'Сохранить анкету',exact:true}).click();await p.waitForURL('**/dashboard/events');}
 const state=await(await c.request.get(base+'/api/test-state')).json(),draft=state.drafts.find(d=>d.id===id),user=state.users.find(u=>u.id==='fixture-google');assert.equal(draft.ownerId,'fixture-google');assert.ok(draft.consumedAt);assert.deepEqual(draft.payload,{});assert.equal(user.affiliation,resource?'none':'maternal');assert.equal(user.firstName,'Reviewed browser');assert.equal(state.users.filter(u=>u.id==='fixture-google').length,1);
 checks.push({name:resource?'Explicit none save consumes restored draft and keeps completion without admission':'Explicit full review consumes restored draft and lands on events',status:'PASS',environment:'Actual Chromium1440; mock Clerk identity3327; real actions/isolated PostgreSQL; not genuine OAuth'});console.log('PASS '+checks.at(-1).name);
}
})().catch(e=>{checks.push({name:'review suite',status:'FAIL',reason:e.message});console.error(e.stack);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(out,'review-results.json'),JSON.stringify({method:'Targeted local browser review regression; injected identity, no Google OAuth',checks},null,2)+'\n');await b?.close();});
