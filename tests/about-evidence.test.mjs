import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const about=readFileSync('about.html','utf8');
const coach=readFileSync('coach-nate.html','utf8');
test('About uses exact educational credentials and grounded sources',()=>{
  for(const token of ['B.S. in Kinesiology','B.A. in Biology','minor in Chemistry'])assert.ok(about.includes(token),token);
  for(const token of ['Blinnergy','EXOS','FYZICAL','BIOL 348','Catherine Clark','Angelique Day','Sound Bio Labs','Gregory Freedman','Jaci Scheer','10.1007/s10560-024-01000-y'])assert.ok(coach.includes(token),token);
  assert.match(about,/href="coach-nate\.html#my-story">Read my story/);
  assert.match(coach,/I'm not a drill sergeant\. I'm a teacher\./);
  assert.doesNotMatch(about,/Yang Lab/i);
  assert.match(coach,/EXOS at Google/);
  assert.doesNotMatch(about,/Google employee|employed by Google/i);
  assert.doesNotMatch(about,/M\.D\.|DPT|current licensed medical provider/i);
  assert.equal((about.match(/<h1(?:\s|>)/g)||[]).length,1);
});
test('About avoids duplicate product journey tiles from homepage',()=>{
  assert.doesNotMatch(about,/Three places, three different purposes/);
  assert.doesNotMatch(about,/class="card-link"/);
  for(const route of ['assets/pdf/Nathan_Holochwost_Resume_2026-11.pdf','coach-nate.html','research.html'])assert.ok(about.includes('href="'+route+'"'));
});
