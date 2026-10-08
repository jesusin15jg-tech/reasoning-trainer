/** dashboard.js — module / level / mode selection. */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const { h } = RT.ui;

  const MODULE_INFO = {
    scheduling: { icon: '⏱', es: 'Planificación de recursos', hint: 'Intervalos, solapes y ventanas libres' },
    positional: { icon: '↔', es: 'Restricciones posicionales', hint: 'Ordenar elementos con reglas lógicas' },
    calendar: { icon: '▦', es: 'Lógica de calendario', hint: 'Fechas en las que todo el equipo puede trabajar' },
    english: { icon: 'Aa', es: 'Inglés contractual y avanzado', hint: 'Vocabulario, gramática, contratos y lectura' },
  };
  const MODE_INFO = {
    training: 'Entrenamiento (cronómetro ascendente, sin límite)',
    trial: 'Contrarreloj (cuenta atrás; al agotarse cuenta como fallo)',
  };
  const LEVEL_HINT = { 1: 'Pocas reglas, directas', 2: 'Más reglas, algunas indirectas', 3: 'Muchas reglas, condicionales y trampas' };

  function radioGroup(name, legend, items, current, onChange, cls) {
    return h('fieldset', { class: 'choice ' + (cls || '') },
      h('legend', {}, legend),
      h('div', { class: 'choice-list' }, items.map((it) => {
        const id = `${name}-${it.value}`;
        return h('label', { class: 'choice-item' + (String(current) === String(it.value) ? ' is-on' : ''), for: id },
          h('input', { type: 'radio', name, id, value: it.value, checked: String(current) === String(it.value), onchange: () => onChange(it.value) }),
          h('span', { class: 'choice-body' }, it.icon ? h('span', { class: 'choice-icon', 'aria-hidden': 'true' }, it.icon) : null,
            h('span', {}, h('strong', {}, it.label), it.hint ? h('small', {}, it.hint) : null)));
      })));
  }

  function render(app) {
    const s = app.state;
    const set = s.settings;
    const mods = Object.keys(MODULE_INFO).map((m) => ({ value: m, label: MODULE_INFO[m].es, hint: MODULE_INFO[m].hint, icon: MODULE_INFO[m].icon }));
    const lvls = [1, 2, 3].map((l) => ({ value: l, label: RT.difficulty.level(l).name, hint: LEVEL_HINT[l] }));
    const modes = Object.keys(MODE_INFO).map((m) => ({ value: m, label: MODE_INFO[m].split(' (')[0], hint: MODE_INFO[m].match(/\((.*)\)/)[1] }));
    const limits = [60, 75, 90].map((n) => ({ value: n, label: n + ' s' }));
    const st = s.stats;

    return h('section', { class: 'screen dashboard', 'aria-labelledby': 'h-dash' },
      h('h1', { id: 'h-dash', tabindex: '-1' }, 'Reasoning & Contractual English Trainer'),
      h('p', { class: 'lead' }, 'Elige módulo, nivel y modo. Cada ejercicio se genera, se resuelve y se valida automáticamente antes de mostrarse.'),
      radioGroup('module', 'Módulo', mods, set.module, (v) => app.updateSettings({ module: v }), 'choice-modules'),
      h('div', { class: 'row-2' },
        radioGroup('difficulty', 'Nivel', lvls, set.difficulty, (v) => app.updateSettings({ difficulty: Number(v) })),
        radioGroup('mode', 'Modo', modes, set.mode, (v) => app.updateSettings({ mode: v }))),
      set.mode === 'trial' ? radioGroup('trialLimit', 'Tiempo por ejercicio', limits, set.trialLimit, (v) => app.updateSettings({ trialLimit: Number(v) }), 'choice-inline') : null,
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'btn-start', onclick: () => app.startExercise() }, 'Empezar'),
        h('button', { type: 'button', class: 'btn', onclick: () => app.showStats() }, 'Estadísticas')),
      st.totalQuestions
        ? h('p', { class: 'muted' }, `Llevas ${st.totalQuestions} ejercicios · precisión ${Math.round(RT.statistics.accuracy(st) * 100)}% · racha actual ${st.currentStreak}`)
        : h('p', { class: 'muted' }, 'Todavía no hay estadísticas.'),
      h('label', { class: 'debug-toggle' },
        h('input', { type: 'checkbox', checked: !!set.debug, onchange: (e) => app.updateSettings({ debug: e.target.checked }) }),
        ' Modo debug (ID, seed, restricciones, nº de soluciones…)'));
  }

  RT.ui.dashboard = { render, MODULE_INFO };
})();
