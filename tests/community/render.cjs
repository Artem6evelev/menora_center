/* Component SSR regressions. No Next HTTP/OAuth/hydration claim. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'../..');const cache=new Map();let pathname='/';
function load(file){
 const absolute=path.join(root,file);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));if(cache.has(absolute))return cache.get(absolute).exports;
 const sourceModule={exports:{}};cache.set(absolute,sourceModule);
 const requireLocal=id=>{
  if(['react','react/jsx-runtime','zod','lucide-react'].includes(id))return require(id);
  if(id==='next/navigation')return{useRouter:()=>({refresh(){},replace(){},push(){}}),usePathname:()=>pathname,useSearchParams:()=>new URLSearchParams()};
  if(id==='@clerk/nextjs')return{useClerk:()=>({}),useAuth:()=>({isLoaded:true,isSignedIn:false})};
  if(id==='next/link')return{__esModule:true,default:({children,href,...props})=>React.createElement('a',{href,...props},children)};
  if(id==='@/components/Logo' || id.endsWith('/Logo'))return{Logo:()=>React.createElement('span',null,'Menorah Center')};
  if(id.startsWith('@/actions/'))return{};
  const base=id.startsWith('@/')?id.slice(2):path.relative(root,path.resolve(path.dirname(absolute),id));
  for(const candidate of [base+'.tsx',base+'.ts',base+'/index.tsx'])if(fs.existsSync(path.join(root,candidate)))return load(candidate);
  if(id.endsWith('/Logo'))return{Logo:()=>React.createElement('span',null,'Menorah Center')};
  throw new Error('Blocked '+id);
 };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText,{module:sourceModule,exports:sourceModule.exports,require:requireLocal,console,URL,Date,Math});return sourceModule.exports;
}
const Form=load('components/dashboard/main/onboarding-form.tsx').default;
const Access=load('components/community/access-screen.tsx').default;
const Navbar=load('components/navbar/guest-navbar.tsx').default;
const ProfileDetails=load('components/dashboard/users/community-profile-details.tsx').default;
const copy=load('lib/community/copy.ts');const cases=[];const evidence=process.env.COMMUNITY_TEST_OUTPUT || path.join(root,'docs/implementation-2026-10-20');const output=path.join(evidence,'render');fs.mkdirSync(output,{recursive:true});
function check(name,fn){fn();cases.push({name,status:'PASS'});console.log('PASS '+name);}
const html=(Component,props={})=>renderToStaticMarkup(React.createElement(Component,props));
const initial=html(Form);fs.writeFileSync(path.join(output,'register-initial.html'),initial);
check('initial questionnaire contains complete welcome and exactly three affiliation answers',()=>{for(const text of copy.WELCOME_PARAGRAPHS)assert.ok(initial.replace(/<[^>]*>/g,'').includes(text.replace(/&/g,'&amp;')));assert.equal((initial.match(/name="affiliation"/g)||[]).length,3);assert.ok(initial.includes('Пожалуйста, укажите Вашу связь с еврейством:'));});
check('initial questionnaire hides full fields and does not turn gender into affiliation',()=>{assert.ok(!initial.includes('profile-firstName'));assert.ok(!initial.includes('name="gender"'));assert.ok(!initial.includes('Ваш статус'));});
for(const affiliation of ['maternal','giyur']){
 const expanded=html(Form,{userId:'synthetic',initialProfile:{filterVersion:2,filterCompletedAt:'2026-10-20T00:00:00Z',affiliation,gender:'female',filterRevision:0,childrenData:[]}});fs.writeFileSync(path.join(output,`register-${affiliation}.html`),expanded);
 check(affiliation+' expands existing fields, explanation and separate gender without duplicate status',()=>{assert.ok(expanded.includes('profile-firstName'));assert.ok(expanded.includes('profile-marital'));assert.equal((expanded.match(/name="gender"/g)||[]).length,2);for(const text of copy.FORM_EXPLANATION)assert.ok(expanded.includes(text));assert.ok(!expanded.includes('name="jewishStatus"'));});
}
check('old version does not preselect religious answers even when old answers are populated',()=>{const old=html(Form,{userId:'old',initialProfile:{filterVersion:1,affiliation:'maternal',gender:'female',firstName:'Existing name'}});assert.ok(!old.includes('checked=""'));assert.ok(!old.includes('profile-firstName'));});
check('reopened permanent profile restores privacy consent, while explicit draft false remains false',()=>{
 const profile={filterVersion:2,filterCompletedAt:'2026-10-20T00:00:00Z',affiliation:'maternal',gender:'female',agreedToPrivacy:true};
 const consent=markup=>markup.match(/<input(?=[^>]*type="checkbox")(?=[^>]*required="")[^>]*>/)?.[0]||'';
 assert.ok(consent(html(Form,{userId:'persisted',initialProfile:profile})).includes('checked=""'),'Stored consent must be checked after reopening the permanent profile');
 assert.ok(!consent(html(Form,{userId:'persisted',initialProfile:profile,initialDraft:{...profile,agreedToPrivacy:false}})).includes('checked=""'),'An explicit draft refusal must not be overwritten by previous consent');
});
const none=html(Form,{userId:'synthetic',initialProfile:{filterVersion:2,filterCompletedAt:'2026-10-20T00:00:00Z',affiliation:'none',gender:'male',filterRevision:0,childrenData:[]}});fs.writeFileSync(path.join(output,'register-none.html'),none);
check('third branch contains all gratitude text/resources and no full-profile submit fields',()=>{for(const text of copy.RESOURCE_PARAGRAPHS)assert.ok(none.includes(text));for(const resource of copy.COMMUNITY_RESOURCES)assert.ok(none.includes(resource.href));assert.ok(!none.includes('profile-firstName'));assert.ok(!none.includes('Продолжить с Google'));});
const father=html(Form,{userId:'father',initialProfile:{filterVersion:2,filterCompletedAt:'2026-10-20T00:00:00Z',affiliation:'maternal',gender:'male',hasChildren:true,childrenData:[]}});
check('father questionnaire offers no child creation control',()=>{assert.ok(!father.includes('Добавить ребёнка'));assert.ok(!father.includes('обратитесь к администратору'));});
for(const gender of ['female','male']) for(const stage of ['advanced','completed',null]){
 const content=html(Form,{userId:'giyur-person',initialProfile:{filterVersion:2,filterCompletedAt:'2026-10-20T00:00:00Z',affiliation:'giyur',gender,giyurStage:stage,hasChildren:true,childrenData:[]}});
 check('giyur '+gender+'/'+stage+' removes main clarification and keeps correct child UI',()=>{
   assert.equal(content.includes('Добавить ребёнка'),gender==='female' && stage==='completed');
   assert.equal((content.match(/name="affiliation"/g)||[]).length,3);
   assert.ok(!content.includes('Для личной записи это уточнение не требуется.'));
   assert.ok(!content.includes('name="giyurStage"'));
   assert.equal((content.match(/name="giyurStage"/g)||[]).length,0);
 });
}
check('administrative card reads canonical city ID and explicit/unknown child genders',()=>{
 const content=html(ProfileDetails,{user:{affiliation:'maternal',city:'Ришон ле-Цион',cityId:'8300',childrenData:[{id:'boy',name:'Boy',gender:'male'},{id:'girl',name:'Girl',gender:'female'},{id:'old',name:'Unknown'}]}});
 for(const text of ['8300','Мальчик','Девочка','Пол не указан'])assert.ok(content.includes(text));
});
const access=html(Access,{returnTo:'/events/synthetic'});fs.writeFileSync(path.join(output,'event-guest.html'),access);
for(const [stage,label] of [[null,'Этап не уточнён'],['advanced','Продвинутый этап'],['completed','Гиюр завершён']]) check('person card shows persisted giyur '+stage,()=>{
 const content=html(ProfileDetails,{user:{affiliation:'giyur',giyurStage:stage}});
 assert.ok(content.includes(label));
});
check('guest event has exact two branches and safe return context without event title/image',()=>{for(const phrase of ['Один шаг до записи!','Чтобы записаться на мероприятие, войдите в аккаунт или сначала зарегистрируйтесь в нашей общине.','Я уже регистрировался. Войти в кабинет&gt;&gt;','Я здесь впервые! Пройти быструю регистрацию&gt;&gt;'])assert.ok(access.includes(phrase),phrase);assert.ok(access.includes('/register?returnTo=%2Fevents%2Fsynthetic'));assert.ok(!access.includes('<img'));});
pathname='/events/synthetic';const eventNavbar=html(Navbar);fs.writeFileSync(path.join(output,'event-header-guest.html'),eventNavbar);
check('guest event header contains no menu, generic registration or extra sign-in branch',()=>{assert.ok(!eventNavbar.includes('Регистрация'));assert.ok(!eventNavbar.includes('Мероприятия'));assert.ok(!eventNavbar.includes('Войти'));});
pathname='/';const homeNavbar=html(Navbar);fs.writeFileSync(path.join(output,'home-header-guest.html'),homeNavbar);
check('guest home header retains Google login and questionnaire link without menu',()=>{assert.ok(homeNavbar.includes('Войти'));assert.ok(homeNavbar.includes('/register?returnTo='));assert.ok(!homeNavbar.includes('Мероприятия'));});
fs.writeFileSync(path.join(evidence,'render-results.json'),JSON.stringify({method:'React component SSR with injected auth/navigation, not browser E2E',checks:cases},null,2)+'\n');console.log(cases.length+'/'+cases.length+' render checks passed.');
