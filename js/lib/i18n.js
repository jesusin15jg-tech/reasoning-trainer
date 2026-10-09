/**
 * i18n.js — tiny internationalisation library (EN / ES), no dependencies.
 *
 *   RT.i18n.t('key', {n: 3})        -> message with {n} interpolation (falls back to English, then to the key)
 *   RT.i18n.pick(en, es)            -> inline pair, used where text is assembled from data (generators)
 *   RT.i18n.withLang('es', fn)      -> runs fn with another language active, then restores it
 *   RT.i18n.add('en', {...})        -> registers messages (dictionaries live in i18n-en.js / i18n-es.js)
 *
 * A message value may be a string, or [singular, plural] chosen by params.count (count === 1 -> singular).
 * The current language is read at GENERATION time: an exercise is built in one language and carries `ex.lang`.
 * Language never influences random draws, so the same seed gives the same exercise in both languages.
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const LANGS = ['en', 'es'];
  const DEFAULT_LANG = 'en';
  const dict = { en: {}, es: {} };
  const missing = new Set();
  let current = DEFAULT_LANG;

  const isLang = (l) => LANGS.includes(l);

  function add(lang, messages) {
    if (!isLang(lang)) throw new Error('i18n: unknown language ' + lang);
    Object.assign(dict[lang], messages);
  }

  function format(msg, params) {
    if (Array.isArray(msg)) msg = params && params.count === 1 ? msg[0] : msg[1];
    if (typeof msg !== 'string') return msg;
    return msg.replace(/\{(\w+)\}/g, (m, k) => (params && params[k] !== undefined ? String(params[k]) : m));
  }

  function t(key, params) {
    let msg = dict[current][key];
    if (msg === undefined) {
      missing.add(`${current}:${key}`);
      msg = dict.en[key];
    }
    if (msg === undefined) {
      missing.add(`en:${key}`);
      return key;
    }
    return format(msg, params);
  }

  const has = (key, lang) => dict[lang || current][key] !== undefined;
  /** English text assembled with guillemets by shared helpers is shown with curly quotes. */
  const curly = (s) => (typeof s === 'string' ? s.replace(/«/g, '“').replace(/»/g, '”') : s);
  /** quote a fragment for the current language: «x» in Spanish, “x” in English */
  const q = (s) => (current === 'es' ? '«' + s + '»' : '“' + s + '”');
  const pick = (en, es) => (current === 'es' ? es : curly(en));

  function setLang(l) {
    if (isLang(l)) current = l;
    return current;
  }

  function withLang(l, fn) {
    const prev = current;
    current = isLang(l) ? l : current;
    try {
      return fn();
    } finally {
      current = prev;
    }
  }

  /** Joins ['a','b','c'] as "a, b and c" / "a, b y c". */
  function list(items, conj) {
    const w = conj || (current === 'es' ? 'y' : 'and');
    if (items.length <= 1) return items.join('');
    return items.slice(0, -1).join(', ') + ' ' + w + ' ' + items[items.length - 1];
  }

  /** Detects the browser language, falling back to English. */
  function detect() {
    try {
      const n = (globalThis.navigator && (navigator.language || '')).slice(0, 2).toLowerCase();
      return isLang(n) ? n : DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;
    }
  }

  RT.i18n = {
    LANGS, DEFAULT_LANG, add, t, has, pick, q, list, setLang, withLang, detect, isLang,
    get lang() { return current; },
    keys: (lang) => Object.keys(dict[lang]),
    missing: () => [...missing],
  };
  RT.t = t;
})();
