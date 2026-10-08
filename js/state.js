/**
 * state.js — application state + session flow (no DOM). Testable in Node.
 *
 *   screens: 'dashboard' | 'exercise' | 'result' | 'stats'
 *   flow:    startExercise() -> submit()/timeout() -> (result) -> next()
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const PRODUCTION_ERROR = 'Unable to generate exercise. Please try again.';
  const RECENT = 12;

  function createState(opts = {}) {
    const timerFactory = opts.timerFactory || ((o) => new RT.Timer(o));
    const data = RT.storage.load();
    const listeners = new Set();

    const st = {
      screen: 'dashboard',
      settings: data.settings,
      stats: data.stats,
      history: data.questionHistory,
      exercise: null,
      genInfo: null, // { attempts, rejected, usedFallback }
      timer: null,
      questionNumber: 0,
      result: null,
      error: null,
      recentSignatures: [],
      busy: false,
    };

    const emit = () => listeners.forEach((f) => f(st));
    const persist = () => RT.storage.save({ version: 1, settings: st.settings, stats: st.stats, questionHistory: st.history });

    function setScreen(s) {
      st.screen = s;
      emit();
    }

    function updateSettings(patch) {
      st.settings = RT.storage.sanitize({ settings: Object.assign({}, st.settings, patch) }).settings;
      persist();
      emit();
    }

    function killTimer() {
      if (st.timer) st.timer.stop();
      st.timer = null;
    }

    /** Generates a validated exercise and starts the timer. `override` = {module, difficulty, seed}. */
    function startExercise(override) {
      killTimer();
      const { module: m, difficulty: d } = Object.assign({}, st.settings, override || {});
      st.error = null;
      st.result = null;
      try {
        const res = RT.generator.generateExercise({ module: m, difficulty: d, seed: override && override.seed, recentSignatures: st.recentSignatures });
        st.exercise = res.exercise;
        st.genInfo = { attempts: res.attempts, rejected: res.rejected, usedFallback: !!res.usedFallback };
        const sig = res.exercise.meta.signature || RT.generator.signatureOf(res.exercise);
        st.recentSignatures = [sig, ...st.recentSignatures].slice(0, RECENT);
        st.questionNumber += 1;
        const trial = st.settings.mode === 'trial';
        st.timer = timerFactory({
          mode: trial ? 'trial' : 'training',
          limit: trial ? st.settings.trialLimit : null,
          onTick: () => listeners.forEach((f) => f(st, 'tick')),
          onTimeout: () => timeout(),
        });
        st.screen = 'exercise';
        st.timer.start();
      } catch (e) {
        st.exercise = null;
        st.genInfo = { attempts: e.rejected ? e.rejected.length : 0, rejected: e.rejected || [], usedFallback: false, message: e.message };
        st.error = PRODUCTION_ERROR;
        st.screen = 'exercise';
      }
      emit();
      return !st.error;
    }

    function finish(userAnswer, timedOut) {
      if (!st.exercise || st.result || !st.timer) return null; // already graded: ignore double submits
      const ex = st.exercise;
      const timeUsed = st.timer.stop();
      const correct = timedOut ? false : RT.validator.checkAnswer(ex, userAnswer).correct;
      const score = RT.statistics.computeScore({
        correct, difficulty: ex.difficulty, timeUsed, timeLimit: st.timer.limit || ex.timeLimit, streakBefore: st.stats.currentStreak,
      });
      const r = { module: ex.module, difficulty: ex.difficulty, correct, timeUsed, score };
      st.stats = RT.statistics.record(st.stats, r);
      st.history = [...st.history, { id: ex.id, seed: ex.seed, module: ex.module, difficulty: ex.difficulty, correct, timedOut: !!timedOut, timeUsed: Math.round(timeUsed * 10) / 10, score, at: Date.now() }].slice(-200);
      st.result = { correct, timedOut: !!timedOut, timeUsed, score, userAnswer: timedOut ? null : userAnswer, correctAnswer: ex.correctAnswer, streak: st.stats.currentStreak };
      st.screen = 'result';
      persist();
      emit();
      return st.result;
    }

    function submit(userAnswer) {
      if (userAnswer === null || userAnswer === undefined) return null;
      return finish(userAnswer, false);
    }
    function timeout() {
      return finish(null, true);
    }
    function next() {
      return startExercise();
    }
    function showStats() {
      killTimer();
      setScreen('stats');
    }
    function goDashboard() {
      killTimer();
      st.exercise = null;
      st.result = null;
      setScreen('dashboard');
    }
    function resetStats() {
      const d = RT.storage.resetStats();
      st.stats = d.stats;
      st.history = d.questionHistory;
      emit();
    }

    return {
      state: st,
      subscribe: (f) => (listeners.add(f), () => listeners.delete(f)),
      setScreen, updateSettings, startExercise, submit, timeout, next, showStats, goDashboard, resetStats, killTimer,
      PRODUCTION_ERROR,
    };
  }

  RT.createState = createState;
})();
