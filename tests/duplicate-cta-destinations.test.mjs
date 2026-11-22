import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
for (const path of ['index.html','coaching.html','nav-coach.html']) {
 test(path+' has no duplicate button destinations inside main',()=>{
   const html=readFileSync(path,'utf8');
   const main=html.split('<main')[1].split('</main>')[0];
   const hrefs=[...main.matchAll(/<a\b(?=[^>]*class="[^"]*button[^"]*")[^>]*href="([^"]+)"[^>]*>/g)].map(m=>m[1]);
   assert.equal(new Set(hrefs).size,hrefs.length);
 });
}
