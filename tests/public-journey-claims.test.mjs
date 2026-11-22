import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {Window} from 'happy-dom';

function documentFor(path){const window=new Window();window.document.write(readFileSync(new URL('../'+path,import.meta.url),'utf8'));return window.document;}

test('homepage offers exactly three distinct, usable destinations',()=>{
 const doc=documentFor('index.html');
 const cards=[...doc.querySelectorAll('.nav-home-action')];
 assert.deepEqual(cards.map(p=>p.querySelector('strong').textContent.trim()),['I want coaching','Use NAV Coach','Explore products']);
 assert.deepEqual(cards.map(p=>p.getAttribute('href')),['coaching.html','nav-coach.html','products.html']);
 assert.equal(new Set(cards.map(p=>p.getAttribute('href'))).size,3);
 assert.doesNotMatch(doc.body.textContent,/enter your tester code|redeem a code|approved beta areas/i);
});

test('products show a functioning study-options menu with truthful $0–$100 manual fulfillment',()=>{
  const doc=documentFor('products.html');
  for(const id of ['nav-coach','classroom','study-tools','merch']) assert.ok(doc.getElementById(id),id);
  assert.match(doc.getElementById('classroom').textContent,/in development/i);
  const study=doc.getElementById('study-tools');
  assert.match(study.textContent,/Ultimate Muscle Card Set/i);
  assert.match(study.textContent,/379.card/i);
  const menu=study.querySelector('details#muscle-card-options');
  assert.ok(menu,'view options must be an accessible native disclosure');
  assert.equal(menu.querySelector('summary').textContent.trim(),'View Options');
  assert.match(study.textContent,/\$0[–-]\$100/);
  assert.match(study.textContent,/choosing \$0 is allowed/i);
  for(const term of ['CSV','Anki-import TSV','duplex PDF','Classroom-format JSON','Anki .apkg']) assert.ok(study.textContent.includes(term),term);
  const quizlet=menu.querySelector('a[href="https://quizlet.com/1128248509/ultimate-muscle-card-set-flash-cards/"]');
  const venmo=menu.querySelector('a[href="https://venmo.com/u/Nate-Holochwost"]');
  const request=menu.querySelector('a[href^="mailto:NAVfitnessBrand@gmail.com"]');
  assert.ok(quizlet,'original Quizlet URL required');
  assert.ok(venmo,'owner-provided Venmo URL required');
  assert.ok(request,'manual delivery must have a real request path');
  for(const link of [quizlet,venmo]){
    assert.equal(link.getAttribute('target'),'_blank');
    assert.match(link.getAttribute('rel'),/noopener/);
    assert.match(link.getAttribute('rel'),/noreferrer/);
  }
  assert.match(study.textContent,/mark the payment as a purchase \/ goods and services/i);
  assert.match(study.textContent,/does not automatically unlock/i);
  assert.match(doc.getElementById('merch').textContent,/not for sale/i);
  assert.doesNotMatch(doc.body.textContent,/Buy now|checkout now|Instant download after payment/i);
});

test('My NAV education directs members to published resources without promising open courses or completion records',()=>{
 const section=documentFor('account/index.html').querySelector('#education');
 assert.doesNotMatch(section.textContent,/open lessons|progress currently stays|account.synced completion|certification record/i);
 assert.match(section.textContent,/still in development/i);
 assert.deepEqual([...section.querySelectorAll('a')].map(a=>a.getAttribute('href')),['../resources.html','../research.html']);
});

test('research and account FAQ describe the actual available next steps',()=>{
 const research=documentFor('research.html');
 assert.equal([...research.querySelectorAll('a')].some(a=>a.textContent.includes('evidence standards')&&a.getAttribute('href')==='science.html'),true);
 assert.doesNotMatch(research.body.textContent,/Explore exercise.science lessons/i);
 const faq=documentFor('resources.html');
 assert.equal([...faq.querySelectorAll('a')].some(a=>a.textContent.includes('Sign In to My NAV')&&a.getAttribute('href')==='account/auth.html?mode=login'),true);
 assert.match(faq.body.textContent,/may be asked to sign in again/);
});

test('public copy never claims unreleased Classroom or private testing is available',()=>{
 const about=documentFor('about.html');
 const science=documentFor('science.html');
 assert.doesNotMatch(about.body.textContent,/available only to invited beta testers|Start learning/i);
 assert.match(about.body.textContent,/not currently available as public offerings/i);
 assert.doesNotMatch(science.body.textContent,/Request private education access|is being tested privately/i);
 assert.match(science.body.textContent,/still in development and review/i);
});

