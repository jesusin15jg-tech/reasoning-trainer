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

    /** Language switch in the header + <html lang> + document title. */
    function drawChrome() {
      const t = RT.i18n.t;
      document.documentElement.lang = RT.i18n.lang;
      document.title = t('app.title');
      const nm = document.getElementById('app-name');
      if (nm) nm.textContent = t('app.title');
      const box = document.getElementById('lang-switch');
      if (!box) return;
      RT.ui.clear(box).append(
        RT.ui.h('span', { class: 'sr-only', id: 'lang-label' }, t('lang.label')),
        ...RT.i18n.LANGS.map((l) => RT.ui.h('button', {
          type: 'button', class: 'lang-btn' + (RT.i18n.lang === l ? ' is-on' : ''), lang: l, 'aria-pressed': RT.i18n.lang === l ? 'true' : 'false',
          'aria-label': t('lang.name.' + l), title: t('lang.name.' + l), onclick: () => app.updateSettings({ lang: l }),
        }, l.toUpperCase())));
      const skip = document.querySelector('.skip');
      if (skip) skip.textContent = t('app.skip');
    }

    function draw(focusHeading) {
      drawChrome();
      let node;
      try {
        node = SCREENS[app.state.screen]();
      } catch (e) {
        console.error(e);
        node = RT.ui.h('section', { class: 'screen' }, RT.ui.h('p', { class: 'alert', role: 'alert' }, RT.i18n.t('err.generic')),
          RT.ui.h('button', { type: 'button', class: 'btn', onclick: () => app.goDashboard() }, RT.i18n.t('ex.back')));
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

    // Reproduce an exercise: ?module=positional&level=2&seed=abc123   (+ &debug=1, &lang=es)
    const q = new URLSearchParams(location.search);
    if (RT.i18n.isLang(q.get('lang'))) app.updateSettings({ lang: q.get('lang') });
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
