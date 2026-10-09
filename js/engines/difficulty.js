/**
 * difficulty.js — difficulty engine.
 * Difficulty drives the GENERATION algorithm (constraint count, items, kinds,
 * search bias) and is re-checked AFTER generation by verify().
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});

  const LEVELS = {
    1: { name: 'Basic', constraints: [3, 4], time: [60, 90], multiplier: 1.0 },
    2: { name: 'Advanced', constraints: [5, 7], time: [75, 120], multiplier: 1.5 },
    3: { name: 'Expert', constraints: [8, 10], time: [90, 150], multiplier: 2.2 },
  };

  // Module-specific knobs. Everything the generators read lives here.
  const MODULE_CONFIG = {
    positional: {
      items: { 1: 5, 2: 6, 3: 7 },
      // how the generator picks the next constraint: strong cuts => few, blunt rules
      bias: { 1: 'strong', 2: 'strong', 3: 'random' },
      candidatePool: { 1: 8, 2: 4, 3: 6 },
      kinds: {
        1: ['position', 'who', 'sequence'],
        2: ['position', 'who', 'sequence', 'must', 'cannot'],
        3: ['position', 'who', 'sequence', 'must', 'cannot', 'could'],
      },
      constraintTypes: {
        1: ['abs', 'notAbs', 'oneOf', 'before', 'offset', 'adj', 'gap'],
        2: ['abs', 'notAbs', 'oneOf', 'before', 'offset', 'adj', 'gap', 'notAdj', 'block'],
        3: ['abs', 'notAbs', 'oneOf', 'before', 'offset', 'adj', 'gap', 'notAdj', 'block', 'cond', 'cond'],
      },
      // level 2 needs >=1 "indirect" rule, level 3 needs >=1 conditional/block
      requiredAnyOf: { 1: [], 2: ['gap', 'notAdj', 'block', 'cond', 'offset'], 3: ['cond', 'block'] },
      maxMultiSolutions: { 1: 24, 2: 40, 3: 60 },
      minMultiSolutions: 3,
    },
    scheduling: {
      machines: { 1: 3, 2: 4, 3: 5 },
      kinds: {
        1: ['firstStart', 'compatible', 'conflict'],
        2: ['firstStart', 'lastStart', 'maxDuration', 'compatible', 'conflict', 'maxConcurrent'],
        3: ['firstStart', 'lastStart', 'allWindows', 'maxDuration', 'compatible', 'conflict', 'maxConcurrent'],
      },
      requireTrapGap: { 1: false, 2: true, 3: true },
    },
    calendar: {
      people: { 1: 4, 2: 5, 3: 5 },
      ruleTypes: {
        1: ['weekday', 'date', 'holiday'],
        2: ['weekday', 'date', 'holiday', 'ordinal', 'range'],
        3: ['weekday', 'date', 'holiday', 'ordinal', 'range', 'ordinal', 'conditional'],
      },
      requiredAnyOf: { 1: [], 2: ['ordinal', 'range'], 3: ['conditional'] },
      maxAnswerSize: { 1: 12, 2: 9, 3: 7 },
    },
    inductive: {
      figures: { 1: ['diamond', 'quad8'], 2: ['quad8', 'frame3'], 3: ['frame3', 'quad8'] },
      kinds: { 1: ['next'], 2: ['next', 'missing'], 3: ['next', 'missing', 'paint'] },
      visibleNext: { 1: 4, 2: 5, 3: 5 }, // figures shown before the "?" in next/paint exercises
      totalMissing: { 2: 6, 3: 7 }, // figures in a "missing" sequence (one of them is hidden)
      options: { 1: 4, 2: 5, 3: 5 },
      // difficulty = complexity of the SIMPLEST rule that explains the visible figures (see sequences.js tiers)
      minTier: { 1: 1, 2: 2, 3: 3 },
    },
    english: {
      itemLevels: { 1: [1], 2: [1, 2], 3: [2, 3] },
      preferLevel: { 1: [1], 2: [2], 3: [3] },
    },
  };

  function level(l) {
    const cfg = LEVELS[l];
    if (!cfg) throw new Error('Unknown difficulty level: ' + l);
    return cfg;
  }

  function moduleConfig(moduleId) {
    return MODULE_CONFIG[moduleId] || {};
  }

  /** target number of constraints for a level (inclusive range, uniformly random) */
  function pickConstraintCount(rng, l) {
    const [a, b] = level(l).constraints;
    return rng.int(a, b);
  }

  function pickRecommendedTime(rng, l) {
    const [a, b] = level(l).time;
    return rng.step(a, b, 15);
  }

  /**
   * Post-generation difficulty check. `ex.meta.constraintCount` and `ex.meta.kinds`
   * (constraint types used) are filled in by the module generators.
   * Modules that are not constraint-count based (english) set meta.difficultyExempt.
   */
  function verify(ex) {
    const errors = [];
    if (!LEVELS[ex.difficulty]) errors.push('unknown difficulty ' + ex.difficulty);
    if (ex.meta && ex.meta.difficultyExempt) return { ok: errors.length === 0, errors };
    const [min, max] = level(ex.difficulty).constraints;
    const n = ex.meta && ex.meta.constraintCount;
    if (typeof n !== 'number') errors.push('missing meta.constraintCount');
    else if (n < min || n > max) errors.push(`constraintCount ${n} outside [${min},${max}] for level ${ex.difficulty}`);
    const req = (moduleConfig(ex.module).requiredAnyOf || {})[ex.difficulty] || [];
    if (req.length && !(ex.meta.kinds || []).some((k) => req.includes(k))) {
      errors.push('level ' + ex.difficulty + ' requires one of: ' + req.join(', '));
    }
    return { ok: errors.length === 0, errors };
  }

  RT.difficulty = { LEVELS, MODULE_CONFIG, level, moduleConfig, pickConstraintCount, pickRecommendedTime, verify };
})();
