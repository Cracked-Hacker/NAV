// NAV Coach Nate training gallery: buttons, scroll and keyboard access.
const gallery = document.querySelector('[data-training-gallery]');
if (gallery) {
  const track = gallery.querySelector('[data-training-track]');
  const slides = [...track.querySelectorAll('.training-gallery-slide')];
  const previous = gallery.querySelector('[data-gallery-prev]');
  const next = gallery.querySelector('[data-gallery-next]');
  const status = gallery.querySelector('[data-gallery-status]');
  const videos = slides.map(slide => slide.querySelector('video'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let rafPending = false;

  function activeIndex() {
    const left = track.getBoundingClientRect().left + track.clientLeft;
    let best = 0;
    let distance = Infinity;
    slides.forEach((slide, index) => {
      const delta = Math.abs(slide.getBoundingClientRect().left - left);
      if (delta < distance) { distance = delta; best = index; }
    });
    return best;
  }

  function updateControls() {
    const index = activeIndex();
    status.textContent = `${index + 1} of ${slides.length}`;
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
  }

  function goTo(index) {
    const target = slides[Math.min(Math.max(index, 0), slides.length - 1)];
    if (!target) return;
    const currentLeft = track.getBoundingClientRect().left + track.clientLeft;
    const destination = track.scrollLeft + target.getBoundingClientRect().left - currentLeft;
    track.scrollTo({ left: destination, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }

  previous.addEventListener('click', () => goTo(activeIndex() - 1));
  next.addEventListener('click', () => goTo(activeIndex() + 1));
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    goTo(activeIndex() + (event.key === 'ArrowRight' ? 1 : -1));
  });
  track.addEventListener('scroll', () => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; updateControls(); });
  }, { passive: true });
  window.addEventListener('resize', updateControls);

  videos.forEach(video => {
    // The files have no audio streams. Keep the player muted as an extra safeguard.
    video.muted = true;
    video.addEventListener('volumechange', () => { if (!video.muted) video.muted = true; });
    video.addEventListener('play', () => {
      videos.forEach(other => { if (other !== video && !other.paused) other.pause(); });
    });
  });
  updateControls();
}
