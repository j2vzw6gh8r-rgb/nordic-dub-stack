const Sound = (() => {
  const track = document.getElementById('dub-track');
  track.volume = 0.59;
  let ctx;
  let master;
  let lastManual = -Infinity;

  function unlock() {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!ctx && Context) {
        ctx = new Context();
        const compressor = ctx.createDynamicsCompressor();
        master = ctx.createGain();
        master.gain.value = 0.55;
        compressor.threshold.value = -17;
        compressor.ratio.value = 5;
        compressor.connect(master).connect(ctx.destination);
        master.input = compressor;
      }
      if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
    } catch {
      ctx = undefined;
    }
  }

  function music(on) {
    if (on) track.play().catch(() => {});
    else track.pause();
  }

  function setEffects(on) {
    if (master) master.gain.setTargetAtTime(on ? 0.55 : 0, ctx.currentTime, 0.015);
  }

  function tone({ from, to = from, type, at, duration, volume, end, wobble = 0, repeats = false }) {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = type === 'sawtooth' ? 1600 : 2400;
    filter.Q.value = 0.45;
    osc.type = type;
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(to, at + duration * 0.48);
    osc.frequency.exponentialRampToValueAtTime(end || to, at + duration);
    envelope.gain.setValueAtTime(0.001, at);
    envelope.gain.linearRampToValueAtTime(volume, at + 0.024);
    envelope.gain.exponentialRampToValueAtTime(0.001, at + duration);
    osc.connect(filter).connect(envelope).connect(master.input);

    if (wobble) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 7.6;
      depth.gain.value = wobble;
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(at);
      lfo.stop(at + duration);
    }
    if (repeats) {
      const delay = ctx.createDelay(1);
      const feedback = ctx.createGain();
      delay.delayTime.value = 0.30;
      feedback.gain.value = 0.32;
      envelope.connect(delay).connect(feedback);
      feedback.connect(delay);
      feedback.connect(master.input);
      // Tear down the feedback loop after the tail has decayed.
      osc.addEventListener('ended', () => setTimeout(() => {
        delay.disconnect();
        feedback.disconnect();
      }, 2000), { once: true });
    }
    osc.start(at);
    osc.stop(at + duration + 0.01);
  }

  function play(name, manual = false) {
    if (!ctx) return;
    const at = ctx.currentTime + 0.016;
    if (manual) {
      if (at - lastManual < 0.14) return;
      lastManual = at;
    }
    if (name === 'siren') {
      tone({ from: 480, to: 1290, end: 390, type: 'triangle', at, duration: 0.81, volume: 0.32, wobble: 75, repeats: true });
      tone({ from: 244, to: 630, end: 210, type: 'sawtooth', at, duration: 0.60, volume: 0.095, wobble: 32 });
    } else if (name === 'horn') {
      for (const [start, duration, volume] of [[0, .19, .18], [.18, .18, .17], [.35, .46, .21]]) {
        for (const [note, balance] of [[326, 1], [417, .63], [493, .48]]) {
          tone({ from: note * .89, to: note, end: note * .94, type: 'sawtooth',
            at: at + start, duration, volume: volume * balance, repeats: start === .35 });
        }
      }
    } else if (name === 'miss') {
      tone({ from: 129, to: 58, end: 40, type: 'triangle', at, duration: .23, volume: .24 });
    } else {
      tone({ from: 89, to: 55, end: 43, type: 'sine', at, duration: .14, volume: .24 });
      if (name === 'row') tone({ from: 392, to: 522, type: 'triangle', at: at + .03, duration: .25, volume: .13, repeats: true });
    }
  }

  return { unlock, music, setEffects, play };
})();
