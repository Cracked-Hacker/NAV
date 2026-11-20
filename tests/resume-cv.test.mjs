import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const page=readFileSync(new URL('../resume.html',import.meta.url),'utf8');
const profile=readFileSync(new URL('../coach-nate.html',import.meta.url),'utf8');
const manifest=readFileSync(new URL('../scripts/public-release-manifest.mjs',import.meta.url),'utf8');
const asset='assets/Nathan-Holochwost-Resume-2026-11-09.pdf';
const pdf=readFileSync(new URL('../'+asset,import.meta.url),'latin1');

test('CV page accurately identifies the source degrees and distinct research roles',()=>{
  assert.match(page,/B\.S\. Kinesiology/);
  assert.match(page,/B\.A\. Biology/);
  assert.doesNotMatch(page,/B\.S\. Biology|B\.A\. Kinesiology/);
  for(const name of ['EXOS','Blinnergy','FYZICAL','North Cascades','Yang Lab','Sound Bio Labs','BIOL 348','Staffers LLC'])
    assert.ok(page.includes(name),'Missing documented CV experience: '+name);
  assert.match(page,/10\.1007\/s10560-024-01000-y/);
  assert.match(page,/observational shadowing|Observational shadowing/);
});

test('View CV links to a real approved PDF in a new tab',()=>{
  assert.ok(page.includes('href="'+asset+'"'),'PDF link must resolve to the packaged asset');
  assert.ok(profile.includes('href="'+asset+'"'),'Coach Nate profile must also link to the PDF');
  assert.match(page,/target="_blank" rel="noopener noreferrer" type="application\/pdf"/);
  assert.ok(manifest.includes('"'+asset+'"'),'PDF must be included in the approved public release manifest');
  assert.ok(pdf.startsWith('%PDF-1.4'),'Expected a PDF, not an HTML placeholder');
  assert.match(pdf,/\/Type \/Pages \/Count [1-9]/);
  const match=pdf.match(/startxref\n(\d+)/);
  assert.ok(match,'Missing PDF xref pointer');
  assert.equal(pdf.slice(Number(match[1]),Number(match[1])+5),'xref\n');
  assert.ok(pdf.endsWith('%%EOF\n'),'PDF trailer incomplete');
});

test('Public CV page distinguishes self-reported totals from independently verified evidence',()=>{
  assert.match(page,/self-reported/);
  assert.match(page,/renewal and current licensure status have not been independently established/);
  assert.match(page,/Google is the client worksite/);
});
