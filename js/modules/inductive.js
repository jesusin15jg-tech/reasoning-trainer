/**
 * inductive.js — MODULE E: inductive reasoning on figure sequences.
 *
 * A segmented figure (triangles and squares) is shown in a sequence of colourings — empty, green (stripes)
 * or blue (dots). The same hidden rule turns each figure into the next one. Exercise kinds:
 *   next    : which figure comes next? (multiple choice)
 *   missing : which figure is missing from the middle of the sequence? (multiple choice)
 *   paint   : paint the figure that comes next (free painting, exact match)
 *
 * VALIDATION: sequences.solve() enumerates every rule of the library that fits the visible figures; the
 * exercise is accepted only if they all predict the same figure and the simplest of them has the tier that the
 * difficulty level demands. Wrong options must not be predicted by any consistent rule.
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const F = RT.figures, S = RT.sequences, D = RT.difficulty;
  const LETTERS = ['A', 'B', 'C', 'D', 'E'];
  const WHY = ['unchanged', 'partial', 'oneCell', 'shifted', 'colors', 'mirror', 'cycled'];
  const t = (k, p) => RT.i18n.t(k, p);
  const cfg = () => D.moduleConfig('inductive');
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  /* ------------------------------ rule + frame generation ------------------------------ */

  function naturalKs(R) {
    return [...new Set([1, 2, 3, R - 1, R - 2, R - 3].filter((k) => k >= 1 && k <= R - 1))];
  }

  function sampleTier1(rng, fig) {
    const bases = S.basesFor(fig.id), nat = naturalKs(fig.ring.length);
    const kind = rng.weighted([['rot', 3], ['swap', 1], ['flipH', 1], ['flipV', 1], ['grow', 2], ['shrink', 1], ['cycAll', 1]]);
    let pool = bases.filter((b) => b.kind === kind);
    if (kind === 'rot') pool = pool.filter((b) => nat.includes(b.p.k));
    return rng.pick(pool);
  }

  function sampleTier2(rng, fig) {
    const bases = S.basesFor(fig.id), nat = naturalKs(fig.ring.length);
    const kinds = [['rotColor', 3], ['rotGB', 3]];
    if (fig.triCount < fig.n) kinds.push(['cycShape', 2]);
    const kind = rng.weighted(kinds);
    let pool = bases.filter((b) => b.kind === kind);
    if (kind === 'rotColor') pool = pool.filter((b) => nat.includes(b.p.k));
    if (kind === 'rotGB') pool = pool.filter((b) => nat.includes(b.p.kg) && nat.includes(b.p.kb));
    return rng.pick(pool);
  }

  function pickRule(rng, fig, level) {
    if (level === 1) return S.single(sampleTier1(rng, fig));
    if (level === 2) {
      if (rng.chance(0.55)) return S.single(sampleTier2(rng, fig));
      const a = sampleTier1(rng, fig);
      let b = sampleTier1(rng, fig);
      for (let i = 0; i < 6 && b === a; i++) b = sampleTier1(rng, fig);
      return b === a ? null : S.alt(a, b);
    }
    const a = rng.chance(0.5) ? sampleTier2(rng, fig) : sampleTier1(rng, fig);
    let b = a.tier === 2 ? (rng.chance(0.5) ? sampleTier2(rng, fig) : sampleTier1(rng, fig)) : sampleTier2(rng, fig);
    if (b === a) return null;
    return rng.chance(0.5) ? S.alt(a, b) : S.alt(b, a);
  }

  function initialFrame(rng, fig, rule) {
    const kinds = [rule.a.kind, rule.b && rule.b.kind];
    const n = fig.n;
    let f = F.blank(n);
    if (kinds.includes('grow') && !kinds.includes('shrink')) {
      const k = rng.int(0, 1);
      for (const i of rng.sample([...Array(n).keys()], k)) f[i] = rng.int(1, 2);
      return f;
    }
    if (kinds.includes('shrink') && !kinds.includes('grow')) {
      f = f.map(() => rng.weighted([[1, 1], [2, 1], [0, 0.15]]));
      return f;
    }
    return f.map(() => rng.weighted([[0, 0.38], [1, 0.34], [2, 0.28]]));
  }

  /* ------------------------------ distractors ------------------------------ */

  function candidatesFor(fig, ctx) {
    const { frames, target, answer, prev } = ctx;
    const out = [];
    const push = (frame, why) => { if (frame && !F.equal(frame, answer)) out.push({ frame, why }); };
    push(prev, 'unchanged');
    const bases = S.basesFor(fig.id);
    // rules that fit only the first step(s) but break later
    const f0 = frames[0], f1 = frames[1];
    for (const b of bases) {
      const g1 = b.apply(f0);
      if (!g1 || !F.equal(g1, f1)) continue;
      const sim = S.simulate(S.single(b), f0, target);
      if (sim) push(sim[target], 'partial');
    }
    for (let i = 0; i < fig.n; i++) for (const v of F.COLORS) if (v !== answer[i]) { const g = answer.slice(); g[i] = v; push(g, 'oneCell'); }
    const byId = (id) => bases.find((b) => b.id === id);
    const R = fig.ring.length;
    for (const id of ['rot:1', 'rot:' + (R - 1)]) push(byId(id).apply(answer), 'shifted');
    push(byId('swap').apply(answer), 'colors');
    push(byId('flipH').apply(answer), 'mirror'); push(byId('flipV').apply(answer), 'mirror');
    push(byId('cycAll:1').apply(answer), 'cycled');
    return out;
  }

  function pickDistractors(rng, fig, ctx, count) {
    const seen = new Set([F.frameKey(ctx.answer)]);
    const byWhy = {};
    for (const c of candidatesFor(fig, ctx)) {
      const k = F.frameKey(c.frame);
      if (seen.has(k)) continue;
      seen.add(k);
      (byWhy[c.why] = byWhy[c.why] || []).push(c);
    }
    const chosen = [];
    const order = rng.shuffle(Object.keys(byWhy));
    for (const w of order) if (chosen.length < count) chosen.push(rng.pick(byWhy[w]));
    const rest = rng.shuffle(order.flatMap((w) => byWhy[w]).filter((c) => !chosen.includes(c)));
    while (chosen.length < count && rest.length) chosen.push(rest.pop());
    return chosen.length === count ? chosen : null;
  }

  /* ------------------------------ explanation ------------------------------ */

  function buildExplanation(ex) {
    const { figure, visible, target } = ex.data;
    const res = S.solve(figure, visible, target);
    const rule = S.simplest(res);
    const steps = [];
    const known = visible.map((v, i) => (v ? i + 1 : null)).filter(Boolean);
    const isMissing = ex.kind === 'missing';
    steps.push(RT.explanation.step(t('ind.exp.seq'), isMissing ? t('ind.exp.seq.missing', { total: visible.length, hole: target + 1 }) : t('ind.exp.seq.next', { count: visible.length })));
    steps.push(RT.explanation.step(t('ind.exp.rule'), rule ? S.describe(figure, rule) : '—'));
    const items = [];
    for (let i = 0; i + 1 < visible.length; i++) {
      if (visible[i] && visible[i + 1]) items.push(t('ind.exp.check.ok', { a: i + 1, b: i + 2 }));
    }
    if (isMissing) items.push(t('ind.exp.check.hole', { a: target, h: target + 1, b: target + 2 }));
    steps.push(RT.explanation.step(t('ind.exp.check'), t('ind.exp.check.text'), items));
    const correct = ex.options ? ex.options.find((o) => o.id === ex.correctAnswer) : null;
    steps.push(RT.explanation.step(t('ind.exp.result'), ex.kind === 'paint' ? t('ind.exp.result.paint', { k: target }) : isMissing ? t('ind.exp.result.missing', { id: correct.id, a: target, h: target + 1 }) : t('ind.exp.result.next', { id: correct.id, k: target })));
    steps.push(RT.explanation.step(t('ind.exp.unique'), t('ind.exp.unique.text', { fit: res.consistent.length, total: res.spaceSize })));
    const notes = {};
    if (ex.options) {
      for (const o of ex.options) notes[o.id] = o.id === ex.correctAnswer ? t('ind.why.correct') : t('ind.why.' + o.payload.why);
      steps.push(RT.explanation.step(t('ind.exp.others'), t('ind.exp.others.text'), ex.options.filter((o) => o.id !== ex.correctAnswer).map((o) => `${o.id}) ${notes[o.id]}`)));
    }
    const answerFrame = Object.values(res.predictions)[0] ? Object.values(res.predictions)[0].frame : null;
    return { steps, visual: { type: 'sequence', figure, frames: visible, hole: target, answer: answerFrame, known }, optionNotes: notes };
  }

  /* ------------------------------ generate / verify ------------------------------ */

  function generate(rng, level) {
    const c = cfg();
    const kind = rng.pick(c.kinds[level]);
    const fig = F.get(rng.pick(c.figures[level]));
    const rule = pickRule(rng, fig, level);
    if (!rule) return null;
    const f0 = initialFrame(rng, fig, rule);
    const total = kind === 'missing' ? c.totalMissing[level] : c.visibleNext[level] + 1;
    const frames = S.simulate(rule, f0, total - 1);
    if (!frames) return null;
    for (let i = 0; i + 1 < frames.length; i++) if (F.equal(frames[i], frames[i + 1])) return null; // every step must change something
    if (frames.every((f) => F.equal(f, frames[0]))) return null;
    const target = kind === 'missing' ? rng.int(2, total - 3) : total - 1;
    const visible = kind === 'missing' ? frames.map((f, i) => (i === target ? null : f)) : frames.slice(0, target);
    const answer = frames[target];
    const res = S.solve(fig.id, visible, target);
    const preds = Object.keys(res.predictions);
    if (preds.length !== 1 || preds[0] !== F.frameKey(answer)) return null; // ambiguous or wrong
    if (res.minTier !== c.minTier[level]) return null; // difficulty must equal the real complexity of the rule

    const ex = {
      kind, answerType: kind === 'paint' ? 'frame' : 'option',
      question: t('ind.q.' + kind),
      data: { instruction: t('ind.instr'), figure: fig.id, visible: visible.map((f) => (f ? f.slice() : null)), target, rules: [] },
      constraints: [],
      meta: { difficultyExempt: true, constraintCount: 0, kinds: [kind], rule: rule.id, tier: res.minTier, consistent: res.consistent.length },
    };
    if (kind === 'paint') {
      ex.options = null;
      ex.correctAnswer = F.frameKey(answer);
    } else {
      const prev = frames[target - 1];
      const ds = pickDistractors(rng, fig, { frames, target, answer, prev }, c.options[level] - 1);
      if (!ds) return null;
      const all = rng.shuffle([{ frame: answer, why: 'correct' }, ...ds]);
      ex.options = all.map((o, i) => ({ id: LETTERS[i], text: F.frameKey(o.frame), payload: { frame: o.frame, why: o.why } }));
      ex.correctAnswer = LETTERS[all.findIndex((o) => o.why === 'correct')];
    }
    ex.explanation = buildExplanation(ex);
    return ex;
  }

  function verify(ex) {
    const errors = [];
    const { figure, visible, target } = ex.data;
    const fig = F.get(figure);
    const c = cfg();
    if (!c.figures[ex.difficulty].includes(figure)) errors.push('figure not allowed at this level');
    if (!c.kinds[ex.difficulty].includes(ex.kind)) errors.push('exercise kind not allowed at this level');
    if (!visible[0]) errors.push('first figure must be visible');
    if (visible.some((f) => f && (f.length !== fig.n || f.some((v) => ![0, 1, 2].includes(v))))) errors.push('malformed figure');
    if (visible[target] !== undefined && visible[target] !== null) errors.push('target figure is not hidden');
    const res = S.solve(figure, visible, target);
    const keys = Object.keys(res.predictions);
    if (!keys.length) errors.push('no rule of the library fits the visible figures');
    if (keys.length > 1) errors.push('ambiguous: ' + keys.length + ' different predictions');
    if (res.minTier !== c.minTier[ex.difficulty]) errors.push(`rule complexity tier ${res.minTier} != ${c.minTier[ex.difficulty]} required by level ${ex.difficulty}`);
    if (ex.question !== t('ind.q.' + ex.kind)) errors.push('question text mismatch');
    if (ex.data.instruction !== t('ind.instr')) errors.push('instruction text mismatch');
    const predicted = keys.length === 1 ? keys[0] : null;
    let solverAnswer = predicted, optionValidity = null;
    if (ex.kind === 'paint') {
      if (ex.options) errors.push('paint exercises have no options');
      if (ex.answerType !== 'frame') errors.push('paint exercises need answerType frame');
    } else {
      if (!ex.options || ex.options.length !== c.options[ex.difficulty]) errors.push('wrong number of options');
      else {
        optionValidity = {};
        for (const o of ex.options) {
          const fk = F.frameKey(o.payload.frame);
          if (o.text !== fk) errors.push('option text does not match its figure');
          if (!(o.id === ex.correctAnswer ? o.payload.why === 'correct' : WHY.includes(o.payload.why))) errors.push('bad option provenance for ' + o.id);
          optionValidity[o.id] = !!res.predictions[fk];
        }
        const hit = ex.options.filter((o) => optionValidity[o.id]);
        solverAnswer = hit.length === 1 ? hit[0].id : null;
      }
    }
    if (!errors.length && !same(buildExplanation(ex), ex.explanation)) errors.push('explanation does not match exercise data');
    return { errors, solutionCount: keys.length, solverAnswer, optionValidity };
  }

  RT.registerModule({
    id: 'inductive', label: 'Inductive Patterns', answerType: 'option', generate, verify,
  });
  RT.inductive = { buildExplanation, pickRule, WHY };
})();
