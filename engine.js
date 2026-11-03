const StackGame = (() => {
  const COLS = 8;
  const ROWS = 9;
  const MAX_MISSES = 3;

  function shuffle(list, random) {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  class Game {
    constructor(catalog, random = Math.random) {
      this.catalog = catalog;
      this.random = random;
      this.reset();
    }

    reset() {
      this.score = 0;
      this.combo = 0;
      this.misses = 0;
      this.built = 0;
      this.correct = 0;
      this.rigIndex = 0;
      this.loadRig();
      this.mode = 'ready';
    }

    get speed() {
      return Math.max(145, Math.round(760 * Math.pow(0.987, this.correct) * Math.pow(0.95, this.built)));
    }

    loadRig() {
      this.rig = this.catalog[this.rigIndex];
      this.placed = this.rig.rows.map(() => []);
      this.row = 0;
      this.queue = this.rig.rows.flatMap(row => shuffle(row, this.random));
      this.spawn();
    }

    start() {
      this.reset();
      this.mode = 'playing';
    }

    nextRig() {
      if (this.mode !== 'complete') return;
      this.rigIndex = (this.rigIndex + 1) % this.catalog.length;
      this.loadRig();
      this.mode = 'playing';
    }

    spawn() {
      const piece = this.queue.shift();
      this.active = piece ? { ...piece, x: Math.floor((COLS - piece.span) / 2), y: 0 } : null;
    }

    collides(x, y) {
      if (x < 0 || x + this.active.span > COLS || y >= ROWS) return true;
      const placed = this.placed[ROWS - 1 - y] || [];
      return placed.some(slot => x < slot.col + slot.span && x + this.active.span > slot.col);
    }

    get landing() {
      if (!this.active) return null;
      let y = this.active.y;
      while (!this.collides(this.active.x, y + 1)) y++;
      return y;
    }

    move(delta) {
      if (this.mode !== 'playing' || this.collides(this.active.x + delta, this.active.y)) return;
      this.active.x += delta;
    }

    step(hard = false) {
      if (this.mode !== 'playing') return null;
      if (hard) this.active.y = this.landing;
      if (!hard && !this.collides(this.active.x, this.active.y + 1)) {
        this.active.y++;
        return null;
      }
      return this.lock();
    }

    lock() {
      const { x, y, id } = this.active;
      const slots = this.rig.rows[this.row];
      const installed = this.placed[this.row];
      const tierY = ROWS - 1 - this.row;
      let match;
      if (Math.abs(y - tierY) <= 1) {
        // A small snap keeps cabinet edges forgiving without marking targets on the stage.
        const candidates = slots.filter(slot => slot.id === id && !installed.includes(slot) &&
          Math.abs(slot.col - x) <= 1 && !this.collides(slot.col, tierY) &&
          this.collides(slot.col, tierY + 1));
        match = candidates.find(slot => slot.col === x) || candidates[0];
      }
      if (!match) {
        this.combo = 0;
        this.misses++;
        if (this.misses === MAX_MISSES) {
          this.mode = 'lost';
          return { type: 'lost', x, y };
        }
        this.active.x = Math.floor((COLS - this.active.span) / 2);
        this.active.y = 0;
        return { type: 'miss', x, y };
      }

      installed.push(match);
      this.correct++;
      this.combo++;
      const points = 100 + Math.min(10, this.combo - 1) * 20;
      const rowDone = installed.length === slots.length;
      this.score += points + (rowDone ? 150 : 0);
      if (rowDone) this.row++;
      if (this.row === this.rig.rows.length) {
        this.built++;
        this.score += 750;
        this.active = null;
        this.mode = 'complete';
        return { type: 'complete', x: match.col, y: tierY };
      }

      this.spawn();
      return { type: rowDone ? 'row' : 'hit', x: match.col, y: tierY, points: points + (rowDone ? 150 : 0) };
    }
  }

  return { Game, COLS, ROWS, MAX_MISSES };
})();
