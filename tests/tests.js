/**
 * tests/tests.js — automatic test-suite. Runs in Node (`node tests/tests.js`) and in the browser (tests/index.html).
 * Env / URL params:  N=100 (exercises per module & level)   QUICK=1 (N=20)
 */
(function () {
  const isNode = typeof module !== 'undefined' && module.exports && typeof window === 'undefined';
  const RT = isNode ? require('../tools/load-engine')() : globalThis.RT;
  const params = isNode ? process.env : Object.fromEntries(new URLSearchParams(location.search));
  const N = params.QUICK ? 20 : Number(params.N) || 100;
  const MODULES = Object.keys(RT.modules);
  const LEVELS = [1, 2, 3];

  const results = [];
  const assert = (c, msg) => { if (!c) throw new Error(msg || 'assertion failed'); };
  const eq = (a, b, msg) => assert(JSON.stringify(a) === JSON.stringify(b), `${msg || 'not equal'}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
  const near = (a, b, msg) => assert(Math.abs(a - b) < 1e-9, `${msg || 'not close'}: ${a} vs ${b}`);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // Pool of generated exercises, shared by the generation tests (N per module and level).
  // Even seeds are generated in English, odd seeds in Spanish, so every generation test covers both languages.
  const pool = [];
  function build() {
    if (pool.length) return;
    for (const m of MODULES) for (const l of LEVELS) for (let i = 0; i < N; i++) {
      const r = RT.generator.generateFromSeed(m, l, `t${i}`, { lang: i % 2 ? 'es' : 'en' });
      pool.push(r.exercise);
    }
  }
  /** module.verify() in the language the exercise was generated in */
  const verifyIn = (ex) => RT.i18n.withLang(ex.lang, () => RT.modules[ex.module].verify(clone(ex)));

  function memoryStorage() {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k), _m: m };
  }

  /** Runs fn with a fake in-memory localStorage, then restores whatever was there before. */
  function withStorage(fn) {
    const had = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const ls = memoryStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true, writable: true });
    try { return fn(ls); }
    finally { if (had) Object.defineProperty(globalThis, 'localStorage', had); else delete globalThis.localStorage; }
  }

  const tests = [
    ['1. Every generated exercise is solvable (N per module & level, 0 generation failures)', () => {
      build();
      eq(pool.length, MODULES.length * LEVELS.length * N, 'pool size');
      for (const ex of pool) assert(ex.meta.solutionCount >= 1, ex.id + ' has no solution');
    }],

    ['2. No contradictions: serialised constraints re-solve to a consistent, non-empty solution set', () => {
      build();
      for (const ex of pool) {
        const v = verifyIn(ex);
        assert(v.errors.length === 0, `${ex.id}: ${v.errors.join('; ')}`);
        assert(v.solutionCount >= 1, `${ex.id}: contradictory constraints`);
      }
    }],

    ['3. Uniqueness: single-answer questions have exactly one valid answer (independent re-count)', () => {
      build();
      for (const ex of pool) {
        const v = RT.validator.validateExercise(clone(ex));
        assert(v.ok, `${ex.id}: ${v.errors.join('; ')}`);
        if (ex.options) {
          const validOpts = Object.keys(v.optionValidity).filter((k) => v.optionValidity[k]);
          assert(validOpts.length === 1, `${ex.id}: ${validOpts.length} valid options`);
        } else if (ex.module === 'inductive') {
          // free-painting exercises: exactly one figure is predicted by every rule that fits the visible figures
          assert(v.solutionCount === 1, `${ex.id}: ${v.solutionCount} different predictions`);
          eq(v.solverAnswer, ex.correctAnswer, ex.id + ' painted figure');
        } else {
          // calendar: the answer is ONE set; the solver must find exactly that set, no more and no fewer dates
          assert(v.solutionCount === ex.correctAnswer.length, `${ex.id}: solver found ${v.solutionCount} dates, answer has ${ex.correctAnswer.length}`);
          assert(RT.validator.sameAnswer(v.solverAnswer, ex.correctAnswer), `${ex.id}: solver set differs from the answer`);
        }
        if (ex.module === 'positional' && ['position', 'who'].includes(ex.kind)) {
          const spec = ex.constraints;
          const n = ex.data.names.length;
          const sols = RT.solver.solveOrdering(n, spec, { limit: 5 });
          assert(sols.length === 1, `${ex.id}: ${sols.length} orderings satisfy the rules`);
        }
      }
    }],

    ['4. correctAnswer == solver answer (module verify() re-derives it from the data)', () => {
      build();
      for (const ex of pool) {
        const v = verifyIn(ex);
        assert(RT.validator.sameAnswer(v.solverAnswer, ex.correctAnswer), `${ex.id}: solver ${JSON.stringify(v.solverAnswer)} vs ${JSON.stringify(ex.correctAnswer)}`);
      }
    }],

    ['5. Wrong options are really wrong (and exactly one option is right)', () => {
      build();
      let checked = 0;
      for (const ex of pool) {
        if (!ex.options) continue;
        const v = verifyIn(ex);
        const valid = Object.keys(v.optionValidity).filter((k) => v.optionValidity[k]);
        eq(valid, [ex.correctAnswer], ex.id + ' valid options');
        for (const o of ex.options) if (o.id !== ex.correctAnswer) { assert(!v.optionValidity[o.id], `${ex.id}: option ${o.id} is accidentally correct`); checked++; }
      }
      assert(checked > 0, 'no wrong options were checked');
    }],

    ['6. Timer: counts up, counts down, times out once, never duplicates intervals', () => {
      let t = 1000, nextId = 1; const live = new Map(); let created = 0;
      const clock = { now: () => t, setInterval: (f) => { created++; const id = nextId++; live.set(id, f); return id; }, clearInterval: (id) => void live.delete(id) };
      const advance = (ms, step = 250) => { for (let d = 0; d < ms; d += step) { t += step; [...live.values()].forEach((f) => f()); } };
      // training: counts up
      const a = new RT.Timer(Object.assign({ mode: 'training' }, clock));
      assert(a.start() === true, 'first start');
      assert(a.start() === false, 'second start must be ignored');
      eq(created, 1, 'only one interval');
      advance(65000);
      eq(a.display(), '01:05', 'training display');
      near(a.stop(), 65, 'elapsed');
      eq(live.size, 0, 'interval cleared on stop');
      assert(a.start() === false, 'a stopped timer cannot restart');
      // trial: counts down, timeout fires exactly once
      let timeouts = 0;
      const b = new RT.Timer(Object.assign({ mode: 'trial', limit: 60, onTimeout: () => timeouts++ }, clock));
      b.start();
      advance(15000);
      eq(b.display(), '00:45', 'trial display');
      advance(60000);
      eq(timeouts, 1, 'timeout fired once');
      assert(b.timedOut, 'timedOut flag');
      eq(live.size, 0, 'no interval left after timeout');
      near(b.elapsed(), 60, 'elapsed capped at limit');
      for (const lim of [60, 75, 90]) { const c = new RT.Timer(Object.assign({ mode: 'trial', limit: lim }, clock)); c.start(); eq(c.display(), RT.timerFormat(lim)); c.stop(); }
      eq(RT.timerFormat(0), '00:00'); eq(RT.timerFormat(599), '09:59');
    }],

    ['7. Statistics maths: accuracy, averages, streaks, per-module/level and score formula', () => {
      const S = RT.statistics;
      let s = S.emptyStats();
      const seq = [[true, 10, 'calendar', 1], [true, 20, 'calendar', 2], [false, 30, 'english', 2], [true, 40, 'english', 3], [true, 50, 'positional', 3], [true, 60, 'positional', 3]];
      for (const [correct, timeUsed, module, difficulty] of seq) s = S.record(s, { correct, timeUsed, module, difficulty, score: correct ? 100 : 0 });
      eq(s.totalQuestions, 6); eq(s.correctAnswers, 5); eq(s.incorrectAnswers, 1);
      near(S.accuracy(s), 5 / 6); near(S.averageTime(s), 35); eq(s.bestTime, 10);
      eq(s.bestStreak, 3, 'best streak'); eq(s.currentStreak, 3, 'current streak (40, 50, 60 are three correct in a row)');
      eq(s.moduleStats.english, { total: 2, correct: 1, incorrect: 1, totalTime: 70, score: 100 }, 'english bucket');
      eq(s.difficultyStats[3].total, 3, 'level-3 bucket'); eq(s.moduleStats.calendar.correct, 2);
      const w = S.record(s, { correct: false, timeUsed: 5, module: 'calendar', difficulty: 1, score: 0 });
      eq(w.currentStreak, 0, 'a miss resets the streak'); eq(w.bestStreak, 3, 'best streak is kept'); eq(s.totalQuestions, 6, 'record() must not mutate its input');
    }],

    ['8. localStorage: save/load round-trip, reset keeps settings, corrupted data is survived', () => {
      withStorage((ls) => {
        const d = RT.storage.load();
        d.settings.module = 'calendar'; d.settings.difficulty = 3; d.settings.mode = 'trial'; d.settings.trialLimit = 90;
        d.stats = RT.statistics.record(d.stats, { correct: true, timeUsed: 12, module: 'calendar', difficulty: 3, score: 330 });
        assert(RT.storage.save(d), 'save');
        const back = RT.storage.load();
        eq(back.settings, d.settings, 'settings round-trip'); eq(back.stats, d.stats, 'stats round-trip');
        const st = RT.createState();
        st.startExercise({ module: 'calendar', difficulty: 1 });
        st.submit([1]); // whatever the answer, it must be persisted
        eq(RT.storage.load().stats.totalQuestions, 2, 'state flow persisted a result');
        RT.storage.resetStats();
        const r = RT.storage.load();
        eq(r.stats.totalQuestions, 0, 'reset'); eq(r.settings.module, 'calendar', 'settings survive reset');
        ls.setItem(RT.storage.KEY, '{not json');
        eq(RT.storage.load().stats.totalQuestions, 0, 'corrupt JSON');
        ls.setItem(RT.storage.KEY, JSON.stringify({ settings: { module: 'hack', difficulty: 99 }, stats: { totalQuestions: -5, bestTime: 'x' } }));
        const c = RT.storage.load();
        eq(c.settings.module, RT.storage.DEFAULT_SETTINGS.module, 'invalid settings replaced'); eq(c.stats.totalQuestions, 0, 'invalid stats replaced');
      });
    }],

    ['9. Rule text == solver data: statement, rules and explanation are regenerated from the constraints', () => {
      build();
      for (const ex of pool) {
        const bad = clone(ex);
        const v = RT.validator.validateExercise(bad);
        assert(v.ok, `${ex.id}: ${v.errors.join('; ')}`);
      }
      // mutation: change one rule's wording / one numeric constraint => must be rejected
      let mutated = 0;
      for (const ex of pool.filter((e) => e.data.rules && e.data.rules.length)) {
        if (mutated >= 60) break;
        const m1 = clone(ex); m1.data.rules[0] = m1.data.rules[0] + ' (tampered)';
        assert(!RT.validator.validateExercise(m1).ok, `${ex.id}: tampered rule text accepted`);
        mutated++;
      }
      assert(mutated > 0, 'no rule texts mutated');
    }],

    ['10. Pipeline rejects invalid exercises (wrong answer, duplicate option, bad difficulty, missing field)', () => {
      build();
      const sample = (m) => pool.find((e) => e.module === m && e.options);
      for (const m of ['positional', 'scheduling', 'english', 'inductive']) {
        const ex = sample(m);
        const wrong = clone(ex); wrong.correctAnswer = ex.options.find((o) => o.id !== ex.correctAnswer).id;
        assert(!RT.validator.validateExercise(wrong).ok, m + ': wrong correctAnswer accepted');
        const dup = clone(ex); dup.options[1].text = dup.options[0].text;
        assert(!RT.validator.validateExercise(dup).ok, m + ': duplicate option text accepted');
        const miss = clone(ex); delete miss.explanation;
        assert(!RT.validator.validateExercise(miss).ok, m + ': missing explanation accepted');
      }
      const cal = pool.find((e) => e.module === 'calendar');
      const cw = clone(cal); cw.correctAnswer = cal.correctAnswer.concat([99]);
      assert(!RT.validator.validateExercise(cw).ok, 'calendar: wrong set accepted');
      const cw2 = clone(cal); cw2.correctAnswer = cal.correctAnswer.slice(1);
      assert(!RT.validator.validateExercise(cw2).ok, 'calendar: partial set accepted');
      const lvl = clone(pool.find((e) => e.module === 'positional' && e.difficulty === 3)); lvl.difficulty = 1;
      assert(!RT.validator.validateExercise(lvl).ok, 'difficulty incoherent with complexity accepted');
    }],

    ['11. Seeds are reproducible; fresh generations do not repeat immediately', () => {
      for (const m of MODULES) for (const l of LEVELS) for (const lang of ['en', 'es']) {
        const a = RT.generator.generateFromSeed(m, l, 'repro', { lang }).exercise, b = RT.generator.generateFromSeed(m, l, 'repro', { lang }).exercise;
        a.createdAt = b.createdAt = 0;
        eq(a, b, `${m} L${l} ${lang} not reproducible`);
      }
      let recent = [];
      for (let i = 0; i < 40; i++) {
        const ex = RT.generator.generateExercise({ module: 'english', difficulty: 2, recentSignatures: recent }).exercise;
        assert(!recent.includes(ex.meta.signature), 'immediate repeat');
        recent = [ex.meta.signature, ...recent].slice(0, 12);
      }
    }],

    ['12. Calendar answers are graded as exact sets (no partial credit)', () => {
      const ex = pool.find((e) => e.module === 'calendar' && e.correctAnswer.length >= 2) || (build(), pool.find((e) => e.module === 'calendar' && e.correctAnswer.length >= 2));
      const C = RT.validator.checkAnswer;
      assert(C(ex, [...ex.correctAnswer].reverse()).correct, 'order must not matter');
      assert(!C(ex, ex.correctAnswer.slice(1)).correct, 'missing date');
      assert(!C(ex, ex.correctAnswer.concat([ex.correctAnswer[0] === 1 ? 2 : 1])).correct || ex.correctAnswer.includes(ex.correctAnswer[0] === 1 ? 2 : 1), 'extra date');
      assert(!C(ex, null).correct, 'null');
    }],

    ['13. English bank lint: one correct option, every distractor has a reason, no duplicates', () => {
      const errs = RT.english.lintBank();
      assert(errs.length === 0, errs.slice(0, 5).join(' | '));
    }],

    ['14. Session flow: time-out counts as wrong, double submit ignored, fallbacks are valid', () => {
      withStorage(() => {
        let t = 0; const live = [];
        const st = RT.createState({ timerFactory: (o) => new RT.Timer(Object.assign({}, o, { now: () => t, setInterval: (f) => (live.push(f), live.length), clearInterval: () => {} })) });
        st.updateSettings({ mode: 'trial', trialLimit: 60 });
        st.startExercise({ module: 'positional', difficulty: 1 });
        t = 61000; live.forEach((f) => f());
        assert(st.state.result && st.state.result.timedOut && !st.state.result.correct, 'time out must be an incorrect result');
        eq(st.state.stats.incorrectAnswers, 1);
        const before = st.state.stats.totalQuestions;
        st.submit(st.state.exercise.correctAnswer);
        eq(st.state.stats.totalQuestions, before, 'second submit ignored');
        // correct answer path
        st.updateSettings({ mode: 'training' });
        st.startExercise({ module: 'scheduling', difficulty: 1 });
        const r = st.submit(st.state.exercise.correctAnswer);
        assert(r.correct && r.score > 0, 'correct answer must score');
      });
      for (const lang of ['en', 'es']) for (const m of MODULES) for (const l of LEVELS) {
        const fb = (RT.fallbacks[lang] || {})[m] && RT.fallbacks[lang][m][l];
        assert(fb && fb.length >= 1, `no ${lang} fallback for ${m} L${l}`);
        for (const ex of fb) {
          eq(ex.lang, lang, 'fallback language tag ' + ex.id);
          assert(RT.validator.validateExercise(clone(ex)).ok, 'invalid fallback ' + ex.id);
        }
      }
    }],

    ['15. Score function: BASE x DIFFICULTY x TIME x STREAK, zero when wrong', () => {
      const S = RT.statistics;
      eq(S.computeScore({ correct: false, difficulty: 3, timeUsed: 1, timeLimit: 60, streakBefore: 5 }), 0);
      eq(S.computeScore({ correct: true, difficulty: 1, timeUsed: 60, timeLimit: 60, streakBefore: 0 }), 100);
      eq(S.computeScore({ correct: true, difficulty: 2, timeUsed: 0, timeLimit: 60, streakBefore: 0 }), 225);
      eq(S.computeScore({ correct: true, difficulty: 3, timeUsed: 30, timeLimit: 60, streakBefore: 5 }), Math.round(100 * 2.2 * 1.25 * 1.5));
      assert(S.computeScore({ correct: true, difficulty: 1, timeUsed: 999, timeLimit: 60, streakBefore: 99 }) <= 100 * 1 * 1 * 2, 'streak cap');
      assert(S.timeFactor(120, 60) === 1 && S.timeFactor(0, 60) === 1.5, 'time factor bounds');
    }],

    ['16. Inductive: unique prediction, difficulty = minimal rule tier, distractors never predicted', () => {
      build();
      const ind = pool.filter((e) => e.module === 'inductive');
      assert(ind.length >= N * LEVELS.length, 'inductive exercises missing');
      const kinds = new Set();
      for (const ex of ind) {
        kinds.add(ex.kind);
        const { figure, visible, target } = ex.data;
        const res = RT.sequences.solve(figure, visible, target);
        const keys = Object.keys(res.predictions);
        eq(keys.length, 1, `${ex.id}: predictions`);
        eq(res.minTier, RT.difficulty.moduleConfig('inductive').minTier[ex.difficulty], `${ex.id}: tier`);
        assert(res.consistent.length >= 1, `${ex.id}: no consistent hypothesis`);
        if (ex.options) {
          const hits = ex.options.filter((o) => res.predictions[RT.figures.frameKey(o.payload.frame)]);
          eq(hits.map((o) => o.id), [ex.correctAnswer], `${ex.id}: only the correct option may be predicted`);
          eq(new Set(ex.options.map((o) => o.text)).size, ex.options.length, `${ex.id}: duplicate figures among options`);
        } else eq(ex.correctAnswer, keys[0], `${ex.id}: paint answer`);
      }
      assert(kinds.size >= 2, 'at least two exercise kinds expected, got ' + [...kinds]);
      // tampering: change one visible figure so that the rule no longer fits -> must be rejected
      const ex = clone(ind.find((e) => e.kind === 'next'));
      const f = ex.data.visible[0].slice(); f[0] = (f[0] + 1) % 3; ex.data.visible[0] = f;
      assert(!RT.validator.validateExercise(ex).ok, 'tampered figure accepted');
    }],

    ['17. i18n: EN and ES dictionaries have the same keys and placeholders; no key is missing', () => {
      const en = RT.i18n.keys('en'), es = RT.i18n.keys('es');
      eq(en.slice().sort(), es.slice().sort(), 'key sets differ');
      assert(en.length > 150, 'dictionary suspiciously small');
      const ph = (s) => (String(s).match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');
      for (const k of en) {
        const a = RT.i18n.withLang('en', () => RT.t(k, {})), b = RT.i18n.withLang('es', () => RT.t(k, {}));
        eq(ph(a), ph(b), `placeholders of ${k}`);
        assert(String(a).length && String(b).length, 'empty translation for ' + k);
      }
      eq(RT.i18n.missing(), [], 'missing keys reported');
      eq(RT.i18n.DEFAULT_LANG, 'en', 'English must be the default');
      eq(RT.i18n.withLang('es', () => RT.i18n.lang), 'es', 'withLang switches the language');
      eq(RT.i18n.lang, 'en', 'withLang must restore the previous language');
    }],

    ['18. Language never changes the exercise: same seed -> same constraints, answers and option order in EN and ES', () => {
      const names = (x) => JSON.stringify(x, (k, v) => (typeof v === 'string' && !['type', 'kind', 'id'].includes(k) && !/^[A-Z]$/.test(v) && isNaN(+v) ? '~' : v));
      for (const m of MODULES) for (const l of LEVELS) for (let i = 0; i < Math.min(N, 30); i++) {
        const a = RT.generator.generateFromSeed(m, l, `p${i}`, { lang: 'en' }).exercise, b = RT.generator.generateFromSeed(m, l, `p${i}`, { lang: 'es' }).exercise;
        eq(a.lang, 'en'); eq(b.lang, 'es');
        const f = (e) => names([e.kind, e.constraints, e.correctAnswer, e.answerType, (e.options || []).map((o) => [o.id, o.payload && Object.keys(o.payload)])]);
        assert(f(a) === f(b), `${m} L${l} seed p${i}: EN and ES versions differ structurally`);
        if (m === 'english') eq([a.question, a.options.map((o) => o.text)], [b.question, b.options.map((o) => o.text)], 'English-test content stays English in both languages');
        else assert(a.explanation.steps.length === b.explanation.steps.length, `${m}: explanation length differs by language`);
        if (m !== 'english' && m !== 'inductive') assert(JSON.stringify(a.data.rules) !== JSON.stringify(b.data.rules) || a.data.rules.length === 0, `${m}: rules are not translated`);
      }
    }],

    ['19. Every text of an English-language exercise is English (no guillemets / Spanish accents) and vice versa', () => {
      const strings = (o, out = [], path = '') => {
        if (typeof o === 'string') { if (!/passage|completed|sva\.rule|"ruleEs"|ruleEs|ruleEn/.test(path)) out.push(o); }
        else if (o && typeof o === 'object') for (const k of Object.keys(o)) strings(o[k], out, path + '.' + k);
        return out;
      };
      for (const m of ['scheduling', 'positional', 'calendar', 'inductive']) for (const l of LEVELS) for (let i = 0; i < 15; i++) {
        const en = RT.generator.generateFromSeed(m, l, `q${i}`, { lang: 'en' }).exercise;
        for (const s of strings({ q: en.question, d: en.data, e: en.explanation, o: en.options })) assert(!/[«»áéíóúñ¿¡]/.test(s), `${m} L${l}: Spanish text in English exercise: ${s.slice(0, 80)}`);
        const es = RT.generator.generateFromSeed(m, l, `q${i}`, { lang: 'es' }).exercise;
        assert(/[áéíóúñ¿¡«»]|\b(el|la|los|las|de|en|que|con|por|una|un)\b/.test(es.question + ' ' + JSON.stringify(es.data.rules || []) + JSON.stringify(es.explanation.steps[0])), `${m}: Spanish exercise does not look Spanish`);
      }
    }],

    ['20. Language switch: setting persists, same exercise is rebuilt in the new language, timer/selection kept', () => {
      withStorage(() => {
        try {
          const st = RT.createState();
          eq(st.state.settings.lang, 'en', 'default language'); eq(RT.i18n.lang, 'en');
          st.startExercise({ module: 'inductive', difficulty: 1, seed: 'sw1' });
          const en = st.state.exercise;
          eq(en.lang, 'en');
          st.updateSettings({ lang: 'es' });
          eq(RT.i18n.lang, 'es'); eq(st.state.exercise.lang, 'es'); eq(st.state.exercise.seed, en.seed);
          eq(st.state.exercise.correctAnswer, en.correctAnswer, 'answer unchanged by language');
          assert(st.state.exercise.question !== en.question, 'question text should change language');
          eq(RT.storage.load().settings.lang, 'es', 'persisted');
          const st2 = RT.createState();
          eq(st2.state.settings.lang, 'es', 'restored on reload'); eq(RT.i18n.lang, 'es');
          st2.startExercise({ module: 'scheduling', difficulty: 1 });
          assert(st2.state.exercise.lang === 'es', 'new exercises use the active language');
          const ok = st2.submit(st2.state.exercise.correctAnswer); assert(ok.correct, 'correct answer in Spanish');
          RT.storage.save(Object.assign(RT.storage.load(), { settings: Object.assign(RT.storage.load().settings, { lang: 'xx' }) }));
          eq(RT.storage.load().settings.lang, 'en', 'invalid language falls back to English');
        } finally { RT.i18n.setLang('en'); }
      });
    }],

    ['21. Inductive paint answers: free painting is graded as an exact figure', () => {
      build();
      const ex = pool.find((e) => e.module === 'inductive' && e.kind === 'paint');
      assert(ex, 'no paint exercise generated');
      const C = RT.validator.checkAnswer;
      assert(C(ex, ex.correctAnswer).correct, 'correct painting rejected');
      const wrong = ex.correctAnswer.slice(0, 1) === '0' ? '2' + ex.correctAnswer.slice(1) : '0' + ex.correctAnswer.slice(1);
      assert(!C(ex, wrong).correct, 'wrong painting accepted');
      assert(!C(ex, null).correct, 'null accepted');
    }],
  ];

  async function run() {
    let failed = 0;
    for (const [name, fn] of tests) {
      const t0 = Date.now();
      try { await fn(); results.push({ name, ok: true, ms: Date.now() - t0 }); }
      catch (e) { failed++; results.push({ name, ok: false, ms: Date.now() - t0, error: e.message }); }
    }
    return { failed, results, N };
  }

  if (isNode) {
    run().then(({ failed, results }) => {
      for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  (${r.ms} ms)${r.ok ? '' : '\n      ' + r.error}`);
      console.log(`\n${results.length - failed}/${results.length} tests passed  (N=${N} per module & level = ${N * MODULES.length * LEVELS.length} exercises)`);
      process.exit(failed ? 1 : 0);
    });
  } else {
    RT.runTests = run;
  }
})();
