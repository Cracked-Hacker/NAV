import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { Window } from 'happy-dom';

test('Four Coach Nate essays open, hide the summary, and close by card click or keyboard', () => {
  const html = readFileSync('coach-nate.html', 'utf8');
  const about = readFileSync('about.html','utf8');
  assert.equal(about.includes('class="essay-disclosure"'), false);
  assert.match(about,/href="coach-nate\.html#my-story"/);
  const script = readFileSync('assets/about-essay-disclosures.js', 'utf8');
  assert.match(html, /\.essay-js-enabled \.essay-disclosure\[open\]>summary\{display:none\}/);
  assert.match(html, /\.essay-js-enabled \.essay-disclosure\[open\] \.essay-rest>p:first-child\{margin-top:0\}/);
  assert.match(html, /src="assets\/about-essay-disclosures\.js"/);
  assert.match(html, /\.story-grid\{[^}]*grid-auto-rows:1fr;[^}]*align-items:stretch\}/);
  assert.match(html, /\.story-grid:has\(\.essay-disclosure\[open\]\)\{grid-auto-rows:auto\}/);
  assert.match(html, /\.story-essay:not\(:has\(\.essay-disclosure\[open\]\)\) \.essay-disclosure\{margin-top:auto\}/);

  const window = new Window({ url: 'https://coach-nate.netlify.app/coach-nate.html#my-story' });
  window.document.write(html);
  runInNewContext(script, { document: window.document, window, Element: window.Element });

  const essays = [...window.document.querySelectorAll('article.card > details.essay-disclosure')];
  assert.equal(essays.length, 4);
  assert.deepEqual([...window.document.querySelectorAll('#my-story article.story-essay h3')].map(h=>h.textContent.trim()),[
    'Coaching and athletics','Patient Care and Rehabilitation Settings','Scientific Research and Publication','Teaching and Community Science'
  ]);
  for (const disclosure of essays) {
    const card = disclosure.closest('article.card');
    const summary = disclosure.querySelector('summary');
    assert.equal(disclosure.open, false);
    assert.equal(card.hasAttribute('tabindex'), false);

    disclosure.open = true;
    disclosure.dispatchEvent(new window.Event('toggle'));
    assert.equal(card.classList.contains('essay-expanded'), true);
    assert.equal(card.tabIndex, 0);
    assert.match(card.getAttribute('aria-label'), /collapse/i);

    // Clicking a link must not close the essay.
    const link = disclosure.querySelector('a');
    if (link) {
      link.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
      assert.equal(disclosure.open, true);
    }

    disclosure.querySelector('.essay-rest p').dispatchEvent(
      new window.MouseEvent('click', { bubbles: true, cancelable: true })
    );
    assert.equal(disclosure.open, false);
    assert.equal(card.classList.contains('essay-expanded'), false);

    disclosure.open = true;
    disclosure.dispatchEvent(new window.Event('toggle'));
    card.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    assert.equal(disclosure.open, false);
    assert.equal(summary.textContent.includes('Read more'), true);
  }
  window.happyDOM.abort();
});
