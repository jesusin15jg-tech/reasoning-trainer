/** app.js — wiring: state -> screens. Exposes window.RT.app for tests and debugging. */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});

  function boot() {
    const root = document.getElementById('app');
    const ctl = RT.createState();
    const app = Object.assign(ctl, { ui: { timerEl: null, barEl: null }, PRODUCTION_ERROR: ctl.PRODUCTION_ERROR });
    app.rerender = () => draw(false);
    let lastScreen = null;

    const SCREENS = {
      dashboard: () => RT.ui.dashboard.render(app),
      exercise: () => RT.ui.exercise.render(app),
      result: () => RT.ui.result.render(app),
      stats: () => RT.ui.stats.render(app),
    };

    function draw(focusHeading) {
      let node;
      try {
        node = SCREENS[app.state.screen]();
      } catch (e) {
        console.error(e);
        node = RT.ui.h('section', { class: 'screen' }, RT.ui.h('p', { class: 'alert', role: 'alert' }, app.PRODUCTION_ERROR),
          RT.ui.h('button', { type: 'button', class: 'btn', onclick: () => app.goDashboard() }, 'Volver al panel'));
      }
      RT.ui.clear(root).appendChild(node);
      if (focusHeading) {
        window.scrollTo(0, 0);
        const target = root.querySelector('[tabindex="-1"]') || root.querySelector('button');
        if (target) target.focus({ preventScroll: true });
      }
    }

    function tick() {
      const t = app.state.timer;
      const el = app.ui.timerEl;
      if (!t || !el || !el.isConnected) return;
      const low = t.limit && t.remaining() <= 10;
      el.textContent = (low ? '⚠ ' : '') + t.display();
      el.classList.toggle('timer-low', !!low);
      if (app.ui.barEl && t.limit) app.ui.barEl.style.width = Math.max(0, (t.remaining() / t.limit) * 100) + '%';
    }

    app.subscribe((st, kind) => {
      if (kind === 'tick') return tick();
      const changed = lastScreen !== st.screen || st.screen === 'exercise';
      const fresh = lastScreen !== st.screen || (st.screen === 'exercise' && !app.ui.timerEl);
      lastScreen = st.screen;
      draw(changed && fresh);
      if (st.screen === 'exercise') tick();
    });

    document.addEventListener('keydown', (e) => {
      const st = app.state;
      if (st.screen === 'exercise') RT.ui.exercise.onKey(app, e);
      else if (st.screen === 'result' && e.key === 'Enter' && !(e.target && /^(BUTTON|A|INPUT)$/.test(e.target.tagName))) {
        e.preventDefault();
        app.next();
      }
    });

    // Reproduce an exercise: ?module=positional&level=2&seed=abc123   (+ &debug=1)
    const q = new URLSearchParams(location.search);
    if (q.get('debug') === '1') app.updateSettings({ debug: true });
    if (q.get('module') && q.get('seed') && RT.modules[q.get('module')]) {
      const lvl = Number(q.get('level')) || 1;
      lastScreen = null;
      app.startExercise({ module: q.get('module'), difficulty: [1, 2, 3].includes(lvl) ? lvl : 1, seed: q.get('seed') });
    } else {
      lastScreen = 'dashboard';
      draw(false);
    }
    RT.app = app;
    return app;
  }

  RT.boot = boot;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }
})();
