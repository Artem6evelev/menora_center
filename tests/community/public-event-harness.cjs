/* Test adapters only: real SQL, route handlers and services; no external IO. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
async function createHarness(){
 process.env.NODE_PATH=(process.env.COMMUNITY_TEST_RUNTIME||'/tmp/menora-filter-test-runtime')+'/node_modules';require('node:module').Module._initPaths();
 const {PGlite}=require((process.env.COMMUNITY_TEST_RUNTIME||'/tmp/menora-filter-test-runtime')+'/node_modules/@electric-sql/pglite');
 const {drizzle}=require('drizzle-orm/pglite'),pg=new PGlite(),cache=new Map(),jar=new Map(),queries=[],effects=[];
 let db,actor=null;
 const env={NODE_ENV:'development',TELEGRAM_BOT_TOKEN:'123456:synthetic-public-event-key',CLERK_SECRET_KEY:'sk_test_synthetic_public_event',NEXT_PUBLIC_APP_URL:'http://localhost:3999'};
 function source(file){
  const absolute=path.join(root,file);if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(absolute));
  if(cache.has(absolute))return cache.get(absolute).exports;const mod={exports:{}};cache.set(absolute,mod);
  const code=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  function localRequire(id){
   if(id==='server-only')return{};if(id==='@/lib/db')return{db};
   if(id==='next/headers')return{cookies:async()=>({get:key=>jar.has(key)?{value:jar.get(key)}:undefined,set(key,value){jar.set(key,value);}})};
   if(id==='@clerk/nextjs/server')return{auth:async()=>({userId:actor}),currentUser:async()=>actor?{id:actor,firstName:'Synthetic',lastName:'Member',primaryEmailAddressId:'email',emailAddresses:[{id:'email',emailAddress:actor+'@example.invalid'}]}:null};
   if(id==='next/cache')return{revalidatePath(){}};
   if(id==='next/navigation')return{redirect(location){throw Object.assign(new Error('redirect'),{location});}};
   if(id==='@/lib/telegram/notifications')return{sendEventRegistrationNotification:async()=>effects.push('notification-adapter')};
   if(id==='@/lib/community/welcome')return{sendCommunityWelcome:async()=>effects.push('welcome-adapter')};
   if(id==='next/server')return{...require(id),after:()=>{}};
   if(id.startsWith('@/')||id.startsWith('.')){const target=id.startsWith('@/')?id.slice(2):path.relative(root,path.resolve(path.dirname(absolute),id));for(const f of [target,target+'.ts',target+'.tsx',target+'/index.ts'])if(fs.existsSync(path.join(root,f))&&fs.statSync(path.join(root,f)).isFile())return source(f);throw new Error('Missing local module '+target);}
   if(['zod','drizzle-orm','drizzle-orm/pg-core','node:crypto','react/jsx-runtime'].includes(id))return require(id);
   throw new Error('External import blocked: '+id);
  }
  vm.runInNewContext(code,{module:mod,exports:mod.exports,require:localRequire,process:{env},console:{log(){},error(){}},Date,Buffer,URL,URLSearchParams,Request,Response,TextDecoder,crypto:crypto.webcrypto,fetch:()=>{throw new Error('External delivery blocked');}},{filename:file});return mod.exports;
 }
 const schema=source('lib/db/schema.ts');db=drizzle(pg,{schema,logger:{logQuery(query){queries.push({kind:query.trim().split(/\s+/)[0].toUpperCase(),locked:/for (update|share)/i.test(query)});}}});
 function signed(id,extra={}){const values={auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic',language_code:'he'}),...extra};const secret=crypto.createHmac('sha256','WebAppData').update(env.TELEGRAM_BOT_TOKEN).digest();return new URLSearchParams({...values,hash:crypto.createHmac('sha256',secret).update(Object.keys(values).sort().map(k=>k+'='+values[k]).join('\n')).digest('hex')}).toString();}
 async function call(file,body,options={}){
  const url='http://localhost:3999'+(options.path||'/api/events/interests');
  const response=await source(file)[options.method||'POST'](new Request(url,{method:options.method||'POST',headers:{origin:options.origin||'http://localhost:3999','content-type':'application/json','x-forwarded-for':options.ip||'192.0.2.1',...options.headers},...(options.method==='GET'?{}:{body:JSON.stringify(body)})}));
  if(options.cookies!==false)for(const cookie of response.cookies?.getAll?.()||[])jar.set(cookie.name,cookie.value);
  return{status:response.status,data:await response.json()};
 }
 return{root,source,pg,db,schema,queries,effects,jar,env,signed,call,setActor:id=>{actor=id;},close:()=>pg.close()};
}
module.exports={createHarness};
