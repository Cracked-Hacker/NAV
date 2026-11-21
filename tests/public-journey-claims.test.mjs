import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {Window} from 'happy-dom';

function documentFor(path){const window=new Window();window.document.write(readFileSync(new URL('../'+path,import.meta.url),'utf8'));return window.document;}

test('homepage offers exactly three distinct, usable destinations',()=>{
 const doc=documentFor('index.html');
 const cards=[...doc.querySelectorAll('.nav-home-action')];
 assert.deepEqual(cards.map(p=>p.querySelector('strong').textContent.trim()),['I want coaching',"I'm a coach",'Explore products']);
 assert.deepEqual(cards.map(p=>p.getAttribute('href')),['coaching.html','nav-coach.html','products.html']);
 assert.equal(new Set(cards.map(p=>p.getAttribute('href'))).size,3);
 assert.doesNotMatch(doc.body.textContent,/enter your tester code|redeem a code|approved beta areas/i);
});

test('products describe unreleased materials truthfully, without enabling checkout',()=>{
 const doc=documentFor('products.html');
 for(const id of ['nav-coach','classroom','study-tools','merch'])assert.ok(doc.getElementById(id),id);
 assert.match(doc.getElementById('classroom').textContent,/in development/i);
 assert.match(doc.getElementById('study-tools').textContent,/planned/i);
 assert.match(doc.getElementById('merch').textContent,/not for sale/i);
 assert.doesNotMatch(doc.body.textContent,/Buy now|checkout now/i);
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

test('online coaching page matches owner-confirmed offering without inventing packages or checkout',()=>{
  const doc=documentFor('coaching.html');
  const main=doc.querySelector('main');
  assert.match(main.textContent,/online fitness coaching/i);
  assert.match(main.textContent,/\$80[–-]\$300 per week/i);
  assert.match(main.textContent,/sliding scale/i);
  assert.match(main.textContent,/one online coaching service/i);
  assert.match(main.textContent,/based on affordability/i);
  assert.match(main.textContent,/not separate packages or different levels/i);
  assert.doesNotMatch(main.textContent,/\$56|Liam/i);
  assert.match(main.textContent,/Venmo or Zelle/i);
  assert.match(main.textContent,/No payments are collected through this website/i);
  assert.doesNotMatch(main.textContent,/in-person coaching available|guaranteed results|buy now|subscribe today/i);
  assert.equal([...main.querySelectorAll('a')].filter(a=>a.href.includes('docs.google.com/forms/')).length,1);
});

test('NAV Coach stays described as coach-and-client software without false checkout or accreditation',()=>{
  const doc=documentFor('nav-coach.html');
  assert.match(doc.querySelector('main').textContent,/coaches and athletes/i);
  assert.doesNotMatch(doc.querySelector('main').textContent,/accredited|guaranteed income|checkout here/i);
});

test('NASM CPT dates reflect owner-provided certification without disclosing certificate number',()=>{
  const about=documentFor('about.html');
  const resume=documentFor('resume.html');
  const coach=documentFor('coach-nate.html');
  for(const page of [about,resume,coach]){
    assert.match(page.body.textContent,/NASM Certified Personal Trainer \(CPT\)/);
    assert.match(page.body.textContent,/May 29, 2025/);
    assert.match(page.body.textContent,/May 29, 2027/);
    assert.doesNotMatch(page.body.textContent,/\b(?:certificate|credential|license|training center)\s*(?:number|id)\s*:/i);
  }
  assert.match(resume.body.textContent,/not a real-time independent NASM registry check/i);
  assert.match(coach.body.textContent,/not been verified/i);
});

test('Red Cross First Aid/CPR/AED credential uses exact owner-provided validity dates',()=>{
  for(const path of ['about.html','resume.html','coach-nate.html']){
    const doc=documentFor(path);
    const content=doc.body.textContent;
    assert.match(content,/American Red Cross Adult and Pediatric First Aid\/CPR\/AED/);
    assert.match(content,/March 7, 2026/);
    assert.match(content,/March 7, 2028/);
    assert.doesNotMatch(content,/credential number\s*:/i);
  }
});

test('older CNA and BLS documentation is historical, not asserted currently active',()=>{
  const resume=documentFor('resume.html').body.textContent;
  const coach=documentFor('coach-nate.html').body.textContent;
  assert.match(resume,/Washington Nursing Assistant Certification/);
  assert.match(resume,/April 11, 2026/);
  assert.match(resume,/renewal status has not been verified/i);
  assert.match(resume,/October 2026/);
  assert.match(resume,/freeCodeCamp Responsive Web Design/);
  assert.match(resume,/September 21, 2023/);
  assert.match(resume,/Scholars Week/);
  assert.match(resume,/May 18, 2022/);
  assert.match(coach,/Prior CNA and BLS renewals have not been verified/i);
});

test('WWU degrees and owner-approved résumé PDF remain unchanged',()=>{
  const resume=documentFor('resume.html');
  assert.match(resume.body.textContent,/B\.S\. Kinesiology/i);
  assert.match(resume.body.textContent,/B\.A\. Biology/i);
  assert.equal(resume.querySelector('a[aria-label="View Resume PDF in a new tab"]').getAttribute('href'),'assets/pdf/Nathan_Holochwost_Resume_2026-11.pdf');
});
