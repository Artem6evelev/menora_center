/* Pure public-link/copy contract. No env, network, profile or database access. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const mod={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.resolve(__dirname,'../../lib/telegram/event-share.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:mod,exports:mod.exports});
const{eventShareCopy}=mod.exports,checks=[];
function test(name,fn){fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}
for(const language of ['ru','he','en'])test(language+' share text and copied/manual feedback are localized',()=>{const copy=eventShareCopy[language];assert.ok(copy.text('Synthetic title').includes('Synthetic title'));assert.ok(copy.text('Synthetic title').includes('Menorah Center'));for(const key of ['share','copied','manual','hint','select','close'])assert.ok(copy[key]);});
const out=process.env.COMMUNITY_TEST_OUTPUT||'/tmp/menora-image-share-evidence/event-share';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'event-share-results.json'),JSON.stringify({environment:'Pure TypeScript module, no external dependencies or side effects',checks},null,2)+'\n');console.log('TOTAL '+checks.length+' PASS');
