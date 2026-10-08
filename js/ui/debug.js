/** debug.js — debug panel: everything needed to reproduce and audit an exercise. */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const { h } = RT.ui;

  function render(s) {
    const ex = s.exercise;
    const g = s.genInfo || {};
    const rows = [];
    if (ex) {
      rows.push(['Exercise ID', ex.id], ['Seed', ex.seed], ['Module / level', `${ex.module} / ${ex.difficulty}`], ['Kind', ex.kind || '—'],
        ['Constraints', String((ex.constraints || []).length)], ['Number of solutions', String(ex.meta.solutionCount)],
        ['Solver result', JSON.stringify(ex.meta.solverAnswer)], ['Expected answer', JSON.stringify(ex.correctAnswer)],
        ['Generation attempts', String(g.attempts)], ['Fallback used', g.usedFallback ? 'yes' : 'no'], ['Signature', ex.meta.signature || '—']);
    } else rows.push(['Error', g.message || 'unknown'], ['Attempts', String(g.attempts)]);
    const rej = (g.rejected || []).slice(0, 5).map((r) => `#${r.attempt}: ${r.errors.join('; ')}`);
    return h('details', { class: 'debug', open: true },
      h('summary', {}, 'Debug'),
      h('dl', { class: 'facts debug-facts' }, rows.map(([k, v]) => h('div', {}, h('dt', {}, k), h('dd', {}, v)))),
      ex ? h('details', {}, h('summary', {}, 'Constraints (JSON)'), h('pre', {}, JSON.stringify(ex.constraints, null, 1))) : null,
      rej.length ? h('details', {}, h('summary', {}, `Rejected candidates (${(g.rejected || []).length})`), h('pre', {}, rej.join('\n'))) : null,
      ex ? h('p', { class: 'muted' }, `Reproducir: ?module=${ex.module}&level=${ex.difficulty}&seed=${ex.seed}`) : null);
  }

  RT.ui.debug = { render };
})();
