import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

test('public deployment artifact contains working account assets and excludes server/test/dependency sources',()=>{
  execFileSync(process.execPath,['scripts/package-site.mjs'],{stdio:'pipe'});
  for(const path of ['account/auth.html','account/index.html','account/config.js','account/security.mjs','vendor/supabase-2.112.4.js','classroom/index.html'])assert.equal(existsSync(`.site-build/${path}`),true,path);
  for(const path of ['supabase','tests','docs','node_modules','package-lock.json','.git','.github'])assert.equal(existsSync(`.site-build/${path}`),false,path);
  assert.match(readFileSync('netlify.toml','utf8'),/publish = "\.site-build"/);
  assert.match(readFileSync('.github/workflows/deploy-pages.yml','utf8'),/path: \.site-build/);
});
