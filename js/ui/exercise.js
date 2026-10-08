/** exercise.js — exercise screen: header, statement, answer area, CHECK ANSWER. */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const { h, LETTER } = RT.ui;

  // UI-local selection (not part of the persisted state)
  const sel = { exId: null, option: null, dates: new Set() };

  function resetSelection(ex) {
    if (sel.exId !== ex.id + ex.createdAt) {
      sel.exId = ex.id + ex.createdAt;
      sel.option = null;
      sel.dates = new Set();
    }
  }

  function currentAnswer(ex) {
    const t = RT.modules[ex.module].answerType;
    if (t === 'dates') return [...sel.dates].sort((a, b) => a - b);
    return sel.option;
  }
  const hasAnswer = (ex) => (RT.modules[ex.module].answerType === 'dates' ? true : sel.option !== null); // empty date set is a legal answer

  function statement(ex) {
    const d = ex.data;
    const base = d.base || {};
    return h('div', { class: 'statement' },
      d.instruction ? h('p', { class: 'instr' }, d.instruction) : null,
      d.intro ? h('p', {}, d.intro) : null,
      d.names ? h('p', { class: 'chips', 'aria-label': 'Elementos' }, d.names.map((n) => h('span', { class: 'chip' }, n))) : null,
      base.names && !d.names ? h('p', { class: 'chips', 'aria-label': 'Personas' }, base.names.map((n) => h('span', { class: 'chip' }, n))) : null,
      d.passage ? h('blockquote', { class: 'passage' }, d.passage.split(/\n+/).map((p) => h('p', {}, p))) : null,
      d.rules && d.rules.length ? h('div', {}, h('h3', {}, 'Reglas'), h('ol', { class: 'rules' }, d.rules.map((r) => h('li', {}, r)))) : null);
  }

  function optionsArea(ex, rerender) {
    return h('fieldset', { class: 'answers' },
      h('legend', { class: 'sr-only' }, 'Opciones de respuesta'),
      ex.options.map((o) => {
        const id = 'opt-' + o.id;
        return h('label', { class: 'answer' + (sel.option === o.id ? ' is-on' : ''), for: id },
          h('input', { type: 'radio', name: 'answer', id, value: o.id, checked: sel.option === o.id, onchange: () => { sel.option = o.id; rerender(); } }),
          h('span', { class: 'answer-letter', 'aria-hidden': 'true' }, o.id),
          h('span', { class: 'answer-text' }, o.text));
      }));
  }

  function datesArea(ex, rerender) {
    const picker = RT.ui.visuals.calendarPicker(ex.data.base, sel.dates, (d) => {
      sel.dates.has(d) ? sel.dates.delete(d) : sel.dates.add(d);
      rerender(d);
    });
    const list = [...sel.dates].sort((a, b) => a - b);
    return h('div', { class: 'answers' },
      picker,
      h('p', { class: 'muted', 'aria-live': 'polite' }, list.length ? `Seleccionadas (${list.length}): ${list.join(', ')}` : 'Ninguna fecha seleccionada. Si crees que no hay ninguna válida, comprueba igualmente.'),
      h('button', { type: 'button', class: 'btn btn-quiet', onclick: () => { sel.dates = new Set(); rerender(); } }, 'Borrar selección'));
  }

  function render(app) {
    const s = app.state;
    if (s.error || !s.exercise) {
      return h('section', { class: 'screen', 'aria-labelledby': 'h-err' },
        h('h1', { id: 'h-err', tabindex: '-1' }, 'Error'),
        h('p', { class: 'alert', role: 'alert' }, s.error || app.PRODUCTION_ERROR),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn btn-primary', onclick: () => app.startExercise() }, 'Reintentar'),
          h('button', { type: 'button', class: 'btn', onclick: () => app.goDashboard() }, 'Volver al panel')),
        s.settings.debug && RT.ui.debug ? RT.ui.debug.render(s) : null);
    }
    const ex = s.exercise;
    resetSelection(ex);
    const trial = s.settings.mode === 'trial';
    const timerEl = h('span', { class: 'timer', id: 'timer', role: 'timer', 'aria-label': trial ? 'Tiempo restante' : 'Tiempo transcurrido' }, s.timer.display());
    const bar = trial ? h('div', { class: 'timebar', 'aria-hidden': 'true' }, h('i', { id: 'timebar' })) : null;

    const root = h('section', { class: 'screen exercise', 'aria-labelledby': 'h-ex' });
    function paint(focusDay) {
      RT.ui.clear(root);
      const answerType = RT.modules[ex.module].answerType;
      root.append(...[
        h('header', { class: 'ex-head' },
          h('div', {},
            h('h1', { id: 'h-ex', tabindex: '-1' }, RT.ui.moduleLabel(ex.module)),
            h('p', { class: 'meta' }, h('span', { class: 'badge' }, RT.ui.levelName(ex.difficulty)), ` Ejercicio nº ${s.questionNumber}`, trial ? ` · Contrarreloj ${s.settings.trialLimit} s` : ' · Entrenamiento')),
          h('div', { class: 'timer-box' }, h('span', { class: 'muted' }, trial ? 'Restante' : 'Tiempo'), timerEl)),
        bar,
        statement(ex),
        h('h2', { class: 'question', id: 'q' }, ex.question),
        answerType === 'dates' ? datesArea(ex, paint) : optionsArea(ex, paint),
        h('div', { class: 'actions' },
          h('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'btn-check', disabled: !hasAnswer(ex), onclick: () => app.submit(currentAnswer(ex)) }, 'Comprobar respuesta'),
          h('button', { type: 'button', class: 'btn btn-quiet', onclick: () => { if (confirm('¿Abandonar el ejercicio? No se contará en las estadísticas.')) app.goDashboard(); } }, 'Salir')),
        s.settings.debug && RT.ui.debug ? RT.ui.debug.render(s) : null].filter(Boolean));
      // keep references to the live timer nodes
      const t = root.querySelector('#timer');
      if (t) { t.textContent = s.timer.display(); }
      app.ui.timerEl = t;
      app.ui.barEl = root.querySelector('#timebar');
      if (focusDay) { const b = root.querySelector(`[data-day="${focusDay}"]`); if (b) b.focus(); }
      else if (answerType === 'option' && sel.option) { const r = root.querySelector('input[name=answer]:checked'); if (r) r.focus(); }
    }
    paint();
    return root;
  }

  /** Keyboard: A–E picks an option; Enter checks the answer when something is selected. */
  function onKey(app, e) {
    const s = app.state;
    if (s.screen !== 'exercise' || !s.exercise || e.ctrlKey || e.metaKey || e.altKey) return;
    const ex = s.exercise;
    if (RT.modules[ex.module].answerType === 'option') {
      const i = LETTER.indexOf(e.key.toUpperCase());
      if (e.key.length === 1 && i >= 0 && ex.options[i]) {
        const r = document.getElementById('opt-' + ex.options[i].id);
        if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
        return;
      }
    }
    if (e.key === 'Enter' && hasAnswer(ex) && !(e.target && e.target.tagName === 'BUTTON')) {
      e.preventDefault();
      app.submit(currentAnswer(ex));
    }
  }

  RT.ui.exercise = { render, onKey, _sel: sel };
})();
