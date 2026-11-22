import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
const html=readFileSync(new URL('../products.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../assets/science-atlas-payment.js',import.meta.url),'utf8');
const pdf=readFileSync(new URL('../downloads/Human_Sciences_Atlas_2026.pdf',import.meta.url));
const manifest=readFileSync(new URL('../scripts/public-release-manifest.mjs',import.meta.url),'utf8');
test('Science Atlas is inside Learning Resources with a direct downloadable PDF',()=>{
 const studyStart=html.indexOf('<article id="study-tools">');
 const studyEnd=html.indexOf('</article>',studyStart);
 const atlasStart=html.indexOf('<section id="science-atlases"');
 assert.ok(studyStart>=0 && studyEnd>studyStart);
 assert.ok(atlasStart>studyStart && atlasStart<studyEnd);
 assert.ok(html.includes('<section id="muscle-cards"'));
 assert.ok(html.includes('<h2>Learning Resources</h2>'));
 assert.ok(!html.includes('<article id="science-atlases">'));
 assert.ok(html.includes('href="downloads/Human_Sciences_Atlas_2026.pdf" download'));
 assert.ok(manifest.includes('"downloads/Human_Sciences_Atlas_2026.pdf"'));
 assert.ok(manifest.includes('"assets/science-atlas-payment.js"'));
 assert.equal(pdf.subarray(0,5).toString('latin1'),'%PDF-');
 assert.ok(pdf.byteLength > 100000,'atlas PDF must be substantive');
});
test('Atlas offer and licensing are truthfully bounded',()=>{
 assert.ok(html.includes('Self-published reference; not peer-reviewed.'));
 assert.ok(html.includes('chart is <strong>not reproduced</strong>'));
 assert.ok(html.includes('Evans Love (2016)'));
 assert.ok(html.includes('creativecommons.org/licenses/by-sa/4.0/'));
 assert.ok(html.includes('Download free at $0.'));
 assert.ok(html.includes('Suggested contribution: $8'));
 assert.ok(html.includes('min="0" step="0.01"'));
 assert.ok(js.includes('Human Sciences Study Atlas'));
 assert.ok(js.includes('navigator.clipboard'));
 assert.ok(!/checkout-success|payments-verified|certified by/i.test(html));
});

test('Learning Resources includes all three direct-download products without required payment',()=>{
 const start=html.indexOf('<article id="study-tools">');
 const end=html.indexOf('</article>',start);
 const section=html.slice(start,end);
 for (const id of ['muscle-cards','science-atlases','nutrition-guide']) {
   assert.ok(section.includes('id="'+id+'"'),id+' must be inside Learning Resources');
 }
 for (const path of [
   'downloads/NAV_Ultimate_Muscle_All_Formats_2026-11.zip',
   'downloads/Human_Sciences_Atlas_2026.pdf',
   'downloads/NAV_Performance_Nutrition_The_Simple_Guide_v1-1.pdf'
 ]) {
   assert.ok(section.includes('href="'+path+'" download'),path+' must be a direct download');
   assert.ok(manifest.includes('"'+path+'"'),path+' must be in public release manifest');
 }
 assert.ok(section.includes('id="nutrition-venmo"'));
 assert.ok(section.includes('id="nutrition-contribution-custom" type="number" min="0" step="0.01"'));
 assert.ok(section.includes('Suggested contribution: $8'));
 assert.ok(js.includes('NAV Performance Nutrition Guide'));
 const nutritionPdf=readFileSync(new URL('../downloads/NAV_Performance_Nutrition_The_Simple_Guide_v1-1.pdf',import.meta.url));
 assert.equal(nutritionPdf.subarray(0,5).toString('latin1'),'%PDF-');
 assert.ok(nutritionPdf.byteLength > 250000,'nutrition PDF must be substantive');
});

test('Published education products omit employer-branded teaching frameworks and preserve correct velocity definition',()=>{
 const prohibited=/position[\s–-]+pattern[\s–-]+power|\bEXOS\b|Pillar Prep/i;
 for(const path of ['products.html','downloads/NAV_Muscle_Cards.csv','downloads/NAV_Muscle_Cards_Offline.html']){
   const body=readFileSync(new URL('../'+path,import.meta.url),'utf8');
   assert.doesNotMatch(body,prohibited,path+' must not contain proprietary branding');
   assert.doesNotMatch(body,/Motion \(velocity\) = position over time/i,path+' includes incorrect biomechanics');
 }
 const csv=readFileSync(new URL('../downloads/NAV_Muscle_Cards.csv',import.meta.url),'utf8');
 assert.ok(csv.includes('Average velocity equals'));
 assert.ok(csv.includes('Displacement is final minus initial position'));
 assert.ok(html.includes('Evans Love (2016)'), 'Metabolic map attribution must remain visible');
});

test('All three Learning Resources cards use the same View Options interaction',()=>{
 const start=html.indexOf('<article id="study-tools">');
 const stop=html.indexOf('</article>',start);
 const catalog=html.slice(start,stop);
 const cards=[
  ['muscle-cards','muscle-card-options','downloads/NAV_Ultimate_Muscle_All_Formats_2026-11.zip'],
  ['science-atlases','atlas-options','downloads/Human_Sciences_Atlas_2026.pdf'],
  ['nutrition-guide','nutrition-options','downloads/NAV_Performance_Nutrition_The_Simple_Guide_v1-1.pdf']
 ];
 assert.equal((catalog.match(/<summary class="button secondary">View Options<\/summary>/g)||[]).length,3);
 for(let i=0;i<cards.length;i++){
  const [id,optionId,path]=cards[i];
  const p=catalog.indexOf('<section id="'+id+'"');
  const next=i+1<cards.length?catalog.indexOf('<section id="'+cards[i+1][0]+'"',p):catalog.length;
  assert.ok(p>=0&&next>p,id+' missing');
  const card=catalog.slice(p,next);
  assert.ok(card.includes('id="'+optionId+'" name="learning-resource-options"'),id+' options missing');
  assert.equal((card.match(/View Options/g)||[]).length,1,id+' requires exactly one View Options');
  assert.ok(card.indexOf('View Options')<card.indexOf('href="'+path+'"'),id+' download must appear inside options');
  assert.ok(card.includes('venmo.com/u/Nate-Holochwost'),id+' contribution link must remain');
  assert.ok(card.includes('study-contribution'),id+' optional amount control missing');
  assert.equal((card.match(/<details\b/g)||[]).length,(card.match(/<\/details>/g)||[]).length,id+' details unbalanced');
 }
});
