/**
 * positional.js — MODULE B: Positional Constraints.
 *
 * Pipeline: hidden arrangement -> add TRUE constraints one by one (each must
 * shrink the solution set) -> prune redundant rules -> build question/options
 * -> (validator re-solves everything from the serialised constraints).
 *
 * Question kinds
 *   position / who  : the full arrangement must be UNIQUE (exactly 1 solution)
 *   sequence        : exactly one of 5 listed orders satisfies every rule
 *   must/cannot/could: statements classified over ALL valid arrangements
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const S = RT.solver;
  const D = RT.difficulty;
  const X = RT.explanation;

  const L = (en, es) => RT.i18n.pick(en, es);
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
  const NUM_ES = ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete'];
  const num = (k) => L(NUM[k], NUM_ES[k]);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const range = (n) => Array.from({ length: n }, (_, i) => i + 1);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const PERSONAL = ['people', 'contractors'];
  /** In Spanish, names of things (not people/companies) are quoted so that bare nouns read naturally in a sentence. */
  const decor = (N, cat) => (RT.i18n.lang === 'es' && !PERSONAL.includes(cat) ? N.map((x) => '«' + x + '»') : N);

  /* ---------------------------- text rendering ---------------------------- */

  function clause(c, N) {
    switch (c.type) {
      case 'abs': return L(`${N[c.a]} is in position ${c.pos}`, `${N[c.a]} está en la posición ${c.pos}`);
      case 'notAbs': return L(`${N[c.a]} is not in position ${c.pos}`, `${N[c.a]} no está en la posición ${c.pos}`);
      case 'oneOf': return L(`${N[c.a]} is in position ${c.positions[0]} or ${c.positions[1]}`, `${N[c.a]} está en la posición ${c.positions[0]} o ${c.positions[1]}`);
      case 'gap': return L(`exactly ${NUM[c.k]} ${c.k === 1 ? 'position lies' : 'positions lie'} between ${N[c.a]} and ${N[c.b]}`,
        `exactamente ${NUM_ES[c.k]} ${c.k === 1 ? 'posición separa' : 'posiciones separan'} a ${N[c.a]} y ${N[c.b]}`);
      case 'offset':
        if (c.d === 1) return c.flip ? L(`${N[c.b]} is immediately after ${N[c.a]}`, `${N[c.b]} está justo después de ${N[c.a]}`) : L(`${N[c.a]} is immediately before ${N[c.b]}`, `${N[c.a]} está justo antes de ${N[c.b]}`);
        return c.flip ? L(`${N[c.b]} is exactly ${NUM[c.d]} positions after ${N[c.a]}`, `${N[c.b]} está exactamente ${NUM_ES[c.d]} posiciones después de ${N[c.a]}`)
          : L(`${N[c.a]} is exactly ${NUM[c.d]} positions before ${N[c.b]}`, `${N[c.a]} está exactamente ${NUM_ES[c.d]} posiciones antes de ${N[c.b]}`);
      case 'before': return c.flip ? L(`${N[c.b]} comes after ${N[c.a]}`, `${N[c.b]} va después de ${N[c.a]}`) : L(`${N[c.a]} comes before ${N[c.b]}`, `${N[c.a]} va antes que ${N[c.b]}`);
      case 'adj': return L(`${N[c.a]} and ${N[c.b]} are next to each other`, `${N[c.a]} y ${N[c.b]} están uno al lado del otro`);
      case 'notAdj': return L(`${N[c.a]} and ${N[c.b]} are not next to each other`, `${N[c.a]} y ${N[c.b]} no están uno al lado del otro`);
      case 'block': {
        const first = c.items.map((i) => N[i]).slice(0, 2).join(', ');
        return L(`${first} and ${N[c.items[2]]} occupy three consecutive positions (in any order)`, `${first} y ${N[c.items[2]]} ocupan tres posiciones consecutivas (en cualquier orden)`);
      }
      case 'cond': return L(`if ${clause(c.if, N)}, then ${clause(c.then, N)}`, `si ${clause(c.if, N)}, entonces ${clause(c.then, N)}`);
      default: throw new Error('clause: unknown type ' + c.type);
    }
  }
  const sentence = (c, N) => cap(clause(c, N)) + '.';

  const orderStr = (p, N) => S.toOrder(p).map((i) => N[i]).join(' – ');
  const orderToPos = (order) => {
    const p = new Array(order.length);
    order.forEach((item, idx) => (p[item] = idx + 1));
    return p;
  };

  function buildQuestion(kind, query, N, n) {
    switch (kind) {
      case 'position': return L(`What is the position of ${N[query.item]}?`, `¿Cuál es la posición de ${N[query.item]}?`);
      case 'who': return L(`Who is in position ${query.pos}?`, `¿Quién está en la posición ${query.pos}?`);
      case 'sequence': return L(`Which of the following orders (positions 1 to ${n}, left to right) satisfies ALL the rules?`, `¿Cuál de los siguientes órdenes (posiciones 1 a ${n}, de izquierda a derecha) cumple TODAS las reglas?`);
      case 'must': return L('Which of the following MUST be true?', '¿Cuál de las siguientes afirmaciones DEBE ser cierta?');
      case 'cannot': return L('Which of the following CANNOT be true?', '¿Cuál de las siguientes afirmaciones NO PUEDE ser cierta?');
      case 'could': return L('Which of the following COULD be true?', '¿Cuál de las siguientes afirmaciones PUEDE ser cierta?');
      default: throw new Error('unknown kind ' + kind);
    }
  }

  /* ----------------------- constraint generation ------------------------- */

  /** random constraint that is TRUE in solution p */
  function randomTrue(rng, n, p, types) {
    const type = rng.pick(types);
    const items = range(n).map((x) => x - 1);
    const itemAt = (pos) => p.indexOf(pos);
    const two = () => rng.sample(items, 2);
    switch (type) {
      case 'abs': { const a = rng.pick(items); return { type, a, pos: p[a] }; }
      case 'notAbs': {
        const a = rng.pick(items);
        return { type, a, pos: rng.pick(range(n).filter((x) => x !== p[a])) };
      }
      case 'oneOf': {
        const a = rng.pick(items);
        const o = rng.pick(range(n).filter((x) => x !== p[a]));
        return { type, a, positions: [p[a], o].sort((x, y) => x - y) };
      }
      case 'before': {
        let [a, b] = two();
        if (p[a] > p[b]) [a, b] = [b, a];
        return { type, a, b, flip: rng.chance(0.5) };
      }
      case 'offset': {
        let [a, b] = two();
        if (p[a] > p[b]) [a, b] = [b, a];
        const d = p[b] - p[a];
        if (d > 3) return null;
        return { type, a, b, d, flip: rng.chance(0.5) };
      }
      case 'adj': {
        const a = rng.pick(items);
        const nb = [p[a] - 1, p[a] + 1].filter((x) => x >= 1 && x <= n).map(itemAt);
        return { type, a, b: rng.pick(nb) };
      }
      case 'gap': {
        const [a, b] = two();
        const diff = Math.abs(p[a] - p[b]);
        if (diff < 2 || diff > 4) return null;
        return { type, a, b, k: diff - 1 };
      }
      case 'notAdj': {
        const [a, b] = two();
        if (Math.abs(p[a] - p[b]) < 2) return null;
        return { type, a, b };
      }
      case 'block': {
        const start = rng.int(1, n - 2);
        return { type, items: rng.shuffle([itemAt(start), itemAt(start + 1), itemAt(start + 2)]) };
      }
      case 'cond': {
        const simple = ['before', 'abs', 'notAbs', 'adj', 'notAdj', 'oneOf'];
        const other = rng.pick(S.permutations(n));
        const ifC = randomTrue(rng, n, other, simple);
        if (!ifC) return null;
        const thenC = S.evalConstraint(ifC, p)
          ? randomTrue(rng, n, p, ['abs', 'oneOf', 'before', 'adj', 'notAbs'])
          : randomTrue(rng, n, rng.pick(S.permutations(n)), ['abs', 'oneOf', 'before', 'adj']);
        if (!thenC || same(ifC, thenC)) return null;
        return { type, if: ifC, then: thenC };
      }
      default: throw new Error('unknown constraint type ' + type);
    }
  }

  /** drop every rule that does not change the solution set */
  function prune(n, cs) {
    let cur = cs.slice();
    let changed = true;
    while (changed) {
      changed = false;
      const base = S.solveOrdering(n, cur).length;
      for (let i = 0; i < cur.length; i++) {
        const rest = cur.filter((_, j) => j !== i);
        if (S.solveOrdering(n, rest).length === base) {
          cur = rest;
          changed = true;
          break;
        }
      }
    }
    return cur;
  }

  function trace(n, cs) {
    const out = [S.permutations(n).length];
    let sols = S.permutations(n);
    for (const c of cs) {
      sols = S.filterSolutions(sols, c);
      out.push(sols.length);
    }
    return out;
  }

  /* ------------------------------ options -------------------------------- */

  const LETTERS = ['A', 'B', 'C', 'D', 'E'];
  const withIds = (arr) => arr.map((o, i) => Object.assign({ id: LETTERS[i] }, o));

  function sequenceOptions(rng, n, sols, constraints, N) {
    const good = rng.pick(sols);
    const goodOrder = S.toOrder(good);
    const bad = [];
    const seen = new Set([goodOrder.join(',')]);
    for (let t = 0; t < 120 && bad.length < 4; t++) {
      const o = goodOrder.slice();
      const [i, j] = rng.sample(range(n).map((x) => x - 1), 2);
      [o[i], o[j]] = [o[j], o[i]];
      if (t > 60) o.splice(0, o.length, ...rng.shuffle(o));
      const key = o.join(',');
      if (seen.has(key)) continue;
      if (S.holdsAll(constraints, orderToPos(o))) continue;
      seen.add(key);
      bad.push(o);
    }
    if (bad.length < 4) return null;
    const all = rng.shuffle([{ order: goodOrder, ok: true }, ...bad.map((o) => ({ order: o, ok: false }))]);
    const options = withIds(all.map((x) => ({ text: x.order.map((i) => N[i]).join(' – '), payload: { order: x.order } })));
    const correct = options[all.findIndex((x) => x.ok)].id;
    return { options, correct };
  }

  function statementOptions(rng, n, sols, kind, constraints, N) {
    const seen = new Set(constraints.map((c) => clause(c, N)));
    const pool = { must: [], cont: [], imp: [] };
    const types = ['abs', 'notAbs', 'before', 'adj', 'notAdj', 'oneOf', 'offset'];
    const perms = S.permutations(n);
    for (let i = 0; i < 400; i++) {
      const st = randomTrue(rng, n, rng.pick(perms), types);
      if (!st) continue;
      const txt = clause(st, N);
      if (seen.has(txt)) continue;
      seen.add(txt);
      const cnt = sols.filter((p) => S.evalConstraint(st, p)).length;
      (cnt === sols.length ? pool.must : cnt === 0 ? pool.imp : pool.cont).push(st);
    }
    let right;
    let wrong;
    if (kind === 'must') { right = pool.must; wrong = pool.cont; }
    else if (kind === 'cannot') { right = pool.imp; wrong = pool.cont; }
    else { right = pool.cont; wrong = pool.imp; }
    if (!right.length || wrong.length < 4) return null;
    const r = rng.pick(right);
    const w = rng.sample(wrong, 4);
    const all = rng.shuffle([{ st: r, ok: true }, ...w.map((st) => ({ st, ok: false }))]);
    const options = withIds(all.map((x) => ({ text: cap(clause(x.st, N)), payload: { stmt: x.st } })));
    return { options, correct: options[all.findIndex((x) => x.ok)].id };
  }

  /* ----------------------------- generation ------------------------------ */

  function generate(rng, level) {
    const cfg = D.moduleConfig('positional');
    const n = cfg.items[level];
    const kind = rng.pick(cfg.kinds[level]);
    const catKey = rng.pick(Object.keys(RT.pools.positional));
    const cat = RT.pools.positional[catKey];
    const N = rng.sample(cat.names, n);
    const DN = decor(N, catKey);
    const perms = S.permutations(n);
    const hidden = rng.pick(perms);
    const [minC, maxC] = D.level(level).constraints;
    const unique = kind === 'position' || kind === 'who';
    const capSol = cfg.maxMultiSolutions[level];
    const minSol = cfg.minMultiSolutions;
    const types = cfg.constraintTypes[level];

    let sols = perms;
    let chosen = [];
    for (let guard = 0; guard < 150; guard++) {
      if (unique ? sols.length === 1 : chosen.length >= minC && sols.length <= capSol) break;
      if (chosen.length >= maxC) return null;
      const cands = [];
      for (let t = 0; t < cfg.candidatePool[level]; t++) {
        const c = randomTrue(rng, n, hidden, types);
        if (!c || chosen.some((x) => same(x, c))) continue;
        const next = S.filterSolutions(sols, c);
        if (next.length >= sols.length) continue;
        if (!unique && next.length < minSol) continue;
        cands.push({ c, next });
      }
      if (!cands.length) { if (guard > 100) return null; continue; }
      let pick;
      if (cfg.bias[level] === 'strong') pick = cands.reduce((a, b) => (b.next.length < a.next.length ? b : a));
      else pick = rng.pick(cands);
      chosen.push(pick.c);
      sols = pick.next;
    }
    chosen = prune(n, chosen);
    sols = S.solveOrdering(n, chosen);
    if (chosen.length < minC || chosen.length > maxC) return null;
    if (unique ? sols.length !== 1 : sols.length < minSol || sols.length > capSol) return null;

    // ---- question ----
    const query = {};
    let built;
    if (kind === 'position') {
      query.item = rng.int(0, n - 1);
      if (chosen.some((c) => c.type === 'abs' && c.a === query.item)) return null; // trivial
      const ans = sols[0][query.item];
      const others = rng.sample(range(n).filter((x) => x !== ans), 4);
      const posList = [ans, ...others].sort((x, y) => x - y);
      const options = withIds(posList.map((pos) => ({ text: L(`Position ${pos}`, `Posición ${pos}`), payload: { pos } })));
      built = { options, correct: options[posList.indexOf(ans)].id };
    } else if (kind === 'who') {
      query.pos = rng.int(1, n);
      const ansItem = S.toOrder(sols[0])[query.pos - 1];
      if (chosen.some((c) => c.type === 'abs' && c.a === ansItem)) return null;
      const items = [ansItem, ...rng.sample(range(n).map((x) => x - 1).filter((x) => x !== ansItem), 4)];
      const shuffled = rng.shuffle(items);
      const options = withIds(shuffled.map((item) => ({ text: N[item], payload: { item } })));
      built = { options, correct: options[shuffled.indexOf(ansItem)].id };
    } else if (kind === 'sequence') {
      built = sequenceOptions(rng, n, sols, chosen, N);
    } else {
      built = statementOptions(rng, n, sols, kind, chosen, DN);
    }
    if (!built) return null;

    const ex = {
      kind,
      question: buildQuestion(kind, query, DN, n),
      data: {
        intro: L(`${cap(NUM[n])} ${cat.noun} must be arranged in positions 1 to ${n}, one per position (position 1 is first).`,
          `Hay ${NUM_ES[n]} ${cat.noun} que deben colocarse en las posiciones 1 a ${n}, una por posición (la posición 1 es la primera).`),
        category: catKey,
        names: N,
        rules: chosen.map((c) => sentence(c, DN)),
        query,
      },
      constraints: chosen,
      options: built.options,
      correctAnswer: built.correct,
      meta: { constraintCount: chosen.length, kinds: chosen.map((c) => c.type), items: n, category: catKey },
    };
    ex.explanation = buildExplanation(ex);
    return ex;
  }

  /* ------------------------------ analysis -------------------------------- */

  function optionValid(ex, opt, sols) {
    const q = ex.data.query;
    switch (ex.kind) {
      case 'position': return sols.length > 0 && sols.every((p) => p[q.item] === opt.payload.pos);
      case 'who': return sols.length > 0 && sols.every((p) => p[opt.payload.item] === q.pos);
      case 'sequence': return S.holdsAll(ex.constraints, orderToPos(opt.payload.order));
      case 'must': return sols.length > 0 && sols.every((p) => S.evalConstraint(opt.payload.stmt, p));
      case 'cannot': return sols.length > 0 && sols.every((p) => !S.evalConstraint(opt.payload.stmt, p));
      case 'could': return sols.some((p) => S.evalConstraint(opt.payload.stmt, p));
      default: return false;
    }
  }

  /* ----------------------------- explanation ------------------------------ */

  function buildExplanation(ex) {
    const N = ex.data.names;
    const DN = decor(N, ex.data.category);
    const n = N.length;
    const cs = ex.constraints;
    const sols = S.solveOrdering(n, cs);
    const tr = trace(n, cs);
    const unique = ex.kind === 'position' || ex.kind === 'who';
    const q = ex.data.query;
    const steps = [];
    const plural = (k, en1, enN, es1, esN) => (k === 1 ? L(en1, es1) : L(enN, esN));

    cs.forEach((c, i) => {
      steps.push(X.step(L(`Rule ${i + 1}`, `Regla ${i + 1}`), L(`“${ex.data.rules[i]}” → of ${tr[i]} ${plural(tr[i], 'possible arrangement', 'possible arrangements', '', '')}, ${tr[i + 1]} remain.`,
        `“${ex.data.rules[i]}” → de ${tr[i]} ${plural(tr[i], '', '', 'configuración posible', 'configuraciones posibles')} quedan ${tr[i + 1]}.`)));
    });

    const notes = {};
    let visual;
    if (unique) {
      const p = sols[0];
      const order = S.toOrder(p).map((i) => N[i]);
      const answerText = ex.kind === 'position'
        ? L(`${DN[q.item]} is in position ${p[q.item]}`, `${DN[q.item]} ocupa la posición ${p[q.item]}`)
        : L(`the one in position ${q.pos} is ${DN[S.toOrder(p)[q.pos - 1]]}`, `en la posición ${q.pos} está ${DN[S.toOrder(p)[q.pos - 1]]}`);
      steps.push(X.step(L('Derived restriction', 'Restricción derivada'), L(`With all the rules applied only 1 arrangement survives: ${order.join(' – ')}.`, `Aplicadas todas las reglas solo sobrevive 1 configuración: ${order.join(' – ')}.`)));
      steps.push(X.step(L('Conclusion', 'Conclusión'), L(`Therefore ${answerText}.`, `Por tanto ${answerText}.`)));
      for (const o of ex.options) {
        const ok = optionValid(ex, o, sols);
        if (ex.kind === 'position') {
          notes[o.id] = ok ? L(`Correct: in the only valid arrangement ${DN[q.item]} is in position ${o.payload.pos}.`, `Correcta: en la única configuración válida ${DN[q.item]} está en la posición ${o.payload.pos}.`)
            : L(`Wrong: ${DN[q.item]} is in position ${p[q.item]}, not in ${o.payload.pos}.`, `Incorrecta: ${DN[q.item]} está en la posición ${p[q.item]}, no en la ${o.payload.pos}.`);
        } else {
          notes[o.id] = ok ? L(`Correct: ${DN[o.payload.item]} is in position ${q.pos}.`, `Correcta: ${DN[o.payload.item]} ocupa la posición ${q.pos}.`)
            : L(`Wrong: ${DN[o.payload.item]} is in position ${p[o.payload.item]}, not ${q.pos}.`, `Incorrecta: ${DN[o.payload.item]} ocupa la posición ${p[o.payload.item]}, no la ${q.pos}.`);
        }
      }
      visual = { type: 'order', rows: [{ label: L('Solution', 'Solución'), order }] };
    } else {
      steps.push(X.step(L('Derived restriction', 'Restricción derivada'), L(`After the ${cs.length} rules, ${sols.length} valid arrangements remain. Each option is checked against all of them.`, `Tras las ${cs.length} reglas quedan ${sols.length} configuraciones válidas. Cada opción se evalúa contra todas ellas.`)));
      const sample = sols.slice(0, 3).map((p, i) => ({ label: L(`Valid ${i + 1}`, `Válida ${i + 1}`), order: S.toOrder(p).map((k) => N[k]) }));
      if (ex.kind === 'sequence') {
        for (const o of ex.options) {
          const p = orderToPos(o.payload.order);
          const broken = cs.map((c, i) => (S.evalConstraint(c, p) ? null : i + 1)).filter(Boolean);
          notes[o.id] = broken.length ? L(`Ruled out: it breaks rule${broken.length > 1 ? 's' : ''} ${broken.join(', ')}.`, `Descartada: incumple la${broken.length > 1 ? 's' : ''} regla${broken.length > 1 ? 's' : ''} ${broken.join(', ')}.`)
            : L('Correct: it satisfies every rule.', 'Correcta: cumple todas las reglas.');
        }
        const right = ex.options.find((o) => o.id === ex.correctAnswer);
        steps.push(X.step(L('Eliminating options', 'Eliminación de opciones'), L('The rules are checked one by one on each order; only one order satisfies all of them.', 'Se comprueban las reglas una a una sobre cada secuencia; solo una las cumple todas.')));
        steps.push(X.step(L('Conclusion', 'Conclusión'), L(`The valid order is ${ex.correctAnswer}: ${right.text}.`, `La secuencia válida es la ${ex.correctAnswer}: ${right.text}.`)));
        visual = { type: 'order', rows: [{ label: L('Correct', 'Correcta'), order: right.payload.order.map((i) => N[i]) }] };
      } else {
        for (const o of ex.options) {
          const holds = sols.filter((p) => S.evalConstraint(o.payload.stmt, p));
          const fails = sols.filter((p) => !S.evalConstraint(o.payload.stmt, p));
          if (ex.kind === 'must') notes[o.id] = fails.length === 0 ? L(`Correct: it is true in all ${sols.length} valid arrangements.`, `Correcta: es cierta en las ${sols.length} configuraciones válidas.`)
            : L(`Not necessary: it is false, for example, in ${orderStr(fails[0], N)}.`, `No es obligatoria: es falsa, por ejemplo, en ${orderStr(fails[0], N)}.`);
          else if (ex.kind === 'cannot') notes[o.id] = holds.length === 0 ? L(`Correct: it is false in all ${sols.length} valid arrangements.`, `Correcta: es falsa en las ${sols.length} configuraciones válidas.`)
            : L(`It can be true, for example, in ${orderStr(holds[0], N)}.`, `Puede ser cierta, por ejemplo, en ${orderStr(holds[0], N)}.`);
          else notes[o.id] = holds.length ? L(`Correct: it is true in ${holds.length} of ${sols.length} arrangements, for example ${orderStr(holds[0], N)}.`, `Correcta: es cierta en ${holds.length} de ${sols.length} configuraciones, por ejemplo ${orderStr(holds[0], N)}.`)
            : L(`Impossible: it is false in all ${sols.length} valid arrangements.`, `Imposible: es falsa en las ${sols.length} configuraciones válidas.`);
        }
        const label = {
          must: L('it is true in every arrangement', 'es cierta en todas las configuraciones'),
          cannot: L('it is false in every arrangement', 'es falsa en todas las configuraciones'),
          could: L('it is true in at least one arrangement', 'es cierta al menos en una configuración'),
        }[ex.kind];
        steps.push(X.step(L('Eliminating options', 'Eliminación de opciones'), L(`Each statement is classified: ${label} ↔ it answers the question.`, `Se clasifica cada afirmación: ${label} ↔ cumple la pregunta.`)));
        const right = ex.options.find((o) => o.id === ex.correctAnswer);
        steps.push(X.step(L('Conclusion', 'Conclusión'), L(`The answer is ${ex.correctAnswer}: «${right.text}».`, `La respuesta es la ${ex.correctAnswer}: «${right.text}».`)));
        visual = { type: 'order', rows: sample };
      }
    }
    return { steps, visual, optionNotes: notes };
  }

  /* ------------------------------ verification ---------------------------- */

  function verify(ex) {
    const errors = [];
    const N = ex.data.names;
    const n = N.length;
    if (new Set(N).size !== n) errors.push('duplicate item names');
    // Statement text must be derived from exactly the constraints the solver uses
    const DN = decor(N, ex.data.category);
    const rules = ex.constraints.map((c) => sentence(c, DN));
    if (!same(rules, ex.data.rules)) errors.push('rules text does not match constraints');
    if (ex.meta.constraintCount !== ex.constraints.length) errors.push('constraintCount mismatch');
    if (ex.question !== buildQuestion(ex.kind, ex.data.query, DN, n)) errors.push('question text does not match query');

    const sols = S.solveOrdering(n, ex.constraints);
    if (sols.length === 0) errors.push('constraints are contradictory (0 solutions)');
    const unique = ex.kind === 'position' || ex.kind === 'who';
    if (unique && sols.length !== 1) errors.push(`expected unique arrangement, found ${sols.length}`);

    const optionValidity = {};
    for (const o of ex.options) optionValidity[o.id] = optionValid(ex, o, sols);
    const valid = Object.keys(optionValidity).filter((k) => optionValidity[k]);

    if (!same(buildExplanation(ex), ex.explanation)) errors.push('explanation does not match solver output');
    return { errors, solutionCount: sols.length, solverAnswer: valid.length === 1 ? valid[0] : null, optionValidity };
  }

  RT.registerModule({
    id: 'positional',
    label: 'Positional Logic',
    description: 'Order people, contractors or activities from a set of positional rules.',
    answerType: 'option',
    generate,
    verify,
  });
  RT.positionalInternals = { clause, sentence, randomTrue, buildExplanation, optionValid, orderToPos };
})();
