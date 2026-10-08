/**
 * scheduling-kinds.js — extra question kinds for MODULE A.
 *   compatible    : which machine can host a fixed job slot
 *   conflict      : which two scheduled items overlap (adjacent ones do not)
 *   maxConcurrent : peak number of tasks running at the same time
 * Loaded after scheduling.js; registers into RT.scheduling.KINDS.
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const S = RT.solver;
  const I = RT.intervals;
  const D = RT.difficulty;
  const X = RT.explanation;
  const { KINDS, withIds, same, hm, span } = RT.scheduling;

  const REL_ES = { NO_OVERLAP: 'NO OVERLAP (separados)', ADJACENT: 'ADJACENT (se tocan; no es conflicto)', PARTIAL_OVERLAP: 'PARTIAL OVERLAP (conflicto)', FULL_OVERLAP: 'FULL OVERLAP (conflicto)' };
  const isConflict = (rel) => rel === 'PARTIAL_OVERLAP' || rel === 'FULL_OVERLAP';
  const rel = (a, b) => I.classify(I.mk(a.start, a.end), I.mk(b.start, b.end));

  /* ===================================================================== */
  /* compatible                                                             */
  /* ===================================================================== */

  function compatRuleText(r, base) {
    const name = (id) => base.machines.find((m) => m.id === id).name;
    if (r.type === 'block') {
      return r.kind === 'maintenance'
        ? `${name(r.machine)} is under maintenance (${r.label}) from ${span(r.start, r.end)}.`
        : `${name(r.machine)} is running "${r.label}" from ${span(r.start, r.end)}.`;
    }
    return `${name(r.a)} and ${name(r.b)} cannot run tasks at the same time (shared power supply).`;
  }

  const compatQuestion = (base) => `A ${base.job.end - base.job.start}-minute "${base.job.name}" must run from ${hm(base.job.start)} to ${hm(base.job.end)}. Which machine can host it?`;

  /** machine validity from rules, using interval relations */
  function compatAnalysis(ex) {
    const { base } = ex.data;
    const job = I.mk(base.job.start, base.job.end);
    const out = {};
    for (const m of base.machines) {
      const own = ex.constraints.filter((r) => r.type === 'block' && r.machine === m.id).map((r) => ({ r, rel: I.classify(job, I.mk(r.start, r.end)) }));
      const links = ex.constraints.filter((r) => r.type === 'exclusiveLink' && (r.a === m.id || r.b === m.id));
      const viaLink = [];
      for (const l of links) {
        const other = l.a === m.id ? l.b : l.a;
        for (const r of ex.constraints) {
          if (r.type === 'block' && r.machine === other && r.kind === 'task' && isConflict(I.classify(job, I.mk(r.start, r.end)))) viaLink.push({ other, r });
        }
      }
      out[m.id] = { own, viaLink, valid: !own.some((x) => isConflict(x.rel)) && viaLink.length === 0 };
    }
    return out;
  }

  /** independent check: minute-grid scan of the job slot */
  function compatGrid(ex) {
    const { base } = ex.data;
    const res = {};
    for (const m of base.machines) {
      let busy = false;
      const partners = ex.constraints.filter((r) => r.type === 'exclusiveLink' && (r.a === m.id || r.b === m.id)).map((l) => (l.a === m.id ? l.b : l.a));
      for (let t = base.job.start; t < base.job.end; t += 5) {
        for (const r of ex.constraints) {
          if (r.type !== 'block') continue;
          const hit = r.start <= t && t < r.end;
          if (hit && r.machine === m.id) busy = true;
          if (hit && partners.includes(r.machine) && r.kind === 'task') busy = true;
        }
      }
      res[m.id] = !busy;
    }
    return res;
  }

  function explainCompat(ex) {
    const { base } = ex.data;
    const an = compatAnalysis(ex);
    const steps = [X.step('Datos', `Franja del trabajo: ${hm(base.job.start)}–${hm(base.job.end)}. Una máquina sirve solo si ningún bloqueo suyo se solapa con esa franja (PARTIAL/FULL OVERLAP); ADJACENT y NO OVERLAP no cuentan.`)];
    for (const m of base.machines) {
      const a = an[m.id];
      const parts = a.own.map((x) => `«${x.r.label}» ${I.fmtRange(x.r)} → ${REL_ES[x.rel]}`);
      for (const v of a.viaLink) parts.push(`${base.machines.find((q) => q.id === v.other).name} ejecuta «${v.r.label}» ${I.fmtRange(v.r)} en la franja y está enlazada por la regla de exclusión → conflicto`);
      steps.push(X.step(m.name, parts.length ? parts.join('; ') + '.' : 'Sin bloqueos.', null));
    }
    const right = base.machines.filter((m) => an[m.id].valid).map((m) => m.name);
    steps.push(X.step('Conclusión', `Solo ${right.join(', ')} queda libre durante toda la franja.`));
    const notes = {};
    for (const o of ex.options) {
      const m = base.machines.find((q) => q.id === o.payload.machine);
      const a = an[m.id];
      if (a.valid) notes[o.id] = 'Correcta: ningún bloqueo se solapa con la franja.';
      else {
        const c = a.own.find((x) => isConflict(x.rel));
        notes[o.id] = c ? `Incorrecta: «${c.r.label}» ${I.fmtRange(c.r)} es ${c.rel.replace('_', ' ')} con la franja.` : `Incorrecta: la regla de exclusión con ${base.machines.find((q) => q.id === a.viaLink[0].other).name} lo impide.`;
      }
    }
    const rows = base.machines.map((m) => ({
      label: m.name,
      blocks: ex.constraints.filter((r) => r.type === 'block' && r.machine === m.id).map((r) => ({
        start: r.start, end: r.end, label: r.label,
        cls: isConflict(I.classify(I.mk(base.job.start, base.job.end), I.mk(r.start, r.end))) ? 'conflict' : r.kind === 'maintenance' ? 'maint' : 'task',
      })),
    }));
    rows.push({ label: 'Job slot', blocks: [{ start: base.job.start, end: base.job.end, cls: 'answer', label: base.job.name }] });
    return { steps, visual: { type: 'timeline', dayStart: base.dayStart, dayEnd: base.dayEnd, rows }, optionNotes: notes };
  }

  KINDS.compatible = {
    generate(rng, level) {
      const cfg = D.moduleConfig('scheduling');
      const nM = cfg.machines[level];
      const [minC, maxC] = D.level(level).constraints;
      const c = rng.int(minC, maxC);
      const dayStart = rng.pick([420, 480, 540]);
      const dayEnd = dayStart + rng.pick([540, 600]);
      const dur = rng.step(30, 120, 15);
      const jobStart = rng.step(dayStart + 90, dayEnd - dur - 90, 15);
      const job = { name: rng.pick(RT.pools.jobs), start: jobStart, end: jobStart + dur };
      const names = rng.sample(RT.pools.machines, nM);
      const base = { dayStart, dayEnd, job, machines: names.map((n, i) => ({ id: 'M' + i, name: n })) };
      const ids = base.machines.map((m) => m.id);
      const free = rng.pick(ids);
      const invalid = ids.filter((x) => x !== free);
      const labels = rng.shuffle(RT.pools.jobs.filter((j) => j !== job.name));
      let li = 0;
      const rules = [];
      const addBlock = (machine, kind, start, end) => rules.push({ type: 'block', machine, kind, label: kind === 'task' ? labels[li++ % labels.length] : rng.pick(RT.pools.maintenance), start, end });

      const S0 = job.start;
      const E0 = job.end;
      const conflictBlock = (machine, kind) => {
        const mode = rng.pick(['left', 'right', 'contains', 'inside']);
        if (mode === 'left') addBlock(machine, kind, S0 - rng.step(30, 60, 15), S0 + rng.step(15, Math.max(15, dur - 15), 15));
        else if (mode === 'right') addBlock(machine, kind, S0 + rng.step(15, Math.max(15, dur - 15), 15), E0 + rng.step(30, 60, 15));
        else if (mode === 'contains') addBlock(machine, kind, S0 - rng.step(0, 45, 15), E0 + rng.step(15, 45, 15));
        else { const len = Math.max(15, Math.min(dur - 15, rng.step(15, 60, 15))); const s = S0 + rng.step(0, Math.max(0, dur - len), 15); addBlock(machine, kind, s, s + len); }
      };
      const safeBlock = (machine, kind) => {
        const mode = rng.pick(['adjBefore', 'adjAfter', 'before', 'after']);
        const len = rng.step(30, 90, 15);
        const g = rng.step(15, 45, 15);
        if (mode === 'adjBefore') addBlock(machine, kind, S0 - len, S0);
        else if (mode === 'adjAfter') addBlock(machine, kind, E0, E0 + len);
        else if (mode === 'before') addBlock(machine, kind, S0 - len - g, S0 - g);
        else addBlock(machine, kind, E0 + g, E0 + g + len);
      };

      let used = 0;
      let linkedPair = null;
      let toBlock = invalid.slice();
      if (level === 3) {
        const [a, b] = rng.sample(invalid, 2);
        linkedPair = { a, b };
        rules.push({ type: 'exclusiveLink', a, b });
        used++;
        toBlock = invalid.filter((x) => x !== a); // `a` is invalid only through the link
        conflictBlock(b, 'task');
        used++;
        toBlock = toBlock.filter((x) => x !== b);
      }
      for (const m of toBlock) { conflictBlock(m, level >= 2 && rng.chance(0.3) ? 'maintenance' : 'task'); used++; }
      const extras = c - used;
      if (extras < 0) return null;
      for (let i = 0; i < extras; i++) {
        const m = rng.pick(ids);
        // extras must never conflict; on a machine linked to a conflicting partner they are harmless too
        safeBlock(m, level >= 2 && rng.chance(0.3) ? 'maintenance' : 'task');
      }
      if (rules.length !== c) return null;
      if (level >= 2 && !rules.some((r) => r.type === 'block' && (r.end === S0 || r.start === E0))) return null; // want an ADJACENT trap
      for (const r of rules) if (r.type === 'block' && (r.start < dayStart || r.end > dayEnd || r.end <= r.start)) return null;

      const shuffled = rng.shuffle(rules);
      const ex = {
        kind: 'compatible',
        question: compatQuestion(base),
        data: {
          intro: `Working day: ${hm(dayStart)}–${hm(dayEnd)}. A machine is available only if none of its commitments overlaps the slot; touching at an end point is not an overlap.`,
          base,
          rules: shuffled.map((r) => compatRuleText(r, base)),
        },
        constraints: shuffled,
        options: withIds(base.machines.map((m) => ({ text: m.name, payload: { machine: m.id } }))),
        meta: { constraintCount: shuffled.length, kinds: shuffled.map((r) => r.type), machines: nM, linked: !!linkedPair },
      };
      const an = compatAnalysis(ex);
      const valid = base.machines.filter((m) => an[m.id].valid);
      if (valid.length !== 1 || valid[0].id !== free) return null;
      ex.correctAnswer = ex.options.find((o) => o.payload.machine === free).id;
      ex.explanation = explainCompat(ex);
      return ex;
    },
    verify(ex) {
      const errors = [];
      const { base } = ex.data;
      if (!same(ex.constraints.map((r) => compatRuleText(r, base)), ex.data.rules)) errors.push('rules text does not match constraints');
      if (ex.question !== compatQuestion(base)) errors.push('question text does not match data');
      if (ex.meta.constraintCount !== ex.constraints.length) errors.push('constraintCount mismatch');
      for (const r of ex.constraints) if (r.type === 'block' && (r.start < base.dayStart || r.end > base.dayEnd)) errors.push('block outside working day');
      const an = compatAnalysis(ex);
      const grid = compatGrid(ex);
      const validity = {};
      for (const o of ex.options) {
        validity[o.id] = an[o.payload.machine].valid;
        if (an[o.payload.machine].valid !== grid[o.payload.machine]) errors.push('grid/interval mismatch for ' + o.payload.machine);
      }
      const ok = Object.keys(validity).filter((k) => validity[k]);
      if (!same(explainCompat(ex), ex.explanation)) errors.push('explanation does not match solver output');
      return { errors, solutionCount: ok.length, solverAnswer: ok.length === 1 ? ok[0] : null, optionValidity: validity };
    },
  };

  /* ===================================================================== */
  /* conflict                                                               */
  /* ===================================================================== */

  const itemText = (it, machine) => (it.kind === 'maintenance'
    ? `${machine} has scheduled maintenance (${it.label}) from ${span(it.start, it.end)}.`
    : `${machine} runs "${it.label}" from ${span(it.start, it.end)}.`);
  const conflictQuestion = (machine) => `Which two items on ${machine}'s schedule conflict (overlap in time)? Items that only touch — one ends exactly when the other starts — do NOT conflict.`;
  const pairText = (a, b) => `"${a}" and "${b}"`;

  function conflictPairs(items) {
    const out = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) out.push({ a: items[i], b: items[j], rel: rel(items[i], items[j]) });
    }
    return out;
  }

  function explainConflict(ex) {
    const machine = ex.data.machine;
    const items = ex.constraints;
    const sorted = items.slice().sort((x, y) => x.start - y.start);
    const pairs = conflictPairs(items);
    const bad = pairs.filter((p) => isConflict(p.rel));
    const adj = pairs.filter((p) => p.rel === 'ADJACENT');
    const steps = [
      X.step('Datos', `Se ordenan los elementos por hora de inicio: ${sorted.map((i) => `«${i.label}» ${I.fmtRange(i)}`).join('; ')}.`),
      X.step('Pares que se tocan', adj.length ? `${adj.map((p) => `«${p.a.label}»–«${p.b.label}»`).join(', ')}: uno termina justo cuando empieza el otro → ADJACENT, no hay conflicto.` : 'Ningún par se toca exactamente en un extremo.'),
      X.step('Conflicto', bad.map((p) => `«${p.a.label}» ${I.fmtRange(p.a)} y «${p.b.label}» ${I.fmtRange(p.b)} comparten tiempo → ${p.rel.replace('_', ' ')}.`).join(' ')),
      X.step('Conclusión', `El único par en conflicto es «${bad[0].a.label}» y «${bad[0].b.label}»; el resto de pares están separados o solo se tocan.`),
    ];
    const notes = {};
    for (const o of ex.options) {
      const p = pairs.find((q) => (q.a.label === o.payload.a && q.b.label === o.payload.b) || (q.a.label === o.payload.b && q.b.label === o.payload.a));
      notes[o.id] = isConflict(p.rel) ? 'Correcta: comparten tiempo.' : p.rel === 'ADJACENT' ? 'Trampa: se tocan en un extremo (ADJACENT) pero no se solapan.' : 'Incorrecta: están separados (NO OVERLAP).';
    }
    const blocks = sorted.map((i) => ({ start: i.start, end: i.end, label: i.label, cls: bad.some((p) => p.a === i || p.b === i) ? 'conflict' : i.kind === 'maintenance' ? 'maint' : 'task' }));
    const rows = sorted.map((i, k) => ({ label: `#${k + 1}`, blocks: [blocks[k]] }));
    return { steps, visual: { type: 'timeline', dayStart: ex.data.dayStart, dayEnd: ex.data.dayEnd, rows }, optionNotes: notes };
  }

  KINDS.conflict = {
    generate(rng, level) {
      const [minC, maxC] = D.level(level).constraints;
      const k = rng.int(minC, maxC);
      const machine = rng.pick(RT.pools.machines);
      const dayStart = rng.pick([420, 480, 540]);
      const maxLen = level === 1 ? 90 : 60;
      const jobLabels = rng.shuffle(RT.pools.jobs);
      const maintLabels = rng.shuffle(RT.pools.maintenance);
      const maintIdx = level >= 2 ? rng.int(0, k - 1) : -1;
      const items = [];
      let cursor = dayStart + rng.step(0, 60, 15);
      for (let i = 0; i < k; i++) {
        const gap = rng.pick([0, 0, 15, 30, 45]);
        const len = rng.step(30, maxLen, 15);
        const start = cursor + gap;
        items.push(i === maintIdx
          ? { type: 'item', kind: 'maintenance', label: maintLabels[0], start, end: start + len }
          : { type: 'item', kind: 'task', label: jobLabels[i], start, end: start + len });
        cursor = start + len;
      }
      // force exactly one overlap between neighbours i and i+1
      const i = rng.int(0, k - 2);
      const a = items[i];
      const b = items[i + 1];
      if (rng.chance(0.5) || a.end - a.start < 45) {
        a.end = b.start + rng.step(15, Math.min(30, b.end - b.start - 15), 15); // partial overlap
      } else {
        const len = rng.step(15, a.end - a.start - 15, 15); // b sits inside a (full overlap)
        b.start = a.start + 15;
        b.end = b.start + len;
      }
      if (items.some((x) => x.end <= x.start)) return null;
      const pairs = conflictPairs(items);
      const bad = pairs.filter((p) => isConflict(p.rel));
      if (bad.length !== 1) return null;
      if (level >= 2 && !pairs.some((p) => p.rel === 'ADJACENT')) return null;
      const lastEnd = Math.max(...items.map((x) => x.end));
      const dayEnd = Math.max(dayStart + 600, Math.ceil((lastEnd + 15) / 60) * 60);
      // options: the conflicting pair + traps (adjacent first) + other separated pairs
      const good = bad[0];
      const traps = rng.shuffle(pairs.filter((p) => p.rel === 'ADJACENT'));
      const rest = rng.shuffle(pairs.filter((p) => p.rel === 'NO_OVERLAP'));
      const wrong = [...traps, ...rest].slice(0, Math.min(4, pairs.length - 1));
      if (wrong.length < 2) return null;
      const all = rng.shuffle([{ p: good, ok: true }, ...wrong.map((p) => ({ p, ok: false }))]);
      const options = withIds(all.map((x) => {
        const [first, second] = x.p.a.start <= x.p.b.start ? [x.p.a, x.p.b] : [x.p.b, x.p.a];
        return { text: pairText(first.label, second.label), payload: { a: first.label, b: second.label } };
      }));
      const shuffledItems = rng.shuffle(items);
      const ex = {
        kind: 'conflict',
        question: conflictQuestion(machine),
        data: {
          intro: `Schedule of ${machine} (working day ${hm(dayStart)}–${hm(dayEnd)}).`,
          machine, dayStart, dayEnd,
          rules: shuffledItems.map((it) => itemText(it, machine)),
        },
        constraints: shuffledItems,
        options,
        correctAnswer: options[all.findIndex((x) => x.ok)].id,
        meta: { constraintCount: k, kinds: ['item'] },
      };
      ex.explanation = explainConflict(ex);
      return ex;
    },
    verify(ex) {
      const errors = [];
      const items = ex.constraints;
      if (!same(items.map((it) => itemText(it, ex.data.machine)), ex.data.rules)) errors.push('rules text does not match constraints');
      if (ex.question !== conflictQuestion(ex.data.machine)) errors.push('question text does not match data');
      if (new Set(items.map((i) => i.label)).size !== items.length) errors.push('duplicate item labels');
      const pairs = conflictPairs(items);
      const bad = pairs.filter((p) => isConflict(p.rel));
      // independent check: minute scan (a conflict = some minute is covered by two items)
      let scanConflicts = 0;
      for (const p of pairs) {
        let both = false;
        for (let t = Math.min(p.a.start, p.b.start); t < Math.max(p.a.end, p.b.end); t += 5) {
          if (p.a.start <= t && t < p.a.end && p.b.start <= t && t < p.b.end) both = true;
        }
        if (both !== isConflict(p.rel)) errors.push('scan/interval mismatch');
        if (both) scanConflicts++;
      }
      if (bad.length !== 1 || scanConflicts !== 1) errors.push(`expected exactly 1 conflicting pair, found ${bad.length}`);
      const validity = {};
      for (const o of ex.options) {
        const p = pairs.find((q) => (q.a.label === o.payload.a && q.b.label === o.payload.b) || (q.a.label === o.payload.b && q.b.label === o.payload.a));
        validity[o.id] = !!p && isConflict(p.rel);
      }
      const ok = Object.keys(validity).filter((k) => validity[k]);
      if (!same(explainConflict(ex), ex.explanation)) errors.push('explanation does not match solver output');
      return { errors, solutionCount: bad.length, solverAnswer: ok.length === 1 ? ok[0] : null, optionValidity: validity };
    },
  };

  /* ===================================================================== */
  /* maxConcurrent                                                          */
  /* ===================================================================== */

  const taskText = (t) => `${t.machine} runs "${t.label}" from ${span(t.start, t.end)}.`;
  const concQuestion = () => 'What is the maximum number of tasks running at the same time? (A task that ends exactly when another starts does not overlap it.)';

  /** wrong-but-tempting count: touching end points treated as overlap */
  function inclusiveDepth(list) {
    const ev = [];
    for (const i of list) { ev.push([i.start, 0]); ev.push([i.end, 1]); } // starts before ends at the same instant
    ev.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    let d = 0;
    let m = 0;
    for (const [, kind] of ev) { d += kind === 0 ? 1 : -1; if (d > m) m = d; }
    return m;
  }

  function peakSets(tasks) {
    const pts = [...new Set(tasks.flatMap((t) => [t.start, t.end]))].sort((a, b) => a - b);
    const peak = I.maxDepth(tasks);
    const segs = [];
    for (let j = 0; j < pts.length - 1; j++) {
      const running = tasks.filter((t) => t.start <= pts[j] && t.end >= pts[j + 1]);
      if (running.length === peak) segs.push({ start: pts[j], end: pts[j + 1], running });
    }
    return segs;
  }

  function explainConc(ex) {
    const tasks = ex.constraints;
    const depth = I.maxDepth(tasks);
    const incl = inclusiveDepth(tasks);
    const segs = peakSets(tasks);
    const events = tasks.flatMap((t) => [{ t: t.start, d: '+', n: t.label }, { t: t.end, d: '−', n: t.label }]).sort((x, y) => x.t - y.t || (x.d === '−' ? -1 : 1));
    const steps = [
      X.step('Barrido temporal', 'Se ordenan los instantes de inicio (+) y fin (−); en un mismo instante el fin se procesa antes que el inicio (tocarse no es solaparse).', events.map((e) => `${hm(e.t)} ${e.d} ${e.n}`)),
      X.step('Máximo', `El máximo simultáneo es ${depth}: ${segs[0].running.map((t) => `«${t.label}»`).join(', ')} durante ${I.fmtRange(segs[0])}.`),
      X.step('Conclusión', `Respuesta: ${depth}.${incl !== depth ? ` (Si se contasen como solapadas las tareas que solo se tocan, saldría ${incl}: es la trampa.)` : ''}`),
    ];
    const notes = {};
    for (const o of ex.options) {
      const v = o.payload.count;
      notes[o.id] = v === depth ? 'Correcta.' : v === incl ? 'Trampa: cuenta como simultáneas tareas que solo se tocan en un extremo.' : v > depth ? `Ningún instante tiene ${v} tareas en marcha.` : `Hay un instante con más tareas: ${segs[0].running.length} durante ${I.fmtRange(segs[0])}.`;
    }
    const rows = tasks.slice().sort((a, b) => a.start - b.start).map((t) => ({ label: t.machine, blocks: [{ start: t.start, end: t.end, label: t.label, cls: segs.some((s) => s.running.includes(t)) ? 'conflict' : 'task' }] }));
    return { steps, visual: { type: 'timeline', dayStart: ex.data.dayStart, dayEnd: ex.data.dayEnd, rows }, optionNotes: notes };
  }

  KINDS.maxConcurrent = {
    generate(rng, level) {
      const [minC, maxC] = D.level(level).constraints;
      const k = rng.int(minC, maxC);
      const dayStart = rng.pick([420, 480, 540]);
      const dayEnd = dayStart + 600;
      const machines = rng.shuffle(RT.pools.machines);
      const labels = rng.shuffle(RT.pools.jobs);
      const tasks = [];
      for (let i = 0; i < k; i++) {
        const len = rng.step(30, 120, 15);
        let start = rng.step(dayStart, dayEnd - len, 15);
        // create touching end points on purpose
        if (i > 0 && rng.chance(0.4)) {
          const o = tasks[rng.int(0, i - 1)];
          start = rng.chance(0.5) ? o.end : o.start - len;
          if (start < dayStart || start + len > dayEnd) start = rng.step(dayStart, dayEnd - len, 15);
        }
        tasks.push({ type: 'task', machine: machines[i % machines.length], label: labels[i % labels.length], start, end: start + len });
      }
      const depth = I.maxDepth(tasks);
      if (depth < 2 || depth >= k) return null;
      const incl = inclusiveDepth(tasks);
      if (level >= 2 && incl === depth) return null; // want the adjacency trap
      const cand = [incl, depth + 1, depth - 1, depth + 2, 1, k].filter((v) => v >= 1 && v <= k && v !== depth);
      const picked = [...new Set(cand)].slice(0, Math.min(4, k - 1));
      if (picked.length < 2) return null;
      const all = [depth, ...picked].sort((a, b) => a - b);
      const options = withIds(all.map((v) => ({ text: String(v), payload: { count: v } })));
      const rules = rng.shuffle(tasks);
      const ex = {
        kind: 'maxConcurrent',
        question: concQuestion(),
        data: { intro: `Tasks scheduled on different machines (working day ${hm(dayStart)}–${hm(dayEnd)}).`, dayStart, dayEnd, rules: rules.map(taskText) },
        constraints: rules,
        options,
        correctAnswer: options[all.indexOf(depth)].id,
        meta: { constraintCount: k, kinds: ['task'] },
      };
      ex.explanation = explainConc(ex);
      return ex;
    },
    verify(ex) {
      const errors = [];
      const tasks = ex.constraints;
      if (!same(tasks.map(taskText), ex.data.rules)) errors.push('rules text does not match constraints');
      if (ex.question !== concQuestion()) errors.push('question text does not match data');
      const depth = I.maxDepth(tasks);
      if (depth !== S.bruteForceDepth(tasks)) errors.push('sweep/grid mismatch on max concurrency');
      const validity = {};
      for (const o of ex.options) validity[o.id] = o.payload.count === depth;
      const ok = Object.keys(validity).filter((k) => validity[k]);
      if (!same(explainConc(ex), ex.explanation)) errors.push('explanation does not match solver output');
      return { errors, solutionCount: 1, solverAnswer: ok.length === 1 ? ok[0] : null, optionValidity: validity };
    },
  };
})();
