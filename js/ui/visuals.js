/** visuals.js — timeline, order, calendar and English renderers (used in the exercise and result screens). */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const { h } = RT.ui;
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const DOW_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const CLS_LABEL = { task: 'Tarea en la máquina', other: 'Otra máquina', maint: 'Mantenimiento', crew: 'Cuadrilla no disponible', free: 'Hueco libre válido', short: 'Hueco demasiado corto', answer: 'Respuesta', conflict: 'Conflicto / solape' };

  function lanes(blocks) {
    const sorted = blocks.map((b, i) => ({ b, i })).sort((x, y) => x.b.start - y.b.start || x.b.end - y.b.end);
    const ends = [];
    const lane = new Array(blocks.length);
    for (const { b, i } of sorted) {
      let l = ends.findIndex((e) => e <= b.start);
      if (l < 0) { l = ends.length; ends.push(0); }
      ends[l] = b.end;
      lane[i] = l;
    }
    return { lane, count: Math.max(1, ends.length) };
  }

  function timeline(v) {
    const span = v.dayEnd - v.dayStart;
    const pct = (m) => ((m - v.dayStart) / span) * 100;
    const ticks = [];
    for (let t = Math.ceil(v.dayStart / 60) * 60; t <= v.dayEnd; t += 60) ticks.push(t);
    const used = new Set();
    const rows = v.rows.map((r) => {
      const { lane, count } = lanes(r.blocks);
      const blocks = r.blocks.map((b, i) => {
        used.add(b.cls);
        return h('div', {
          class: 'tl-block tl-' + b.cls, role: 'img',
          style: { left: pct(b.start) + '%', width: Math.max(0.5, pct(b.end) - pct(b.start)) + '%', top: lane[i] * 26 + 'px' },
          title: `${b.label || ''} ${hm(b.start)}–${hm(b.end)}`.trim(),
          'aria-label': `${r.label}: ${b.label || ''} ${hm(b.start)} a ${hm(b.end)} (${CLS_LABEL[b.cls] || b.cls})`,
        }, h('span', {}, b.label || ''));
      });
      return h('div', { class: 'tl-row' },
        h('div', { class: 'tl-label' }, r.label),
        h('div', { class: 'tl-track', style: { height: count * 26 + 4 + 'px' } }, ticks.map((t) => h('i', { class: 'tl-grid', style: { left: pct(t) + '%' } })), blocks));
    });
    const axis = h('div', { class: 'tl-row tl-axis' }, h('div', { class: 'tl-label' }, ''),
      h('div', { class: 'tl-track tl-axis-track' }, ticks.map((t) => h('span', { style: { left: pct(t) + '%' } }, hm(t)))));
    const legend = h('ul', { class: 'legend' }, [...used].filter((c) => CLS_LABEL[c]).map((c) => h('li', {}, h('i', { class: 'tl-sw tl-' + c }), CLS_LABEL[c])));
    return h('figure', { class: 'visual timeline', 'aria-label': 'Línea de tiempo de la solución' }, rows, axis, legend);
  }

  function order(v) {
    return h('figure', { class: 'visual order', 'aria-label': 'Orden de elementos' }, v.rows.map((r) =>
      h('div', { class: 'order-row' }, h('span', { class: 'order-label' }, r.label),
        h('ol', {}, r.order.map((n, i) => h('li', {}, h('b', {}, i + 1), ' ', n))))));
  }

  /** Static calendar for explanations (solution + blockers). */
  function calendarStatic(v) {
    const cells = [];
    for (let i = 0; i < v.startDow; i++) cells.push(h('div', { class: 'cal-cell cal-empty', 'aria-hidden': 'true' }));
    for (let d = 1; d <= v.days; d++) {
      const ok = v.solution.includes(d);
      const bl = v.blockers[d] || [];
      const hol = v.holidays.includes(d);
      cells.push(h('div', { class: 'cal-cell ' + (ok ? 'cal-ok' : 'cal-no'), role: 'gridcell', 'aria-label': `Día ${d}: ${ok ? 'todos disponibles' : 'no disponible: ' + bl.join(', ')}` },
        h('b', {}, d, ok ? ' ✓' : ''), hol ? h('small', {}, 'festivo') : null, bl.length ? h('small', {}, bl.join(', ')) : null));
    }
    return h('figure', { class: 'visual calendar', 'aria-label': 'Calendario con la solución' },
      h('div', { class: 'cal-grid', role: 'grid' }, DOW.map((n) => h('div', { class: 'cal-head', role: 'columnheader' }, n)), cells),
      h('p', { class: 'muted' }, '✓ = todos disponibles · el texto pequeño indica quién o qué bloquea cada día.'));
  }

  /** Interactive calendar (exercise screen). `selected` is a Set of day numbers. */
  function calendarPicker(base, selected, onToggle) {
    const cells = [];
    for (let i = 0; i < base.startDow; i++) cells.push(h('div', { class: 'cal-cell cal-empty', 'aria-hidden': 'true' }));
    for (let d = 1; d <= base.days; d++) {
      const on = selected.has(d);
      const dow = (base.startDow + d - 1) % 7;
      cells.push(h('button', {
        type: 'button', class: 'cal-cell cal-pick' + (on ? ' cal-sel' : ''), 'aria-pressed': on ? 'true' : 'false',
        'aria-label': `Day ${d}, ${DOW_LONG[dow]}${on ? ', selected' : ''}`, 'data-day': d,
        onclick: () => onToggle(d),
      }, h('b', {}, d), h('small', {}, on ? '✓' : DOW[dow])));
    }
    return h('div', { class: 'cal-grid', role: 'group', 'aria-label': 'Select every date when the whole team is available' },
      DOW.map((n) => h('div', { class: 'cal-head', 'aria-hidden': 'true' }, n)), cells);
  }

  function english(v) {
    return h('figure', { class: 'visual english' },
      v.completed ? h('p', { class: 'eng-sentence' }, v.completed) : null,
      v.highlight ? h('p', {}, 'Respuesta: ', h('mark', {}, '✓ ' + v.highlight)) : null,
      v.rule ? h('p', { class: 'muted' }, v.rule) : null,
      v.diff ? h('p', { class: 'muted' }, v.diff) : null);
  }

  function render(v) {
    if (!v) return null;
    switch (v.type) {
      case 'timeline': return timeline(v);
      case 'order': return order(v);
      case 'calendar': return calendarStatic(v);
      case 'english': return english(v);
      default: return null;
    }
  }

  RT.ui.visuals = { render, timeline, order, calendarStatic, calendarPicker, english };
})();
