/** exercise.js — exercise screen: header, statement, answer area, CHECK ANSWER. */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const { h, LETTER } = RT.ui;
  const F = RT.figures;
  const t = (k, p) => RT.i18n.t(k, p);

  // UI-local selection (not part of the persisted state)
  const sel = { exId: null, option: null, dates: new Set(), frame: null, brush: 1 };

  const answerTypeOf = (ex) => ex.answerType || RT.modules[ex.module].answerType;

  function resetSelection(ex) {
    if (sel.exId !== ex.id + ex.createdAt) {
      sel.exId = ex.id + ex.createdAt;
      sel.option = null;
      sel.dates = new Set();
      sel.frame = ex.data.figure ? F.blank(F.get(ex.data.figure).n) : null;
      sel.brush = 1;
    }
  }

  function currentAnswer(ex) {
    const type = answerTypeOf(ex);
    if (type === 'dates') return [...sel.dates].sort((a, b) => a - b);
    if (type === 'frame') return F.frameKey(sel.frame);
    return sel.option;
  }
  const hasAnswer = (ex) => (answerTypeOf(ex) === 'option' ? sel.option !== null : true); // an empty date set / blank figure is a legal answer

  function statement(ex) {
    const d = ex.data;
    const base = d.base || {};
    return h('div', { class: 'statement' },
      d.instruction ? h('p', { class: 'instr' }, d.instruction) : null,
      d.intro ? h('p', {}, d.intro) : null,
      d.names ? h('p', { class: 'chips', 'aria-label': t('ex.elements') }, d.names.map((n) => h('span', { class: 'chip' }, n))) : null,
      base.names && !d.names ? h('p', { class: 'chips', 'aria-label': t('ex.people') }, base.names.map((n) => h('span', { class: 'chip' }, n))) : null,
      d.passage ? h('blockquote', { class: 'passage' }, d.passage.split(/\n+/).map((p) => h('p', {}, p))) : null,
      d.figure ? RT.ui.visuals.sequenceStrip(d) : null,
      d.rules && d.rules.length ? h('div', {}, h('h3', {}, t('ex.rules')), h('ol', { class: 'rules' }, d.rules.map((r) => h('li', {}, r)))) : null);
  }

  function optionsArea(ex, rerender) {
    return h('fieldset', { class: 'answers' + (ex.options[0].payload && ex.options[0].payload.frame ? ' answers-figs' : '') },
      h('legend', { class: 'sr-only' }, t('ex.options.legend')),
      ex.options.map((o) => {
        const id = 'opt-' + o.id;
        const isFig = o.payload && o.payload.frame;
        return h('label', { class: 'answer' + (sel.option === o.id ? ' is-on' : '') + (isFig ? ' answer-fig' : ''), for: id },
          h('input', { type: 'radio', name: 'answer', id, value: o.id, checked: sel.option === o.id, onchange: () => { sel.option = o.id; rerender(); } }),
          h('span', { class: 'answer-letter', 'aria-hidden': 'true' }, o.id),
          isFig ? RT.figuresSvg.render(ex.data.figure, o.payload.frame, { size: 104, label: t('opt.label', { id: o.id }) + '. ' + RT.figuresSvg.describe(ex.data.figure, o.payload.frame) })
            : h('span', { class: 'answer-text' }, o.text));
      }));
  }

  function datesArea(ex, rerender) {
    const picker = RT.ui.visuals.calendarPicker(ex.data.base, sel.dates, (d) => {
      sel.dates.has(d) ? sel.dates.delete(d) : sel.dates.add(d);
      rerender({ day: d });
    });
    const list = [...sel.dates].sort((a, b) => a - b);
    return h('div', { class: 'answers' },
      picker,
      h('p', { class: 'muted', 'aria-live': 'polite' }, list.length ? t('ex.dates.selected', { count: list.length, list: list.join(', ') }) : t('ex.dates.none')),
      h('button', { type: 'button', class: 'btn btn-quiet', onclick: () => { sel.dates = new Set(); rerender(); } }, t('ex.dates.clear')));
  }

  /** Free painting of the next figure: pick a brush, then click (or Enter/Space) on cells. */
  function paintArea(ex, rerender) {
    const brushes = [0, 1, 2].map((b) => h('label', { class: 'brush' + (sel.brush === b ? ' is-on' : ''), for: 'brush-' + b },
      h('input', { type: 'radio', name: 'brush', id: 'brush-' + b, value: b, checked: sel.brush === b, onchange: () => { sel.brush = b; rerender({ brush: b }); } }),
      RT.figuresSvg.swatch(b), h('span', {}, t('brush.' + b))));
    const fig = RT.figuresSvg.render(ex.data.figure, sel.frame, {
      size: 260, onCell: (i) => { sel.frame = sel.frame.slice(); sel.frame[i] = sel.brush; rerender({ cell: i }); },
    });
    return h('div', { class: 'answers paint' },
      h('p', { class: 'muted' }, t('paint.help')),
      h('fieldset', { class: 'brushes' }, h('legend', {}, t('paint.brush')), brushes),
      h('div', { class: 'paint-board' }, fig),
      h('button', { type: 'button', class: 'btn btn-quiet', onclick: () => { sel.frame = F.blank(sel.frame.length); rerender(); } }, t('paint.clear')));
  }

  function render(app) {
    const s = app.state;
    if (s.error || !s.exercise) {
      return h('section', { class: 'screen', 'aria-labelledby': 'h-err' },
        h('h1', { id: 'h-err', tabindex: '-1' }, t('ex.error.title')),
        h('p', { class: 'alert', role: 'alert' }, t('err.generic')),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn btn-primary', onclick: () => app.startExercise() }, t('ex.retry')),
          h('button', { type: 'button', class: 'btn', onclick: () => app.goDashboard() }, t('ex.back'))),
        s.settings.debug && RT.ui.debug ? RT.ui.debug.render(s) : null);
    }
    const ex = s.exercise;
    resetSelection(ex);
    const trial = s.settings.mode === 'trial';
    const timerEl = h('span', { class: 'timer', id: 'timer', role: 'timer', 'aria-label': trial ? t('ex.timer.left.aria') : t('ex.timer.elapsed.aria') }, s.timer.display());
    const bar = trial ? h('div', { class: 'timebar', 'aria-hidden': 'true' }, h('i', { id: 'timebar' })) : null;

    const root = h('section', { class: 'screen exercise', 'aria-labelledby': 'h-ex' });
    function paint(focus) {
      RT.ui.clear(root);
      const type = answerTypeOf(ex);
      root.append(...[
        h('header', { class: 'ex-head' },
          h('div', {},
            h('h1', { id: 'h-ex', tabindex: '-1' }, RT.ui.moduleLabel(ex.module)),
            h('p', { class: 'meta' }, h('span', { class: 'badge' }, RT.ui.levelName(ex.difficulty)), ' ' + t('ex.number', { n: s.questionNumber }), trial ? ' · ' + t('ex.mode.trial', { s: s.settings.trialLimit }) : ' · ' + t('ex.mode.training'))),
          h('div', { class: 'timer-box' }, h('span', { class: 'muted' }, trial ? t('ex.timer.left') : t('ex.timer.elapsed')), timerEl)),
        bar,
        statement(ex),
        h('h2', { class: 'question', id: 'q' }, ex.question),
        type === 'dates' ? datesArea(ex, paint) : type === 'frame' ? paintArea(ex, paint) : optionsArea(ex, paint),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'btn-check', disabled: !hasAnswer(ex), onclick: () => app.submit(currentAnswer(ex)) }, t('ex.check')),
          h('button', { type: 'button', class: 'btn btn-quiet', onclick: () => { if (confirm(t('ex.quit.confirm'))) app.goDashboard(); } }, t('ex.quit'))),
        s.settings.debug && RT.ui.debug ? RT.ui.debug.render(s) : null].filter(Boolean));
      const tm = root.querySelector('#timer');
      if (tm) tm.textContent = s.timer.display();
      app.ui.timerEl = tm;
      app.ui.barEl = root.querySelector('#timebar');
      if (focus && focus.day) { const b = root.querySelector(`[data-day="${focus.day}"]`); if (b) b.focus(); }
      else if (focus && focus.cell !== undefined) { const c = root.querySelector(`[data-cell="${focus.cell}"]`); if (c) c.focus(); }
      else if (type === 'option' && sel.option) { const r = root.querySelector('input[name=answer]:checked'); if (r) r.focus(); }
      else if (focus && focus.brush !== undefined) { const r = root.querySelector('#brush-' + focus.brush); if (r) r.focus(); }
    }
    paint();
    return root;
  }

  /** Keyboard: A–E picks an option; Enter checks the answer when something is selected. */
  function onKey(app, e) {
    const s = app.state;
    if (s.screen !== 'exercise' || !s.exercise || e.ctrlKey || e.metaKey || e.altKey) return;
    const ex = s.exercise;
    if (answerTypeOf(ex) === 'option') {
      const i = LETTER.indexOf(e.key.toUpperCase());
      if (e.key.length === 1 && i >= 0 && ex.options[i]) {
        const r = document.getElementById('opt-' + ex.options[i].id);
        if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
        return;
      }
    }
    if (answerTypeOf(ex) === 'frame' && ['0', '1', '2'].includes(e.key) && !(e.target && e.target.tagName === 'INPUT' && e.target.type === 'text')) {
      const r = document.getElementById('brush-' + e.key);
      if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
      return;
    }
    const tag = e.target && e.target.tagName;
    const onOperable = tag === 'BUTTON' || (e.target && e.target.getAttribute && e.target.getAttribute('role') === 'button');
    if (e.key === 'Enter' && hasAnswer(ex) && !onOperable) {
      e.preventDefault();
      app.submit(currentAnswer(ex));
    }
  }

  RT.ui.exercise = { render, onKey, _sel: sel };
})();
