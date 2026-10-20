// Read-only public HTTP smoke. Output contains no event titles, IDs or visitor data.
const fs=require('node:fs');const {createHash}=require('node:crypto');
async function get(url){const res=await fetch(url,{signal:AbortSignal.timeout(20000)});const html=await res.text();return{res,html};}
(async()=>{
 const out={scope:'Unauthenticated public GET, deployment SHA unknown. No state-changing request.',checked_at:new Date().toISOString()};
 try{
  const {res,html}=await get('https://menorah-rishon.com/');
  const links=[...html.matchAll(/href="(\/events\/[^"?#]+)"/g)].map(m=>m[1]);
  out.home={status:res.status,url:res.url,server:res.headers.get('server'),cache_control:res.headers.get('cache-control'),event_links: new Set(links).size,has_upcoming_heading:/Ближайшие/.test(html),has_new_filter_question:html.includes('Пожалуйста, укажите Вашу связь с еврейством'),contains_supabase_image_url:html.includes('.supabase.co/storage/'),has_event_menu:/Мероприятия/.test(html)};
  if(links.length){
   const eventPath=links[0];const event=await get(new URL(eventPath,res.url));
   out.first_event={path_sha256:createHash('sha256').update(eventPath).digest('hex'),status:event.res.status,cache_control:event.res.headers.get('cache-control'),has_old_guest_heading:event.html.includes('Один шаг до'),has_old_google_button:event.html.toLowerCase().includes('продолжить с google'),has_new_two_branch_copy:event.html.includes('Я уже регистрировался'),has_description_meta: /name="description" content="[^"]+"/.test(event.html),contains_image_source:event.html.includes('.supabase.co/storage/')};
  }
 }catch(e){out.error={name:e.name,message:'HTTP smoke failed; raw error suppressed'};}
 fs.writeFileSync('docs/audit-2026-10-20/evidence/public-http.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
})().catch(()=>{process.exitCode=1});
