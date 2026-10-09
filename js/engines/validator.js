/**
 * validator.js — the gatekeeper.
 *
 *   validateExercise(ex)  -> an exercise may be shown ONLY if ok === true
 *   checkAnswer(ex, ans)  -> grades the user's answer
 *
 * validateExercise never trusts the generator: it re-solves the exercise from
 * its serialised constraints through the module's verify() and compares the
 * solver result with ex.correctAnswer.
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});

  const REQUIRED = ['id', 'module', 'lang', 'difficulty', 'question', 'data', 'constraints', 'correctAnswer', 'explanation', 'createdAt', 'timeLimit'];

  function sameAnswer(a, b) {
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b)) return false;
      const x = [...new Set(a)].sort((p, q) => p - q);
      const y = [...new Set(b)].sort((p, q) => p - q);
      return x.length === y.length && x.every((v, i) => v === y[i]);
    }
    return a === b;
  }

  function validateExercise(ex) {
    return RT.i18n.withLang(ex && ex.lang, () => validateInLang(ex));
  }

  function validateInLang(ex) {
    const errors = [];
    const out = { ok: false, errors, solutionCount: null, solverAnswer: null, optionValidity: null };
    try {
      for (const f of REQUIRED) if (ex[f] === undefined || ex[f] === null) errors.push('missing field: ' + f);
      const mod = RT.modules && RT.modules[ex.module];
      if (!mod) errors.push('unknown module: ' + ex.module);
      if (errors.length) return out;

      const diff = RT.difficulty.verify(ex);
      if (!diff.ok) errors.push(...diff.errors);

      if (ex.options) {
        const ids = ex.options.map((o) => o.id);
        const texts = ex.options.map((o) => o.text);
        if (new Set(ids).size !== ids.length) errors.push('duplicate option ids');
        if (new Set(texts).size !== texts.length) errors.push('duplicate option texts');
        if (texts.some((t) => !String(t).trim())) errors.push('empty option text');
        if (!ids.includes(ex.correctAnswer)) errors.push('correctAnswer is not one of the options');
      }

      if (!ex.explanation.steps || !ex.explanation.steps.length) errors.push('empty explanation');

      const v = mod.verify(ex);
      errors.push(...(v.errors || []));
      out.solutionCount = v.solutionCount;
      out.solverAnswer = v.solverAnswer;
      out.optionValidity = v.optionValidity || null;

      if (!sameAnswer(v.solverAnswer, ex.correctAnswer)) {
        errors.push('solver answer ' + JSON.stringify(v.solverAnswer) + ' != correctAnswer ' + JSON.stringify(ex.correctAnswer));
      }
      if (v.optionValidity) {
        const valid = Object.keys(v.optionValidity).filter((k) => v.optionValidity[k]);
        if (valid.length !== 1) errors.push('expected exactly 1 valid option, solver found ' + valid.length + ' (' + valid.join(',') + ')');
        else if (valid[0] !== ex.correctAnswer) errors.push('valid option ' + valid[0] + ' != correctAnswer ' + ex.correctAnswer);
      }
    } catch (e) {
      errors.push('validator exception: ' + (e && e.message ? e.message : e));
    }
    out.ok = errors.length === 0;
    return out;
  }

  /** @returns {{correct:boolean}} */
  function checkAnswer(ex, userAnswer) {
    if (userAnswer === null || userAnswer === undefined) return { correct: false };
    return { correct: sameAnswer(userAnswer, ex.correctAnswer) };
  }

  RT.validator = { validateExercise, checkAnswer, sameAnswer };
})();
