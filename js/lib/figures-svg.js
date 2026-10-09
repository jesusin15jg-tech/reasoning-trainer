/**
 * figures-svg.js — SVG renderer for figures (needs a DOM). Cells are drawn as polygons filled with
 * a texture, so the three states never depend on colour alone:
 *   empty = plain · green = diagonal stripes · blue = dots
 *
 *   RT.figuresSvg.render(figId, frame, { size, label, onCell, brushCursor, selectedCell })
 *   RT.figuresSvg.describe(figId, frame)   // text for screen readers
 *   RT.figuresSvg.legend()                 // swatches: empty / green / blue
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const F = RT.figures;
  const t = (k, p) => RT.i18n.t(k, p);
  let defsInstalled = false;

  /** Patterns are defined once per document and referenced with url(#…). */
  function ensureDefs() {
    if (defsInstalled && document.getElementById('rt-fig-defs')) return;
    const { svg } = RT.ui;
    const defs = svg('svg', { id: 'rt-fig-defs', 'aria-hidden': 'true', focusable: 'false', width: 0, height: 0, style: 'position:absolute;width:0;height:0;overflow:hidden' },
      svg('defs', {},
        svg('pattern', { id: 'rt-pat-green', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
          svg('rect', { width: 7, height: 7, class: 'pat-g-bg' }), svg('line', { x1: 0, y1: 0, x2: 0, y2: 7, 'stroke-width': 3.4, class: 'pat-g-line' })),
        svg('pattern', { id: 'rt-pat-blue', width: 8, height: 8, patternUnits: 'userSpaceOnUse' },
          svg('rect', { width: 8, height: 8, class: 'pat-b-bg' }), svg('circle', { cx: 4, cy: 4, r: 2.4, class: 'pat-b-dot' }))));
    document.body.insertBefore(defs, document.body.firstChild);
    defsInstalled = true;
  }

  const FILL = ['var(--fig-empty)', 'url(#rt-pat-green)', 'url(#rt-pat-blue)'];
  const cellName = (cell) => t('cell.name', { n: cell.id + 1, where: t('compass.' + F.compass(cell)), shape: t('shape.' + cell.shape) });

  function describe(figId, frame) {
    const fig = F.get(figId);
    const parts = fig.cells.filter((c) => frame[c.id] !== 0).map((c) => `${cellName(c)}: ${t('color.' + frame[c.id])}`);
    return parts.length ? t('fig.describe', { list: parts.join('; ') }) : t('fig.describe.empty');
  }

  /**
   * opts: size (px), label (aria-label override), onCell(i) -> makes cells operable (click / Enter / Space),
   *       focusCell (cell id to mark with data-focus for restoring focus), mini (smaller stroke)
   */
  function render(figId, frame, opts = {}) {
    ensureDefs();
    const { svg } = RT.ui;
    const fig = F.get(figId);
    const interactive = typeof opts.onCell === 'function';
    const cells = fig.cells.map((c) => {
      const attrs = {
        class: 'fig-cell fig-' + c.shape + (interactive ? ' fig-op' : ''),
        points: c.pts.map((p) => p.join(',')).join(' '), fill: FILL[frame[c.id]], 'data-state': frame[c.id],
      };
      if (!interactive) return svg('polygon', attrs);
      const act = () => opts.onCell(c.id);
      return svg('g', {
        role: 'button', tabindex: 0, class: 'fig-g', 'data-cell': c.id,
        'aria-label': `${cellName(c)}: ${t('color.' + frame[c.id])}`,
        onclick: act, onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } },
      }, svg('polygon', attrs));
    });
    return svg('svg', {
      class: 'fig' + (opts.mini ? ' fig-mini' : ''), viewBox: '-2 -2 104 104', width: opts.size || 110, height: opts.size || 110,
      role: interactive ? 'group' : 'img', 'aria-label': opts.label || (interactive ? t('paint.area') : describe(figId, frame)),
    }, cells);
  }

  function legend() {
    const { h } = RT.ui;
    const sw = (state, name) => h('li', {}, RT.figuresSvg.swatch(state), ' ', name);
    return h('ul', { class: 'legend fig-legend', 'aria-label': t('legend.label') }, sw(0, t('color.0')), sw(1, t('legend.green')), sw(2, t('legend.blue')));
  }

  function swatch(state) {
    ensureDefs();
    const { svg } = RT.ui;
    return svg('svg', { class: 'fig-swatch', viewBox: '0 0 20 20', width: 22, height: 22, 'aria-hidden': 'true' },
      svg('rect', { x: 1, y: 1, width: 18, height: 18, rx: 2, class: 'fig-cell', fill: FILL[state] }));
  }

  RT.figuresSvg = { render, describe, legend, swatch, ensureDefs, cellName };
})();
