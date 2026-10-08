/**
 * explanation.js — helpers for building pedagogical explanations.
 *
 * An explanation is a plain, serialisable object:
 *   {
 *     steps:   [{ title, text, items? }],      // ordered deduction chain (Spanish)
 *     visual:  { type: 'timeline'|'order'|'calendar'|'text', ... } | null,
 *     optionNotes: { <optionId>: 'why this option is right/wrong' }
 *   }
 * Every number and claim is produced from the same data the solver used,
 * so the explanation is verifiable — it never contains free-form model reasoning.
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});

  const step = (title, text, items) => (items && items.length ? { title, text, items } : { title, text });

  /** "a, b y c" */
  function listEs(arr, last = 'y') {
    if (arr.length <= 1) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' ' + last + ' ' + arr[arr.length - 1];
  }

  const plural = (n, one, many) => (n === 1 ? one : many);

  /** plain-text rendering (debug panel, tests, accessibility fallback) */
  function toText(expl) {
    const lines = expl.steps.map((s, i) => `${i + 1}. ${s.title ? s.title + ': ' : ''}${s.text}` + (s.items ? '\n   - ' + s.items.join('\n   - ') : ''));
    if (expl.optionNotes && !expl.steps.some((s) => s.items)) {
      for (const [k, v] of Object.entries(expl.optionNotes)) lines.push(`   [${k}] ${v}`);
    }
    return lines.join('\n');
  }

  RT.explanation = { step, listEs, plural, toText };
})();
