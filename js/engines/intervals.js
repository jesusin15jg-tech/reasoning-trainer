/**
 * intervals.js — half-open interval algebra on integer minutes: [start, end).
 * Used by the Resource Scheduling module to turn every constraint into
 * verifiable time intervals.
 *
 * Relations (classify):
 *   NO_OVERLAP       – there is a gap between them
 *   ADJACENT         – one ends exactly when the other starts (NOT a conflict)
 *   PARTIAL_OVERLAP  – they share time, neither contains the other
 *   FULL_OVERLAP     – one contains the other (or they are identical)
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});

  const mk = (start, end) => ({ start, end });
  const len = (i) => i.end - i.start;

  function overlaps(a, b) {
    return a.start < b.end && b.start < a.end;
  }

  function classify(a, b) {
    if (a.end === b.start || b.end === a.start) return 'ADJACENT';
    if (!overlaps(a, b)) return 'NO_OVERLAP';
    const aInB = a.start >= b.start && a.end <= b.end;
    const bInA = b.start >= a.start && b.end <= a.end;
    return aInB || bInA ? 'FULL_OVERLAP' : 'PARTIAL_OVERLAP';
  }

  /** sort + merge overlapping AND touching intervals; drops empty ones */
  function union(list) {
    const s = list
      .filter((i) => i.end > i.start)
      .map((i) => mk(i.start, i.end))
      .sort((x, y) => x.start - y.start || x.end - y.end);
    const out = [];
    for (const i of s) {
      const last = out[out.length - 1];
      if (last && i.start <= last.end) last.end = Math.max(last.end, i.end);
      else out.push(i);
    }
    return out;
  }

  /** base minus blocked => list of free intervals (both may be unsorted) */
  function subtract(base, blocked) {
    const b = union(blocked);
    const out = [];
    for (const seg of union(base)) {
      let cur = seg.start;
      for (const x of b) {
        if (x.end <= cur || x.start >= seg.end) continue;
        if (x.start > cur) out.push(mk(cur, x.start));
        cur = Math.max(cur, x.end);
      }
      if (cur < seg.end) out.push(mk(cur, seg.end));
    }
    return out;
  }

  function intersect(listA, listB) {
    const a = union(listA);
    const b = union(listB);
    const out = [];
    for (const x of a) {
      for (const y of b) {
        const s = Math.max(x.start, y.start);
        const e = Math.min(x.end, y.end);
        if (e > s) out.push(mk(s, e));
      }
    }
    return union(out);
  }

  /** maximal free intervals able to hold a job of `dur` minutes */
  function windows(free, dur) {
    return free.filter((i) => len(i) >= dur);
  }

  function earliestStart(free, dur) {
    const w = windows(free, dur);
    return w.length ? w[0].start : null;
  }

  /** latest start time such that the job still fits inside a free interval */
  function latestStart(free, dur) {
    const w = windows(free, dur);
    return w.length ? w[w.length - 1].end - dur : null;
  }

  function longest(free) {
    return free.reduce((m, i) => Math.max(m, len(i)), 0);
  }

  /** maximum number of intervals running simultaneously (touching ends do not count) */
  function maxDepth(list) {
    const ev = [];
    for (const i of list) {
      if (i.end > i.start) {
        ev.push([i.start, 1]);
        ev.push([i.end, -1]); // -1 sorts before +1 at the same instant => adjacency is not overlap
      }
    }
    ev.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
    let d = 0;
    let m = 0;
    for (const [, v] of ev) {
      d += v;
      if (d > m) m = d;
    }
    return m;
  }

  /** intervals during which at least k of the given intervals run at once */
  function depthAtLeast(list, k) {
    const pts = [...new Set(list.flatMap((i) => [i.start, i.end]))].sort((a, b) => a - b);
    const out = [];
    for (let j = 0; j < pts.length - 1; j++) {
      const seg = mk(pts[j], pts[j + 1]);
      const d = list.filter((i) => i.start <= seg.start && i.end >= seg.end).length;
      if (d >= k) out.push(seg);
    }
    return union(out);
  }

  const sameList = (a, b) => a.length === b.length && a.every((x, i) => x.start === b[i].start && x.end === b[i].end);

  function fmt(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }
  const fmtRange = (i) => fmt(i.start) + '–' + fmt(i.end);

  RT.intervals = {
    mk, len, overlaps, classify, union, subtract, intersect, windows,
    earliestStart, latestStart, longest, maxDepth, depthAtLeast, sameList, fmt, fmtRange,
  };
})();
