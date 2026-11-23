// A local, click-only visual/audio Easter egg. No tracking, network calls, or third-party media.
const easterEggButton = document.querySelector('[data-exos-easter-egg]');

if (easterEggButton) {
  let active = false;

  function playExplosionSound() {
    const AudioContextType = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextType) return;

    let audio;
    try {
      audio = new AudioContextType();
      // Audio is initiated only from the button's trusted click event.
      if (audio.state === 'suspended') void audio.resume().catch(() => {});

      const t = audio.currentTime;
      const master = audio.createGain();
      master.gain.value = 0.27;
      master.connect(audio.destination);

      // Original synthesized boom: a filtered short burst of noise plus a low pitch sweep.
      const duration = 0.82;
      const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
        const fade = 1 - 0.45 * (i / samples.length);
        samples[i] = (Math.random() * 2 - 1) * fade;
      }

      const noise = audio.createBufferSource();
      noise.buffer = buffer;
      const filter = audio.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, t);
      filter.frequency.exponentialRampToValueAtTime(135, t + duration);
      const noiseGain = audio.createGain();
      noiseGain.gain.setValueAtTime(0.001, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.26, t + 0.035);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(master);

      const bass = audio.createOscillator();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(110, t);
      bass.frequency.exponentialRampToValueAtTime(32, t + 0.63);
      const bassGain = audio.createGain();
      bassGain.gain.setValueAtTime(0.001, t);
      bassGain.gain.exponentialRampToValueAtTime(0.4, t + 0.025);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.63);
      bass.connect(bassGain);
      bassGain.connect(master);

      noise.start(t);
      noise.stop(t + duration);
      bass.start(t);
      bass.stop(t + 0.64);
      noise.onended = () => { void audio.close().catch(() => {}); };
    } catch {
      // Sound may be disabled by device settings; the visual effect still works.
      if (audio && audio.state !== 'closed') void audio.close().catch(() => {});
    }
  }

  function launchExplosion() {
    if (active) return;
    active = true;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const overlay = document.createElement('div');
    overlay.className = 'exos-explosion-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const burst = document.createElement('div');
    burst.className = 'exos-explosion-burst';
    overlay.append(burst);
    for (let i = 0; i < 18; i++) {
      const spark = document.createElement('i');
      spark.className = 'exos-explosion-spark';
      spark.style.setProperty('--spark-angle', String(i * 20) + 'deg');
      spark.style.setProperty('--spark-distance', String(28 + (i % 4) * 6) + 'vmin');
      burst.append(spark);
    }

    document.body.append(overlay);
    if (!reduceMotion) document.body.classList.add('exos-easter-egg-shake');
    playExplosionSound();

    window.setTimeout(() => {
      document.body.classList.remove('exos-easter-egg-shake');
      overlay.remove();
      active = false;
    }, reduceMotion ? 400 : 1100);
  }

  easterEggButton.addEventListener('click', launchExplosion);
}
