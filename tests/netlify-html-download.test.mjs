import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('Netlify does not rewrite downloadable HTML study pages to extensionless URLs',()=>{
  const config=readFileSync('netlify.toml','utf8');
  const products=readFileSync('products.html','utf8');
  assert.match(config,/\[build\.processing\.html\]\s*pretty_urls\s*=\s*false/);
  assert.match(products,/href="downloads\/NAV_Muscle_Cards_Offline\.bin" download="NAV_Muscle_Cards_Offline\.html"/);
  assert.deepEqual(readFileSync('downloads/NAV_Muscle_Cards_Offline.bin'),readFileSync('downloads/NAV_Muscle_Cards_Offline.html'));
  assert.match(config,/for = "\/downloads\/\*"/);
  assert.match(config,/Content-Disposition = "attachment"/);
});
