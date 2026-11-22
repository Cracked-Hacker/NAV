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
  assert.match(page,/Research shadowing|shadowing researchers/);
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
  assert.match(page,/credential renewal status is being confirmed|Current renewal status for time-limited credentials is being confirmed/);
  assert.match(page,/EXOS at Google\x27s South Lake Union campus/);
});

test('research and CV pages state achievements directly, without defensive filler',()=>{
  const research=readFileSync(new URL('../research.html',import.meta.url),'utf8');
  const publicPages=[research,profile,page];
  for(const [index,source] of publicPages.entries()){
    assert.doesNotMatch(source,/as listed on the poster|as recorded on the November 2026 résumé/i,'redundant source commentary in public page '+index);
    assert.doesNotMatch(source,/not a claim of coauthorship|no university affiliation implied|not reconstructed by generative illustration/i,'defensive filler in public page '+index);
  }
  // Important factual distinctions remain visible despite shorter public copy.
  assert.match(research,/University of Washington School of Social Work/);
  assert.match(research,/research shadowing|shadowed researchers/i);
  assert.match(profile,/Community volunteering/);
  assert.match(page,/credential renewal status is being confirmed/i);
  assert.match(page,/EXOS at Google's South Lake Union campus/);
});
