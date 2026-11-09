import {cpSync, mkdirSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const output = '.site-build';
rmSync(output, {recursive:true,force:true});
mkdirSync(output);
for (const name of readdirSync('.')) {
  if (['account','assets','vendor'].includes(name) || /\.(html|css|xml|txt)$/.test(name)) cpSync(name, `${output}/${name}`, {recursive:true});
}
// Explicit private-by-default boundary: source-controlled Classroom authoring
// work is NOT published merely because it exists in this repo. Only the
// reviewed public landing is included until the owner approves releases.
mkdirSync(`${output}/classroom`, {recursive:true});
cpSync('classroom/public-landing.html', `${output}/classroom/index.html`);
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
console.log('Packaged approved public website only; unreleased Classroom pages and source assets are excluded.');
