(() => {
  const { Game, COLS, ROWS, MAX_MISSES } = StackGame;
  const game = new Game(rigs);
  const $ = id => document.getElementById(id);
  const board = $('board');
  const ctx = board.getContext('2d');
  const mini = $('rig-preview').getContext('2d');
  const next = $('next').getContext('2d');
  const artwork = new Image();
  const number = new Intl.NumberFormat('en-GB');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'nordic-dub-stack.best.v2.2';
  const actions = {
    ready: 'String up the sound',
    paused: 'Back to the session',
    complete: 'Next sound',
    lost: 'Run it again',
  };
  const stageFloor = board.height - 35;
  const spawnTop = 13;
  let layout;
  const panel = document.querySelector('.board-panel');
  const buttons = [...document.querySelectorAll('[data-control]')];
  const rigSteps = rigs.map(rig => {
    const step = document.createElement('i');
    step.title = rig.name;
    return step;
  });
  $('rig-path').append(...rigSteps);

  let best = 0;
  try { best = Math.max(0, Number(localStorage.getItem(storageKey)) || 0); } catch {}
  let musicOn = true;
  let effectsOn = true;
  let lastDrop = 0;
  let dirty = true;
  let particles = [];
  let feedbackTimer = 0;
  let drawnRig = -1;
  let repeatDelay;
  let repeatTimer;
  let touched = null;

  function fittedSize(sourceWidth, sourceHeight, maxWidth, maxHeight) {
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
    return [sourceWidth * scale, sourceHeight * scale];
  }

  function drawPiece(target, piece, x, y, w, h, fitted = false) {
    if (artwork.complete && artwork.naturalWidth) {
      if (fitted) {
        const [drawW, drawH] = fittedSize(piece.rect[2], piece.rect[3], w, h);
        x += (w - drawW) / 2;
        y += (h - drawH) / 2;
        w = drawW;
        h = drawH;
      }
      if (piece.outline) {
        target.save();
        target.beginPath();
        for (const [px, py] of piece.outline) {
          target.lineTo(x + px * w / piece.rect[2], y + py * h / piece.rect[3]);
        }
        target.closePath();
        target.clip();
      }
      target.drawImage(artwork, ...piece.rect, x, y, w, h);
      if (piece.outline) target.restore();
      return;
    }

    target.fillStyle = game.rig.color;
    target.fillRect(x, y, w, h);
    target.fillStyle = '#192021';
    target.fillRect(x + w * .06, y + h * .10, w * .88, h * .80);
    target.fillStyle = game.rig.color;
    target.font = `bold ${Math.min(w / 6, h / 4)}px monospace`;
    target.textAlign = 'center';
    target.textBaseline = 'middle';
    target.fillText(piece.kind, x + w / 2, y + h / 2, w * .83);
  }

  function drawCabinet(target, piece, col, row, size) {
    drawPiece(target, piece, col * size + 1, row * size + 1, piece.span * size - 2, size - 2);
  }

  function drawRig() {
    mini.clearRect(0, 0, mini.canvas.width, mini.canvas.height);
    if (artwork.complete && artwork.naturalWidth) {
      const [x, y, w, h] = game.rig.art;
      const [drawW, drawH] = fittedSize(w, h, mini.canvas.width - 110, mini.canvas.height - 38);
      mini.drawImage(artwork, x, y, w, h, (mini.canvas.width - drawW) / 2,
        (mini.canvas.height - drawH) / 2, drawW, drawH);
      return;
    }
    const size = Math.min(45, 282 / game.rig.rows.length);
    const left = (mini.canvas.width - COLS * size) / 2;
    const bottom = (mini.canvas.height + size * game.rig.rows.length) / 2 + 4;
    mini.save();
    mini.fillStyle = '#51402a52';
    mini.beginPath();
    mini.ellipse(mini.canvas.width / 2, bottom + 5, size * 3.8, 8, 0, 0, Math.PI * 2);
    mini.fill();
    mini.translate(left, bottom);
    game.rig.rows.forEach((row, i) => row.forEach(piece => drawCabinet(mini, piece, piece.col, -i - 1, size)));
    mini.restore();
  }

  function drawNext() {
    next.clearRect(0, 0, next.canvas.width, next.canvas.height);
    const piece = game.queue[0];
    if (piece) drawPiece(next, piece, 10, 7, 180, 136, true);
    $('next-name').textContent = piece?.kind || (game.mode === 'complete' ? 'Stack ready' : 'Last box in play');
  }

  function measureRig() {
    const [artX, , artWidth] = game.rig.art;
    const heights = game.rig.rows.map(row => Math.max(...row.map(piece => piece.rect[3])));
    const total = heights.reduce((sum, height) => sum + height, 0);
    const scale = Math.min((board.width - 138) / artWidth, (stageFloor - 92) / total);
    let baseline = stageFloor;
    const tiers = game.rig.rows.map((slots, i) => {
      const first = slots[0];
      const last = slots.at(-1);
      const width = last.rect[0] + last.rect[2] - first.rect[0];
      const pitch = width * scale / (last.col + last.span - first.col);
      const bottom = baseline;
      baseline -= heights[i] * scale;
      return { slots, pitch, bottom };
    });
    return {
      scale, tiers, ceiling: baseline, width: artWidth * scale,
      left: (board.width - artWidth * scale) / 2 - artX * scale,
    };
  }

  function activeBottom(y, height) {
    const target = ROWS - 1 - game.row;
    if (y >= target) return layout.tiers[ROWS - 1 - y].bottom;
    const start = height + spawnTop;
    const distance = layout.tiers[game.row].bottom - start;
    return start + distance * y / target;
  }

  function stageX(piece, col, tier) {
    const { slots, pitch } = layout.tiers[tier];
    let anchor = slots[0];
    for (const slot of slots) {
      if (slot.col > col) break;
      anchor = slot;
    }
    const x = layout.left + anchor.rect[0] * layout.scale + (col - anchor.col) * pitch;
    return Math.min(board.width - piece.rect[2] * layout.scale - 8, Math.max(8, x));
  }

  function stagePiece(piece, x, bottom, falling = false) {
    const width = piece.rect[2] * layout.scale;
    const height = piece.rect[3] * layout.scale;
    ctx.save();
    if (falling) {
      ctx.shadowColor = '#000b';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;
    }
    drawPiece(ctx, piece, x, bottom - height, width, height);
    ctx.restore();
  }

  function drawStage() {
    const { width, height } = board;
    const glow = ctx.createRadialGradient(width / 2, height * .47, 22, width / 2, height * .47, width * .58);
    glow.addColorStop(0, '#4e2d1b');
    glow.addColorStop(.55, '#2a1a12');
    glow.addColorStop(1, '#170f0b');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const floor = ctx.createLinearGradient(0, stageFloor, 0, height);
    floor.addColorStop(0, '#392215');
    floor.addColorStop(1, '#190f0a');
    ctx.fillStyle = floor;
    ctx.fillRect(0, stageFloor, width, height - stageFloor);
    ctx.fillStyle = '#8653357a';
    ctx.fillRect(0, stageFloor, width, 1);
    ctx.fillStyle = '#0f090585';
    ctx.beginPath();
    ctx.ellipse(width / 2, stageFloor + 6, layout.width / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBoard(now) {
    drawStage();
    game.placed.forEach((slots, tier) => {
      for (const slot of slots) {
        stagePiece(slot, layout.left + slot.rect[0] * layout.scale, layout.tiers[tier].bottom);
      }
    });
    if (game.active && game.mode !== 'lost') {
      const piece = game.active;
      const height = piece.rect[3] * layout.scale;
      stagePiece(piece, stageX(piece, piece.x, game.row), activeBottom(piece.y, height), true);
    }

    particles = particles.filter(p => now - p.start < p.duration);
    for (const p of particles) {
      const elapsed = (now - p.start) / 1000;
      ctx.globalAlpha = Math.max(0, 1 - elapsed * 1000 / p.duration);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x + p.vx * elapsed, p.y + p.vy * elapsed + elapsed ** 2 * 230, p.size, p.size * 1.4);
    }
    ctx.globalAlpha = 1;
  }

  function burst(x, y, type, piece, tier) {
    if (reducedMotion.matches) return;
    const many = type === 'complete';
    const wrong = type === 'miss' || type === 'lost';
    const count = many ? 64 : wrong ? 19 : 13;
    const palette = wrong ? ['#ff785d', '#ffc89c'] : ['#f6ba6d', '#ff995b', game.rig.color, '#fff4c5'];
    const start = performance.now();
    const impactX = stageX(piece, x, tier) + piece.rect[2] * layout.scale / 2;
    const impactY = layout.tiers[ROWS - 1 - y]?.bottom ?? layout.ceiling;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: many ? board.width * (.14 + Math.random() * .72) : impactX,
        y: impactY - 20,
        vx: (Math.random() - .5) * (many ? 510 : 220),
        vy: -(40 + Math.random() * (many ? 510 : 220)),
        color: palette[i % palette.length], start,
        duration: many ? 500 + Math.random() * 770 : 240 + Math.random() * 350,
        size: 2 + Math.random() * 5,
      });
    }
  }

  function announce(message) {
    $('announcement').textContent = message;
  }

  function updateControls() {
    const playable = game.mode === 'playing';
    for (const button of buttons) button.disabled = !playable;
    $('pause').disabled = !playable && game.mode !== 'paused';
    const paused = game.mode === 'paused';
    $('pause').setAttribute('aria-label', paused ? 'Resume' : 'Pause');
    $('pause').title = paused ? 'Resume (P)' : 'Pause (P)';
    $('pause').querySelector('use').setAttribute('href', paused ? '#icon-play' : '#icon-pause');
  }

  function updateHUD() {
    if (drawnRig !== game.rigIndex) {
      drawnRig = game.rigIndex;
      layout = measureRig();
      const rig = game.rig;
      document.documentElement.style.setProperty('--rig-color', rig.color);
      $('rig-number').textContent = `${String(game.rigIndex + 1).padStart(2, '0')} / ${String(rigs.length).padStart(2, '0')}`;
      $('rig-name').textContent = rig.name;
      $('rig-country').textContent = rig.country;
      $('rig-code').textContent = rig.code;
      $('rig-note').textContent = rig.note;
      rigSteps.forEach((step, i) => { step.className = i === game.rigIndex ? 'current' : i < game.rigIndex ? 'past' : ''; });
      drawRig();
    }
    if (game.score > best) {
      best = game.score;
      try { localStorage.setItem(storageKey, String(best)); } catch {}
    }
    $('score').textContent = number.format(game.score);
    $('best').textContent = number.format(best);
    $('combo').textContent = game.combo > 1 ? `×${game.combo}` : '—';
    $('lives').setAttribute('aria-label', `${MAX_MISSES - game.misses} chances left`);
    [...$('lives').children].forEach((life, i) => life.classList.toggle('spent', i >= MAX_MISSES - game.misses));
    $('tempo').textContent = `TEMPO ${Math.min(9, 1 + Math.floor((760 - game.speed) / 75))}`;
    $('board-state').textContent = ({
      ready: 'SOUNDCHECK', playing: 'IN SESSION', paused: 'PAUSED', complete: 'STACK READY', lost: 'SESSION DONE',
    })[game.mode];
    $('board-led').classList.toggle('off', game.mode === 'paused' || game.mode === 'lost');
    updateControls();
    drawNext();
    dirty = true;
  }

  function renderAction(focus = false) {
    const primary = $('primary');
    const text = actions[game.mode];
    primary.hidden = !text;
    if (text) primary.querySelector('span').textContent = text;
    if (focus) (text ? primary : board).focus({ preventScroll: true });
  }

  function defaultInstruction() {
    if (game.mode === 'playing') return `In the air · ${game.active.kind}`;
    if (game.mode === 'paused') return 'Take a breather. The rig will be here.';
    return 'Take a look at the rig, then build it one box at a time.';
  }

  function feedback(text = defaultInstruction(), style = '', duration = 0) {
    clearTimeout(feedbackTimer);
    panel.classList.toggle('flash-good', style === 'good');
    panel.classList.toggle('flash-bad', style === 'bad');
    $('instruction').textContent = text;
    if (duration) feedbackTimer = setTimeout(() => feedback(), duration);
  }

  function updateMusic() {
    Sound.music(musicOn && ['playing', 'complete', 'lost'].includes(game.mode));
  }

  const bandInfo = {
    bass: { title: 'Bass section', range: '30–100 Hz' },
    kick: { title: 'Kick section', range: '100–200 Hz' },
    mid: { title: 'Mid section', range: '200 Hz–5 kHz' },
    high: { title: 'High section', range: '5 kHz+' },
  };
  let currentBand = 'bass';
  const preampBands = [...document.querySelectorAll('.preamp-band')];

  function paintPreamp() {
    preampBands.forEach(element => {
      const name = element.dataset.band;
      element.classList.toggle('active', name === 'bass' || game._activeBands?.includes(name));
      element.classList.toggle('current', name === currentBand);
    });
    const info = bandInfo[currentBand];
    $('preamp-status').textContent = game.mode === 'playing' ? `${info.title} live` : 'Soundcheck';
    $('preamp-readout').textContent = `${info.title} · ${info.range}`;
  }

  function resetPreamp() {
    game._activeBands = ['bass'];
    currentBand = 'bass';
    Sound.resetBands();
    paintPreamp();
  }

  function bandForPiece(piece, tier) {
    const kind = piece.kind.toLowerCase();
    if (/scoop|sub|bass/.test(kind)) return 'bass';
    if (/kick/.test(kind)) return 'kick';
    if (/mid/.test(kind)) return 'mid';
    if (/tweeter|top|horn|crest/.test(kind)) return 'high';
    return tier === 0 ? 'bass' : tier === 1 ? 'kick' : tier === 2 ? 'mid' : 'high';
  }

  function activatePreamp(piece, tier) {
    currentBand = bandForPiece(piece, tier);
    game._activeBands ||= ['bass'];
    if (!game._activeBands.includes(currentBand)) game._activeBands.push(currentBand);
    Sound.activateBand(currentBand);
    paintPreamp();
  }

  function togglePause() {
    if (game.mode !== 'playing' && game.mode !== 'paused') return;
    stopRepeating();
    const pause = game.mode === 'playing';
    game.mode = pause ? 'paused' : 'playing';
    if (!pause) Sound.unlock();
    lastDrop = performance.now();
    updateHUD();
    feedback();
    renderAction(true);
    updateMusic();
  }

  function triggerEffect(name, manual = false) {
    if (!effectsOn) return;
    if (manual) Sound.unlock();
    Sound.play(name, manual);
    if (name === 'siren' || name === 'horn') {
      const pads = document.querySelectorAll(`[data-effect="${name}"]`);
      pads.forEach(button => button.classList.add('fired'));
      setTimeout(() => pads.forEach(button => button.classList.remove('fired')), 250);
    }
  }

  function handleResult(result, piece, tier) {
    if (!result) return;
    const { type, x, y, points } = result;
    if (type === 'hit' || type === 'row' || type === 'complete') activatePreamp(piece, tier);
    burst(x, y, type, piece, tier);
    updateHUD();
    if (type === 'complete') {
      feedback(`${game.rig.name} is ready to play. +750 bonus points.`, 'good');
      announce(`${game.rig.name} is built.`);
      triggerEffect(game.built % 2 ? 'horn' : 'siren');
      stopRepeating();
      renderAction(true);
    } else if (type === 'lost' || type === 'miss') {
      const tries = MAX_MISSES - game.misses;
      const message = tries ? `Off the stack. ${tries} ${tries === 1 ? 'chance' : 'chances'} left. Same box again.`
        : `Session done · ${number.format(game.score)} points · ${game.built} ${game.built === 1 ? 'rig' : 'rigs'} built.`;
      feedback(message, 'bad', tries ? 2300 : 0);
      announce(message);
      triggerEffect('miss');
      if (!tries) {
        stopRepeating();
        renderAction(true);
      }
    } else {
      const message = type === 'row' ? `Tier locked in. +${points} points.` : `Solid placement. +${points} points.`;
      feedback(message, 'good', 920);
      if (type === 'row') announce(message);
      triggerEffect(type);
    }
  }

  function drop(hard = false) {
    if (game.mode !== 'playing') return;
    const { active, row } = game;
    handleResult(game.step(hard), active, row);
    lastDrop = performance.now();
    dirty = true;
  }

  function control(action) {
    if (game.mode !== 'playing') return;
    if (action === 'left' || action === 'right') {
      game.move(action === 'left' ? -1 : 1);
      dirty = true;
    } else {
      drop(action === 'drop');
    }
  }

  function frame(now) {
    if (game.mode === 'playing' && now - lastDrop >= game.speed) drop();
    if (dirty || particles.length) {
      drawBoard(now);
      dirty = false;
    }
    requestAnimationFrame(frame);
  }

  function stopRepeating() {
    clearTimeout(repeatDelay);
    clearInterval(repeatTimer);
    touched = null;
  }

  for (const button of buttons) {
    const { control: action } = button.dataset;
    button.addEventListener('pointerdown', event => {
      if (button.disabled || event.button !== 0 || touched !== null) return;
      event.preventDefault();
      touched = event.pointerId;
      button.setPointerCapture(event.pointerId);
      control(action);
      if (action !== 'drop' && touched !== null) {
        repeatDelay = setTimeout(() => {
          repeatTimer = setInterval(() => control(action), action === 'down' ? 70 : 90);
        }, 130);
      }
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(event, event => {
        if (touched === event.pointerId) stopRepeating();
      });
    }
    button.addEventListener('click', event => {
      if (event.detail === 0) control(action);
    });
  }

  $('primary').addEventListener('click', () => {
    Sound.unlock();
    Sound.setEffects(effectsOn);
    if (game.mode === 'paused') {
      togglePause();
      return;
    }
    if (game.mode === 'complete') game.nextRig();
    else game.start();
    resetPreamp();
    lastDrop = performance.now();
    particles = [];
    feedback();
    updateHUD();
    renderAction(true);
    updateMusic();
    announce(`Build ${game.rig.name}.`);
  });
  $('pause').addEventListener('click', togglePause);
  function returnToBoard(event) {
    if (event.detail > 0 && game.mode === 'playing') board.focus({ preventScroll: true });
  }

  $('music').addEventListener('click', event => {
    musicOn = !musicOn;
    $('music').setAttribute('aria-pressed', musicOn);
    if (musicOn) Sound.unlock();
    if (musicOn && game.mode === 'ready') Sound.music(true);
    else updateMusic();
    returnToBoard(event);
  });
  $('effects').addEventListener('click', event => {
    effectsOn = !effectsOn;
    $('effects').setAttribute('aria-pressed', effectsOn);
    Sound.setEffects(effectsOn);
    returnToBoard(event);
  });
  for (const pad of document.querySelectorAll('[data-effect]')) {
    pad.addEventListener('click', event => {
      triggerEffect(pad.dataset.effect, true);
      returnToBoard(event);
    });
  }

  const keys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', Space: 'drop' };
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
    const action = keys[event.code];
    if (action && game.mode === 'playing') {
      if (action === 'drop' && event.target.closest('button')) return;
      event.preventDefault();
      if (action !== 'drop' || !event.repeat) control(action);
      return;
    }
    if (event.repeat) return;
    if (event.code === 'KeyP' || (event.code === 'Escape' && game.mode === 'playing')) {
      togglePause();
    } else if (event.code === 'KeyS') triggerEffect('siren', true);
    else if (event.code === 'KeyH') triggerEffect('horn', true);
    else if ((event.code === 'Space' || event.code === 'Enter') && !event.target.closest('button') && !$('primary').hidden) {
      event.preventDefault();
      $('primary').click();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.mode === 'playing') togglePause();
  });
  artwork.addEventListener('load', () => {
    drawRig();
    drawNext();
    dirty = true;
  });
  artwork.src = './assets/nordic-speakers.png';
  resetPreamp();
  updateHUD();
  renderAction();
  requestAnimationFrame(frame);
})();
