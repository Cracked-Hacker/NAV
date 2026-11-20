import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Window} from 'happy-dom';

const page = readFileSync(new URL('../coach-nate.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../assets/coach-nate-instagram-gallery.js', import.meta.url), 'utf8');
const manifest = readFileSync(new URL('../scripts/public-release-manifest.mjs', import.meta.url), 'utf8');
const codes = ['DU67U4xAbgg','DVH2BmojR-X','DVKLlgxkm7e','DVO9SxBEkVh','DVRlBK5EpBz','DVZrxHgAWpp'];

function setup() {
  const start = page.indexOf('<div class="instagram-showcase"');
  const end = page.indexOf('\n</section>', start);
  assert.ok(start > 0 && end > start, 'New gallery is within Coach Nate section');
  const window = new Window({url:'https://preview.example.invalid/coach-nate.html'});
  window.document.write('<!doctype html><html><body>' + page.slice(start, end) + '</body></html>');
  window.eval(script);
  return window;
}

test('six distinct owner-shared reels have exact canonical links and appear only on Coach Nate', () => {
  const window = setup();
  const cards = [...window.document.querySelectorAll('[data-instagram-card]')];
  assert.equal(cards.length, 6);
  assert.equal(new Set(cards.map(card => card.dataset.reelCode)).size, 6);
  assert.deepEqual(cards.map(card => card.dataset.reelCode), codes);
  cards.forEach((card, index) => {
    const link = card.querySelector('.instagram-caption a');
    assert.equal(link.href, 'https://www.instagram.com/reel/' + codes[index] + '/');
    assert.equal(link.target, '_blank');
    assert.match(link.rel, /noopener/);
    assert.ok(card.querySelector('[data-reel-load]'));
  });
  assert.match(page, /src="assets\/coach-nate-instagram-gallery\.js"/);
  assert.ok(manifest.includes('"assets/coach-nate-instagram-gallery.js"'));
  window.happyDOM.abort();
});

test('reel players are consent-on-click; opening another removes the previous iframe', () => {
  const window = setup();
  const doc = window.document;
  const buttons = [...doc.querySelectorAll('[data-reel-load]')];
  assert.equal(doc.querySelectorAll('iframe').length, 0, 'No Instagram request before action');
  buttons[0].click();
  assert.equal(doc.querySelectorAll('iframe').length, 1);
  let iframe = doc.querySelector('iframe');
  assert.equal(iframe.src, 'https://www.instagram.com/reel/' + codes[0] + '/embed/');
  assert.equal(iframe.loading, 'lazy');
  assert.equal(iframe.title, 'Instagram reel 1');
  assert.equal(buttons[0].hidden, true);
  buttons[5].click();
  assert.equal(doc.querySelectorAll('iframe').length, 1);
  iframe = doc.querySelector('iframe');
  assert.equal(iframe.src, 'https://www.instagram.com/reel/' + codes[5] + '/embed/');
  assert.equal(buttons[0].hidden, false);
  assert.equal(doc.querySelectorAll('.instagram-caption a').length, 6, 'Direct-link fallback retained');
  window.happyDOM.abort();
});
