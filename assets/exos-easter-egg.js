// Original NAV Easter egg: no third-party sound, image, or network dependency.
const trigger = document.querySelector('[data-exos-egg]');

function playExplosionSound() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return; // Visual effect still works in unsupported or muted environments.
  let context;
  try {
    context = new Audio();
    if (context.state === 'suspended') void context.resume().catch(() => {});
    const t = context.currentTime;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -15;
    limiter.ratio.value = 10;
    limiter.connect(context.destination);

    // A single synthesized boom: falling sub-bass plus a filtered noise burst.
    const bass = context.createOscillator();
    const bassGain = context.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(116, t);
    bass.frequency.exponentialRampToValueAtTime(32, t + 0.46);
    bassGain.gain.setValueAtTime(0.0001, t);
    bassGain.gain.exponentialRampToValueAtTime(0.43, t + 0.015);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.57);
    bass.connect(bassGain).connect(limiter);
    bass.start(t);
    bass.stop(t + 0.58);

    const length = Math.floor(context.sampleRate * 0.7);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) samples[i] = Math.random() * 2 - 1;
    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    noise.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2300, t);
    filter.frequency.exponentialRampToValueAtTime(130, t + 0.68);
    noiseGain.gain.setValueAtTime(0.0001, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.30, t + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.69);
    noise.connect(filter).connect(noiseGain).connect(limiter);
    noise.start(t);
    noise.stop(t + 0.7);
    window.setTimeout(() => { void context.close().catch(() => {}); }, 1100);
  } catch (_) {
    if (context) void context.close().catch(() => {});
  }
}

if (trigger) {
  let active = false;
  trigger.addEventListener('click', () => {
    if (active) return;
    active = true;
    trigger.disabled = true;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const overlay = document.createElement('div');
    overlay.className = 'exos-egg-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    for (const className of ['exos-egg-flash', 'exos-egg-fireball', 'exos-egg-shockwave', 'exos-egg-smoke']) {
      const piece = document.createElement('div');
      piece.className = className;
      overlay.appendChild(piece);
    }
    if (!reduceMotion) {
      for (let i = 0; i < 20; i++) {
        const spark = document.createElement('i');
        spark.className = 'exos-egg-spark';
        spark.style.setProperty('--spark-angle', (i * 18 + (i % 3) * 4) + 'deg');
        spark.style.setProperty('--spark-distance', (110 + (i * 37) % 160) + 'px');
        spark.style.setProperty('--spark-delay', ((i % 5) * 13) + 'ms');
        overlay.appendChild(spark);
      }
      document.body.classList.add('exos-egg-shake');
    }
    document.body.appendChild(overlay);
    playExplosionSound();
    window.setTimeout(() => {
      overlay.remove();
      document.body.classList.remove('exos-egg-shake');
      trigger.disabled = false;
      active = false;
    }, reduceMotion ? 450 : 1100);
  });
}
