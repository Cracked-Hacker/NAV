import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {Window} from 'happy-dom';

function documentFor(path){const window=new Window();window.document.write(readFileSync(new URL('../'+path,import.meta.url),'utf8'));return window.document;}

test('homepage offers exactly three distinct, usable destinations',()=>{
 const doc=documentFor('index.html');
 const cards=[...doc.querySelectorAll('.nav-home-action')];
 assert.deepEqual(cards.map(p=>p.querySelector('strong').textContent.trim()),['I want coaching','I’m a coach','I want study materials']);
 assert.deepEqual(cards.map(p=>p.getAttribute('href')),['coaching.html','nav-coach.html#coach-flow','products.html']);
 assert.equal(new Set(cards.map(p=>p.getAttribute('href'))).size,3);
 assert.equal(cards[2].querySelector('span')?.textContent.trim(),'Browse educational products.');
 const testing=doc.querySelector('main p.tiny.muted a[href="contact.html#testing"]');
 assert.ok(testing,'Software-testing contact link remains available below the action cards');
 assert.match(testing.textContent,/Interested in using NAV Coach for free\?/);
 assert.doesNotMatch(doc.body.textContent,/enter your tester code|redeem a code|approved beta areas/i);
});

test('Learning Resources preserves the flashcard download, Venmo, and Quizlet password',()=>{
 const doc=documentFor('products.html');
 for(const id of ['nav-coach','study-tools','merch'])assert.ok(doc.getElementById(id),id);
 assert.equal(doc.getElementById('classroom'),null,'Unreleased Classroom must not be presented as a public product');
 const learning=doc.getElementById('study-tools');
 assert.equal(learning.querySelector('h2').textContent.trim(),'Learning Resources');
 const study=doc.getElementById('muscle-cards');
 assert.ok(study.textContent.includes('379 flashcards covering muscle anatomy and basic kinesiology'));
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
 for(const format of ['.apkg','.pdf','.csv'])assert.ok([...study.querySelectorAll('.study-download-links a')].some(a=>a.getAttribute('href').endsWith(format)),format);
 const offlineLink=study.querySelector('a[href="downloads/NAV_Muscle_Cards_Offline.bin"]');
 assert.equal(offlineLink?.getAttribute('download'),'NAV_Muscle_Cards_Offline.html');
 assert.equal(study.querySelectorAll('a').length,7);
 assert.equal(study.querySelector('a[href^="mailto:"]'),null);
 assert.ok(doc.querySelector('#muscle-card-options'));
 assert.ok(doc.querySelector('#atlas-options'));
 assert.ok(doc.querySelector('#nutrition-options'));
 assert.match(doc.getElementById('merch').textContent,/not for sale/i);
});

test('My NAV education directs members to published resources without promising open courses or completion records',()=>{
 const section=documentFor('account/index.html').querySelector('#education');
 assert.doesNotMatch(section.textContent,/open lessons|progress currently stays|account.synced completion|certification record/i);
 assert.match(section.textContent,/still in development|not yet available/i);
 assert.deepEqual([...section.querySelectorAll('a')].map(a=>a.getAttribute('href')),['../resources.html','../research.html']);
});

test('research and account FAQ describe the actual available next steps',()=>{
 const research=documentFor('research.html');
 assert.equal([...research.querySelectorAll('a')].some(a=>a.getAttribute('href')==='science.html'&&/evidence|research/i.test(a.textContent)),true);
 assert.doesNotMatch(research.body.textContent,/Explore exercise.science lessons/i);
 const faq=documentFor('resources.html');
 assert.equal([...faq.querySelectorAll('a')].some(a=>a.textContent.includes('Sign In to My NAV')&&a.getAttribute('href')==='account/auth.html?mode=login'),true);
 assert.match(faq.body.textContent,/may be asked to sign in again/);
});

