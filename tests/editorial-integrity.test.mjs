import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {Window} from 'happy-dom';
const pages=['index.html','about.html','coach-nate.html','resume.html','research.html','coaching.html','products.html','resources.html','science.html','nav-coach.html','classroom/index.html'];
function text(p){const w=new Window();w.document.write(readFileSync(p,'utf8'));return w.document.body.textContent.replace(/\s+/g,' ');}
test('Site has no internal report wording in public copy',()=>{for(const p of pages)assert.doesNotMatch(text(p),/owner-provided certificate|approved (?:r[eé]sum[eé]|CV)|production-verified|as documented in (?:his|my) r[eé]sum[eé]|not independently audited timesheets|not a verified public capability/i,p);});
test('Editorial changes retain genuine experience, credentials, and story',()=>{
 const c=text('coach-nate.html'),a=text('about.html'),r=text('resume.html');
 for(const term of ['started college thinking I might become a marine biologist','During the COVID-19 pandemic, I worked as a nursing assistant'])assert.ok(c.includes(term),term);
 for(const page of [a,r,c])for(const term of ['NASM Certified Personal Trainer (CPT)','May 29, 2025','May 29, 2027'])assert.ok(page.includes(term),term);
 for(const term of ['B.S. in Kinesiology','B.A. in Biology','minor in Chemistry','Blinnergy','EXOS','FYZICAL','BIOL 348','Sound Bio Labs','University of Washington Yang Lab'])assert.ok(a.includes(term),term);
 for(const term of ['1,300+','700+','1,600+','800+','300+','50+'])assert.ok(r.includes(term),term);
 assert.ok(a.includes('Read Nate’s story and how NAV got its start.'));
 assert.ok(r.includes('I work for EXOS at Google'));
 assert.doesNotMatch(a,/Google employee|employed by Google/i);
});
test('Research credit and licensing remain legible',()=>{
 const p=text('products.html'),r=text('research.html'),a=text('about.html');
 assert.match(p,/Evans Love \(2016\)/);
 assert.match(p,/CC BY-SA 4\.0/);
 assert.match(r,/Crosland, Nate Holochwost, Warren de Bruyn, and Catherine Clark/);
 assert.match(a,/Fitness coaching and education; not medical care/i);
 assert.match(text('disclaimer.html'),/not medical advice/i);
});
