import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {createHash} from 'node:crypto';
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

test('Learning Resources preserves the flashcard download, Venmo, and Quizlet password',()=>{
 const doc=documentFor('products.html');
 for(const id of ['nav-coach','classroom','study-tools','merch'])assert.ok(doc.getElementById(id),id);
 const learning=doc.getElementById('study-tools');
 assert.equal(learning.querySelector('h2').textContent.trim(),'Learning Resources');
 const study=doc.getElementById('muscle-cards');
 assert.ok(study.textContent.includes('379 text-only flashcards'));
 assert.ok(study.textContent.includes('Quizlet password: nate'));
 assert.ok(study.textContent.includes('Recommended contribution: $8'));
 assert.ok(study.textContent.includes('Free at $0'));
 const menu=study.querySelector('details#muscle-card-options');
 assert.ok(menu,'native accessible View Options menu required');
 assert.equal(menu.querySelector('summary').textContent.trim(),'View Options');
 const actions=menu.querySelector('.study-download-actions');
 assert.ok(actions);
 const buttons=[...actions.querySelectorAll('a')];
 assert.equal(buttons.length,2);
 assert.equal(buttons[0].textContent.trim(),'Download');
 assert.ok(buttons[1].textContent.includes('Venmo'));
 assert.equal(buttons[1].getAttribute('href'),'https://venmo.com/u/Nate-Holochwost');
 assert.equal(buttons[0].getAttribute('href'),'downloads/NAV_Ultimate_Muscle_All_Formats_2026-11.zip');
 const zip=readFileSync(new URL('../downloads/NAV_Ultimate_Muscle_All_Formats_2026-11.zip',import.meta.url));
 assert.ok(zip.length>100000);
 assert.deepEqual([...zip.subarray(0,4)],[80,75,3,4]);
 assert.ok(study.querySelector('a[href="https://quizlet.com/1128248509/ultimate-muscle-card-set-flash-cards/"]'));
 for(const format of ['.apkg','.pdf','.csv','.html'])assert.ok([...study.querySelectorAll('.study-download-links a')].some(a=>a.getAttribute('href').endsWith(format)),format);
 assert.equal(study.querySelectorAll('a').length,7);
 assert.equal(study.querySelector('a[href^="mailto:"]'),null);
 assert.match(doc.getElementById('classroom').textContent,/in development/i);
 assert.match(doc.getElementById('merch').textContent,/not for sale/i);
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

test('Learning Resources supports instant copy, optional prefilled Venmo, and unlimited custom amounts',()=>{
 const doc=documentFor('products.html');
 const slider=doc.querySelector('#muscle-contribution');
 assert.ok(slider);
 assert.equal(slider.getAttribute('type'),'range');
 assert.deepEqual([slider.min,slider.max,slider.step,slider.value],['0','100','1','8']);
 const custom=doc.querySelector('#muscle-contribution-custom');
 assert.ok(custom);
 assert.equal(custom.getAttribute('type'),'number');
 assert.equal(custom.min,'0');
 assert.equal(custom.hasAttribute('max'),false,'No $100 cap on manual contribution');
 assert.equal(custom.value,'8');
 assert.ok(doc.querySelector('button#muscle-copy-amount'));
 const script=readFileSync(new URL('../assets/study-tools-options.js',import.meta.url),'utf8');
 assert.match(script,/navigator\.clipboard\.writeText/);
 assert.match(script,/slider\.addEventListener\('change'/);
 assert.match(script,/searchParams\.set\('amount'/);
 assert.match(script,/searchParams\.set\('txn', 'pay'\)/);
 assert.ok(doc.querySelector('script[src="assets/study-tools-options.js"]'));
 assert.doesNotMatch(doc.getElementById('study-tools').innerHTML,/Create checkout|Buy now|stripe\.com/i);
 const venmo=doc.getElementById('study-tools').querySelector('a[href="https://venmo.com/u/Nate-Holochwost"]');
 assert.ok(venmo,'Fallback Venmo profile remains available');
 assert.equal(venmo.getAttribute('target'),'_blank');
 assert.match(venmo.getAttribute('rel'),/noopener/);
 assert.match(venmo.getAttribute('rel'),/noreferrer/);
 assert.ok(doc.getElementById('study-tools').querySelector('a[download]'),'Free download must never require payment');
});

test('Muscle Card Set offers all five valid, internally consistent local formats',()=>{
 const doc=documentFor('products.html');
 const section=doc.getElementById('muscle-cards');
 const expected={
   'NAV_Ultimate_Muscle_All_Formats_2026-11.zip':100000,
   'NAV_Ultimate_Muscle_Card_Set.apkg':20000,
   'NAV_Muscle_Cards_Print.pdf':100000,
   'NAV_Muscle_Cards.csv':50000,
   'NAV_Muscle_Cards_Offline.html':50000
 };
 const links=[...section.querySelectorAll('a[download]')];
 assert.equal(links.length,5);
 const manifest=readFileSync(new URL('../scripts/public-release-manifest.mjs',import.meta.url),'utf8');
 for(const [name,minBytes] of Object.entries(expected)){
   const path='downloads/'+name;
   const link=links.find(a=>a.getAttribute('href')===path);
   assert.ok(link && link.hasAttribute('download'),'Direct download missing: '+name);
   assert.ok(manifest.includes('"'+path+'"'),'Missing release manifest entry: '+path);
   const bytes=readFileSync(new URL('../'+path,import.meta.url));
   assert.ok(bytes.length>minBytes,'Unexpectedly small download: '+name);
   if(name.endsWith('.zip')||name.endsWith('.apkg'))
     assert.deepEqual([...bytes.subarray(0,4)],[80,75,3,4]);
   if(name.endsWith('.pdf'))
     assert.equal(bytes.subarray(0,5).toString('latin1'),'%PDF-');
   if(name.endsWith('.csv'))
     assert.match(bytes.toString('utf8'),/^Front,Back/);
   if(name.endsWith('.html'))
     assert.match(bytes.toString('utf8'),/^<!doctype html>/);
 }
 const csv=readFileSync(new URL('../downloads/NAV_Muscle_Cards.csv',import.meta.url),'utf8');
 const html=readFileSync(new URL('../downloads/NAV_Muscle_Cards_Offline.html',import.meta.url),'utf8');
 for(const s of [csv,html]){
   assert.ok(s.includes('Biomechanics: position, displacement, and velocity'));
   assert.ok(!s.includes('Motion (velocity) = position over time'));
   assert.doesNotMatch(s,/position\s+pattern\s+power|\bEXOS\b|Pillar Prep/i);
 }
 assert.doesNotMatch(section.innerHTML,/<form|mailto:|Buy now|checkout now|Payment required/i);
 assert.ok(section.textContent.includes('Free at $0. Download does not require payment.'));
});