test('public copy never claims unreleased Classroom or private testing is available',()=>{
 const about=documentFor('about.html');
 const science=documentFor('science.html');
 assert.doesNotMatch(about.body.textContent,/available only to invited beta testers|Start learning/i);
 assert.match(about.body.textContent,/Courses and certifications are still in development/i);
 assert.doesNotMatch(science.body.textContent,/Request private education access|is being tested privately/i);
 assert.match(science.body.textContent,/still in development/i);
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

test('coaching clearly separates NAV online coaching from employer-owned booking',()=>{
 const main=documentFor('coaching.html').querySelector('main');
 const options=[...main.querySelectorAll('#booking > .grid-3 > article.card')];
 assert.equal(options.length,3);
 assert.match(options[0].textContent,/\$80[–-]\$300 per week/);
 assert.match(options[0].textContent,/Sliding-scale pricing based on what you can afford/);
 assert.match(options[0].textContent,/agree on pricing, what’s included, and when to start/);
 const applications=[...main.querySelectorAll('a[href^="https://docs.google.com/forms/"]')];
 assert.equal(applications.length,2,'One primary application button plus one Availability text link');
 const primaryApply=options[0].querySelector('a.button.lime[href^="https://docs.google.com/forms/"]');
 assert.ok(primaryApply,'Preserve exactly one visible primary application button');
 assert.equal(primaryApply.textContent,'Apply for Coaching');
 assert.equal(main.querySelectorAll('a.button.lime[href^="https://docs.google.com/forms/"]').length,1);
 const availability=main.querySelector('[aria-labelledby="availability-heading"]');
 const availableApply=availability?.querySelector('a[href^="https://docs.google.com/forms/"]');
 assert.ok(availableApply,'Availability application instruction must be a functional link');
 assert.equal(availableApply.getAttribute('href'),primaryApply.getAttribute('href'),'Availability link should use same application');
 assert.equal(availableApply.textContent,'Apply for Coaching');
 assert.equal(availability.querySelectorAll('.button').length,0,'Do not add a duplicate primary button');
 const disclaimer=main.querySelector('.coaching-example')?.parentElement?.querySelector('p.muted');
 assert.ok(disclaimer,'Fitness versus clinical scope disclaimer must remain visible');
 assert.equal(disclaimer.textContent.trim(),'NAV defines coaching as fitness and exercise guidance, not medical diagnosis, treatment, physical therapy, or medical nutrition therapy. For those services, consult an appropriately qualified healthcare professional.');
 assert.match(options[1].textContent,/In-person · Blinnergy/);
 assert.match(options[1].textContent,/separate from NAV and online coaching/);
 assert.ok(options[1].querySelector('a[href="https://apps.apple.com/us/app/blinnergy/id6742318263"]'));
 assert.match(options[2].textContent,/Google Employees · EXOS@Google/);
 assert.match(options[2].textContent,/On-Campus Training/);
 assert.match(options[2].textContent,/I train Google employees on campus in Seattle through EXOS/);
 assert.match(options[2].textContent,/Find me on Boost under Nate Holochwost to book a session/);
 assert.match(options[2].textContent,/Scheduling and availability are handled through EXOS, separately from NAV/);
 const preparation=main.querySelector('.coaching-example');
 assert.ok(preparation?.classList.contains('grid-2'),'Two remaining preparation cards use two-column layout');
 assert.equal(preparation.querySelectorAll(':scope > article.card').length,2,'Removed video panel must not leave an empty card');
 assert.equal(preparation.querySelector('.coaching-lesson'),null,'Remove Watch Nate Coach video and link');
 assert.doesNotMatch(preparation.textContent,/Watch Nate coach|Quick Deadlift Lesson/);
 assert.match(options[2].textContent,/Exos @ Google · gFit/);
 assert.equal(options[2].querySelectorAll('img, svg').length,0,'Do not imply corporate logo approval');
 assert.ok(options[2].querySelector('.exos-gfit-label'),'Keep the affiliation identifier accessible');
 assert.doesNotMatch(main.textContent,/Rain City Fit|\$100 base price per session/);
});
test('NASM CPT dates remain visible and the public site does not disclose private identifiers',()=>{
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
   'NAV_Muscle_Cards_Offline.bin':50000
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
   if(name.endsWith('.bin')){
     assert.match(bytes.toString('utf8'),/^<!doctype html>/);
     assert.deepEqual(bytes,readFileSync(new URL('../downloads/NAV_Muscle_Cards_Offline.html',import.meta.url)));
     assert.equal(link.getAttribute('download'),'NAV_Muscle_Cards_Offline.html');
   }
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

test('Blinnergy review label stays exact with a quiet Google source link and no unlicensed quotations',()=>{
 const doc=documentFor('coaching.html');
 const card=[...doc.querySelectorAll('#booking > .grid-3 > article.card')][1];
 const reviews=card.querySelector('.blinnergy-reviews');
 assert.ok(reviews);
 const count=reviews.querySelector('.blinnergy-review-count');
 assert.equal(count.textContent,'Coach Nate ★★★★★ (10+ reviews)','Preserve owner-requested exact visible label');
 assert.match(count.getAttribute('aria-label'),/at least ten five-star Google reviews of Blinnergy mention his coaching/);
 assert.equal(reviews.querySelectorAll('p').length,1,'No extra marketing fluff');
 const links=[...reviews.querySelectorAll('a')];
 assert.equal(links.length,1,'One discrete evidence link directly under the count');
 const link=links[0];
 assert.equal(link.className,'blinnergy-review-link','No bulky or redundant button');
 assert.match(link.textContent,/Blinnergy reviews on Google/);
 assert.equal(link.getAttribute('href'),'https://www.google.com/search?hl=en-US&gl=us&q=Blinnergy+Woodinville+WA#lrd=0x549006e72bbb6539:0x1f73ce46e1cb9651,1,,,');
 assert.equal(link.getAttribute('target'),'_blank');
 assert.match(link.getAttribute('rel'),/noopener/);
 assert.ok(card.querySelector('a[href="https://apps.apple.com/us/app/blinnergy/id6742318263"]'),'Keep Blinnergy booking CTA');
 assert.match(card.querySelector('.blinnergy-location').textContent,/5817 238th St SE, Suite 1/);
 assert.equal(card.querySelectorAll('.blinnergy-rating,blockquote,.blinnergy-review-slide').length,0,'Do not republish unlicensed full reviews or stale business-rating averages');
 const manifest=readFileSync(new URL('../scripts/public-release-manifest.mjs',import.meta.url),'utf8');
 assert.ok(!manifest.includes('assets/blinnergy-reviews.js'),'No orphaned carousel JS in public release');
 const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
 assert.ok(!css.includes('.blinnergy-review-track'),'No dead carousel styles');
});

test('do not republish third-party review transcripts anywhere in the finished public HTML release',()=>{
 const manifest=readFileSync(new URL('../scripts/public-release-manifest.mjs',import.meta.url),'utf8');
 const publicPages=[...manifest.matchAll(/"([^"]+\.html)"/g)].map(x=>x[1]);
 assert.ok(publicPages.length>=18,'Must inspect the full published HTML release, not only coaching.html');
 const identities=['Vignesh Gunasekaran','Mary Ventura','Bob Freer','Sara Job','shruti nair','Diane K','Kathy Williams','Darrin Buenger','Shannon J.','Steph Young'];
 const uniqueReviewText=['Nate is a fantastic trainer. He has really addressed issues at my level.','Coach Nate brings amazing energy to every session','I give credit to the amazing personal trainers Adaeze, Sam, and Nate','I love training with Adaeze, Sam, and Nate','Love Nate’s 6 am class!!'];
 for(const path of publicPages){
   const html=readFileSync(new URL('../'+path,import.meta.url),'utf8');
   for(const phrase of identities.concat(uniqueReviewText))
     assert.ok(!html.includes(phrase),'Publication permission is not evidenced; remove third-party review text from '+path);
 }
});
