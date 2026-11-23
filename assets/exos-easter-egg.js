// A purely local, opt-in, eleven-second EXOS card Easter egg.
// No audio files, cookies, tracking, or external animation libraries.
const card = document.querySelector('[data-exos-card]');
if (card) {
  const trigger = card.querySelector('[data-exos-trigger]');
  const live = card.querySelector('[data-exos-status]');
  const sources = [...card.querySelectorAll('[data-exos-fall]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const RESET_MS = 11000;
  const idleLabel = trigger.textContent;
  const pointer = { active: false, x: 0, y: 0, dx: 0, dy: 0 };
  let deadline = 0;
  let countdownTimer = 0;
  let running = false;

  // Event handlers only collect input; at most one bounded impulse per frame.
  card.addEventListener('pointermove', event => {
    if (!running || reducedMotion.matches) return;
    pointer.dx += pointer.active ? event.clientX - pointer.x : 0;
    pointer.dy += pointer.active ? event.clientY - pointer.y : 0;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  });
  const clearPointer = () => {
    pointer.active = false;
    pointer.dx = pointer.dy = 0;
  };
  card.addEventListener('pointerleave', clearPointer);
  card.addEventListener('pointercancel', clearPointer);
  card.addEventListener('pointerup', event => {
    if (event.pointerType === 'touch') clearPointer();
  });

  function updateCountdown() {
    if (!running) return;
    window.clearTimeout(countdownTimer);
    const remaining = Math.max(0, deadline - performance.now());
    trigger.textContent = 'Reset in ' + Math.ceil(remaining / 1000) + 's';
    if (!remaining) { reset(); return; }
    countdownTimer = window.setTimeout(updateCountdown, remaining % 1000 || 1000);
  }

  let resetTimer = 0;
  let effectTimer = 0;
  let frame = 0;
  let lastTime = 0;
  let wordLayer = null;
  let blastLayer = null;

  function boomSound() {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) return;
    let audio;
    try {
      audio = new AudioEngine();
      const now = audio.currentTime;
      const master = audio.createGain();
      master.gain.value = 0.36;
      master.connect(audio.destination);
      const sampleCount = Math.floor(audio.sampleRate * 0.85);
      const noise = audio.createBuffer(1, sampleCount, audio.sampleRate);
      const channel = noise.getChannelData(0);
      for (let i = 0; i < sampleCount; i++) {
        const t = i / sampleCount;
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2);
      }
      const burst = audio.createBufferSource();
      burst.buffer = noise;
      const lowPass = audio.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.frequency.setValueAtTime(1100, now);
      lowPass.frequency.exponentialRampToValueAtTime(100, now + 0.8);
      const noiseGain = audio.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.85, now + 0.015);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      burst.connect(lowPass).connect(noiseGain).connect(master);
      const rumble = audio.createOscillator();
      const rumbleGain = audio.createGain();
      rumble.type = 'sine';
      rumble.frequency.setValueAtTime(96, now);
      rumble.frequency.exponentialRampToValueAtTime(34, now + 0.78);
      rumbleGain.gain.setValueAtTime(0.32, now);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      rumble.connect(rumbleGain).connect(master);
      burst.start(now);
      rumble.start(now);
      rumble.stop(now + 0.85);
      audio.resume().catch(() => {});
      window.setTimeout(() => audio.close().catch(() => {}), 1500);
    } catch {
      if (audio) audio.close().catch(() => {});
      // Sound can be unavailable or blocked; the visual Easter egg still works.
    }
  }

  function makeExplosion() {
    const rect = trigger.getBoundingClientRect();
    const x = Math.min(window.innerWidth - 40, Math.max(40, rect.left + rect.width / 2));
    const y = Math.min(window.innerHeight - 40, Math.max(40, rect.top + rect.height / 2));
    blastLayer = document.createElement('div');
    blastLayer.className = 'exos-blast-layer';
    blastLayer.setAttribute('aria-hidden', 'true');
    blastLayer.style.setProperty('--exos-blast-x', x + 'px');
    blastLayer.style.setProperty('--exos-blast-y', y + 'px');
    const core = document.createElement('span');
    core.className = 'exos-blast-core';
    blastLayer.append(core);
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('span');
      particle.className = 'exos-blast-spark';
      const angle = (i / 30) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const distance = 110 + Math.random() * Math.min(360, window.innerWidth * 0.42);
      particle.style.setProperty('--exos-dx', Math.cos(angle) * distance + 'px');
      particle.style.setProperty('--exos-dy', Math.sin(angle) * distance + 'px');
      particle.style.setProperty('--exos-delay', (i % 5) * 0.018 + 's');
      particle.style.background = i % 3 === 0 ? '#ffcd38' : i % 3 === 1 ? '#ff5d26' : '#ffdf8f';
      blastLayer.append(particle);
    }
    document.body.append(blastLayer);
    document.body.classList.add('exos-screen-shaking');
    effectTimer = window.setTimeout(() => {
      document.body.classList.remove('exos-screen-shaking');
      blastLayer?.remove();
      blastLayer = null;
    }, 1600);
  }

  function makeWords() {
    const bounds = card.getBoundingClientRect();
    wordLayer = document.createElement('div');
    wordLayer.className = 'exos-word-layer';
    wordLayer.setAttribute('aria-hidden', 'true');
    const bodies = [];
    for (const element of sources) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const content = node.nodeValue || '';
        const style = window.getComputedStyle(node.parentElement);
        for (const match of content.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const rect = range.getBoundingClientRect();
          range.detach?.();
          if (rect.width < 1 || rect.height < 1) continue;
          const token = document.createElement('span');
          token.className = 'exos-falling-word';
          token.textContent = match[0];
          token.style.left = rect.left - bounds.left + 'px';
          token.style.top = rect.top - bounds.top + 'px';
          token.style.fontFamily = style.fontFamily;
          token.style.fontSize = style.fontSize;
          token.style.fontWeight = style.fontWeight;
          token.style.fontStyle = style.fontStyle;
          token.style.letterSpacing = style.letterSpacing;
          token.style.lineHeight = style.lineHeight;
          token.style.textTransform = style.textTransform;
          token.style.color = style.color;
          wordLayer.append(token);
          bodies.push({
            element: token,
            homeX: rect.left - bounds.left,
            homeY: rect.top - bounds.top,
            x: rect.left - bounds.left,
            y: rect.top - bounds.top,
            w: Math.min(rect.width, card.clientWidth - 20),
            h: rect.height,
            vx: (Math.random() - 0.5) * 340,
            vy: -210 - Math.random() * 360,
            angle: 0,
            spin: (Math.random() - 0.5) * 2.6
          });
        }
      }
    }
    card.append(wordLayer);
    return bodies;
  }

  function moveWords(bodies, time) {
    if (!running) return;
    if (time >= deadline) { reset(); return; }
    const dt = Math.min(0.032, Math.max(0.001, (time - lastTime) / 1000 || 0.016));
    lastTime = time;
    const box = card.getBoundingClientRect();
    const buttonRect = trigger.getBoundingClientRect();
    const floor = Math.max(95, buttonRect.top - box.top - 12);
    const left = 10;
    const right = card.clientWidth - 10;
    const gravity = 1550;
    const movement = Math.min(80, Math.hypot(pointer.dx, pointer.dy));
    for (const body of bodies) {
      if (pointer.active && movement > 0) {
        const dx = body.x + body.w / 2 - (pointer.x - box.left);
        const dy = body.y + body.h / 2 - (pointer.y - box.top);
        const distance = Math.hypot(dx, dy);
        const radius = 85;
        if (distance < radius) {
          const impulse = Math.min(420, movement * 18) * (1 - distance / radius);
          body.vx += (distance > 0.1 ? dx / distance : 0) * impulse;
          body.vy += (distance > 0.1 ? dy / distance : -1) * impulse - impulse * 0.6;
          body.spin = Math.max(-3, Math.min(3, body.spin + pointer.dx * 0.01));
        }
      }
      body.vx = Math.max(-600, Math.min(600, body.vx));
      body.vy = Math.max(-650, Math.min(900, body.vy));
      body.vy += gravity * dt;
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      body.angle += body.spin * dt;
      if (body.x < left) { body.x = left; body.vx = Math.abs(body.vx) * 0.34; }
      if (body.x + body.w > right) {
        body.x = Math.max(left, right - body.w);
        body.vx = -Math.abs(body.vx) * 0.34;
      }
      if (body.y < 8) { body.y = 8; body.vy = Math.abs(body.vy) * 0.22; }
      if (body.y + body.h > floor) {
        body.y = Math.max(8, floor - body.h);
        body.vy = Math.abs(body.vy) < 40 ? 0 : -Math.abs(body.vy) * 0.18;
        body.vx *= 0.91;
        body.spin *= 0.93;
      }
    }
    pointer.dx = pointer.dy = 0;
    // Rectangle collisions make the words pile up instead of overlapping on one baseline.
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          if (ox <= 0 || oy <= 0) continue;
          if (oy <= ox) {
            const sign = a.y < b.y ? -1 : 1;
            a.y += sign * oy * 0.52;
            b.y -= sign * oy * 0.48;
            if (sign < 0) { a.vy = Math.min(0, a.vy) * 0.12; b.vy = Math.max(0, b.vy) * 0.12; }
            else { a.vy = Math.max(0, a.vy) * 0.12; b.vy = Math.min(0, b.vy) * 0.12; }
            a.vx *= 0.94;
            b.vx *= 0.94;
          } else {
            const sign = a.x < b.x ? -1 : 1;
            a.x += sign * ox * 0.52;
            b.x -= sign * ox * 0.48;
            a.vx = -a.vx * 0.18;
            b.vx = -b.vx * 0.18;
          }
        }
      }
    }
    for (const body of bodies) {
      body.x = Math.max(left, Math.min(right - body.w, body.x));
      body.y = Math.max(8, Math.min(floor - body.h, body.y));
      body.element.style.transform = 'translate3d(' + (body.x - body.homeX).toFixed(1) +
        'px,' + (body.y - body.homeY).toFixed(1) + 'px,0) rotate(' +
        body.angle.toFixed(3) + 'rad)';
    }
    frame = window.requestAnimationFrame(next => moveWords(bodies, next));
  }

  function reset() {
    if (!running) return;
    running = false;
    window.cancelAnimationFrame(frame);
    window.clearTimeout(resetTimer);
    window.clearTimeout(countdownTimer);
    clearPointer();
    window.clearTimeout(effectTimer);
    wordLayer?.remove();
    blastLayer?.remove();
    wordLayer = blastLayer = null;
    card.classList.remove('exos-in-chaos');
    document.body.classList.remove('exos-screen-shaking');
    trigger.disabled = false;
    trigger.textContent = idleLabel;
    live.textContent = '';
  }

  trigger.addEventListener('click', () => {
    if (running) return;
    running = true;
    deadline = performance.now() + RESET_MS;
    resetTimer = window.setTimeout(reset, RESET_MS);
    updateCountdown();
    trigger.disabled = true;
    live.textContent = 'Boom! The card will reset in 11 seconds.';
    boomSound();
    if (!reducedMotion.matches) {
      const bodies = makeWords();
      card.classList.add('exos-in-chaos');
      lastTime = performance.now();
      frame = window.requestAnimationFrame(next => moveWords(bodies, next));
      makeExplosion();
    }
  });

  reducedMotion.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && running) updateCountdown();
  });
  window.addEventListener('pagehide', reset);
}
