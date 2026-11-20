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


test('educational YouTube Shorts are mixed into the existing reel carousel without changing the original six', () => {
  const window = setup();
  const doc = window.document;
  const shorts = [...doc.querySelectorAll('[data-youtube-short-card]')];
  assert.equal(shorts.length, 3);
  assert.deepEqual(shorts.map(card => card.dataset.youtubeId), ['l6mn8OVIhiM','qKc7Pgy0_I4','WyrwYLIxhvc']);
  assert.equal(doc.querySelectorAll('[data-instagram-card]').length, 6);
  assert.equal(doc.querySelectorAll('iframe').length, 0);
  shorts[0].querySelector('[data-reel-load]').click();
  assert.equal(doc.querySelectorAll('iframe').length, 1);
  assert.ok(doc.querySelector('iframe').src.includes('youtube-nocookie.com/embed/l6mn8OVIhiM'));
  doc.querySelectorAll('[data-instagram-card]')[0].querySelector('[data-reel-load]').click();
  assert.equal(doc.querySelectorAll('iframe').length, 1);
  assert.ok(doc.querySelector('iframe').src.includes('instagram.com/reel/DU67U4xAbgg'));
  window.happyDOM.abort();
});

test('long-form educational videos load only on click, with direct-link fallback', () => {
  const window = new Window({url:'https://preview.example.invalid/coach-nate.html'});
  window.document.write(page);
  window.eval(script);
  const cards = [...window.document.querySelectorAll('[data-youtube-long]')];
  assert.deepEqual(cards.map(card => card.dataset.youtubeId), ['50DcRryZoTM','Lt7uXl7eL4o','LFA-6Gnm7wA']);
  assert.equal(window.document.querySelectorAll('.youtube-video-screen iframe').length, 0);
  assert.equal(window.document.querySelectorAll('.youtube-video-caption a[href^="https://www.youtube.com/watch?"]').length, 3);
  cards[2].querySelector('.youtube-long-load').click();
  assert.equal(window.document.querySelectorAll('.youtube-video-screen iframe').length, 1);
  assert.ok(window.document.querySelector('.youtube-video-screen iframe').src.includes('youtube-nocookie.com/embed/LFA-6Gnm7wA'));
  window.happyDOM.abort();
});
