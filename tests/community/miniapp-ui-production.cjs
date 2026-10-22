/* Ordinary browser against actual production build, without Clerk runtime keys. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/tmp/menora-browser-runtime/node_modules/playwright');
const base='http://127.0.0.1:3343',out=path.resolve(__dirname,'../../docs/miniapp-ui-v1/evidence');let browser;
(async()=>{
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-US'}),external=[],api=[],errors=[];
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin===base)return route.continue();external.push(url.hostname);return route.abort()});
 const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/api/telegram/miniapp/'))api.push(request.method()+' '+new URL(request.url()).pathname)});
 const response=await page.goto(base+'/miniapp?dev=1&fixture=home&userId=760001');assert.equal(response.status(),200);await page.locator('[data-screen=outside]').waitFor();await page.getByRole('heading',{name:'Open this app in Telegram',exact:true}).waitFor();
 assert.equal(await page.locator('.miniapp-preview').count(),0);assert.equal(await page.locator('[name=affiliation]').count(),0);assert.equal(await page.locator('footer').count(),0);assert.equal(await page.locator('input[type=email]').count(),0);assert.ok(!(await context.cookies()).some(cookie=>/miniapp_session/.test(cookie.name)));assert.ok(!external.some(host=>/clerk|vercel|analytics/.test(host)));assert.deepEqual(api,[]);assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:path.join(out,'production-browser-outside.png'),fullPage:true});
 const cities=await context.request.get(base+'/api/community/cities?q='+encodeURIComponent('Ришон'));assert.equal(cities.status(),200);assert.ok((await cities.json()).cities.some(city=>city.id==='8300'));
 fs.writeFileSync(path.join(out,'miniapp-ui-production-results.json'),JSON.stringify({environment:'real npm production build, no runtime Clerk keys; loopback synthetic DB unavailable; browser outside Telegram',checks:[{name:'production query params and preview env cannot enable fake login; no Clerk/analytics/session activity',status:'PASS'},{name:'shared public locality directory works without Clerk configuration',status:'PASS'}],errors,externalDomains:external,miniappRequests:api},null,2)+'\n');console.log('2/2 production browser checks passed');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>browser?.close());
