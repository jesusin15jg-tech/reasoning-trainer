/**
 * generator.js — module registry + validated generation pipeline.
 *
 *   RANDOM -> SOLVE -> VALIDATE -> ACCEPT      (never RANDOM -> DISPLAY)
 *
 * generateFromSeed() is fully deterministic: the same (module, difficulty, seed)
 * always returns the same exercise, which is what makes debugging possible.
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  RT.modules = RT.modules || {};

  const MAX_ATTEMPTS = 300;
  const MAX_SEED_RETRIES = 6;

  /**
   * A module must provide:
   *   id, label, description, answerType ('option' | 'dates')
   *   generate(rng, level) -> exercise | null     (null = rejected candidate)
   *   verify(ex)           -> { errors[], solutionCount, solverAnswer, optionValidity? }
   */
  function registerModule(mod) {
    for (const f of ['id', 'label', 'generate', 'verify']) {
      if (!mod[f]) throw new Error('registerModule: missing ' + f);
    }
    RT.modules[mod.id] = mod;
  }

  function signatureOf(ex) {
    const basis = JSON.stringify([ex.module, ex.difficulty, ex.question, ex.data && ex.data.rules, ex.options && ex.options.map((o) => o.text)]);
    return RT.hashString(basis).toString(36);
  }

  /** Deterministic generation from a seed. Returns { exercise, attempts, rejected } or throws. */
  function generateFromSeed(moduleId, difficulty, seed, opts = {}) {
    const lang = RT.i18n.isLang(opts.lang) ? opts.lang : RT.i18n.lang;
    return RT.i18n.withLang(lang, () => generateInLang(moduleId, difficulty, seed, opts, lang));
  }

  function generateInLang(moduleId, difficulty, seed, opts, lang) {
    const mod = RT.modules[moduleId];
    if (!mod) throw new Error('Unknown module: ' + moduleId);
    const rejected = [];
    const max = opts.maxAttempts || MAX_ATTEMPTS;
    for (let attempt = 1; attempt <= max; attempt++) {
      const rng = new RT.RNG(`${seed}|${moduleId}|${difficulty}|${attempt}`);
      let ex;
      try {
        ex = mod.generate(rng, difficulty);
      } catch (e) {
        rejected.push({ attempt, errors: ['generator exception: ' + e.message] });
        continue;
      }
      if (!ex) continue; // silently rejected candidate
      ex.module = moduleId;
      ex.lang = lang;
      ex.difficulty = difficulty;
      ex.seed = String(seed);
      ex.id = `${moduleId}-L${difficulty}-${seed}`;
      ex.createdAt = ex.createdAt || Date.now();
      ex.timeLimit = RT.difficulty.pickRecommendedTime(rng.child('time'), difficulty);
      ex.meta = ex.meta || {};
      ex.meta.attempts = attempt;
      const v = RT.validator.validateExercise(ex);
      if (!v.ok) {
        rejected.push({ attempt, errors: v.errors });
        continue;
      }
      ex.meta.solutionCount = v.solutionCount;
      ex.meta.solverAnswer = v.solverAnswer;
      ex.meta.signature = signatureOf(ex);
      return { exercise: ex, attempts: attempt, rejected };
    }
    const err = new Error(`No valid exercise after ${max} attempts (${moduleId}, level ${difficulty}, seed ${seed})`);
    err.rejected = rejected;
    throw err;
  }

  /** Validated, pre-built static exercise used only if live generation keeps failing. */
  function fallbackExercise(moduleId, difficulty, rng, lang) {
    lang = RT.i18n.isLang(lang) ? lang : RT.i18n.lang;
    const pool = ((((RT.fallbacks || {})[lang] || {})[moduleId]) || {})[difficulty] || [];
    const candidates = rng ? rng.shuffle(pool) : pool;
    for (const raw of candidates) {
      const ex = JSON.parse(JSON.stringify(raw));
      ex.createdAt = Date.now();
      ex.meta = Object.assign({}, ex.meta, { fallback: true });
      if (RT.validator.validateExercise(ex).ok) return ex;
    }
    return null;
  }

  /**
   * Public entry point.
   * @param {{module:string, difficulty:number, seed?:string, recentSignatures?:string[]}} req
   */
  function generateExercise(req) {
    const { module: moduleId, difficulty } = req;
    const recent = req.recentSignatures || [];
    // An explicit seed means "reproduce exactly this exercise" => no repetition filter.
    if (req.seed) return generateFromSeed(moduleId, difficulty, req.seed, { lang: req.lang });

    let lastError = null;
    for (let i = 0; i < MAX_SEED_RETRIES; i++) {
      const seed = RT.newSeed();
      try {
        const res = generateFromSeed(moduleId, difficulty, seed, { lang: req.lang });
        if (recent.includes(res.exercise.meta.signature)) continue; // never repeat immediately
        return res;
      } catch (e) {
        lastError = e;
      }
    }
    const fb = fallbackExercise(moduleId, difficulty, new RT.RNG(RT.newSeed()), req.lang);
    if (fb) return { exercise: fb, attempts: MAX_ATTEMPTS, rejected: (lastError && lastError.rejected) || [], usedFallback: true };
    throw lastError || new Error('Unable to generate exercise');
  }

  RT.registerModule = registerModule;
  RT.generator = { generateExercise, generateFromSeed, fallbackExercise, signatureOf, MAX_ATTEMPTS };
})();
