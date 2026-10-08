/** stats.js — statistics screen (with confirmed reset). */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const { h } = RT.ui;
  const ui = { confirming: false };
  const pct = (x) => Math.round(x * 100) + '%';

  function card(label, value) {
    return h('div', { class: 'stat' }, h('dt', {}, label), h('dd', {}, value));
  }

  function breakdown(title, entries) {
    return h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
      h('caption', {}, title),
      h('thead', {}, h('tr', {}, ['', 'Ejercicios', 'Aciertos', 'Precisión', 'Tiempo medio', 'Puntos'].map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, entries.length ? entries.map(([name, b]) => h('tr', {},
        h('th', { scope: 'row' }, name), h('td', {}, String(b.total)), h('td', {}, String(b.correct)),
        h('td', {}, h('span', { class: 'bar', 'aria-hidden': 'true' }, h('i', { style: { width: pct(RT.statistics.bucketAccuracy(b)) } })), ' ' + pct(RT.statistics.bucketAccuracy(b))),
        h('td', {}, RT.ui.fmtSeconds(RT.statistics.bucketAvgTime(b))), h('td', {}, String(b.score))))
        : h('tr', {}, h('td', { colspan: 6 }, 'Sin datos todavía.')))));
  }

  function render(app) {
    const st = app.state.stats;
    const mods = Object.keys(RT.modules).filter((m) => st.moduleStats[m]).map((m) => [RT.ui.moduleLabel(m), st.moduleStats[m]]);
    const lvls = [1, 2, 3].filter((l) => st.difficultyStats[l]).map((l) => [RT.ui.levelName(l), st.difficultyStats[l]]);
    const hist = app.state.history.slice(-10).reverse();
    return h('section', { class: 'screen stats', 'aria-labelledby': 'h-stats' },
      h('h1', { id: 'h-stats', tabindex: '-1' }, 'Estadísticas'),
      h('dl', { class: 'stat-grid' },
        card('Ejercicios', String(st.totalQuestions)), card('Correctos', String(st.correctAnswers)), card('Incorrectos', String(st.incorrectAnswers)),
        card('Precisión', pct(RT.statistics.accuracy(st))), card('Tiempo total', RT.ui.fmtTime(st.totalTime)),
        card('Tiempo medio', RT.ui.fmtSeconds(RT.statistics.averageTime(st))), card('Mejor tiempo (acierto)', st.bestTime === null ? '—' : RT.ui.fmtSeconds(st.bestTime)),
        card('Racha actual', String(st.currentStreak)), card('Mejor racha', String(st.bestStreak)), card('Puntos', String(st.totalScore))),
      breakdown('Rendimiento por módulo', mods),
      breakdown('Rendimiento por dificultad', lvls),
      h('h2', {}, 'Últimos ejercicios'),
      hist.length ? h('ul', { class: 'history' }, hist.map((x) => h('li', {}, h('span', { class: x.correct ? 'ok-t' : 'bad-t' }, x.correct ? '✓ ' : x.timedOut ? '⏰ ' : '✕ '),
        `${RT.ui.moduleLabel(x.module)} · ${RT.ui.levelName(x.difficulty)} · ${RT.ui.fmtSeconds(x.timeUsed)} · ${x.score} pts`))) : h('p', { class: 'muted' }, 'Aún no hay historial.'),
      h('div', { class: 'actions' },
        h('button', { type: 'button', class: 'btn btn-primary', onclick: () => app.goDashboard() }, 'Volver al panel'),
        ui.confirming
          ? h('div', { class: 'confirm', role: 'alertdialog', 'aria-label': 'Confirmar reinicio' }, h('span', {}, '¿Seguro? Se borrarán todas las estadísticas.'),
            h('button', { type: 'button', class: 'btn btn-danger', id: 'btn-reset-yes', onclick: () => { ui.confirming = false; app.resetStats(); } }, 'Sí, borrar'),
            h('button', { type: 'button', class: 'btn', onclick: () => { ui.confirming = false; app.rerender(); } }, 'Cancelar'))
          : h('button', { type: 'button', class: 'btn btn-danger-quiet', id: 'btn-reset', onclick: () => { ui.confirming = true; app.rerender(); } }, 'Reiniciar estadísticas')));
  }

  RT.ui.stats = { render, _ui: ui };
})();
