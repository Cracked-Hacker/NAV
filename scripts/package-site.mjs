import {cpSync, mkdirSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const output = '.site-build';
rmSync(output, {recursive:true,force:true});
mkdirSync(output);
for (const name of readdirSync('.')) {
  if (['account','assets','classroom','vendor'].includes(name) || /\.(html|css|xml|txt)$/.test(name)) cpSync(name, `${output}/${name}`, {recursive:true});
}
let commit = process.env.COMMIT_REF;
let dirty = false;
if (!commit) {
  try {
    commit = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
    dirty = Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim());
  } catch { dirty = true; }
}
writeFileSync(`${output}/release.json`, JSON.stringify({
  repository:'Cracked-Hacker/NAV', commit:/^[a-f0-9]{40}$/.test(commit||'')?commit:null,
  dirty, builtAt:new Date().toISOString(), node:process.version
},null,2)+'\n');
console.log('Packaged public assets only; server source, tests, docs, and development dependencies are excluded.');
