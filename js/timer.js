/**
 * timer.js — exercise timer. Exactly ONE interval can exist per Timer instance;
 * start() on a running timer is a no-op, so intervals can never be duplicated.
 *
 *   mode 'training': counts up (mm:ss), no limit.
 *   mode 'trial'   : counts down from `limit` seconds; at 0 -> onTimeout (counts as wrong).
 *
 * Elapsed time is measured with the clock (not by counting ticks), so throttled
 * background tabs still report the right time. The clock and the interval
 * functions are injectable for tests.
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});

  function format(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  class Timer {
    constructor(opts = {}) {
      this.mode = opts.mode === 'trial' ? 'trial' : 'training';
      this.limit = this.mode === 'trial' ? opts.limit || 75 : null;
      this.onTick = opts.onTick || (() => {});
      this.onTimeout = opts.onTimeout || (() => {});
      this.now = opts.now || (() => Date.now());
      this._setInterval = opts.setInterval || ((f, ms) => globalThis.setInterval(f, ms));
      this._clearInterval = opts.clearInterval || ((h) => globalThis.clearInterval(h));
      this.handle = null;
      this.startedAt = null;
      this.stoppedElapsed = null;
      this.timedOut = false;
    }

    get running() {
      return this.handle !== null;
    }

    elapsed() {
      if (this.stoppedElapsed !== null) return this.stoppedElapsed;
      if (this.startedAt === null) return 0;
      const e = (this.now() - this.startedAt) / 1000;
      return this.limit ? Math.min(e, this.limit) : e;
    }

    remaining() {
      return this.limit ? Math.max(0, this.limit - this.elapsed()) : null;
    }

    display() {
      return format(this.limit ? Math.ceil(this.remaining()) : this.elapsed());
    }

    start() {
      if (this.handle !== null || this.stoppedElapsed !== null) return false;
      this.startedAt = this.now();
      this.handle = this._setInterval(() => this._tick(), 250);
      this.onTick(this);
      return true;
    }

    _tick() {
      if (this.handle === null) return;
      this.onTick(this);
      if (this.limit && this.elapsed() >= this.limit) {
        this.timedOut = true;
        this.stop();
        this.onTimeout(this);
      }
    }

    /** Stops the timer and freezes the elapsed time (seconds). Idempotent. */
    stop() {
      if (this.stoppedElapsed !== null) return this.stoppedElapsed;
      const e = this.elapsed();
      if (this.handle !== null) this._clearInterval(this.handle);
      this.handle = null;
      this.stoppedElapsed = e;
      return e;
    }
  }

  RT.Timer = Timer;
  RT.timerFormat = format;
})();