test('Products page has canonical, Open Graph and sitemap coverage',()=>{
 const doc=documentFor('products.html');
 assert.equal(doc.querySelector('link[rel="canonical"]').href,'https://coach-nate.netlify.app/products.html');
 assert.ok(doc.querySelector('meta[property="og:title"]'));
 assert.ok(readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8').includes('<loc>https://coach-nate.netlify.app/products.html</loc>'));
});

test('404 page offers useful released destinations instead of unfinished beta',()=>{
 const doc=documentFor('404.html');
 assert.deepEqual([...doc.querySelectorAll('main a')].map(a=>a.getAttribute('href')),['index.html','coaching.html','products.html']);
});

test('science page presents study-design categories without a universal rank',()=>{
 const doc=documentFor('science.html');
 const labels=[...doc.querySelectorAll('.principle-index')].map(x=>x.textContent.trim());
 assert.deepEqual(labels,['SR','GL','CT','OB']);
 assert.match(doc.body.textContent,/risk of bias, consistency, precision, relevance/i);
 assert.ok(doc.querySelector('a[href^="https://www.cebm.ox.ac.uk/"]'));
 assert.ok(doc.querySelector('a[href^="https://www.cdc.gov/acip-grade-handbook/"]'));
});


test('Coach Nate displays only selected, contextual, privacy-safe uploaded photos',()=>{
 const doc=documentFor('coach-nate.html');
 const photos=[...doc.querySelectorAll('#teaching img[src*="selected.webp"]')];
 assert.equal(photos.length,2);
 assert.deepEqual(photos.map(img=>img.getAttribute('src')),[ 
  'assets/coach-nate-bod-pod-selected.webp',
  'assets/coach-nate-clinical-ppe-selected.webp'
 ]);
 for(const img of photos){assert.equal(img.getAttribute('loading'),'lazy');assert.ok(img.getAttribute('alt')?.length>20);}
 assert.doesNotMatch(doc.body.textContent,/Another day another butt|certified registered nurse/i);
 const manifest=readFileSync(new URL('../scripts/public-release-manifest.mjs',import.meta.url),'utf8');
 for(const img of photos){
   const relative=img.getAttribute('src');
   assert.ok(manifest.includes('"'+relative+'"'),relative+' missing from finished-only build inventory');
   const bytes=readFileSync(new URL('../'+relative,import.meta.url));
   assert.ok(bytes.length<20000,'New photo unexpectedly large');
   assert.equal(bytes.subarray(0,4).toString(),'RIFF');
   assert.equal(bytes.subarray(8,12).toString(),'WEBP');
 }
 assert.ok(doc.querySelector('img[src="assets/coach-nate-lab-portrait.webp"]'),'Existing research hero must remain');
});

test('coaching offers three booking paths and describes Rain City Fit as pending',()=>{
 const main=documentFor('coaching.html').querySelector('main');
 const options=[...main.querySelectorAll('#booking article')];
 assert.equal(options.length,3);
 assert.match(options[0].textContent,/\$80[–-]\$300 per week/);
 assert.match(options[0].textContent,/same coaching service/);
 assert.match(options[0].textContent,/sliding scale depends on what you can afford/);
 const applications=[...main.querySelectorAll('a[href^="https://docs.google.com/forms/"]')];
 assert.equal(applications.length,1);
 assert.equal(applications[0].textContent,'Apply for coaching');
 assert.match(options[1].textContent,/Woodinville, Bothell, and nearby communities · Blinnergy/);
 assert.match(options[1].textContent,/\$100 base price per session/);
 assert.ok(options[1].querySelector('a[href="https://apps.apple.com/us/app/blinnergy/id6742318263"]'));
 assert.match(options[2].textContent,/Google Employees · EXOS/);
 assert.match(options[2].textContent,/find Nate Holochwost on Boost/);
 assert.match(main.textContent,/Rain City Fit.+Booking is pending/s);
});
test('owner-provided NASM CPT dates are correct and the public site does not disclose private identifiers',()=>{
 for(const path of ['about.html','resume.html','coach-nate.html']){
   const body=documentFor(path).body.textContent;
   assert.match(body,/NASM Certified Personal Trainer \(CPT\)/i);
   assert.match(body,/May 29, 2025/);
   assert.match(body,/May 29, 2027/);
 }
 const doc=documentFor('coach-nate.html');
 const clinical=doc.querySelector('img[src="assets/coach-nate-clinical-ppe-selected.webp"]');
 assert.ok(clinical);
 assert.match(clinical.alt,/seated on a couch/i);
 assert.doesNotMatch(doc.body.textContent,/Another day another butt/i);
});
test('My NAV presents one global app launch instead of redundant app links',()=>{
 const doc=documentFor('account/index.html');
 const links=[...doc.querySelectorAll('a[href="https://nav-coach-app-eight.vercel.app/"]')];
 assert.equal(links.length,1);
});
