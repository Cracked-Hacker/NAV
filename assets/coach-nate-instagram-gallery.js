// Coach Nate: load owner-shared Instagram reels only after an explicit click.
// The public page makes no requests to Instagram before a visitor opts in.
(() => {
  const gallery = document.querySelector('[data-instagram-gallery]');
  if (!gallery) return;
  const showcase = gallery.closest('.instagram-showcase');
  const track = gallery.querySelector('[data-instagram-track]');
  const cards = [...track.querySelectorAll('[data-instagram-card]')];
  const prev = showcase.querySelector('[data-instagram-prev]');
  const next = showcase.querySelector('[data-instagram-next]');
  const status = showcase.querySelector('[data-instagram-status]');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rafPending = false;

  function activeIndex() {
    const left = track.getBoundingClientRect().left + track.clientLeft;
    let closest = 0, distance = Infinity;
    cards.forEach((card, index) => {
      const delta = Math.abs(card.getBoundingClientRect().left - left);
      if (delta < distance) { distance = delta; closest = index; }
    });
    return closest;
  }

  function updateControls() {
    const index = activeIndex();
    status.textContent = (index + 1) + ' of ' + cards.length;
    prev.disabled = index === 0;
    next.disabled = index === cards.length - 1;
  }

  function goTo(index) {
    const card = cards[Math.max(0, Math.min(cards.length - 1, index))];
    if (!card) return;
    // An off-screen embedded reel must not keep playing.
    cards.forEach(other => { if (other !== card) closeReel(other); });
    const left = track.getBoundingClientRect().left + track.clientLeft;
    const target = track.scrollLeft + card.getBoundingClientRect().left - left;
    track.scrollTo({ left: target, behavior: reduceMotion ? 'instant' : 'smooth' });
  }

  function closeReel(card) {
    card.querySelector('iframe')?.remove();
    card.querySelector('[data-reel-cover]').hidden = false;
    const button = card.querySelector('[data-reel-load]');
    button.hidden = false;
    button.textContent = 'Load reel ' + (cards.indexOf(card) + 1);
    button.setAttribute('aria-label', 'Load Instagram reel ' + (cards.indexOf(card) + 1) + ' here');
  }

  cards.forEach((card, index) => {
    const button = card.querySelector('[data-reel-load]');
    button.addEventListener('click', () => {
      const shortcode = card.getAttribute('data-reel-code');
      if (!/^[A-Za-z0-9_-]{11}$/.test(shortcode || '')) return;
      // Never introduce an arbitrary third-party URL from markup.
      cards.forEach(other => { if (other !== card) closeReel(other); });
      closeReel(card);
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.instagram.com/reel/' + shortcode + '/embed/';
      iframe.title = 'Instagram reel ' + (index + 1);
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.setAttribute('allow', 'encrypted-media; fullscreen; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      card.querySelector('[data-reel-media]').append(iframe);
      card.querySelector('[data-reel-cover]').hidden = true;
      button.hidden = true;
    });
  });

  prev.addEventListener('click', () => goTo(activeIndex() - 1));
  next.addEventListener('click', () => goTo(activeIndex() + 1));
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    goTo(activeIndex() + (event.key === 'ArrowRight' ? 1 : -1));
  });
  track.addEventListener('scroll', () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      const active = cards[activeIndex()];
      cards.forEach(card => { if (card !== active) closeReel(card); });
      updateControls();
    });
  }, { passive: true });
  window.addEventListener('resize', updateControls);
  updateControls();
})();
