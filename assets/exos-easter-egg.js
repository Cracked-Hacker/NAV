// Coach Nate / EXOS card Easter egg. All audio is synthesized on click.
// Words are rendered as independent bodies; originals remain in the DOM for accessibility.
const card = document.querySelector('[data-exos-card]');
const button = card?.querySelector('[data-exos-boom]');

if (card && button) {
  const sources = [...card.querySelectorAll('[data-exos-fall]')];
  const status = card.querySelector('[data-exos-status]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let running = false;
  let frame = 0;
  let resetTimer = 0;
  let burstTimer = 0;
  let overlay = null;
  let layer = null;
  let previousHeight = '';

  function tokensForLayer() {
    const cardRect = card.getBoundingClientRect();
    const tokens = [];
    for (const source of sources) {
      const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const style = getComputedStyle(node.parentElement);
        const matches = node.textContent.matchAll(/\S+/gu);
        for (const match of matches) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const rect = range.getBoundingClientRect();
          if (!rect.width || !rect.height) continue;
          const word = document.createElement('span');
          word.className = 'exos-falling-word';
          word.textContent = match[0];
          word.style.font = style.font;
          word.style.fontWeight = style.fontWeight;
          word.style.letterSpacing = style.letterSpacing;
          word.style.lineHeight = style.lineHeight;
          word.style.textTransform = style.textTransform;
          word.style.color = style.color;
          word.style.width = rect.width + 'px';
          word.style.height = rect.height + 'px';
          layer.append(word);
          tokens.push({
            el: word, x: rect.left - cardRect.left, y: rect.top - cardRect.top,
            w: rect.width, h: rect.height, vx: (Math.random() - .5) * 360,
            vy: -(130 + Math.random() * 260), spin: (Math.random() - .5) * 180,
            angle: 0
          });
        }
      }
    }
    return tokens;
  }

  function playExplosion() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      const context = new Audio();
      if (context.state === 'suspended') context.resume().catch(() => {});
      const t = context.currentTime;
      const length = Math.floor(context.sampleRate * 1.05);
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        const u = i / context.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-u * 5.5);
      }
      const noise = context.createBufferSource();
      noise.buffer = buffer;
      const lowpass = context.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(2800, t);
      lowpass.frequency.exponentialRampToValueAtTime(85, t + 1.03);
      const boom = context.createGain();
      boom.gain.setValueAtTime(.0001, t);
      boom.gain.exponentialRampToValueAtTime(.23, t + .018);
      boom.gain.exponentialRampToValueAtTime(.0001, t + 1.04);
      noise.connect(lowpass).connect(boom).connect(context.destination);
      noise.start(t);
      noise.stop(t + 1.05);

      const rumble = context.createOscillator();
      const bass = context.createGain();
      rumble.type = 'sine';
      rumble.frequency.setValueAtTime(85, t);
      rumble.frequency.exponentialRampToValueAtTime(29, t + .65);
      bass.gain.setValueAtTime(.001, t);
      bass.gain.exponentialRampToValueAtTime(.22, t + .025);
      bass.gain.exponentialRampToValueAtTime(.0001, t + .78);
      rumble.connect(bass).connect(context.destination);
      rumble.start(t);
      rumble.stop(t + .8);
      window.setTimeout(() => context.close().catch(() => {}), 1350);
    } catch (_) {
      // Audio can be unavailable or blocked; visual effect still works.
    }
  }

  function showBlast() {
    overlay = document.createElement('div');
    overlay.className = 'exos-blast';
    overlay.setAttribute('aria-hidden', 'true');
    const rect = button.getBoundingClientRect();
    overlay.style.setProperty('--exos-x', (rect.left + rect.width / 2) + 'px');
    overlay.style.setProperty('--exos-y', (rect.top + rect.height / 2) + 'px');
    for (const cls of ['exos-blast-flash', 'exos-blast-fireball', 'exos-blast-ring']) {
      const element = document.createElement('i');
      element.className = cls;
      overlay.append(element);
    }
    for (let i = 0; i < 27; i++) {
      const particle = document.createElement('i');
      particle.className = 'exos-blast-spark';
      const theta = (i * Math.PI * 2 / 27) + (Math.random() - .5) * .27;
      const distance = 135 + Math.random() * 230;
      particle.style.setProperty('--exos-dx', (Math.cos(theta) * distance) + 'px');
      particle.style.setProperty('--exos-dy', (Math.sin(theta) * distance) + 'px');
      particle.style.setProperty('--exos-delay', (Math.random() * .09) + 's');
      overlay.append(particle);
    }
    document.body.append(overlay);
    if (!reduceMotion.matches) document.body.classList.add('exos-screen-shake');
    burstTimer = window.setTimeout(() => {
      document.body.classList.remove('exos-screen-shake');
      overlay?.remove();
      overlay = null;
    }, 1080);
  }

  function constrain(body, maxX, maxY) {
    if (body.x < 7) { body.x = 7; body.vx = Math.abs(body.vx) * .3; }
    if (body.x > maxX - body.w) { body.x = Math.max(7, maxX - body.w); body.vx = -Math.abs(body.vx) * .3; }
    if (body.y < 7) { body.y = 7; body.vy = Math.abs(body.vy) * .25; }
    if (body.y > maxY - body.h) {
      body.y = Math.max(7, maxY - body.h);
      body.vy = Math.abs(body.vy) > 26 ? -Math.abs(body.vy) * .17 : 0;
      body.vx *= .83;
      body.spin *= .88;
    }
  }

  function collide(tokens) {
    // Multiple settling passes keep word bodies from occupying the same space.
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < tokens.length; i++) {
        const a = tokens[i];
        for (let j = i + 1; j < tokens.length; j++) {
          const b = tokens[j];
          const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          if (overlapX <= 0 || overlapY <= 0) continue;
          if (overlapY < overlapX * 1.25) {
            const direction = a.y + a.h / 2 < b.y + b.h / 2 ? 1 : -1;
            a.y -= overlapY * .52 * direction;
            b.y += overlapY * .52 * direction;
            a.vy *= .38;
            b.vy *= .38;
          } else {
            const direction = a.x + a.w / 2 < b.x + b.w / 2 ? 1 : -1;
            a.x -= overlapX * .52 * direction;
            b.x += overlapX * .52 * direction;
            a.vx *= .65;
            b.vx *= .65;
          }
        }
      }
    }
  }

  function render(tokens) {
    for (const p of tokens) {
      p.el.style.transform = 'translate3d(' + p.x.toFixed(2) + 'px,' +
        p.y.toFixed(2) + 'px,0) rotate(' + p.angle.toFixed(1) + 'deg)';
    }
  }

  function startPhysics(tokens, started) {
    let last = started;
    const step = now => {
      if (!running) return;
      const dt = Math.min(.034, (now - last) / 1000);
      last = now;
      const elapsed = (now - started) / 1000;
      const w = layer.clientWidth - 8;
      const h = layer.clientHeight - 12;
      for (const p of tokens) {
        p.vy += 1180 * dt;
        // A gentle inward pull makes a loose pile rather than scattered words.
        p.vx += ((w / 2) - (p.x + p.w / 2)) * (elapsed > 1.5 ? .65 : .16) * dt;
        p.vx *= Math.pow(.991, dt * 60);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle = Math.max(-21, Math.min(21, p.angle + p.spin * dt));
        p.spin *= Math.pow(.976, dt * 60);
        constrain(p, w, h);
      }
      collide(tokens);
      for (const p of tokens) constrain(p, w, h);
      render(tokens);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }

  function reset() {
    running = false;
    cancelAnimationFrame(frame);
    window.clearTimeout(resetTimer);
    window.clearTimeout(burstTimer);
    document.body.classList.remove('exos-screen-shake');
    overlay?.remove();
    overlay = null;
    layer?.remove();
    layer = null;
    sources.forEach(source => source.classList.remove('exos-copy-hidden'));
    card.classList.remove('exos-activated');
    card.style.height = previousHeight;
    button.disabled = false;
    status.textContent = '';
  }

  button.addEventListener('click', () => {
    if (running) return;
    running = true;
    previousHeight = card.style.height;
    card.style.height = card.getBoundingClientRect().height + 'px';
    layer = document.createElement('div');
    layer.className = 'exos-physics-layer';
    layer.setAttribute('aria-hidden', 'true');
    card.append(layer);
    const tokens = tokensForLayer();
    sources.forEach(source => source.classList.add('exos-copy-hidden'));
    card.classList.add('exos-activated');
    button.disabled = true;
    status.textContent = 'Boom. The card resets in 11 seconds.';
    playExplosion();
    showBlast();
    const start = performance.now();
    if (reduceMotion.matches) {
      // Respect OS reduced-motion settings: no shaking or animated falling.
      const bottom = layer.clientHeight - 19;
      tokens.forEach((p, i) => {
        p.x = Math.max(7, Math.min(layer.clientWidth - p.w - 8,
          (layer.clientWidth - p.w) / 2 + ((i % 5) - 2) * 22));
        p.y = Math.max(7, bottom - p.h - Math.floor(i / 5) * 17);
        p.angle = 0;
      });
      render(tokens);
    } else {
      startPhysics(tokens, start);
    }
    resetTimer = window.setTimeout(reset, 11000);
  });

  window.addEventListener('pagehide', () => { if (running) reset(); });
}
