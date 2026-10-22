/* Optional headed local preview. Creates no product route or auth bypass. */
const assert=require('node:assert/strict');
const {chromium}=require('/tmp/menora-browser-runtime/node_modules/playwright');
const {installSdk}=require('./miniapp-ui-sdk.cjs');
const base='http://127.0.0.1:3342';let browser;
assert.notEqual(process.env.NODE_ENV,'production','Preview is development-only');
(async()=>{
 const probe=await (await fetch(base+'/api/test-miniapp-state')).json();assert.equal(probe.testDatabase,'isolated-pglite');
 browser=await chromium.launch({headless:false});const context=await browser.newContext({viewport:{width:390,height:844},locale:'ru-RU'});
 await installSdk(context,{id:789999});await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
 const page=await context.newPage();await page.goto(base+'/miniapp');console.log('Local synthetic Mini App preview. Not real Telegram. Close this window to finish.');
 await new Promise(resolve=>browser.on('disconnected',resolve));
})().catch(error=>{console.error(error.message);process.exitCode=1}).finally(async()=>browser?.close());
