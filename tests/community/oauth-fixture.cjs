/* Disposable REAL Clerk TEST stand, isolated native PostgreSQL/WASM; never remote DB.
   Run only with explicitly authorized test Clerk keys. No session injection here. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),fixture=process.env.COMMUNITY_OAUTH_FIXTURE || '/tmp/menora-acceptance-oauth';
fs.mkdirSync(fixture,{recursive:true});
cp.execFileSync('rsync',['-a','--exclude=.git','--exclude=.next*','--exclude=node_modules','--exclude=.env*','--exclude=docs','--exclude=tests','--exclude=*.tsbuildinfo',root+'/',fixture+'/']);
if(!fs.existsSync(path.join(fixture,'node_modules')))fs.symlinkSync(path.join(root,'node_modules'),path.join(fixture,'node_modules'));
const port=Number(process.env.COMMUNITY_OAUTH_PORT || 3330);
const write=(file,body)=>fs.writeFileSync(path.join(fixture,file),body);
const runtime=path.join(process.env.COMMUNITY_TEST_RUNTIME||'/tmp/menora-filter-test-runtime','node_modules/@electric-sql/pglite');
write('lib/db/index.ts',`import * as schema from './schema';
const nativeRequire=(process as any).getBuiltinModule('node:module').createRequire(${JSON.stringify(path.join(root,'package.json'))});
const {PGlite}=nativeRequire(${JSON.stringify(runtime)});
const {drizzle}=nativeRequire('drizzle-orm/pglite');
const {migrate}=nativeRequire('drizzle-orm/pglite/migrator');
const g=globalThis as any;
if(!g.__menoraSyntheticDb)g.__menoraSyntheticDb=(async()=>{const client=new PGlite();const db=drizzle(client,{schema});await migrate(db,{migrationsFolder:${JSON.stringify(path.join(fixture,'drizzle'))}});await client.exec("INSERT INTO event_categories(id,name) VALUES ('fixture-category','Synthetic'); INSERT INTO events(id,title,description,is_free,date,status,category_id) VALUES ('fixture-event','PRIVATE_FIXTURE_EVENT_TITLE','PRIVATE_FIXTURE_DESCRIPTION',true,'2026-11-20','planned','fixture-category');");return db;})();
export const db=await g.__menoraSyntheticDb;
`);
write('actions/telegram.ts',`'use server';export async function sendEventRegistrationNotification(){return {success:true};}export async function sendServiceRegistrationNotification(){return {success:true};}export async function sendBroadcastMessage(){return {success:false};}export async function getBotSettings(){return null;}export async function updateBotSettings(){return {success:false};}\n`);
 write('lib/telegram/notifications.ts',`import 'server-only';export async function sendEventRegistrationNotification(){return {success:true};}export async function sendServiceRegistrationNotification(){return {success:true};}\n`);
write('lib/community/welcome.ts',`export async function sendCommunityWelcome(){return;}\n`);
let config=fs.readFileSync(path.join(root,'next.config.mjs'),'utf8');config=config.replace('  images: {',()=>`  webpack(config) {config.externals.push(({request},callback)=>{if(request===${JSON.stringify(runtime)} || request==='drizzle-orm/pglite' || request==='drizzle-orm/pglite/migrator')return callback(null,'commonjs '+request);callback();});return config;},\n  images: {`);write('next.config.mjs',config);
write('app/layout.tsx',fs.readFileSync(path.join(root,'app/layout.tsx'),'utf8').replace(/<Analytics\s*\/>/g,''));
const launcher=`const fs=require('node:fs'),cp=require('node:child_process');const dotenv=require(${JSON.stringify(path.join(root,'node_modules/dotenv'))});const source={...dotenv.parse(fs.readFileSync(${JSON.stringify(path.join(root,'.env'))})),...dotenv.parse(fs.readFileSync(${JSON.stringify(path.join(root,'.env.local'))}))};if(!source.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')||!source.CLERK_SECRET_KEY?.startsWith('sk_test_'))throw new Error('Test Clerk keys required');const env={...process.env,NODE_PATH:'/tmp/menora-filter-test-runtime/node_modules',NEXT_PUBLIC_APP_URL:'http://localhost:${port}',NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:source.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY:source.CLERK_SECRET_KEY,NEXT_PUBLIC_SUPABASE_URL:'https://synthetic.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic',EMAIL_USER:'',EMAIL_PASS:'',TELEGRAM_BOT_TOKEN:'',DATABASE_URL:''};const child=cp.spawn(process.execPath,[${JSON.stringify(path.join(root,'node_modules/next/dist/bin/next'))},'dev','--webpack','--hostname','localhost','--port','${port}'],{cwd:${JSON.stringify(fixture)},env,stdio:'inherit'});process.on('SIGTERM',()=>child.kill('SIGTERM'));child.on('exit',code=>process.exit(code||0));`;
fs.writeFileSync('/tmp/menora-acceptance-oauth-launcher.cjs',launcher);
console.log('REAL Clerk TEST stand prepared: localhost:'+port+'; isolated DB; notification/analytics delivery disabled; no env copied');
