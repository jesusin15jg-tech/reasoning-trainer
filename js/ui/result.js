/** result.js — result screen: verdict, correct answer, step-by-step explanation, visual. */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const { h } = RT.ui;
  const t = (k, p) => RT.i18n.t(k, p);

  const answerTypeOf = (ex) => ex.answerType || RT.modules[ex.module].answerType;

  function figureOf(ex, key, label) {
    return RT.figuresSvg.render(ex.data.figure, RT.figures.parseKey(key), { size: 110, label: label + '. ' + RT.figuresSvg.describe(ex.data.figure, RT.figures.parseKey(key)) });
  }

  function answerNode(ex, ans, who) {
    if (ans === null || ans === undefined) return '—';
    if (answerTypeOf(ex) === 'frame') return figureOf(ex, ans, who);
    if (Array.isArray(ans)) return ans.length ? ans.join(', ') : t('res.nodates');
    const o = ex.options.find((x) => x.id === ans);
    if (o && o.payload && o.payload.frame) return h('span', { class: 'res-fig' }, h('b', {}, o.id + ') '), RT.figuresSvg.render(ex.data.figure, o.payload.frame, { size: 84, label: t('opt.label', { id: o.id }) }));
    return o ? `${o.id}) ${o.text}` : String(ans);
  }

  function optionReview(ex, r) {
    const notes = (ex.explanation && ex.explanation.optionNotes) || {};
    return h('ul', { class: 'review', 'aria-label': t('res.review') }, ex.options.map((o) => {
      const right = o.id === ex.correctAnswer;
      const mine = o.id === r.userAnswer;
      const isFig = o.payload && o.payload.frame;
      return h('li', { class: right ? 'rv-ok' : mine ? 'rv-bad' : '' },
        h('span', { class: 'rv-mark', 'aria-hidden': 'true' }, right ? '✓' : mine ? '✕' : '·'),
        h('div', { class: 'rv-body' },
          isFig ? h('div', { class: 'rv-fig' }, h('b', {}, o.id + ')'), RT.figuresSvg.render(ex.data.figure, o.payload.frame, { size: 84, label: t('opt.label', { id: o.id }) + '. ' + RT.figuresSvg.describe(ex.data.figure, o.payload.frame) }))
            : h('b', {}, `${o.id}) ${o.text}`),
          right ? h('span', { class: 'tag' }, ' ' + t('res.tag.right')) : null, mine && !right ? h('span', { class: 'tag tag-bad' }, ' ' + t('res.tag.mine')) : null,
          notes[o.id] ? h('small', {}, notes[o.id]) : null));
    }));
  }

  function render(app) {
    const s = app.state;
    const ex = s.exercise;
    const r = s.result;
    if (!ex || !r) return h('section', { class: 'screen' }, h('p', {}, t('res.none')));
    const verdict = r.timedOut ? { cls: 'bad', icon: '⏰', text: t('res.timeout') } : r.correct ? { cls: 'ok', icon: '✓', text: t('res.correct') } : { cls: 'bad', icon: '✕', text: t('res.incorrect') };
    const type = answerTypeOf(ex);
    const expl = ex.explanation;

    return h('section', { class: 'screen result', 'aria-labelledby': 'h-res' },
      h('h1', { id: 'h-res', tabindex: '-1', class: 'verdict verdict-' + verdict.cls, role: 'status' }, h('span', { 'aria-hidden': 'true' }, verdict.icon + ' '), verdict.text),
      r.timedOut ? h('p', {}, t('res.timeout.text')) : null,
      h('dl', { class: 'facts' },
        h('div', {}, h('dt', {}, t('res.yours')), h('dd', {}, answerNode(ex, r.userAnswer, t('res.yours')))),
        h('div', {}, h('dt', {}, t('res.right')), h('dd', {}, answerNode(ex, ex.correctAnswer, t('res.right')))),
        h('div', {}, h('dt', {}, t('res.time')), h('dd', {}, RT.ui.fmtTime(r.timeUsed) + ` (${RT.ui.fmtSeconds(r.timeUsed)})`)),
        h('div', {}, h('dt', {}, t('res.points')), h('dd', {}, `+${r.score}`)),
        h('div', {}, h('dt', {}, t('res.streak')), h('dd', {}, String(r.streak)))),
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'btn-next', onclick: () => app.next() }, t('res.next')),
        h('button', { type: 'button', class: 'btn', onclick: () => app.goDashboard() }, t('res.dash')),
        h('button', { type: 'button', class: 'btn', onclick: () => app.showStats() }, t('res.stats'))),
      h('h2', {}, ex.question),
      type === 'option' ? optionReview(ex, r) : null,
      h('h2', {}, t('res.expl')),
      h('ol', { class: 'steps' }, expl.steps.map((st) => h('li', {}, st.title ? h('b', {}, st.title + ': ') : null, st.text,
        st.items && st.items.length ? h('ul', {}, st.items.map((i) => h('li', {}, i))) : null))),
      RT.ui.visuals.render(expl.visual),
      s.settings.debug && RT.ui.debug ? RT.ui.debug.render(s) : null);
  }

  RT.ui.result = { render };
})();
