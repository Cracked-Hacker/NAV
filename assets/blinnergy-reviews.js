// Reviews are manually curated in coaching.html. Never infer individual star ratings from the venue average.
const carousel = document.querySelector('[data-blinnergy-reviews]');
if (carousel) {
  const track = carousel.querySelector('[data-review-track]');
  const slides = [...carousel.querySelectorAll('[data-review-slide]')];
  const prev = carousel.querySelector('[data-review-prev]');
  const next = carousel.querySelector('[data-review-next]');
  const status = carousel.querySelector('[data-review-status]');
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let active = 0;
  let pendingFrame = false;

  function closestSlide() {
    const left = track.getBoundingClientRect().left;
    let bestIndex = 0;
    let bestDistance = Infinity;
    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.getBoundingClientRect().left - left);
      if (distance < bestDistance) { bestDistance = distance; bestIndex = index; }
    });
    return bestIndex;
  }

  function update() {
    active = closestSlide();
    status.textContent = `${active + 1} of ${slides.length}`;
    prev.disabled = active === 0;
    next.disabled = active >= slides.length - 1;
  }

  function moveTo(index) {
    const slide = slides[Math.max(0, Math.min(index, slides.length - 1))];
    if (!slide) return;
    const delta = slide.getBoundingClientRect().left - track.getBoundingClientRect().left;
    track.scrollTo({left: track.scrollLeft + delta, behavior: reduceMotion ? 'instant' : 'smooth'});
  }

  if (track && slides.length && prev && next && status) {
    prev.addEventListener('click', () => moveTo(active - 1));
    next.addEventListener('click', () => moveTo(active + 1));
    track.addEventListener('keydown', event => {
      if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      moveTo(active + (event.key === 'ArrowRight' ? 1 : -1));
    });
    track.addEventListener('scroll', () => {
      if (pendingFrame) return;
      pendingFrame = true;
      requestAnimationFrame(() => { pendingFrame = false; update(); });
    }, {passive: true});
    window.addEventListener('resize', update);
    update();
  }
}
