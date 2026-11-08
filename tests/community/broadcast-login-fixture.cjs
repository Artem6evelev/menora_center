/* Disposable adapters only. Product auth/validation/routes remain real. */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const fixture=process.env.MINIAPP_UI_FIXTURE||'/tmp/menora-broadcast-ui';
cp.execFileSync(process.execPath,[path.join(__dirname,'public-event-fixture.cjs')],{env:{...process.env,MINIAPP_UI_FIXTURE:fixture},stdio:'inherit'});
const file=fixture+'/lib/telegram/broadcast-image.ts',body=fs.readFileSync(file,'utf8');
fs.writeFileSync(file,body.replace('from "@supabase/supabase-js"','from "@/test-fixture/broadcast-storage"'));
fs.appendFileSync(fixture+'/.env.local','SUPABASE_SERVICE_ROLE_KEY=synthetic-storage-adapter\n');
fs.writeFileSync(fixture+'/test-fixture/broadcast-storage.ts',`export function createClient(){return{storage:{from:()=>({upload:async()=>({error:null}),getPublicUrl:(object:string)=>({data:{publicUrl:'https://synthetic.supabase.co/storage/v1/object/public/images/'+object}})})}};}`);
const r=fixture+'/app/api/test-release-state/route.ts';fs.writeFileSync(r,fs.readFileSync(r,'utf8').replace('select id,recipient_count,status from telegram_broadcasts','select id,message,image_url,event_id,button_label,recipient_count,status from telegram_broadcasts'));
console.log('Image upload adapter is synthetic. No storage or Telegram writes possible.');
