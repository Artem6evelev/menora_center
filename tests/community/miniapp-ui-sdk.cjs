/* Test-only Telegram bridge, synthetic HMAC; never imported by application code. */
const {createHmac}=require('node:crypto');
const key='123456:synthetic-miniapp-ui-key';
function signedInitData(id,language='ru'){
 const fields={auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:'Synthetic',language_code:language}),start_param:'ui_test'};
 const secret=createHmac('sha256','WebAppData').update(key).digest();
 return new URLSearchParams({...fields,hash:createHmac('sha256',secret).update(Object.keys(fields).sort().map(k=>k+'='+fields[k]).join('\n')).digest('hex')}).toString();
}
async function installSdk(context,{id,language='ru',version='9.0',platform='ios',safeArea={top:12,bottom:16,left:0,right:0},contentSafeArea={top:8,bottom:4,left:0,right:0}}){
 await context.addInitScript(({raw,version,platform,safeArea,contentSafeArea})=>{
  const handlers=new Map(),back=new Set();const calls={ready:0,expand:0,subscribed:0,removed:0,backVisible:false,header:[],background:[],bottom:[]};
  const app={initData:raw,initDataUnsafe:{user:{id:999999,first_name:'UNTRUSTED',language_code:'xx'}},platform,version,colorScheme:'dark',themeParams:{bg_color:'#000000'},viewportStableHeight:innerHeight,isActive:true,safeAreaInset:safeArea,contentSafeAreaInset:contentSafeArea,
   ready(){calls.ready++},expand(){calls.expand++},isVersionAtLeast(min){const a=version.split('.').map(Number),b=min.split('.').map(Number);return a[0]>b[0]||(a[0]===b[0]&&(a[1]||0)>=(b[1]||0));},
   setHeaderColor(v){calls.header.push(v)},setBackgroundColor(v){calls.background.push(v)},setBottomBarColor(v){calls.bottom.push(v)},
   onEvent(name,fn){if(!handlers.has(name))handlers.set(name,new Set());handlers.get(name).add(fn);calls.subscribed++},offEvent(name,fn){handlers.get(name)?.delete(fn);calls.removed++},
   BackButton:{show(){calls.backVisible=true},hide(){calls.backVisible=false},onClick(fn){back.add(fn)},offClick(fn){back.delete(fn)}}};
  window.Telegram={WebApp:app};window.__miniappFixture={calls,emit(name){handlers.get(name)?.forEach(fn=>fn())},back(){back.forEach(fn=>fn())},listenerCount(){return [...handlers.values()].reduce((n,set)=>n+set.size,0)}};
 },{raw:signedInitData(id,language),version,platform,safeArea,contentSafeArea});
}
module.exports={signedInitData,installSdk};
