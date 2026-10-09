/**
 * english.js — MODULE D: Contractual & Advanced English.
 *
 * Question and options are always English (it is an English test); instructions and explanations follow the UI
 * language (EN/ES). Spanish notes live next to the bank items, English ones in data/notes-en.js (overlay by item id).
 * Priority order: natural English > precision > professional relevance > difficulty > randomness.
 *
 * Quality gates (run by verify() on every generated exercise, and by lintBank() on the whole bank):
 *   - exactly one correct option, 3–5 distinct options
 *   - every wrong option has a written reason (so each distractor is deliberate, not accidental)
 *   - fill-in stems have exactly one blank and do not leak the answer
 *   - SVA: the correct form is COMPUTED by a rule engine, distractors are validated by it
 *   - Reading: claim labels (supported / contradicted / unsupported) and event dates are re-evaluated
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const D = RT.difficulty;
  const X = RT.explanation;
  const T = RT.data.templates;
  const G = RT.grammar;

  const LETTERS = ['A', 'B', 'C', 'D', 'E'];
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const wordCount = (s) => s.trim().split(/\s+/).length;
  const L = (en, es) => RT.i18n.pick(en, es);
  const when = (day) => {
    const hhmm = `${String(Math.floor(day / 60)).padStart(2, '0')}:${String(day % 60).padStart(2, '0')}`;
    return day >= 100 ? L(`at ${hhmm}`, `a las ${hhmm}`) : L(`on day ${day}`, `el día ${day}`);
  };
  const EN = () => RT.data.notesEn;

  /* language-aware access to the written reasons stored with the bank */
  const itemNote = (item, i) => (RT.i18n.lang === 'es' ? item.notes[i] : EN().items[item.id].notes[i]);
  const itemRule = (item) => (!item.rule ? null : RT.i18n.lang === 'es' ? item.rule : EN().items[item.id].rule || item.rule);
  const itemDiff = (item) => (!item.diff ? null : RT.i18n.lang === 'es' ? item.diff : EN().items[item.id].diff || item.diff);
  const claimWhy = (p, i) => (RT.i18n.lang === 'es' ? p.claims[i].why : EN().claims[p.id][i]);

  const bankFor = (cat) => (cat === 'prepositions' ? RT.data.prepositions : RT.data.vocabulary[cat]);
  const instructionFor = (cat, item) => {
    const en = cat === 'synonyms' ? T.SYN_INSTR[item.mode] : T.categories[cat].instruction;
    return L(en, ES_INSTR[en] || en);
  };
  const ES_INSTR = {
    'Choose the word or phrase that best completes the sentence.': 'Elige la palabra o expresión que mejor completa la frase.',
    'Choose the preposition that correctly completes the sentence.': 'Elige la preposición que completa correctamente la frase.',
    'Choose the verb form that correctly completes the sentence.': 'Elige la forma verbal que completa correctamente la frase.',
    'Read the text and answer the question.': 'Lee el texto y responde a la pregunta.',
    'Choose the word or phrase closest in meaning to the word in capitals.': 'Elige la palabra o expresión de significado más cercano a la palabra en mayúsculas.',
    'Choose the word or phrase opposite in meaning to the word in capitals.': 'Elige la palabra o expresión de significado opuesto a la palabra en mayúsculas.',
  };
  const CAT_LABEL_ES = {
    vocabulary: 'Vocabulario y colocaciones', synonyms: 'Sinónimos / antónimos', contractual: 'Inglés contractual',
    fidic: 'FIDIC / gestión de proyectos', prepositions: 'Preposiciones', sva: 'Concordancia sujeto–verbo', reading: 'Lectura e inferencia',
  };
  const catLabel = (cat) => L(T.categories[cat].label, CAT_LABEL_ES[cat]);

  /* ------------------------------- lint ----------------------------------- */

  function lintItem(item, cat) {
    const e = [];
    const id = item.id || '?';
    const texts = item.options.map((o) => o.toLowerCase().trim());
    if (item.options.length < 3 || item.options.length > 5) e.push(`${id}: needs 3–5 options`);
    if (new Set(texts).size !== texts.length) e.push(`${id}: duplicate options`);
    if (!(item.answer >= 0 && item.answer < item.options.length)) e.push(`${id}: answer index out of range`);
    if (!item.notes || item.notes.length !== item.options.length) e.push(`${id}: notes must match options`);
    else item.notes.forEach((n, i) => { if (!n || n.trim().length < 8) e.push(`${id}: option ${i} lacks a written reason`); });
    const en = EN() && EN().items[item.id];
    if (!en) e.push(`${id}: missing English notes`);
    else {
      if (en.notes.length !== item.options.length) e.push(`${id}: English notes must match options`);
      else en.notes.forEach((n, i) => { if (!n || n.trim().length < 8) e.push(`${id}: English option ${i} lacks a written reason`); });
      if (!!item.rule !== !!en.rule && item.rule) e.push(`${id}: English rule missing`);
      if (!!item.diff !== !!en.diff && item.diff) e.push(`${id}: English difference missing`);
    }
    if (cat === 'synonyms') {
      if (!item.target || !item.stem.toLowerCase().includes(item.target.toLowerCase())) e.push(`${id}: target word missing in stem`);
      if (texts.includes(item.target.toLowerCase())) e.push(`${id}: an option repeats the target word`);
      if (!['syn', 'ant'].includes(item.mode)) e.push(`${id}: bad mode`);
    } else {
      const blanks = (item.stem.match(/____/g) || []).length;
      if (blanks !== 1) e.push(`${id}: stem must contain exactly one blank (found ${blanks})`);
      if (cat !== 'prepositions') {
        item.options.forEach((o) => { if (o.length >= 6 && item.stem.toLowerCase().includes(o.toLowerCase())) e.push(`${id}: option "${o}" already appears in the stem`); });
      }
    }
    if (item.options.some((o) => o.length > 40)) e.push(`${id}: option too long`);
    if (item.stem.length > 400) e.push(`${id}: stem too long`);
    return e;
  }

  function lintReading(p) {
    const e = [];
    const n = wordCount(p.text);
    if (n < 100 || n > 250) e.push(`${p.id}: passage has ${n} words (expected 100–250)`);
    const sup = p.claims.filter((c) => c.label === 'supported').length;
    const non = p.claims.length - sup;
    if (sup < 3) e.push(`${p.id}: needs ≥3 supported claims`);
    if (non < 3) e.push(`${p.id}: needs ≥3 non-supported claims`);
    p.claims.forEach((c, i) => {
      if (!['supported', 'contradicted', 'unsupported'].includes(c.label)) e.push(`${p.id}: claim ${i} bad label`);
      if (!c.why || c.why.length < 10) e.push(`${p.id}: claim ${i} lacks justification`);
      const w = EN() && EN().claims[p.id] && EN().claims[p.id][i];
      if (!w || w.length < 10) e.push(`${p.id}: claim ${i} lacks English justification`);
    });
    if (EN() && EN().claims[p.id] && EN().claims[p.id].length !== p.claims.length) e.push(`${p.id}: English claims must match claims`);
    const texts = p.claims.map((c) => c.text);
    if (new Set(texts).size !== texts.length) e.push(`${p.id}: duplicate claims`);
    for (const k of ['past', 'planned']) {
      const days = p.facts.filter((f) => f.kind === k).map((f) => f.day);
      if (new Set(days).size !== days.length) e.push(`${p.id}: duplicate ${k} fact days`);
    }
    return e;
  }

  function lintBank() {
    const errors = [];
    const stems = new Set();
    for (const cat of ['vocabulary', 'synonyms', 'contractual', 'fidic', 'prepositions']) {
      for (const item of bankFor(cat)) {
        errors.push(...lintItem(item, cat));
        if (stems.has(item.stem)) errors.push(`${item.id}: duplicate stem`);
        stems.add(item.stem);
      }
    }
    for (const p of T.readings) errors.push(...lintReading(p));
    return errors;
  }

  /* ------------------------------ explanation ------------------------------ */

  function buildExplanation(ex) {
    const correct = ex.options.find((o) => o.id === ex.correctAnswer);
    const notes = {};
    for (const o of ex.options) notes[o.id] = o.payload.note;
    const steps = [];
    let visual = null;
    const hasBlank = ex.question.includes('____');

    if (ex.kind === 'reading') {
      steps.push(X.step(L('Answer', 'Respuesta'), L(`The correct answer is ${correct.id}: “${correct.text}”`, `La respuesta correcta es la ${correct.id}: «${correct.text}».`)));
      steps.push(X.step(L('Evidence', 'Evidencia'), correct.payload.note));
      steps.push(X.step(L('Eliminating options', 'Eliminación de opciones'), L('Each alternative is checked against what the text actually says:', 'Cada alternativa se contrasta con lo que el texto dice realmente:'), ex.options.filter((o) => o.id !== correct.id).map((o) => `${o.id}) ${o.payload.note}`)));
      visual = { type: 'english', passage: ex.data.passage, highlight: null, rule: L('A statement is supported only if the text says it or necessarily implies it; what is plausible but not mentioned CANNOT be inferred.', 'Una afirmación solo está respaldada si el texto la dice o la implica de forma necesaria; lo plausible pero no mencionado NO se puede inferir.'), diff: null };
    } else {
      const completed = hasBlank ? ex.question.replace('____', correct.text) : ex.question;
      steps.push(X.step(L('Answer', 'Respuesta'), L(`The correct option is “${correct.text}”.`, `La opción correcta es «${correct.text}».`)));
      if (ex.data.rule) steps.push(X.step(L('Rule', 'Regla'), ex.data.rule));
      steps.push(X.step(L('Why it is correct', 'Por qué es correcta'), correct.payload.note));
      steps.push(X.step(L('Eliminating options', 'Eliminación de opciones'), L('The other options fail for specific reasons:', 'Las demás opciones fallan por motivos concretos:'), ex.options.filter((o) => o.id !== correct.id).map((o) => `${o.id}) ${RT.i18n.q(o.text)}: ${o.payload.note}`)));
      if (ex.data.diff) steps.push(X.step(L('Difference in meaning', 'Diferencia de significado'), ex.data.diff));
      visual = { type: 'english', completed, highlight: correct.text, rule: ex.data.rule || null, diff: ex.data.diff || null };
    }
    return { steps, visual, optionNotes: notes };
  }

  /* ------------------------------ generators ------------------------------- */

  function base(cat, level, question, instruction, options, correctId, data, extraMeta) {
    const ex = {
      kind: cat,
      question,
      data: Object.assign({ instruction, category: cat, categoryLabel: catLabel(cat), rules: [] }, data),
      constraints: [],
      options,
      correctAnswer: correctId,
      meta: Object.assign({ difficultyExempt: true, constraintCount: 0, kinds: [cat], category: cat, itemLevel: level }, extraMeta || {}),
    };
    ex.explanation = buildExplanation(ex);
    return ex;
  }

  function pickItem(rng, items, level) {
    const cfg = D.moduleConfig('english');
    const pool = items.filter((i) => cfg.itemLevels[level].includes(i.level));
    if (!pool.length) return null;
    return rng.weighted(pool.map((i) => [i, cfg.preferLevel[level].includes(i.level) ? 3 : 1]));
  }

  function fromBankItem(rng, cat, level) {
    const item = pickItem(rng, bankFor(cat), level);
    if (!item) return null;
    const order = rng.shuffle(item.options.map((_, i) => i));
    const options = order.map((old, k) => ({ id: LETTERS[k], text: item.options[old], payload: { note: itemNote(item, old) } }));
    const correctId = LETTERS[order.indexOf(item.answer)];
    return base(cat, item.level, item.stem, instructionFor(cat, item), options, correctId, { itemId: item.id, rule: itemRule(item), diff: itemDiff(item) });
  }

  function fromSva(rng, level) {
    const g = G.makeSva(rng, level);
    const forms = rng.shuffle(g.forms);
    const options = forms.map((f, k) => ({ id: LETTERS[k], text: f, payload: { note: G.noteFor(g.spec, f) } }));
    const correctId = LETTERS[forms.indexOf(g.correct)];
    return base('sva', level, g.stem, T.categories.sva.instruction, options, correctId, { sva: g.spec, rule: G.ruleFor(g.spec), diff: null }, { pattern: g.spec.pattern });
  }

  const READ_Q = {
    supported: 'Which of the following statements is supported by the text?',
    cannot: 'Which of the following statements CANNOT be inferred from the text?',
    pastFirst: 'According to the text, which of these events happened FIRST?',
    pastLast: 'According to the text, which of these events happened LAST?',
    plannedFirst: 'According to the text, which of these events is scheduled to happen FIRST?',
    plannedLast: 'According to the text, which of these events is scheduled to happen LAST?',
  };

  function fromReading(rng, level) {
    const cfg = D.moduleConfig('english');
    const p = pickItem(rng, T.readings, level);
    if (!p) return null;
    const sup = p.claims.map((c, i) => ({ c, i })).filter((x) => x.c.label === 'supported');
    const non = p.claims.map((c, i) => ({ c, i })).filter((x) => x.c.label !== 'supported');
    const past = p.facts.filter((f) => f.kind === 'past');
    const planned = p.facts.filter((f) => f.kind === 'planned');
    const types = ['supported', 'cannot'];
    if (past.length >= 3) types.push('pastFirst', 'pastLast');
    if (planned.length >= 3) types.push('plannedFirst', 'plannedLast');
    const qType = rng.pick(types);

    let rows; // [{text, payload, ok}]
    if (qType === 'supported' || qType === 'cannot') {
      const rightPool = qType === 'supported' ? sup : non;
      const wrongPool = qType === 'supported' ? non : sup;
      if (!rightPool.length || wrongPool.length < 3) return null;
      const right = rng.pick(rightPool);
      const wrong = rng.sample(wrongPool, 3);
      const mk = (x, ok) => {
        const prefix = x.c.label === 'supported' ? L('Supported by the text', 'Respaldada por el texto') : x.c.label === 'contradicted' ? L('Contradicts the text', 'Contradice el texto') : L('Cannot be inferred', 'No se puede inferir');
        return { text: x.c.text, ok, payload: { claim: x.i, label: x.c.label, note: `${prefix}: ${claimWhy(p, x.i)}` } };
      };
      rows = [mk(right, true), ...wrong.map((w) => mk(w, false))];
    } else {
      const pool = qType.startsWith('past') ? past : planned;
      const chosen = rng.sample(pool, Math.min(4, pool.length));
      const days = chosen.map((f) => f.day);
      const target = qType.endsWith('First') ? Math.min(...days) : Math.max(...days);
      rows = chosen.map((f) => ({ text: f.text, ok: f.day === target, payload: { day: f.day, note: L(`According to the text it happens ${when(f.day)}.`, `Según el texto ocurre ${when(f.day)}.`) } }));
    }
    const shuffled = rng.shuffle(rows);
    const options = shuffled.map((r, k) => ({ id: LETTERS[k], text: r.text, payload: r.payload }));
    const correctId = options[shuffled.findIndex((r) => r.ok)].id;
    return base('reading', p.level, READ_Q[qType], T.categories.reading.instruction, options, correctId,
      { passage: p.text, passageId: p.id, passageType: p.type, qType, rule: null, diff: null }, { passageId: p.id });
  }

  function generate(rng, level) {
    const cats = Object.keys(T.categories);
    const cat = rng.weighted(cats.map((c) => [c, T.categories[c].weight]));
    if (cat === 'sva') return fromSva(rng, level);
    if (cat === 'reading') return fromReading(rng, level);
    return fromBankItem(rng, cat, level);
  }

  /* ------------------------------ verification ------------------------------ */

  function verify(ex) {
    const errors = [];
    const validity = {};
    const cat = ex.kind;

    if (ex.options.length < 3 || ex.options.length > 5) errors.push('option count must be 3–5');
    for (const o of ex.options) if (!o.payload || !o.payload.note || o.payload.note.length < 8) errors.push(`option ${o.id} lacks a written reason`);

    if (cat === 'sva') {
      const spec = ex.data.sva;
      if (G.renderStem(spec) !== ex.question) errors.push('stem does not match the SVA spec');
      if ((ex.question.match(/____/g) || []).length !== 1) errors.push('SVA stem needs exactly one blank');
      for (const o of ex.options) {
        validity[o.id] = G.validForm(spec, o.text);
        if (o.payload.note !== G.noteFor(spec, o.text)) errors.push(`note for ${o.id} does not match the engine`);
      }
      if (G.ruleFor(spec) !== ex.data.rule) errors.push('rule text does not match the SVA spec');
    } else if (cat === 'reading') {
      const p = T.readings.find((r) => r.id === ex.data.passageId);
      if (!p) errors.push('unknown passage');
      else {
        errors.push(...lintReading(p));
        if (ex.data.passage !== p.text) errors.push('passage text does not match the source passage');
        if (ex.question !== READ_Q[ex.data.qType]) errors.push('question text does not match question type');
        if (ex.data.passage !== p.text) errors.push('passage text mismatch');
        for (const o of ex.options) {
          if (o.payload.claim !== undefined && !o.payload.note.endsWith(claimWhy(p, o.payload.claim))) errors.push(`note for ${o.id} does not match the claim justification`);
          if (ex.data.qType === 'supported') validity[o.id] = p.claims[o.payload.claim].label === 'supported' && p.claims[o.payload.claim].text === o.text;
          else if (ex.data.qType === 'cannot') validity[o.id] = p.claims[o.payload.claim].label !== 'supported' && p.claims[o.payload.claim].text === o.text;
          else {
            const pool = ex.options.map((x) => x.payload.day);
            const target = ex.data.qType.endsWith('First') ? Math.min(...pool) : Math.max(...pool);
            const fact = p.facts.find((f) => f.day === o.payload.day && f.text === o.text);
            validity[o.id] = !!fact && o.payload.day === target;
          }
        }
      }
    } else {
      const item = bankFor(cat).find((i) => i.id === ex.data.itemId);
      if (!item) errors.push('unknown bank item');
      else {
        errors.push(...lintItem(item, cat));
        if (item.stem !== ex.question) errors.push('stem does not match bank item');
        if (!same(item.options.slice().sort(), ex.options.map((o) => o.text).sort())) errors.push('options do not match bank item');
        for (const o of ex.options) {
          validity[o.id] = o.text === item.options[item.answer];
          if (o.payload.note !== itemNote(item, item.options.indexOf(o.text))) errors.push(`note for ${o.id} does not match the bank item`);
        }
        if ((ex.data.rule || null) !== itemRule(item) || (ex.data.diff || null) !== itemDiff(item)) errors.push('rule/difference does not match the bank item');
      }
    }
    const ok = Object.keys(validity).filter((k) => validity[k]);
    if (!same(buildExplanation(ex), ex.explanation)) errors.push('explanation does not match exercise data');
    return { errors, solutionCount: ok.length, solverAnswer: ok.length === 1 ? ok[0] : null, optionValidity: validity };
  }

  RT.registerModule({
    id: 'english',
    label: 'Contractual English',
    description: 'Vocabulary, agreement, prepositions, contract terms and reading inference in professional English.',
    answerType: 'option',
    generate,
    verify,
  });
  RT.english = { itemNote, claimWhy, catLabel, lintBank, lintItem, lintReading, buildExplanation, bankFor };
})();
