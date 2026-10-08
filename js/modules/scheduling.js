/**
 * scheduling.js — MODULE A: Resource Scheduling (core + "window" question kinds).
 *
 * Every rule is converted into blocked intervals (solver.blockedIntervals);
 * the answer is derived from the free intervals via interval algebra and is
 * independently cross-checked by a 5-minute grid brute force.
 *
 * Kinds handled here:  firstStart · lastStart · maxDuration · allWindows
 * Kinds in scheduling-kinds.js: compatible · conflict · maxConcurrent
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const S = RT.solver;
  const I = RT.intervals;
  const D = RT.difficulty;
  const X = RT.explanation;

  const KINDS = {};
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const LETTERS = ['A', 'B', 'C', 'D', 'E'];
  const withIds = (arr) => arr.map((o, i) => Object.assign({ id: LETTERS[i] }, o));
  const hm = I.fmt;
  const span = (a, b) => `${hm(a)} to ${hm(b)}`;

  /* ------------------------- rules -> problem ----------------------------- */

  function problemFromRules(base, rules) {
    const machines = base.machines.map((m) => ({ id: m.id, name: m.name, blocks: [] }));
    const extra = { crewOff: [], exclusiveWith: [], capacity: null };
    for (const r of rules) {
      if (r.type === 'block') machines.find((m) => m.id === r.machine).blocks.push({ start: r.start, end: r.end, kind: r.kind, label: r.label });
      else if (r.type === 'crew') extra.crewOff.push({ start: r.start, end: r.end, label: r.label });
      else if (r.type === 'exclusive') extra.exclusiveWith.push(r.other);
      else if (r.type === 'capacity') extra.capacity = r.k;
    }
    return { dayStart: base.dayStart, dayEnd: base.dayEnd, target: { machine: base.target.machine, duration: base.target.duration }, machines, extra };
  }

  function ruleText(r, base) {
    const name = (id) => base.machines.find((m) => m.id === id).name;
    switch (r.type) {
      case 'block':
        if (r.kind === 'maintenance') return `${name(r.machine)} is under maintenance (${r.label}) from ${span(r.start, r.end)}.`;
        if (r.machine === base.target.machine) return `${name(r.machine)} is occupied by "${r.label}" from ${span(r.start, r.end)}.`;
        return `${name(r.machine)} is running "${r.label}" from ${span(r.start, r.end)}.`;
      case 'crew': return `The crew is unavailable from ${span(r.start, r.end)} (${r.label}).`;
      case 'exclusive': return `${name(base.target.machine)} cannot run at the same time as any task on ${name(r.other)}.`;
      case 'capacity': return `At most ${r.k} machines may run tasks at the same time (power limit), including ${name(base.target.machine)}.`;
      default: throw new Error('unknown rule type ' + r.type);
    }
  }

  /* --------------------------- generation helpers ------------------------- */

  function newBase(rng, level, dur) {
    const cfg = D.moduleConfig('scheduling');
    const dayStart = rng.pick([420, 480, 540]);
    const dayEnd = dayStart + rng.pick([480, 540, 600]);
    const names = rng.sample(RT.pools.machines, cfg.machines[level]);
    return {
      dayStart, dayEnd,
      target: { machine: 'M0', duration: dur, job: rng.pick(RT.pools.jobs) },
      machines: names.map((nm, i) => ({ id: 'M' + i, name: nm })),
    };
  }

  function randomInterval(rng, lo, hi, minLen, maxLen) {
    const len = rng.step(minLen, maxLen, 15);
    const start = rng.step(lo, hi - len, 15);
    return { start, end: start + len };
  }

  /** Build a random ruleset for window-type questions. Returns {base, rules} or null. */
  function buildWindowRules(rng, level) {
    const [minC, maxC] = D.level(level).constraints;
    const c = rng.int(minC, maxC);
    const dur = rng.step(30, 120, 15);
    const base = newBase(rng, level, dur);
    const { dayStart, dayEnd } = base;
    const labels = rng.shuffle(RT.pools.jobs.filter((j) => j !== base.target.job));
    let li = 0;
    const rules = [];
    const block = (machine, kind, iv) => rules.push({ type: 'block', machine, kind, label: kind === 'task' ? labels[li++ % labels.length] : rng.pick(RT.pools.maintenance), start: iv.start, end: iv.end });
    const maxLen = level === 3 ? 90 : 120;
    const rnd = () => randomInterval(rng, dayStart, dayEnd, 30, maxLen);

    let fixed = 0; // rules other than own task blocks
    block('M0', 'maintenance', rnd()); fixed++;
    if (level === 1) {
      if (rng.chance(0.35)) { const iv = randomInterval(rng, dayStart + 120, dayEnd - 120, 30, 60); rules.push({ type: 'crew', label: 'lunch break', start: iv.start, end: iv.end }); fixed++; }
    } else {
      rules.push({ type: 'exclusive', other: 'M1' }); fixed++;
      const t1 = level === 2 ? rng.int(1, 2) : 1;
      for (let i = 0; i < t1; i++) { block('M1', 'task', rnd()); fixed++; }
      if (level === 2 && rng.chance(0.5)) { const iv = randomInterval(rng, dayStart + 120, dayEnd - 120, 30, 60); rules.push({ type: 'crew', label: 'lunch break', start: iv.start, end: iv.end }); fixed++; }
      if (level === 3) {
        const iv = randomInterval(rng, dayStart + 120, dayEnd - 120, 30, 60);
        rules.push({ type: 'crew', label: 'safety briefing', start: iv.start, end: iv.end }); fixed++;
        rules.push({ type: 'capacity', k: 2 }); fixed++;
        // two overlapping tasks on two different machines make the power limit bite
        const a = randomInterval(rng, dayStart, dayEnd - 60, 60, 90);
        const b0 = a.start + rng.step(15, 30, 15);
        block('M2', 'task', a);
        block('M3', 'task', { start: b0, end: Math.min(dayEnd, b0 + rng.step(45, 90, 15)) });
        fixed += 2;
        if (rng.chance(0.4) && c - fixed - 1 >= 1) { block('M2', 'task', randomInterval(rng, dayStart, dayEnd, 30, 60)); fixed++; }
      }
    }
    const own = c - fixed;
    if (own < 1) return null;
    for (let i = 0; i < own; i++) block('M0', 'task', rnd());
    if (rules.length !== c) return null;
    return { base, rules: rng.shuffle(rules) };
  }

  /** free-interval set after removing rule i (to test that every rule matters) */
  const freeWithout = (base, rules, i) => S.freeIntervals(problemFromRules(base, rules.filter((_, j) => j !== i)));

  function everyRuleMatters(base, rules, free) {
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      const isOwn = r.type === 'block' && r.machine === base.target.machine;
      if (!(isOwn || r.type === 'crew' || r.type === 'exclusive' || r.type === 'capacity')) continue;
      if (same(freeWithout(base, rules, i), free)) return false;
    }
    return true;
  }

  const shortGaps = (free, dur) => free.filter((f) => I.len(f) < dur);

  /* ---------------------------- option builders --------------------------- */

  function timeOptions(rng, correct, candidates, lo, hi, fmtFn, step = 15) {
    const picked = [];
    for (const t of rng.shuffle([...new Set(candidates)])) {
      if (t === correct || t < lo || t > hi || picked.includes(t)) continue;
      picked.push(t);
      if (picked.length === 4) break;
    }
    let guard = 0;
    while (picked.length < 4 && guard++ < 200) {
      const t = rng.step(lo, hi, step);
      if (t !== correct && !picked.includes(t)) picked.push(t);
    }
    if (picked.length < 4) return null;
    const all = [correct, ...picked].sort((x, y) => x - y);
    const options = withIds(all.map((t) => ({ text: fmtFn(t), payload: { minutes: t } })));
    return { options, correct: options[all.indexOf(correct)].id };
  }

  function windowListOptions(rng, wins, shorts, dur, day) {
    const fmtList = (l) => l.map(I.fmtRange).join('; ');
    const correct = wins;
    const muts = [];
    const clone = () => wins.map((w) => I.mk(w.start, w.end));
    const push = (l) => {
      const u = l.filter((i) => i.end - i.start >= 15);
      if (!u.length || same(u, correct) || muts.some((m) => same(m, u))) return;
      muts.push(u);
    };
    for (let t = 0; t < 40 && muts.length < 8; t++) {
      const l = clone();
      const k = rng.int(0, l.length - 1);
      switch (rng.int(1, 5)) {
        case 1: l[k].end += rng.pick([-30, -15, 15, 30]); if (l[k].end > day.end) l[k].end = day.end; break;
        case 2: l[k].start += rng.pick([-30, -15, 15, 30]); if (l[k].start < day.start) l[k].start = day.start; break;
        case 3: if (shorts.length) l.push(I.mk(shorts[0].start, shorts[0].end)); else l.length = 0; break;
        case 4: if (l.length > 1) l.splice(k, 1); else l.length = 0; break;
        case 5: if (l.length > 1) { const j = Math.min(k, l.length - 2); l.splice(j, 2, I.mk(l[j].start, l[j + 1].end)); } else l.length = 0; break;
      }
      l.sort((a, b) => a.start - b.start);
      if (l.every((x, i) => i === 0 || x.start >= l[i - 1].end)) push(l);
    }
    if (muts.length < 4) return null;
    const chosen = rng.sample(muts, 4);
    const all = rng.shuffle([{ list: correct, ok: true }, ...chosen.map((l) => ({ list: l, ok: false }))]);
    const options = withIds(all.map((x) => ({ text: fmtList(x.list), payload: { windows: x.list } })));
    return { options, correct: options[all.findIndex((x) => x.ok)].id };
  }

  /* ------------------------------ window kinds ---------------------------- */

  function questionFor(kind, base) {
    const M = base.machines[0].name;
    const job = base.target.job;
    const d = base.target.duration;
    switch (kind) {
      case 'firstStart': return `"${job}" needs ${d} continuous minutes on ${M}. What is the earliest time it can start?`;
      case 'lastStart': return `"${job}" needs ${d} continuous minutes on ${M} and must finish within the working day. What is the latest time it can start?`;
      case 'maxDuration': return `What is the longest continuous period (in minutes) during which ${M} could be used without breaking any rule?`;
      case 'allWindows': return `"${job}" needs ${d} continuous minutes on ${M}. Which option lists ALL the free periods long enough to hold it?`;
      default: throw new Error('bad kind');
    }
  }

  function makeWindowKind(kind) {
    return {
      generate(rng, level) {
        const built = buildWindowRules(rng, level);
        if (!built) return null;
        const { base, rules } = built;
        const dur = base.target.duration;
        const problem = problemFromRules(base, rules);
        const free = S.freeIntervals(problem);
        const wins = I.windows(free, dur);
        if (!wins.length) return null;
        if (!everyRuleMatters(base, rules, free)) return null;
        const shorts = shortGaps(free, dur);
        const needTrap = D.moduleConfig('scheduling').requireTrapGap[level];
        const first = wins[0].start;
        const last = I.latestStart(free, dur);
        let built2;
        const lo = base.dayStart;
        const hi = base.dayEnd;
        const blockedEnds = S.blockedIntervals(problem).map((b) => b.end);
        if (kind === 'firstStart') {
          if (first === base.dayStart) return null;
          if (needTrap && !shorts.some((g) => g.start < first)) return null;
          const cand = [...shorts.map((g) => g.start), ...blockedEnds, base.dayStart, first - 15, first - 30, first + 15, wins[wins.length - 1].start, ...wins.map((w) => w.start)];
          built2 = timeOptions(rng, first, cand, lo, hi - dur, hm);
        } else if (kind === 'lastStart') {
          if (last === base.dayEnd - dur) return null;
          if (needTrap && !shorts.some((g) => g.start > last)) return null;
          const cand = [...wins.map((w) => w.end), base.dayEnd - dur, last - 15, last - 30, last + 15, last + 30, ...shorts.map((g) => g.start), wins[0].start];
          built2 = timeOptions(rng, last, cand, lo, hi - dur + 30, hm);
        } else if (kind === 'maxDuration') {
          const longest = I.longest(free);
          if (free.filter((f) => I.len(f) === longest).length > 1) return null; // keep the explanation unambiguous
          const cand = [...free.map(I.len), longest + 15, longest + 30, longest - 15, longest - 30, dur, dur + 15];
          built2 = timeOptions(rng, longest, cand.filter((x) => x >= 15), 15, hi - lo, (m) => `${m} min`);
        } else {
          if (needTrap && !shorts.length) return null;
          built2 = windowListOptions(rng, wins, shorts, dur, { start: base.dayStart, end: base.dayEnd });
        }
        if (!built2) return null;
        const ex = {
          kind,
          question: questionFor(kind, base),
          data: {
            intro: `Working day: ${hm(base.dayStart)}–${hm(base.dayEnd)}. Times are on a 24-hour clock; a task that ends exactly when another starts does not conflict with it.`,
            base,
            rules: rules.map((r) => ruleText(r, base)),
          },
          constraints: rules,
          options: built2.options,
          correctAnswer: built2.correct,
          meta: { constraintCount: rules.length, kinds: rules.map((r) => r.type), machines: base.machines.length },
        };
        ex.explanation = explainWindow(ex);
        return ex;
      },
      verify: verifyWindow,
      explain: explainWindow,
    };
  }

  /* ----------------------------- verification ----------------------------- */

  function verifyWindow(ex) {
    const errors = [];
    const { base } = ex.data;
    const rules = ex.constraints;
    const dur = base.target.duration;
    if (!same(rules.map((r) => ruleText(r, base)), ex.data.rules)) errors.push('rules text does not match constraints');
    if (ex.question !== questionFor(ex.kind, base)) errors.push('question text does not match data');
    if (ex.meta.constraintCount !== rules.length) errors.push('constraintCount mismatch');
    const problem = problemFromRules(base, rules);
    const free = S.freeIntervals(problem);
    const wins = I.windows(free, dur);
    if (!wins.length) errors.push('no feasible window (contradictory constraints)');

    // independent cross-check on a 5-minute grid
    const grid = S.bruteForceStarts(problem);
    const gridWins = S.bruteForceWindows(problem);
    if (grid.length && grid[0] !== I.earliestStart(free, dur)) errors.push('grid/interval mismatch on earliest start');
    if (grid.length && grid[grid.length - 1] !== I.latestStart(free, dur)) errors.push('grid/interval mismatch on latest start');
    if (!I.sameList(gridWins, wins)) errors.push('grid/interval mismatch on windows');
    if (S.bruteForceLongest(problem) !== I.longest(free)) errors.push('grid/interval mismatch on longest free period');

    const validity = {};
    for (const o of ex.options) {
      if (ex.kind === 'firstStart') validity[o.id] = o.payload.minutes === I.earliestStart(free, dur);
      else if (ex.kind === 'lastStart') validity[o.id] = o.payload.minutes === I.latestStart(free, dur);
      else if (ex.kind === 'maxDuration') validity[o.id] = o.payload.minutes === I.longest(free);
      else validity[o.id] = I.sameList(o.payload.windows, wins);
    }
    const ok = Object.keys(validity).filter((k) => validity[k]);
    if (!same(explainWindow(ex), ex.explanation)) errors.push('explanation does not match solver output');
    return { errors, solutionCount: wins.length, solverAnswer: ok.length === 1 ? ok[0] : null, optionValidity: validity };
  }

  /* ------------------------------ explanation ----------------------------- */

  const SRC_ES = { 'own-task': 'tarea propia', 'own-maintenance': 'mantenimiento', exclusive: 'exclusión', crew: 'equipo', capacity: 'límite de potencia' };

  function buildTimeline(base, problem, free, dur, answerBlocks) {
    const rows = [];
    for (const m of problem.machines) {
      const bl = m.blocks.map((b) => ({ start: b.start, end: b.end, cls: b.kind === 'maintenance' ? 'maint' : m.id === base.target.machine ? 'task' : 'other', label: b.label }));
      if (bl.length) rows.push({ label: m.name, blocks: bl });
    }
    if (problem.extra.crewOff.length) rows.push({ label: 'Crew', blocks: problem.extra.crewOff.map((c) => ({ start: c.start, end: c.end, cls: 'crew', label: c.label })) });
    rows.push({ label: 'Free', blocks: free.map((f) => ({ start: f.start, end: f.end, cls: I.len(f) >= dur ? 'free' : 'short', label: I.len(f) + ' min' })) });
    if (answerBlocks && answerBlocks.length) rows.push({ label: 'Answer', blocks: answerBlocks.map((b) => Object.assign({ cls: 'answer' }, b)) });
    return { type: 'timeline', dayStart: base.dayStart, dayEnd: base.dayEnd, rows };
  }

  function explainWindow(ex) {
    const { base } = ex.data;
    const rules = ex.constraints;
    const dur = base.target.duration;
    const durEff = ex.kind === 'maxDuration' ? 0 : dur; // the job length is irrelevant for "longest period"
    const M = base.machines[0].name;
    const problem = problemFromRules(base, rules);
    const blocked = S.blockedIntervals(problem);
    const free = S.freeIntervals(problem);
    const wins = I.windows(free, dur);
    const shorts = shortGaps(free, durEff);
    const first = I.earliestStart(free, dur);
    const last = I.latestStart(free, dur);
    const longest = I.longest(free);
    const list = (l) => (l.length ? l.map(I.fmtRange).join(', ') : '—');
    const steps = [];
    steps.push(X.step('Datos', ex.kind === 'maxDuration'
      ? `Jornada ${hm(base.dayStart)}–${hm(base.dayEnd)}. Se busca el tramo libre más largo de ${M}.`
      : `Jornada ${hm(base.dayStart)}–${hm(base.dayEnd)}. El trabajo necesita ${dur} min continuos en ${M}.`));

    rules.forEach((r, i) => {
      const txt = ex.data.rules[i];
      let eff;
      if (r.type === 'block' && r.machine === base.target.machine) eff = `${M} queda bloqueada de ${hm(r.start)} a ${hm(r.end)} (${r.kind === 'maintenance' ? 'mantenimiento' : 'tarea propia'}).`;
      else if (r.type === 'block') eff = 'Es un dato sobre otra máquina; se usa en las reglas de exclusión / límite de potencia.';
      else if (r.type === 'crew') eff = `Nadie puede trabajar de ${hm(r.start)} a ${hm(r.end)}.`;
      else if (r.type === 'exclusive') eff = `Se bloquean los intervalos en que ${base.machines.find((m) => m.id === r.other).name} ejecuta tareas: ${list(blocked.filter((b) => b.source === 'exclusive').map((b) => I.mk(b.start, b.end)))}.`;
      else eff = `Se bloquean los instantes con ${r.k} o más máquinas ajenas en marcha: ${list(blocked.filter((b) => b.source === 'capacity').map((b) => I.mk(b.start, b.end)))}.`;
      steps.push(X.step(`Regla ${i + 1}`, `«${txt}» → ${eff}`));
    });

    const union = I.union(blocked);
    steps.push(X.step('Restricción derivada', `Unión de todos los bloqueos: ${list(union)}. (Los intervalos contiguos se funden: terminar justo cuando empieza otro NO es conflicto, pero tampoco deja hueco.)`));
    steps.push(X.step('Intervalos libres', `Dentro de la jornada quedan libres: ${free.map((f) => `${I.fmtRange(f)} (${I.len(f)} min${I.len(f) < durEff ? ', demasiado corto' : ''})`).join(', ')}.`));
    let concl;
    let marks;
    if (ex.kind === 'firstStart') { concl = `El primer hueco de al menos ${dur} min empieza a las ${hm(first)}. Respuesta: ${hm(first)}.`; marks = [{ start: first, end: first + dur, label: hm(first) }]; }
    else if (ex.kind === 'lastStart') { concl = `El último hueco válido termina a las ${hm(wins[wins.length - 1].end)}; restando ${dur} min, el último inicio posible es ${hm(last)}.`; marks = [{ start: last, end: last + dur, label: hm(last) }]; }
    else if (ex.kind === 'maxDuration') { const lf = free.find((f) => I.len(f) === longest); concl = `El tramo libre más largo es ${I.fmtRange(lf)}: ${longest} min.`; marks = [{ start: lf.start, end: lf.end, label: longest + ' min' }]; }
    else { concl = `Solo cuentan los tramos libres de al menos ${dur} min: ${list(wins)}. ${shorts.length ? `Se descartan por cortos: ${list(shorts)}.` : ''}`; marks = wins.map((w) => ({ start: w.start, end: w.end, label: I.fmtRange(w) })); }
    if (ex.kind !== 'maxDuration') steps.push(X.step('Filtro por duración', `Un hueco solo sirve si mide ≥ ${dur} min. Válidos: ${list(wins)}${shorts.length ? `; descartados: ${list(shorts)}` : ''}.`));
    steps.push(X.step('Conclusión', concl));

    // option notes
    const notes = {};
    const blockedAt = (t) => union.find((b) => t >= b.start && t < b.end);
    for (const o of ex.options) {
      const p = o.payload;
      if (ex.kind === 'firstStart' || ex.kind === 'lastStart') {
        const t = p.minutes;
        const target = ex.kind === 'firstStart' ? first : last;
        if (t === target) notes[o.id] = 'Correcta.';
        else {
          const conflict = union.find((b) => I.overlaps(I.mk(t, t + dur), b));
          const gap = shorts.find((g) => t >= g.start && t < g.end);
          if (gap) notes[o.id] = `Trampa: ${hm(t)} cae en el hueco ${I.fmtRange(gap)} que dura solo ${I.len(gap)} min (< ${dur}).`;
          else if (conflict) notes[o.id] = `Incorrecta: de ${hm(t)} a ${hm(t + dur)} el trabajo choca con el bloqueo ${I.fmtRange(conflict)}.`;
          else notes[o.id] = `Es una hora factible, pero no es la ${ex.kind === 'firstStart' ? 'primera' : 'última'} posible (${hm(target)}).`;
        }
      } else if (ex.kind === 'maxDuration') {
        notes[o.id] = p.minutes === longest ? 'Correcta.' : free.some((f) => I.len(f) === p.minutes) ? `Es la longitud de otro tramo libre, pero no del más largo (${longest} min).` : `Ningún tramo libre mide ${p.minutes} min.`;
      } else {
        if (I.sameList(p.windows, wins)) notes[o.id] = 'Correcta.';
        else {
          const extra = p.windows.filter((w) => !wins.some((x) => x.start === w.start && x.end === w.end));
          const missing = wins.filter((x) => !p.windows.some((w) => w.start === x.start && w.end === x.end));
          notes[o.id] = `Incorrecta: ${extra.length ? `incluye ${list(extra)} (no es un hueco libre válido)` : ''}${extra.length && missing.length ? '; ' : ''}${missing.length ? `omite ${list(missing)}` : ''}.`;
        }
      }
    }
    return { steps, visual: buildTimeline(base, problem, free, durEff, marks), optionNotes: notes };
  }

  for (const k of ['firstStart', 'lastStart', 'maxDuration', 'allWindows']) KINDS[k] = makeWindowKind(k);

  /* ------------------------------- module --------------------------------- */

  function generate(rng, level) {
    const kind = rng.pick(D.moduleConfig('scheduling').kinds[level]);
    const handler = KINDS[kind];
    if (!handler) throw new Error('scheduling kind not registered: ' + kind);
    const ex = handler.generate(rng, level);
    if (ex) ex.kind = kind;
    return ex;
  }

  function verify(ex) {
    const handler = KINDS[ex.kind];
    if (!handler) return { errors: ['unknown scheduling kind ' + ex.kind], solutionCount: 0, solverAnswer: null };
    return handler.verify(ex);
  }

  RT.scheduling = { KINDS, problemFromRules, ruleText, withIds, timeOptions, same, hm, span };
  RT.registerModule({
    id: 'scheduling',
    label: 'Resource Scheduling',
    description: 'Find free windows, conflicts and compatible machines from time-based rules.',
    answerType: 'option',
    generate,
    verify,
  });
})();
