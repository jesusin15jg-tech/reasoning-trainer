/** dom.js — tiny hyperscript helper. All text goes through textContent (no innerHTML => no injection). */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  RT.ui = RT.ui || {};

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'open') { if (v) el.setAttribute(k, ''); if (k !== 'open') el[k] = !!v; }
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    const add = (c) => {
      if (c === null || c === undefined || c === false) return;
      if (Array.isArray(c)) return c.forEach(add);
      el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
    };
    kids.forEach(add);
    return el;
  }

  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  const LETTER = ['A', 'B', 'C', 'D', 'E'];

  RT.ui.h = h;
  RT.ui.clear = clear;
  RT.ui.LETTER = LETTER;
  RT.ui.fmtTime = (s) => RT.timerFormat(s);
  RT.ui.fmtSeconds = (s) => (s < 10 ? s.toFixed(1) : Math.round(s)) + ' s';
  RT.ui.levelName = (d) => RT.difficulty.level(d).name;
  RT.ui.moduleLabel = (m) => (RT.modules[m] ? RT.modules[m].label : m);
})();
