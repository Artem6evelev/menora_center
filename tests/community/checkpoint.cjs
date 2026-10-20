/* Value-free identity of the complete current source/assets/tests/manual SQL. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'docs/production-readiness-2026-10-20/evidence');
const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const listed=[...new Set(cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean))].sort();
const digest=value=>crypto.createHash('sha256').update(value).digest('hex'),files={};
for(const rel of listed){const full=path.join(root,rel);if(!fs.existsSync(full)||!fs.statSync(full).isFile())continue;
 if((path.basename(rel).startsWith('.env')&&rel!=='.env.example')||/^(node_modules|\.next[^/]*|out|build|coverage)\//.test(rel)||rel.endsWith('.tsbuildinfo'))continue;
 if(rel.startsWith('docs/')&&!/\.(?:[cm]?js|tsx?|sql)$/.test(rel))continue;
 files[rel]=digest(fs.readFileSync(full));}
const codeManifestSha256=digest(Object.entries(files).map(([file,hash])=>file+'\0'+hash+'\n').join(''));
const versions={};for(const name of ['next','eslint','eslint-config-next','typescript','@clerk/nextjs','drizzle-orm','drizzle-kit'])versions[name]=require(path.join(root,'node_modules',name,'package.json')).version;
const status=git('status','--short','--untracked-files=all').split('\n');
const result={branch:git('branch','--show-current'),head:git('rev-parse','HEAD'),worktreeDirty:status.some(Boolean),checkedAt:new Date().toISOString(),codeManifestSha256,manifestAlgorithm:'v3: SHA256 of sorted relative-path + NUL + content SHA256 + LF. All git-listed CURRENT source/config/assets/tests and executable docs/SQL; includes value-free .env.example; excludes real env, deps/build outputs, docs prose/evidence JSON/images. Deleted tracked files are recorded in gitStatus, never restored from HEAD.',previousVerifiedV2:'24317fb81c171ba10681e3ac67a76c35d2756e1bfab73a5fc06a706c3368a588',versions,gitStatus:status,sourceFiles:Object.keys(files).length,manualSqlSha256:digest(fs.readFileSync(path.join(root,'docs/production-readiness-2026-10-20/SUPABASE_MANUAL_MIGRATION.sql'))),files};
fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'code-checkpoint.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({branch:result.branch,head:result.head,worktreeDirty:result.worktreeDirty,codeManifestSha256,sourceFiles:result.sourceFiles,manualSqlSha256:result.manualSqlSha256}));
