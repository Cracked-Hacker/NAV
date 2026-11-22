import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
const html=readFileSync(new URL('../products.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../assets/science-atlas-payment.js',import.meta.url),'utf8');
const pdf=readFileSync(new URL('../downloads/Human_Sciences_Atlas_2026.pdf',import.meta.url));
const manifest=readFileSync(new URL('../scripts/public-release-manifest.mjs',import.meta.url),'utf8');
test('Science Atlases is separate from Study Tools with a direct downloadable PDF',()=>{
 assert.ok(html.includes('id="science-atlases"') && html.includes('id="study-tools"'));
 assert.ok(html.indexOf('id="science-atlases"') < html.indexOf('id="study-tools"'));
 assert.ok(html.includes('href="downloads/Human_Sciences_Atlas_2026.pdf" download'));
 assert.ok(manifest.includes('"downloads/Human_Sciences_Atlas_2026.pdf"'));
 assert.ok(manifest.includes('"assets/science-atlas-payment.js"'));
 assert.equal(pdf.subarray(0,5).toString('latin1'),'%PDF-');
 assert.ok(pdf.byteLength > 100000,'atlas PDF must be substantive');
});
test('Atlas offer and licensing are truthfully bounded',()=>{
 assert.ok(html.includes('Not independently peer reviewed.'));
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
