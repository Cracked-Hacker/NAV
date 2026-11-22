import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const about=readFileSync('about.html','utf8');
test('About uses exact educational credentials and grounded sources',()=>{
  for(const token of ['B.S. in Kinesiology','B.A. in Biology','minor in Chemistry','Blinnergy','EXOS','FYZICAL','BIOL 348','Catherine Clark','Angelique Day','Sound Bio Labs','Yang Lab','10.1007/s10560-024-01000-y'])assert.ok(about.includes(token),token);
  assert.match(about,/Hours are estimates from my November 2026 résumé/);
  assert.match(about,/shadowed researchers in the/);
  assert.match(about,/EXOS at Google/);
  assert.doesNotMatch(about,/Google employee|employed by Google/i);
  assert.doesNotMatch(about,/M\.D\.|DPT|current licensed medical provider/i);
  assert.equal((about.match(/<h1(?:\s|>)/g)||[]).length,1);
});
test('About avoids duplicate product journey tiles from homepage',()=>{
  assert.doesNotMatch(about,/Three places, three different purposes/);
  assert.doesNotMatch(about,/class="card-link"/);
  for(const route of ['resume.html','coach-nate.html','research.html'])assert.ok(about.includes('href="'+route+'"'));
});
