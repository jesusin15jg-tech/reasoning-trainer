/** result.js — result screen: verdict, correct answer, step-by-step explanation, visual. */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const { h } = RT.ui;

  function answerText(ex, ans) {
    if (ans === null || ans === undefined) return '—';
    if (Array.isArray(ans)) return ans.length ? ans.join(', ') : '(ninguna fecha)';
    const o = ex.options.find((x) => x.id === ans);
    return o ? `${o.id}) ${o.text}` : String(ans);
  }

  function optionReview(ex, r) {
    const notes = (ex.explanation && ex.explanation.optionNotes) || {};
    return h('ul', { class: 'review', 'aria-label': 'Revisión de opciones' }, ex.options.map((o) => {
      const right = o.id === ex.correctAnswer;
      const mine = o.id === r.userAnswer;
      return h('li', { class: right ? 'rv-ok' : mine ? 'rv-bad' : '' },
        h('span', { class: 'rv-mark', 'aria-hidden': 'true' }, right ? '✓' : mine ? '✕' : '·'),
        h('div', {}, h('b', {}, `${o.id}) ${o.text}`), right ? h('span', { class: 'tag' }, ' correcta') : null, mine && !right ? h('span', { class: 'tag tag-bad' }, ' tu respuesta') : null,
          notes[o.id] ? h('small', {}, notes[o.id]) : null));
    }));
  }

  function render(app) {
    const s = app.state;
    const ex = s.exercise;
    const r = s.result;
    if (!ex || !r) return h('section', { class: 'screen' }, h('p', {}, 'Sin resultado.'));
    const verdict = r.timedOut ? { cls: 'bad', icon: '⏰', text: 'TIME OUT' } : r.correct ? { cls: 'ok', icon: '✓', text: 'CORRECT' } : { cls: 'bad', icon: '✕', text: 'INCORRECT' };
    const dates = Array.isArray(ex.correctAnswer);
    const expl = ex.explanation;

    return h('section', { class: 'screen result', 'aria-labelledby': 'h-res' },
      h('h1', { id: 'h-res', tabindex: '-1', class: 'verdict verdict-' + verdict.cls, role: 'status' }, h('span', { 'aria-hidden': 'true' }, verdict.icon + ' '), verdict.text),
      r.timedOut ? h('p', {}, 'Se agotó el tiempo: cuenta como respuesta incorrecta. Esta es la solución:') : null,
      h('dl', { class: 'facts' },
        h('div', {}, h('dt', {}, 'Tu respuesta'), h('dd', {}, answerText(ex, r.userAnswer))),
        h('div', {}, h('dt', {}, 'Respuesta correcta'), h('dd', {}, answerText(ex, ex.correctAnswer))),
        h('div', {}, h('dt', {}, 'Tiempo'), h('dd', {}, RT.ui.fmtTime(r.timeUsed) + ` (${RT.ui.fmtSeconds(r.timeUsed)})`)),
        h('div', {}, h('dt', {}, 'Puntos'), h('dd', {}, `+${r.score}`)),
        h('div', {}, h('dt', {}, 'Racha'), h('dd', {}, String(r.streak)))),
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'btn-next', onclick: () => app.next() }, 'Siguiente ejercicio'),
        h('button', { type: 'button', class: 'btn', onclick: () => app.goDashboard() }, 'Panel'),
        h('button', { type: 'button', class: 'btn', onclick: () => app.showStats() }, 'Estadísticas')),
      h('h2', {}, ex.question),
      dates ? null : optionReview(ex, r),
      h('h2', {}, 'Explicación paso a paso'),
      h('ol', { class: 'steps' }, expl.steps.map((st) => h('li', {}, st.title ? h('b', {}, st.title + ': ') : null, st.text,
        st.items && st.items.length ? h('ul', {}, st.items.map((i) => h('li', {}, i))) : null))),
      RT.ui.visuals.render(expl.visual),
      s.settings.debug && RT.ui.debug ? RT.ui.debug.render(s) : null);
  }

  RT.ui.result = { render };
})();
