import {cpSync, mkdirSync, rmSync, writeFileSync, existsSync} from 'node:fs';
import {dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {PUBLIC_RELEASE_FILES} from './public-release-manifest.mjs';

const output = '.site-build';
rmSync(output, {recursive:true,force:true});
mkdirSync(output);
for (const path of PUBLIC_RELEASE_FILES) {
  if (!existsSync(path)) throw new Error(`Approved public file missing: ${path}`);
  const target = `${output}/${path}`;
  mkdirSync(dirname(target), {recursive:true});
  cpSync(path, target);
}
let commit=process.env.COMMIT_REF;
let dirty=false;
if (!commit) {
  try {
    commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
    dirty=Boolean(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim());
  } catch { dirty=true; }
}
writeFileSync(`${output}/release.json`,JSON.stringify({
  repository:'Cracked-Hacker/NAV',commit:/^[a-f0-9]{40}$/.test(commit||'')?commit:null,
  dirty,builtAt:new Date().toISOString(),node:process.version,
  publicFileCount:PUBLIC_RELEASE_FILES.length,
  releasePolicy:'explicit-approved-files-only'
},null,2)+'\n');
console.log(`Packaged ${PUBLIC_RELEASE_FILES.length} explicitly approved public files. No wildcard course files, drafts, answers, or future assets published.`);
