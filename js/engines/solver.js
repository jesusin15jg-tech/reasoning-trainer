/**
 * solver.js — constraint solvers.
 *
 *  - Positional ordering CSP: controlled brute force over cached permutations
 *    (n <= 7 => at most 5040 candidates; exact and trivially auditable).
 *  - Scheduling: interval algebra (see intervals.js) + an independent minute-grid
 *    brute force used to cross-check the interval result.
 *  - Calendar: deterministic day-by-day evaluation of every rule.
 *
 * Positions are 1-based. A "solution" for the ordering CSP is an array `p`
 * where p[i] is the position of item i.
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const I = RT.intervals;

  /* ------------------------------------------------------------------ */
  /* Ordering CSP                                                        */
  /* ------------------------------------------------------------------ */

  const permCache = {};
  function permutations(n) {
    if (permCache[n]) return permCache[n];
    const out = [];
    const cur = [];
    const used = new Array(n + 1).fill(false);
    (function rec() {
      if (cur.length === n) return void out.push(cur.slice());
      for (let v = 1; v <= n; v++) {
        if (used[v]) continue;
        used[v] = true;
        cur.push(v);
        rec();
        cur.pop();
        used[v] = false;
      }
    })();
    return (permCache[n] = out);
  }

  /** Evaluate a positional constraint against a solution p (p[item] = position). */
  function evalConstraint(c, p) {
    switch (c.type) {
      case 'abs': return p[c.a] === c.pos;
      case 'notAbs': return p[c.a] !== c.pos;
      case 'oneOf': return c.positions.includes(p[c.a]);
      case 'gap': return Math.abs(p[c.a] - p[c.b]) === c.k + 1;
      case 'offset': return p[c.b] - p[c.a] === c.d;
      case 'before': return p[c.a] < p[c.b];
      case 'adj': return Math.abs(p[c.a] - p[c.b]) === 1;
      case 'notAdj': return Math.abs(p[c.a] - p[c.b]) !== 1;
      case 'block': {
        const ps = c.items.map((i) => p[i]);
        return Math.max(...ps) - Math.min(...ps) === c.items.length - 1;
      }
      case 'cond': return !evalConstraint(c.if, p) || evalConstraint(c.then, p);
      default: throw new Error('Unknown constraint type: ' + c.type);
    }
  }

  const holdsAll = (cs, p) => cs.every((c) => evalConstraint(c, p));

  /** all permutations satisfying every constraint */
  function solveOrdering(n, constraints) {
    return permutations(n).filter((p) => holdsAll(constraints, p));
  }

  function filterSolutions(sols, c) {
    return sols.filter((p) => evalConstraint(c, p));
  }

  /** items mentioned by a constraint (used for display / sanity checks) */
  function involved(c) {
    if (c.type === 'cond') return [...new Set([...involved(c.if), ...involved(c.then)])];
    if (c.type === 'block') return c.items.slice();
    return [c.a, c.b].filter((x) => x !== undefined);
  }

  /** order array (item at each position) from a solution */
  function toOrder(p) {
    const order = new Array(p.length);
    p.forEach((pos, item) => (order[pos - 1] = item));
    return order;
  }

  /* ------------------------------------------------------------------ */
  /* Scheduling                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Convert a scheduling problem into blocked intervals for the target job.
   * Returns [{start,end,reason,source}] — every entry is an auditable interval.
   *
   * problem = { dayStart, dayEnd, target:{machine,duration}, machines:[{id,name,blocks:[{start,end,kind,label}]}],
   *             extra:{ crewOff:[{start,end}], exclusiveWith:[machineId], capacity:k|null } }
   * kind: 'task' | 'maintenance'
   */
  function blockedIntervals(problem) {
    const out = [];
    const { target, machines, extra } = problem;
    const own = machines.find((m) => m.id === target.machine);
    for (const b of own.blocks) {
      out.push({ start: b.start, end: b.end, source: 'own-' + b.kind, label: b.label });
    }
    for (const id of extra.exclusiveWith || []) {
      const m = machines.find((x) => x.id === id);
      for (const b of m.blocks) {
        if (b.kind === 'task') out.push({ start: b.start, end: b.end, source: 'exclusive', label: m.name + ' · ' + b.label });
      }
    }
    for (const c of extra.crewOff || []) out.push({ start: c.start, end: c.end, source: 'crew', label: c.label || 'Crew unavailable' });
    if (extra.capacity) {
      const others = machines.filter((m) => m.id !== target.machine);
      const tasks = others.flatMap((m) => m.blocks.filter((b) => b.kind === 'task').map((b) => I.mk(b.start, b.end)));
      for (const s of I.depthAtLeast(tasks, extra.capacity)) {
        out.push({ start: s.start, end: s.end, source: 'capacity', label: 'power limit reached' });
      }
    }
    return out;
  }

  function freeIntervals(problem) {
    const day = [I.mk(problem.dayStart, problem.dayEnd)];
    return I.subtract(day, blockedIntervals(problem));
  }

  /** Independent check: scan every 5-minute start on a minute grid. */
  function bruteForceStarts(problem, step = 5) {
    const bl = blockedIntervals(problem);
    const D = problem.target.duration;
    const ok = [];
    for (let s = problem.dayStart; s + D <= problem.dayEnd; s += step) {
      const job = I.mk(s, s + D);
      if (!bl.some((b) => I.overlaps(job, b))) ok.push(s);
    }
    return ok;
  }

  /** maximal runs of consecutive feasible starts => [{start, end}] job windows (start..latest end) */
  function bruteForceWindows(problem, step = 5) {
    const starts = bruteForceStarts(problem, step);
    const D = problem.target.duration;
    const out = [];
    for (const s of starts) {
      const last = out[out.length - 1];
      if (last && s - last.lastStart === step) {
        last.lastStart = s;
        last.end = s + D;
      } else out.push({ start: s, lastStart: s, end: s + D });
    }
    return out.map((w) => I.mk(w.start, w.end));
  }


  /** longest run of free time on a 5-minute grid (independent of the interval algebra) */
  function bruteForceLongest(problem, step = 5) {
    const bl = blockedIntervals(problem);
    let best = 0;
    let run = 0;
    for (let t = problem.dayStart; t + step <= problem.dayEnd; t += step) {
      const cell = I.mk(t, t + step);
      if (bl.some((b) => I.overlaps(cell, b))) run = 0;
      else {
        run += step;
        if (run > best) best = run;
      }
    }
    return best;
  }

  /** brute-force max number of simultaneously running intervals (minute scan) */
  function bruteForceDepth(list, step = 5) {
    if (!list.length) return 0;
    const lo = Math.min(...list.map((i) => i.start));
    const hi = Math.max(...list.map((i) => i.end));
    let best = 0;
    for (let t = lo; t < hi; t += step) {
      const d = list.filter((i) => i.start <= t && t < i.end).length;
      if (d > best) best = d;
    }
    return best;
  }

  /* ------------------------------------------------------------------ */
  /* Calendar                                                            */
  /* ------------------------------------------------------------------ */

  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const ORDINALS = { 1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth', last: 'last' };

  /** weekday index 0=Mon..6=Sun of day d (1-based) in a month that starts on weekday `startDow` */
  const dowOf = (startDow, d) => (startDow + d - 1) % 7;

  /** n-th occurrence (1-based) of that weekday within the month for day d */
  function occurrenceIndex(startDow, d) {
    return Math.floor((d - 1) / 7) + 1;
  }

  /** is day d the LAST occurrence of its weekday in the month? */
  const isLastOccurrence = (days, d) => d + 7 > days;

  /** Monday-based week index (0-based) of day d. Day 1 may be mid-week. */
  const weekOf = (startDow, d) => Math.floor((d - 1 + startDow) / 7);

  /**
   * Base availability (no conditional rules) of a person on day d.
   * spec = { days, startDow, holidays:[d], people:[{name, rules:[...]}] }
   * rule types: weekday{days:[0..6]} | date{day} | range{from,to} | ordinal{weekday,ordinals:[1..4|'last']}
   */
  function baseAvailable(spec, person, d) {
    const dow = dowOf(spec.startDow, d);
    if (dow >= 5) return false; // Saturday / Sunday
    if (spec.holidays.includes(d)) return false;
    for (const r of person.rules) {
      if (r.type === 'weekday' && r.days.includes(dow)) return false;
      if (r.type === 'date' && r.day === d) return false;
      if (r.type === 'range' && d >= r.from && d <= r.to) return false;
      if (r.type === 'ordinal' && r.weekday === dow) {
        const occ = occurrenceIndex(spec.startDow, d);
        if (r.ordinals.some((o) => (o === 'last' ? isLastOccurrence(spec.days, d) : o === occ))) return false;
      }
    }
    return true;
  }

  /** Full availability: base rules + conditional rules (which only look at other people's BASE availability). */
  function available(spec, person, d) {
    if (!baseAvailable(spec, person, d)) return false;
    for (const r of person.rules) {
      if (r.type !== 'conditional') continue;
      const dow = dowOf(spec.startDow, d);
      if (!r.days.includes(dow)) continue;
      const other = spec.people.find((p) => p.name === r.other);
      // the Friday (or other weekday) of the SAME Monday-Sunday week, only if it falls inside the month
      const target = d + (r.weekday - dow);
      if (target >= 1 && target <= spec.days && baseAvailable(spec, other, target)) return false;
    }
    return true;
  }

  function solveCalendar(spec) {
    const out = [];
    for (let d = 1; d <= spec.days; d++) {
      if (spec.people.every((p) => available(spec, p, d))) out.push(d);
    }
    return out;
  }

  /** who/what blocks each day — used for the explanation table */
  function blockersByDay(spec) {
    const res = {};
    for (let d = 1; d <= spec.days; d++) {
      const dow = dowOf(spec.startDow, d);
      const why = [];
      if (dow >= 5) why.push('weekend');
      else if (spec.holidays.includes(d)) why.push('public holiday');
      else for (const p of spec.people) if (!available(spec, p, d)) why.push(p.name);
      res[d] = why;
    }
    return res;
  }

  RT.solver = {
    permutations, evalConstraint, holdsAll, solveOrdering, filterSolutions, involved, toOrder,
    blockedIntervals, freeIntervals, bruteForceStarts, bruteForceWindows, bruteForceLongest, bruteForceDepth,
    WEEKDAYS, ORDINALS, dowOf, occurrenceIndex, isLastOccurrence, weekOf,
    baseAvailable, available, solveCalendar, blockersByDay,
  };
})();
