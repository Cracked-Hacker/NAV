import {cpSync, mkdirSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const output = '.site-build';
rmSync(output, {recursive:true,force:true});
mkdirSync(output);
// Allowlist public release assets. Do not upload source-only coursework, quiz banks,
 // labs, drafts, or beta materials to a static host where links cannot protect them.
for (const name of readdirSync('.')) {
  if (name === 'classroom') {
    mkdirSync(`${output}/classroom`, {recursive:true});
    cpSync('classroom/index.html', `${output}/classroom/index.html`);
    continue;
  }
  if (['account','assets','vendor'].includes(name) || /\.(html|css|xml|txt)$/.test(name)) {
    cpSync(name, `${output}/${name}`, {recursive:true});
  }
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
