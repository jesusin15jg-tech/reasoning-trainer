/** visuals.js — timeline, order, calendar, English and figure-sequence renderers. */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const { h } = RT.ui;
  const t = (k, p) => RT.i18n.t(k, p);
  const dow = (i) => t('dow.short.' + i);
  const dowLong = (i) => t('dow.long.' + i);
  const hm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  const CLS = ['task', 'other', 'maint', 'crew', 'free', 'short', 'answer', 'conflict'];

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
    for (let tk = Math.ceil(v.dayStart / 60) * 60; tk <= v.dayEnd; tk += 60) ticks.push(tk);
    const used = new Set();
    const rows = v.rows.map((r) => {
      const { lane, count } = lanes(r.blocks);
      const blocks = r.blocks.map((b, i) => {
        used.add(b.cls);
        const what = t('tl.' + b.cls);
        return h('div', {
          class: 'tl-block tl-' + b.cls, role: 'img',
          style: { left: pct(b.start) + '%', width: Math.max(0.5, pct(b.end) - pct(b.start)) + '%', top: lane[i] * 26 + 'px' },
          title: `${b.label || ''} ${hm(b.start)}–${hm(b.end)}`.trim(),
          'aria-label': `${r.label}: ${b.label || ''} ${hm(b.start)} – ${hm(b.end)} (${what})`,
        }, h('span', {}, b.label || ''));
      });
      return h('div', { class: 'tl-row' },
        h('div', { class: 'tl-label' }, r.label),
        h('div', { class: 'tl-track', style: { height: count * 26 + 4 + 'px' } }, ticks.map((tk) => h('i', { class: 'tl-grid', style: { left: pct(tk) + '%' } })), blocks));
    });
    const axis = h('div', { class: 'tl-row tl-axis' }, h('div', { class: 'tl-label' }, ''),
      h('div', { class: 'tl-track tl-axis-track' }, ticks.map((tk) => h('span', { style: { left: pct(tk) + '%' } }, hm(tk)))));
    const legend = h('ul', { class: 'legend' }, CLS.filter((c) => used.has(c)).map((c) => h('li', {}, h('i', { class: 'tl-sw tl-' + c }), t('tl.' + c))));
    return h('figure', { class: 'visual timeline', 'aria-label': t('vis.timeline') }, rows, axis, legend);
  }

  function order(v) {
    return h('figure', { class: 'visual order', 'aria-label': t('vis.order') }, v.rows.map((r) =>
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
      const blockNames = bl.map((b) => (b === 'weekend' ? t('cal.weekend') : b));
      cells.push(h('div', { class: 'cal-cell ' + (ok ? 'cal-ok' : 'cal-no'), role: 'gridcell', 'aria-label': t('cal.cell.aria', { d, state: ok ? t('cal.allfree') : t('cal.blocked', { who: blockNames.join(', ') }) }) },
        h('b', {}, d, ok ? ' ✓' : ''), hol ? h('small', {}, t('cal.holiday')) : null, blockNames.length ? h('small', {}, blockNames.join(', ')) : null));
    }
    return h('figure', { class: 'visual calendar', 'aria-label': t('vis.calendar') },
      h('div', { class: 'cal-grid', role: 'grid' }, [0, 1, 2, 3, 4, 5, 6].map((i) => h('div', { class: 'cal-head', role: 'columnheader' }, dow(i))), cells),
      h('p', { class: 'muted' }, t('cal.caption')));
  }

  /** Interactive calendar (exercise screen). `selected` is a Set of day numbers. */
  function calendarPicker(base, selected, onToggle) {
    const cells = [];
    for (let i = 0; i < base.startDow; i++) cells.push(h('div', { class: 'cal-cell cal-empty', 'aria-hidden': 'true' }));
    for (let d = 1; d <= base.days; d++) {
      const on = selected.has(d);
      const di = (base.startDow + d - 1) % 7;
      cells.push(h('button', {
        type: 'button', class: 'cal-cell cal-pick' + (on ? ' cal-sel' : ''), 'aria-pressed': on ? 'true' : 'false',
        'aria-label': t('cal.pick.aria', { d, dow: dowLong(di) }) + (on ? ', ' + t('cal.selected') : ''), 'data-day': d,
        onclick: () => onToggle(d),
      }, h('b', {}, d), h('small', {}, on ? '✓' : dow(di))));
    }
    return h('div', { class: 'cal-grid', role: 'group', 'aria-label': t('cal.picker') },
      [0, 1, 2, 3, 4, 5, 6].map((i) => h('div', { class: 'cal-head', 'aria-hidden': 'true' }, dow(i))), cells);
  }

  function english(v) {
    return h('figure', { class: 'visual english' },
      v.completed ? h('p', { class: 'eng-sentence' }, v.completed) : null,
      v.highlight ? h('p', {}, t('eng.answer') + ' ', h('mark', {}, '✓ ' + v.highlight)) : null,
      v.rule ? h('p', { class: 'muted' }, v.rule) : null,
      v.diff ? h('p', { class: 'muted' }, v.diff) : null);
  }

  /* ---------------------------- figure sequences ---------------------------- */

  function seqItem(label, child, cls) {
    return h('li', { class: 'seq-item ' + (cls || '') }, child, h('span', { class: 'seq-n' }, label));
  }

  /** Exercise statement: the visible figures, then a "?" slot (or a "?" in the middle). */
  function sequenceStrip(d) {
    const fig = d.figure;
    const hole = h('div', { class: 'seq-hole', role: 'img', 'aria-label': t('seq.hole.aria') }, '?');
    const items = d.visible.map((f, i) => (f ? seqItem(String(i + 1), RT.figuresSvg.render(fig, f, { size: 96, label: t('seq.figure', { n: i + 1 }) + '. ' + RT.figuresSvg.describe(fig, f) }))
      : seqItem(String(i + 1), hole, 'seq-missing')));
    if (d.visible.length === d.target) items.push(seqItem(String(d.target + 1), hole, 'seq-missing'));
    return h('div', { class: 'sequence' }, h('ol', { class: 'seq', 'aria-label': t('seq.label') }, items), RT.figuresSvg.legend());
  }

  /** Explanation visual: the whole sequence with the solved figure highlighted. */
  function sequence(v) {
    const fig = v.figure;
    const frames = v.frames.slice();
    if (frames.length === v.hole) frames.push(null);
    frames[v.hole] = v.answer;
    return h('figure', { class: 'visual sequence-vis', 'aria-label': t('vis.sequence') },
      h('ol', { class: 'seq' }, frames.map((f, i) => seqItem(String(i + 1), RT.figuresSvg.render(fig, f, { size: 92, label: t('seq.figure', { n: i + 1 }) + '. ' + RT.figuresSvg.describe(fig, f) }), i === v.hole ? 'seq-answer' : ''))),
      h('p', { class: 'muted' }, t('seq.answer.note', { n: v.hole + 1 })), RT.figuresSvg.legend());
  }

  function render(v) {
    if (!v) return null;
    switch (v.type) {
      case 'timeline': return timeline(v);
      case 'order': return order(v);
      case 'calendar': return calendarStatic(v);
      case 'english': return english(v);
      case 'sequence': return sequence(v);
      default: return null;
    }
  }

  RT.ui.visuals = { render, timeline, order, calendarStatic, calendarPicker, english, sequence, sequenceStrip };
})();
