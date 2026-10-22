/* Actual initial JS in local production browser. No Telegram device/performance claim. */
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),zlib=require('zlib');
const{chromium}=require('/tmp/menora-browser-runtime/node_modules/playwright');
const base='http://127.0.0.1:3343',out=process.env.COMMUNITY_TEST_OUTPUT||path.resolve(__dirname,'../../docs/production-candidate-telegram/evidence');
(async()=>{const browser=await chromium.launch({headless:true});try{const context=await browser.newContext(),files=new Map(),reads=[];
 await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());const page=await context.newPage();
 page.on('response',r=>{const url=new URL(r.url());if(url.origin===base&&url.pathname.endsWith('.js'))reads.push(r.body().then(body=>files.set(url.pathname,{bytes:body.length,gzipBytes:zlib.gzipSync(body).length,clerkMarkers:/clerk\.com|ClerkProvider|ClerkJS/.test(body.toString())})).catch(()=>{}));});
 await page.goto(base+'/miniapp');await page.locator('[data-screen=outside]').waitFor();await Promise.allSettled(reads);
 const result={environment:'Local production build, Chromium ordinary browser; external requests blocked',files:[...files].map(([file,value])=>({path:file,...value})),totalBytes:[...files.values()].reduce((sum,row)=>sum+row.bytes,0),estimatedGzipBytes:[...files.values()].reduce((sum,row)=>sum+row.gzipBytes,0),note:'Includes framework/shared JS; compressed bytes estimated locally, not actual network/device metrics.',checks:[]};
 assert.equal(result.files.filter(file=>file.clerkMarkers).length,0,'Mini App downloads website Clerk runtime');result.checks.push({name:'Mini App initial JS excludes website Clerk runtime',status:'PASS'});fs.writeFileSync(path.join(out,'bundle.json'),JSON.stringify(result,null,2)+'\n');console.log('PASS Mini App initial JS excludes Clerk; '+result.files.length+' scripts, '+result.totalBytes+' bytes, estimated gzip '+result.estimatedGzipBytes+' bytes');
 }finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
