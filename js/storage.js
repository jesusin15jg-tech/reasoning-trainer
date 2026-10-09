/**
 * storage.js — persistence layer. localStorage when available, in-memory otherwise.
 * Every access is wrapped in try/catch (private mode, blocked storage, quota).
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const KEY = 'reasoning-trainer.v1';
  const memory = {};

  const DEFAULT_SETTINGS = { module: 'positional', difficulty: 1, mode: 'training', trialLimit: 75, debug: false, lang: 'en' };

  function backend() {
    try {
      const ls = globalThis.localStorage;
      if (!ls) return null;
      const probe = '__rt_probe__';
      ls.setItem(probe, '1');
      ls.removeItem(probe);
      return ls;
    } catch (e) {
      return null;
    }
  }

  function emptyData() {
    return {
      version: 1,
      settings: Object.assign({}, DEFAULT_SETTINGS),
      stats: RT.statistics.emptyStats(),
      questionHistory: [],
    };
  }

  function isObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
  }

  /** Merge stored data over defaults; discards anything malformed instead of crashing. */
  function sanitize(raw) {
    const d = emptyData();
    if (!isObject(raw)) return d;
    if (isObject(raw.settings)) {
      const s = raw.settings;
      if (['positional', 'scheduling', 'calendar', 'inductive', 'english'].includes(s.module)) d.settings.module = s.module;
      if ([1, 2, 3].includes(s.difficulty)) d.settings.difficulty = s.difficulty;
      if (['training', 'trial'].includes(s.mode)) d.settings.mode = s.mode;
      if ([60, 75, 90].includes(s.trialLimit)) d.settings.trialLimit = s.trialLimit;
      if (typeof s.debug === 'boolean') d.settings.debug = s.debug;
      if (['en', 'es'].includes(s.lang)) d.settings.lang = s.lang;
    }
    if (isObject(raw.stats)) d.stats = RT.statistics.sanitizeStats(raw.stats);
    if (Array.isArray(raw.questionHistory)) d.questionHistory = raw.questionHistory.filter(isObject).slice(-200);
    return d;
  }

  function load() {
    const ls = backend();
    let text = null;
    try {
      text = ls ? ls.getItem(KEY) : memory[KEY] || null;
    } catch (e) {
      text = null;
    }
    if (!text) return emptyData();
    try {
      return sanitize(JSON.parse(text));
    } catch (e) {
      return emptyData();
    }
  }

  function save(data) {
    const text = JSON.stringify(data);
    const ls = backend();
    try {
      if (ls) ls.setItem(KEY, text);
      else memory[KEY] = text;
      return true;
    } catch (e) {
      memory[KEY] = text;
      return false;
    }
  }

  /** Resets statistics + history but keeps the user's settings. */
  function resetStats() {
    const d = load();
    d.stats = RT.statistics.emptyStats();
    d.questionHistory = [];
    save(d);
    return d;
  }

  RT.storage = { KEY, DEFAULT_SETTINGS, load, save, resetStats, emptyData, sanitize, available: () => !!backend() };
})();
