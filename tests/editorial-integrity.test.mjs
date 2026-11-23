import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import test from 'node:test';
import {Window} from 'happy-dom';
const pages=['index.html','about.html','coach-nate.html','research.html','coaching.html','products.html','resources.html','science.html','nav-coach.html','classroom/index.html'];
function text(p){const w=new Window();w.document.write(readFileSync(p,'utf8'));return w.document.body.textContent.replace(/\s+/g,' ');}
test('Site has no internal report wording in public copy',()=>{for(const p of pages)assert.doesNotMatch(text(p),/owner-provided certificate|approved (?:r[eé]sum[eé]|CV)|production-verified|as documented in (?:his|my) r[eé]sum[eé]|not independently audited timesheets|not a verified public capability/i,p);});
test('Editorial changes retain genuine experience, credentials, and story',()=>{
 const c=text('coach-nate.html'),a=text('about.html');
 for(const term of ['entered college thinking I might become a marine biologist','During the COVID-19 pandemic, I worked as a nursing assistant'])assert.ok(c.includes(term),term);
 for(const page of [a,c])for(const term of ['NASM Certified Personal Trainer (CPT)','May 29, 2025','May 29, 2027'])assert.ok(page.includes(term),term);
 for(const term of ['B.S. in Kinesiology','B.A. in Biology','minor in Chemistry'])assert.ok(a.includes(term),term);
 for(const term of ['Blinnergy','EXOS','FYZICAL','BIOL 348','Sound Bio Labs','Professors Gregory Freedman and Jaci Scheer'])assert.ok(c.includes(term),term);
 for(const term of ['1,300+','700+','300+','50+'])assert.ok(c.includes(term),term);
 const pdf=readFileSync('assets/pdf/Nathan_Holochwost_Resume_2026-11.pdf');
 assert.equal(pdf.subarray(0,5).toString(),'%PDF-','Public résumé must be a real PDF file');
 assert.ok(readFileSync('about.html','utf8').includes('href="coach-nate.html#my-story"'));
 assert.ok(readFileSync('coach-nate.html','utf8').includes('<h2 id="story-heading">My story</h2>'));
 assert.ok(c.includes('EXOS at Google'));
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

test('Coach Nate hero retains the approved introduction and original media links',()=>{
 const w=new Window();w.document.write(readFileSync('coach-nate.html','utf8'));
 const hero=w.document.querySelector('section.hero');
 assert.ok(hero,'Hero section must exist');
 assert.equal(hero.querySelector('.eyebrow')?.textContent,'Athlete · Coach · NAV founder');
 assert.match(hero.querySelector('h1')?.textContent||'',/Nathan G\..*Holochwost/);
 assert.equal(hero.querySelector('.lead')?.textContent,'I am Coach Nate. I coach strength and fitness at Blinnergy and EXOS, and I founded NAV to build a career around my passion for training, science, and education.');
 assert.equal(hero.querySelector('.subcopy')?.textContent,'I graduated with a pre-medical education from Western Washington University: a B.S. in Kinesiology, a B.A. in Biology, and a minor in Chemistry. Feel free to look at my résumé—you’re hiring a coach, after all!');
 assert.equal(hero.querySelector('a.btn')?.getAttribute('href'),'assets/pdf/Nathan_Holochwost_Resume_2026-11.pdf');
 assert.equal(hero.querySelector('a.btn')?.textContent,'View Resume');
 assert.equal(hero.querySelector('.hero-coaching-hours strong')?.textContent,'2,000+');
 assert.equal(hero.querySelector('.hero-coaching-hours span')?.textContent,'coaching hours');
 assert.equal(w.document.querySelector('.info[aria-label="Career highlights"]'),null,'Redundant career highlight strip must be removed');
 assert.equal(w.document.querySelectorAll('.hero-coaching-hours').length,1,'One understated coaching-hour figure beside the résumé button');
 assert.equal(hero.querySelector('a.btn')?.getAttribute('target'),'_blank');
 assert.equal(hero.querySelector('img')?.getAttribute('src'),'assets/coach-nate-lab-portrait.webp');
 assert.equal(hero.querySelector('figure a'),null,'The approved photo caption has no extra link');
 assert.equal(hero.querySelector('figcaption')?.textContent,'A photo from one of my lab shadowing experiences. I’m interested in cartilage biology, how tissues respond to mechanical loading, regenerative medicine, and, of course, exercise science.');
 assert.equal(hero.querySelector('img')?.getAttribute('alt'),'Nate in a white lab coat and blue gloves holding a sample tube in a laboratory');
 assert.equal(w.document.querySelector('nav.profile-jumps'),null,'Retired shortcut buttons should not remain');
 assert.ok(w.document.querySelector('#my-story'),'The essay collection remains accessible');
 assert.ok(w.document.querySelector('#cv'),'Experience details remain accessible');
 assert.ok(w.document.querySelector('#youtube-lessons'),'Educational videos remain accessible');
 w.happyDOM.abort();
});

test('Standalone résumé HTML page is retired without breaking PDF access',()=>{
 assert.equal(existsSync('resume.html'),false,'Do not publish the duplicate résumé page');
 const netlify=readFileSync('netlify.toml','utf8');
 assert.match(netlify,/from = "\/resume\.html"[\s\S]{0,160}to = "\/assets\/pdf\/Nathan_Holochwost_Resume_2026-11\.pdf"[\s\S]{0,60}status = 301/);
 for(const path of pages){
  const html=readFileSync(path,'utf8');
  assert.doesNotMatch(html,/href="resume\.html"/,path+' must not link to the retired page');
 }
 const coach=readFileSync('coach-nate.html','utf8');
 assert.match(coach,/href="assets\/pdf\/Nathan_Holochwost_Resume_2026-11\.pdf" target="_blank" rel="noopener noreferrer" type="application\/pdf">View Resume<\/a>/);
});
