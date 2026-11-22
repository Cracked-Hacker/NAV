import test from 'node:test';
import assert from 'node:assert/strict';
import {hasVerifiedBetaContactLink} from '../scripts/site-link-check.mjs';

const action = (href, quote = '"') =>
  '<a class=' + quote + 'button lime' + quote + ' href=' + quote + href + quote + '>Ask about future testing</a>';

for (const href of ['../contact.html', '/contact', '/contact/', '/contact.html']) {
  test('production verifier accepts safe link ' + href, () => {
    assert.equal(hasVerifiedBetaContactLink(action(href)), true);
    assert.equal(hasVerifiedBetaContactLink(action(href, "'")), true);
  });
}
for (const href of ['https://malicious.example/contact', '//malicious.example/contact', '/privacy', '/contact?unsafe=1', 'javascript:alert(1)']) {
  test('production verifier rejects unexpected destination ' + href, () => {
    assert.equal(hasVerifiedBetaContactLink(action(href)), false);
  });
}
test('production verifier requires the real private beta action text', () => {
  assert.equal(hasVerifiedBetaContactLink('<a href="/contact">A different link</a>'), false);
});
