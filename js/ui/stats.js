/** stats.js — statistics screen (with confirmed reset). */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const { h } = RT.ui;
  const t = (k, p) => RT.i18n.t(k, p);
  const ui = { confirming: false };
  const pct = (x) => Math.round(x * 100) + '%';

  function card(label, value) {
    return h('div', { class: 'stat' }, h('dt', {}, label), h('dd', {}, value));
  }

  function breakdown(title, entries) {
    return h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
      h('caption', {}, title),
      h('thead', {}, h('tr', {}, ['', t('stats.col.n'), t('stats.col.hits'), t('stats.col.acc'), t('stats.col.avg'), t('stats.col.pts')].map((x) => h('th', { scope: 'col' }, x)))),
      h('tbody', {}, entries.length ? entries.map(([name, b]) => h('tr', {},
        h('th', { scope: 'row' }, name), h('td', {}, String(b.total)), h('td', {}, String(b.correct)),
        h('td', {}, h('span', { class: 'bar', 'aria-hidden': 'true' }, h('i', { style: { width: pct(RT.statistics.bucketAccuracy(b)) } })), ' ' + pct(RT.statistics.bucketAccuracy(b))),
        h('td', {}, RT.ui.fmtSeconds(RT.statistics.bucketAvgTime(b))), h('td', {}, String(b.score))))
        : h('tr', {}, h('td', { colspan: 6 }, t('stats.nodata'))))));
  }

  function render(app) {
    const st = app.state.stats;
    const mods = Object.keys(RT.modules).filter((m) => st.moduleStats[m]).map((m) => [RT.ui.moduleLabel(m), st.moduleStats[m]]);
    const lvls = [1, 2, 3].filter((l) => st.difficultyStats[l]).map((l) => [RT.ui.levelName(l), st.difficultyStats[l]]);
    const hist = app.state.history.slice(-10).reverse();
    return h('section', { class: 'screen stats', 'aria-labelledby': 'h-stats' },
      h('h1', { id: 'h-stats', tabindex: '-1' }, t('stats.title')),
      h('dl', { class: 'stat-grid' },
        card(t('stats.total'), String(st.totalQuestions)), card(t('stats.correct'), String(st.correctAnswers)), card(t('stats.incorrect'), String(st.incorrectAnswers)),
        card(t('stats.accuracy'), pct(RT.statistics.accuracy(st))), card(t('stats.totalTime'), RT.ui.fmtTime(st.totalTime)),
        card(t('stats.avgTime'), RT.ui.fmtSeconds(RT.statistics.averageTime(st))), card(t('stats.bestTime'), st.bestTime === null ? '—' : RT.ui.fmtSeconds(st.bestTime)),
        card(t('stats.streak'), String(st.currentStreak)), card(t('stats.bestStreak'), String(st.bestStreak)), card(t('stats.points'), String(st.totalScore))),
      breakdown(t('stats.byModule'), mods),
      breakdown(t('stats.byLevel'), lvls),
      h('h2', {}, t('stats.last')),
      hist.length ? h('ul', { class: 'history' }, hist.map((x) => h('li', {}, h('span', { class: x.correct ? 'ok-t' : 'bad-t' }, x.correct ? '✓ ' : x.timedOut ? '⏰ ' : '✕ '),
        `${RT.ui.moduleLabel(x.module)} · ${RT.ui.levelName(x.difficulty)} · ${RT.ui.fmtSeconds(x.timeUsed)} · ${x.score} ${t('stats.pts')}`))) : h('p', { class: 'muted' }, t('stats.nohistory')),
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn-primary', onclick: () => app.goDashboard() }, t('stats.back')),
        ui.confirming
          ? h('div', { class: 'confirm', role: 'alertdialog', 'aria-label': t('stats.confirm.aria') }, h('span', {}, t('stats.confirm')),
            h('button', { type: 'button', class: 'btn btn-danger', id: 'btn-reset-yes', onclick: () => { ui.confirming = false; app.resetStats(); } }, t('stats.confirm.yes')),
            h('button', { type: 'button', class: 'btn', onclick: () => { ui.confirming = false; app.rerender(); } }, t('stats.confirm.no')))
          : h('button', { type: 'button', class: 'btn btn-danger-quiet', id: 'btn-reset', onclick: () => { ui.confirming = true; app.rerender(); } }, t('stats.reset'))));
  }

  RT.ui.stats = { render, _ui: ui };
})();
