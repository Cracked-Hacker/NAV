// Native <details> works without JavaScript; with JS the expanded card closes on click.
for (const disclosure of document.querySelectorAll('article.card > details.essay-disclosure')) {
  const card = disclosure.closest('article.card');
  const summary = disclosure.querySelector('summary');
  if (!card || !summary) continue;

  const title = card.querySelector('h3')?.textContent?.trim() || 'Essay';

  function syncCard() {
    if (disclosure.open) {
      card.classList.add('essay-expanded');
      card.tabIndex = 0;
      card.setAttribute('aria-label', title + '. Expanded. Click the card or press Enter or Space to collapse.');
      // The summary is hidden once expanded, so move keyboard focus to the card.
      if (document.activeElement === summary) card.focus({ preventScroll: true });
    } else {
      card.classList.remove('essay-expanded');
      card.removeAttribute('tabindex');
      card.removeAttribute('aria-label');
    }
  }

  disclosure.addEventListener('toggle', syncCard);

  card.addEventListener('click', (event) => {
    if (!disclosure.open || !(event.target instanceof Element)) return;
    // Links and other interactive elements should work without collapsing the essay.
    if (event.target.closest('a,button,input,select,textarea,label,summary,[role="button"],[contenteditable="true"]')) return;
    // Let readers select and copy text without accidentally closing the card.
    if (window.getSelection?.()?.toString().trim()) return;
    disclosure.open = false;
    syncCard();
  });

  card.addEventListener('keydown', (event) => {
    if (!disclosure.open || event.target !== card) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    disclosure.open = false;
    syncCard();
    summary.focus({ preventScroll: true });
  });

  syncCard();
}
document.documentElement.classList.add('essay-js-enabled');
