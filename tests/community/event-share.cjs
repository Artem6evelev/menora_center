/* Pure public-link/copy contract. No env, network, profile or database access. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../../lib/telegram/event-share.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:mod,exports:mod.exports});
const{eventShareCopy}=mod.exports,checks=[];
function test(name,fn){fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}
test('Russian share text preserves the supplied public title and describes the community event',()=>{const title='Встреча семей — 22 октября';assert.equal(eventShareCopy.ru.text(title),title+' — мероприятие Menorah Center в Ришон-ле-Ционе');});
test('Russian Share label and successful-copy feedback use the approved product wording',()=>{assert.equal(eventShareCopy.ru.share,'Поделиться');assert.equal(eventShareCopy.ru.copied,'Ссылка на мероприятие скопирована');});
test('manual-copy fallback offers Russian selection instructions and a close action',()=>{const copy=eventShareCopy.ru;assert.equal(copy.manual,'Скопируйте ссылку');assert.match(copy.hint,/Выделите ссылку/);assert.equal(copy.select,'Выделить ссылку');assert.equal(copy.close,'Закрыть');});
const out=process.env.COMMUNITY_TEST_OUTPUT||'/tmp/menora-image-share-evidence/event-share';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'event-share-results.json'),JSON.stringify({environment:'Pure TypeScript module, no external dependencies or side effects',checks},null,2)+'\n');console.log('TOTAL '+checks.length+' PASS');
