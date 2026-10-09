/** dashboard.js — module / level / mode selection. */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const { h } = RT.ui;
  const t = (k, p) => RT.i18n.t(k, p);

  const ICON = { scheduling: '⏱', positional: '↔', calendar: '▦', inductive: '◭', english: 'Aa' };
  const MODULES = ['scheduling', 'positional', 'calendar', 'inductive', 'english'];

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
    const mods = MODULES.map((m) => ({ value: m, label: t('module.' + m), hint: t('module.' + m + '.hint'), icon: ICON[m] }));
    const lvls = [1, 2, 3].map((l) => ({ value: l, label: t('level.' + l), hint: t('level.' + l + '.hint') }));
    const modes = ['training', 'trial'].map((m) => ({ value: m, label: t('mode.' + m), hint: t('mode.' + m + '.hint') }));
    const limits = [60, 75, 90].map((n) => ({ value: n, label: n + ' s' }));
    const st = s.stats;

    return h('section', { class: 'screen dashboard', 'aria-labelledby': 'h-dash' },
      h('h1', { id: 'h-dash', tabindex: '-1' }, t('app.title')),
      h('p', { class: 'lead' }, t('dash.lead')),
      radioGroup('module', t('dash.module'), mods, set.module, (v) => app.updateSettings({ module: v }), 'choice-modules'),
      h('div', { class: 'row-2' },
        radioGroup('difficulty', t('dash.level'), lvls, set.difficulty, (v) => app.updateSettings({ difficulty: Number(v) })),
        radioGroup('mode', t('dash.mode'), modes, set.mode, (v) => app.updateSettings({ mode: v }))),
      set.mode === 'trial' ? radioGroup('trialLimit', t('dash.trial'), limits, set.trialLimit, (v) => app.updateSettings({ trialLimit: Number(v) }), 'choice-inline') : null,
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn-primary btn-lg', id: 'btn-start', onclick: () => app.startExercise() }, t('dash.start')),
        h('button', { type: 'button', class: 'btn', onclick: () => app.showStats() }, t('dash.stats'))),
      st.totalQuestions
        ? h('p', { class: 'muted' }, t('dash.summary', { n: st.totalQuestions, acc: Math.round(RT.statistics.accuracy(st) * 100), streak: st.currentStreak }))
        : h('p', { class: 'muted' }, t('dash.nostats')),
      h('label', { class: 'debug-toggle' },
        h('input', { type: 'checkbox', checked: !!set.debug, onchange: (e) => app.updateSettings({ debug: e.target.checked }) }),
        ' ' + t('dash.debug')));
  }

  RT.ui.dashboard = { render, MODULES };
})();
