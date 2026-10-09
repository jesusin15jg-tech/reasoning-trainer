/**
 * figures.js — "figure library": segmented figures made of triangles and squares.
 *
 * A figure is a fixed tiling of a 100×100 box into cells. A FRAME is the colouring of that figure:
 * an array with one state per cell — 0 = empty, 1 = green (striped), 2 = blue (dotted).
 *
 *   RT.figures.get('quad8')  -> { id, n, cells:[{id, shape:'tri'|'sq', pts, cx, cy, ang}], ring:[cell ids clockwise],
 *                                 inner:[cell ids not in the ring], perms:{flipH, flipV}, shapes:[…] }
 *
 * The ring is the sequence of cells around the centre, in clockwise order; most "movement" rules slide colours along it.
 * Pure data + geometry: no DOM here (rendering lives in figures-svg.js).
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const EMPTY = 0, GREEN = 1, BLUE = 2;
  const COLORS = [EMPTY, GREEN, BLUE];
  const R2 = (v) => Math.round(v * 100) / 100;

  const tri = (a, b, c) => ({ shape: 'tri', pts: [a, b, c] });
  const sq = (...p) => ({ shape: 'sq', pts: p });

  /** Cell box split along its radial diagonal (outer corner O to inner corner I) into two triangles. */
  function radialSplit(O, I) {
    const P = [I[0], O[1]], Q = [O[0], I[1]];
    return [tri(O, P, I), tri(O, Q, I)];
  }

  const DEFS = {
    // 4 corner triangles + a central diamond (a square turned 45°)
    diamond: () => [
      tri([0, 0], [50, 0], [0, 50]), tri([50, 0], [100, 0], [100, 50]),
      tri([100, 50], [100, 100], [50, 100]), tri([0, 50], [50, 100], [0, 100]),
      sq([50, 0], [100, 50], [50, 100], [0, 50]),
    ],
    // 2×2 squares, each cut along its radial diagonal: 8 triangles, no square
    quad8: () => [
      ...radialSplit([0, 0], [50, 50]), ...radialSplit([100, 0], [50, 50]),
      ...radialSplit([100, 100], [50, 50]), ...radialSplit([0, 100], [50, 50]),
    ],
    // 3×3 grid: corner squares cut into 2 triangles (8), 4 edge squares and 1 central square
    frame3: () => {
      const a = 100 / 3, b = 200 / 3;
      return [
        ...radialSplit([0, 0], [a, a]), ...radialSplit([100, 0], [b, a]),
        ...radialSplit([100, 100], [b, b]), ...radialSplit([0, 100], [a, b]),
        sq([a, 0], [b, 0], [b, a], [a, a]), sq([b, a], [100, a], [100, b], [b, b]),
        sq([a, b], [b, b], [b, 100], [a, 100]), sq([0, a], [a, a], [a, b], [0, b]),
        sq([a, a], [b, a], [b, b], [a, b]),
      ];
    },
  };
  // which cells (by index into the definition) are central/non-ring
  const INNER = { diamond: [4], quad8: [], frame3: [12] };

  const centroid = (pts) => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  /** clockwise angle from "12 o'clock", in degrees, around (50,50) */
  function angle(cx, cy) {
    let a = (Math.atan2(cx - 50, -(cy - 50)) * 180) / Math.PI;
    if (a < 0) a += 360;
    return a;
  }
  const key = (pts) => pts.map((p) => R2(p[0]) + ',' + R2(p[1])).sort().join('|');

  const cache = {};
  function build(id) {
    const raw = DEFS[id]();
    const cells = raw.map((c, i) => {
      const [cx, cy] = centroid(c.pts);
      return { id: i, shape: c.shape, pts: c.pts.map((p) => [R2(p[0]), R2(p[1])]), cx: R2(cx), cy: R2(cy), ang: R2(angle(cx, cy)) };
    });
    const inner = INNER[id].slice();
    const ring = cells.filter((c) => !inner.includes(c.id)).sort((p, q) => p.ang - q.ang).map((c) => c.id);
    const polyKey = cells.map((c) => key(c.pts));
    const perm = (f) => cells.map((c) => {
      const j = polyKey.indexOf(key(c.pts.map(f)));
      if (j < 0) throw new Error('figure ' + id + ' is not symmetric');
      return j;
    });
    const fig = {
      id, n: cells.length, cells, ring, inner,
      perms: { flipH: perm((p) => [100 - p[0], p[1]]), flipV: perm((p) => [p[0], 100 - p[1]]) },
      triCount: cells.filter((c) => c.shape === 'tri').length,
    };
    return fig;
  }

  function get(id) {
    if (!DEFS[id]) throw new Error('unknown figure ' + id);
    return cache[id] || (cache[id] = build(id));
  }

  /** Compass-style name (top, top-right, …) of a cell, used in explanations. */
  const COMPASS = ['top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left'];
  const compass = (cell) => COMPASS[Math.round(cell.ang / 45) % 8];

  const frameKey = (f) => f.join('');
  const parseKey = (s) => s.split('').map(Number);
  const equal = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const blank = (n) => new Array(n).fill(EMPTY);

  RT.figures = { EMPTY, GREEN, BLUE, COLORS, IDS: Object.keys(DEFS), get, compass, frameKey, parseKey, equal, blank };
})();
