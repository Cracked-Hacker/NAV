// Coach Nate: click-to-load Instagram reels and educational YouTube videos.
// Neither third-party platform receives requests before a visitor opts in.
(() => {
  const gallery = document.querySelector('[data-instagram-gallery]');
  if (!gallery) return;
  const showcase = gallery.closest('.instagram-showcase');
  const track = gallery.querySelector('[data-instagram-track]');
  const cards = [...track.querySelectorAll('[data-instagram-card], [data-youtube-short-card]')];
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
    const youtube = card.hasAttribute('data-youtube-short-card');
    const number = youtube ? cards.filter(other => other.hasAttribute('data-youtube-short-card')).indexOf(card) + 1 : cards.indexOf(card) + 1;
    button.textContent = (youtube ? 'Load Short ' : 'Load reel ') + number;
    button.setAttribute('aria-label', (youtube ? 'Load educational YouTube Short ' : 'Load Instagram reel ') + number + ' here');
  }

  cards.forEach((card, index) => {
    const button = card.querySelector('[data-reel-load]');
    button.addEventListener('click', () => {
      const youtube = card.hasAttribute('data-youtube-short-card');
      const videoId = card.getAttribute(youtube ? 'data-youtube-id' : 'data-reel-code');
      if (!/^[A-Za-z0-9_-]{11}$/.test(videoId || '')) return;
      // Never introduce an arbitrary third-party URL from markup.
      cards.forEach(other => { if (other !== card) closeReel(other); });
      closeReel(card);
      const iframe = document.createElement('iframe');
      iframe.src = youtube ? 'https://www.youtube-nocookie.com/embed/' + videoId + '?rel=0&playsinline=1' : 'https://www.instagram.com/reel/' + videoId + '/embed/';
      iframe.title = youtube ? (card.getAttribute('data-video-title') || 'Educational YouTube Short') : 'Instagram reel ' + (index + 1);
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

  // The separate long-form gallery is opt-in as well; no automatic YouTube embeds.
  document.querySelectorAll('[data-youtube-long]').forEach(card => {
    const button = card.querySelector('.youtube-long-load');
    button.addEventListener('click', () => {
      const videoId = card.getAttribute('data-youtube-id');
      if (!/^[A-Za-z0-9_-]{11}$/.test(videoId || '')) return;
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?rel=0&playsinline=1';
      iframe.title = card.getAttribute('data-video-title') || 'Educational video';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.setAttribute('allow', 'encrypted-media; fullscreen; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      card.querySelector('.youtube-video-screen').append(iframe);
      button.hidden = true;
    });
  });
})();
