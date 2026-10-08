/**
 * random.js — seeded pseudo-random generator.
 * Same seed => same sequence, so any exercise can be reproduced from its seed.
 * Classic scripts (no ES modules) so index.html works when opened from file://.
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});

  // xmur3: string -> 32-bit seed generator
  function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }

  // mulberry32: small, fast, good-enough PRNG
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class RNG {
    constructor(seed) {
      this.seed = String(seed);
      this._next = mulberry32(hashSeed(this.seed)());
    }
    /** float in [0,1) */
    next() {
      return this._next();
    }
    /** integer in [min,max] (inclusive) */
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    }
    /** integer multiple of `step` in [min,max] */
    step(min, max, step) {
      return min + step * this.int(0, Math.floor((max - min) / step));
    }
    chance(p) {
      return this.next() < p;
    }
    pick(arr) {
      if (!arr.length) throw new Error('RNG.pick: empty array');
      return arr[Math.floor(this.next() * arr.length)];
    }
    /** Fisher–Yates; returns a new array */
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    sample(arr, n) {
      return this.shuffle(arr).slice(0, n);
    }
    /** pick from [[value, weight], ...] */
    weighted(pairs) {
      const total = pairs.reduce((s, p) => s + p[1], 0);
      let r = this.next() * total;
      for (const [v, w] of pairs) {
        if ((r -= w) < 0) return v;
      }
      return pairs[pairs.length - 1][0];
    }
    /** independent sub-stream derived from this seed + a label */
    child(label) {
      return new RNG(this.seed + ':' + label);
    }
  }

  let counter = 0;
  /** Fresh base seed for a new exercise (not reproducible by design; the seed itself is). */
  function newSeed() {
    counter = (counter + 1) % 46656;
    const a = Math.floor(Math.random() * 2176782336).toString(36).padStart(6, '0');
    return a + counter.toString(36);
  }

  RT.RNG = RNG;
  RT.newSeed = newSeed;
  RT.hashString = (s) => hashSeed(String(s))();
})();
