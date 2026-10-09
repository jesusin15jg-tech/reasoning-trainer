/**
 * calendar.js — MODULE C: Calendar Logic.
 *
 * A month (28–31 days, any starting weekday), a team of 4–5 people and a set of
 * availability rules. The user must select EVERY date on which the whole team
 * can work. Grading is exact set equality (no partial credit).
 *
 * The solver (solver.solveCalendar) is cross-checked by an independent
 * implementation built on the real JS Date calendar (see independentSolve).
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const S = RT.solver;
  const D = RT.difficulty;
  const X = RT.explanation;

  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const L = (en, es) => RT.i18n.pick(en, es);
  const DAYS = S.WEEKDAYS;
  const DAYS_ES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const ORD_WORD = { 1: 'first', 2: 'second', 3: 'third', 4: 'fourth', last: 'last' };
  const ORD_ES = { 1: 'primer', 2: 'segundo', 3: 'tercer', 4: 'cuarto', last: 'último' };
  const dayName = (i) => L(DAYS[i], DAYS_ES[i]);
  /** "Mondays" / "los lunes" */
  const dayPlural = (i) => L(DAYS[i] + 's', (i >= 5 ? DAYS_ES[i] + 's' : DAYS_ES[i]));

  function ordNum(n) {
    const v = n % 100;
    const suf = v >= 11 && v <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
    return `${n}${suf}`;
  }
  const joinEn = (arr) => (arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]);
  const joinOr = (arr) => (arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + L(' or ', ' o ') + arr[arr.length - 1]);
  const joinEs = (arr) => (arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1]);

  /* ----------------------------- text ------------------------------------ */

  function ruleText(r) {
    switch (r.type) {
      case 'holiday': return L(`The ${ordNum(r.day)} is a public holiday (nobody works).`, `El día ${r.day} es festivo (nadie trabaja).`);
      case 'weekday': return L(`${r.person} does not work on ${joinOr(r.days.map(dayPlural))}.`, `${r.person} no trabaja los ${joinOr(r.days.map(dayPlural))}.`);
      case 'date': return L(`${r.person} cannot work on the ${ordNum(r.day)}.`, `${r.person} no puede trabajar el día ${r.day}.`);
      case 'range': return L(`${r.person} is on leave from the ${ordNum(r.from)} to the ${ordNum(r.to)} (both included).`, `${r.person} está de permiso del día ${r.from} al día ${r.to} (ambos incluidos).`);
      case 'ordinal': return L(`${r.person} does not work on the ${joinEn(r.ordinals.map((o) => ORD_WORD[o]))} ${DAYS[r.weekday]}${r.ordinals.length > 1 ? 's' : ''} of the month.`,
        `${r.person} no trabaja ${joinEs(r.ordinals.map((o) => 'el ' + ORD_ES[o]))} ${DAYS_ES[r.weekday]} del mes.`);
      case 'conditional': return L(`${r.person} does not work on ${joinOr(r.days.map(dayPlural))} of any week in which ${r.other} works on the ${DAYS[r.weekday]} of that same week.`,
        `${r.person} no trabaja los ${joinOr(r.days.map(dayPlural))} de ninguna semana en la que ${r.other} trabaje el ${DAYS_ES[r.weekday]} de esa misma semana.`);
      default: throw new Error('unknown rule type ' + r.type);
    }
  }

  const questionText = (n) => L(`On which dates can all ${n} people work together? Select every valid date.`, `¿En qué fechas pueden trabajar juntas las ${n} personas? Selecciona todas las fechas válidas.`);
  const introText = (base) => L(`A ${base.days}-day month whose 1st falls on a ${DAYS[base.startDow]}. Nobody works on Saturdays or Sundays. Weeks run Monday to Sunday; only dates inside this month are considered.`,
    `Un mes de ${base.days} días cuyo día 1 cae en ${DAYS_ES[base.startDow]}. Nadie trabaja los sábados ni los domingos. Las semanas van de lunes a domingo; solo se consideran las fechas de este mes.`);

  /* ----------------------- constraints <-> spec --------------------------- */

  function specFromConstraints(base, constraints) {
    const people = base.names.map((name) => ({ name, rules: [] }));
    const holidays = [];
    for (const c of constraints) {
      if (c.type === 'holiday') holidays.push(c.day);
      else people.find((p) => p.name === c.person).rules.push(c);
    }
    return { days: base.days, startDow: base.startDow, holidays, people };
  }

  /* ----------------------- independent verification ---------------------- */

  /** find a real (year, month) whose length and first weekday match */
  function realMonthFor(days, startDow) {
    for (let y = 2000; y <= 2040; y++) {
      for (let m = 0; m < 12; m++) {
        const len = new Date(y, m + 1, 0).getDate();
        const dow = (new Date(y, m, 1).getDay() + 6) % 7; // JS: 0=Sun -> 0=Mon
        if (len === days && dow === startDow) return { y, m };
      }
    }
    return null;
  }

  /** same problem solved with real Date objects and week-by-week logic */
  function independentSolve(base, constraints) {
    const real = realMonthFor(base.days, base.startDow);
    if (!real) return null;
    const { y, m } = real;
    const dateOf = (d) => new Date(y, m, d);
    const dowOf = (d) => (dateOf(d).getDay() + 6) % 7;
    const holidays = constraints.filter((c) => c.type === 'holiday').map((c) => c.day);
    const rulesOf = (name) => constraints.filter((c) => c.person === name);
    const nthWeekday = (d) => Math.ceil(d / 7);
    const isLast = (d) => dateOf(d + 7).getMonth() !== m;
    const blockedBase = (name, d) => {
      if (dowOf(d) > 4 || holidays.includes(d)) return true;
      for (const r of rulesOf(name)) {
        if (r.type === 'weekday' && r.days.includes(dowOf(d))) return true;
        if (r.type === 'date' && r.day === d) return true;
        if (r.type === 'range' && d >= r.from && d <= r.to) return true;
        if (r.type === 'ordinal' && dowOf(d) === r.weekday && r.ordinals.some((o) => (o === 'last' ? isLast(d) : o === nthWeekday(d)))) return true;
      }
      return false;
    };
    const out = [];
    for (let d = 1; d <= base.days; d++) {
      let ok = true;
      for (const name of base.names) {
        if (blockedBase(name, d)) { ok = false; break; }
        for (const r of rulesOf(name)) {
          if (r.type !== 'conditional' || !r.days.includes(dowOf(d))) continue;
          // walk to the Monday of this week, then forward to the referenced weekday
          const monday = new Date(y, m, d - dowOf(d));
          const target = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + r.weekday);
          if (target.getMonth() === m && !blockedBase(r.other, target.getDate())) ok = false;
        }
        if (!ok) break;
      }
      if (ok) out.push(d);
    }
    return out;
  }

  /* ----------------------------- explanation ------------------------------ */

  function explainCalendar(ex) {
    const base = ex.data.base;
    const cs = ex.constraints;
    const spec = specFromConstraints(base, cs);
    const sol = S.solveCalendar(spec);
    const listDays = (a) => (a.length ? a.join(', ') : L('none', 'ninguno'));
    const weekdayDates = [];
    for (let d = 1; d <= base.days; d++) if (S.dowOf(base.startDow, d) < 5) weekdayDates.push(d);
    const weekends = [];
    for (let d = 1; d <= base.days; d++) if (S.dowOf(base.startDow, d) >= 5) weekends.push(d);

    const steps = [X.step(L('Calendar', 'Calendario'), L(`A ${base.days}-day month starting on ${DAYS[base.startDow]}. Weekends (non-working): ${weekends.join(', ')}. ${weekdayDates.length} working days remain.`,
      `Mes de ${base.days} días que empieza en ${DAYS_ES[base.startDow]}. Fines de semana (no laborables): ${weekends.join(', ')}. Quedan ${weekdayDates.length} días laborables.`))];

    cs.forEach((c, i) => {
      let eff;
      if (c.type === 'holiday') eff = L(`nobody works on day ${c.day}${S.dowOf(base.startDow, c.day) >= 5 ? ' (it was already a weekend)' : ''}.`, `el día ${c.day} no trabaja nadie${S.dowOf(base.startDow, c.day) >= 5 ? ' (ya era fin de semana)' : ''}.`);
      else {
        // raw effect of this rule alone (what it would block even if no other rule existed)
        const solo = {
          ...spec,
          holidays: c.type === 'conditional' ? spec.holidays : [],
          people: spec.people.map((p) => (p.name === c.person ? { name: p.name, rules: [c] } : p)),
        };
        const blocked = weekdayDates.filter((d) => !S.available(solo, solo.people.find((p) => p.name === c.person), d));
        eff = L(`${c.person} cannot work on ${blocked.length === 1 ? 'day' : 'days'} ${listDays(blocked)}.`, `${c.person} no puede trabajar ${blocked.length === 1 ? 'el día' : 'los días'} ${listDays(blocked)}.`);
      }
      steps.push(X.step(L(`Rule ${i + 1}`, `Regla ${i + 1}`), `${RT.i18n.q(ex.data.rules[i])} → ${eff}`));
    });

    const blockers = S.blockersByDay(spec);
    const free = weekdayDates.filter((d) => !blockers[d].length);
    steps.push(X.step(L('Intersection', 'Intersección'), L(`A day is valid only if nobody has it blocked (weekends, holidays and each person's rules). Working days free for everyone: ${listDays(free)}.`, `Un día vale solo si nadie lo tiene bloqueado (fines de semana, festivos y reglas de cada persona). Días laborables libres para todos: ${listDays(free)}.`)));
    steps.push(X.step(L('Conclusion', 'Conclusión'), L(`Answer: ${sol.join(', ')}. Any different selection (even a partly correct one) is wrong.`, `Respuesta: ${sol.join(', ')}. Cualquier selección distinta (incluso parcialmente correcta) es incorrecta.`)));
    return {
      steps,
      visual: { type: 'calendar', days: base.days, startDow: base.startDow, holidays: spec.holidays, solution: sol, blockers },
      optionNotes: {},
    };
  }

  /* ----------------------------- generation ------------------------------- */

  function randomRule(rng, base, type, names, pers) {
    const days = base.days;
    const wd = () => rng.int(0, 4);
    const person = pers || rng.pick(names);
    switch (type) {
      case 'holiday': return { type, day: rng.int(1, days) };
      case 'weekday': return { type, person, days: rng.chance(0.25) ? rng.sample([0, 1, 2, 3, 4], 2).sort() : [wd()] };
      case 'date': return { type, person, day: rng.int(1, days) };
      case 'range': { const len = rng.int(2, 5); const from = rng.int(1, days - len + 1); return { type, person, from, to: from + len - 1 }; }
      case 'ordinal': {
        const pool = [1, 2, 3, 4, 'last'];
        const ords = rng.chance(0.5) ? [rng.pick(pool)] : rng.sample(pool, 2);
        const order = (o) => (o === 'last' ? 99 : o);
        ords.sort((a, b) => order(a) - order(b));
        return { type, person, weekday: wd(), ordinals: ords };
      }
      case 'conditional': {
        const other = rng.pick(names.filter((n) => n !== person));
        return { type, person, other, days: rng.chance(0.4) ? [0, 1] : [rng.int(0, 1)], weekday: 4 };
      }
      default: throw new Error('bad rule type');
    }
  }

  function generate(rng, level) {
    const cfg = D.moduleConfig('calendar');
    const days = rng.pick([28, 29, 30, 31]);
    const startDow = rng.int(0, 6);
    const names = rng.sample(RT.pools.people, cfg.people[level]);
    const base = { days, startDow, names };
    const [minC, maxC] = D.level(level).constraints;
    const c = rng.int(minC, maxC);
    const types = cfg.ruleTypes[level];
    const required = cfg.requiredAnyOf[level];

    const solveWith = (cs) => S.solveCalendar(specFromConstraints(base, cs));
    let cs = [];
    let cur = solveWith(cs);
    for (let guard = 0; cs.length < c && guard < 200; guard++) {
      const forced = cs.length === 0 && required.length ? rng.pick(required) : null;
      const cands = [];
      for (let t = 0; t < 4; t++) {
        const r = randomRule(rng, base, forced || rng.pick(types), names);
        const next = solveWith([...cs, r]);
        if (next.length >= cur.length || next.length < 1) continue;
        cands.push({ r, next });
      }
      if (!cands.length) continue;
      const pick = rng.chance(0.5) ? cands.reduce((a, b) => (b.next.length < a.next.length ? b : a)) : rng.pick(cands);
      cs.push(pick.r);
      cur = pick.next;
    }
    if (cs.length !== c) return null;
    const maxAns = cfg.maxAnswerSize[level];
    if (cur.length < 1 || cur.length > maxAns) return null;
    // keep the rules in a natural reading order: holidays first, then per person
    cs = rng.shuffle(cs);
    const ex = {
      kind: 'dates',
      question: questionText(names.length),
      data: { intro: introText(base), base, rules: cs.map(ruleText) },
      constraints: cs,
      options: null,
      correctAnswer: cur.slice(),
      meta: { constraintCount: cs.length, kinds: cs.map((r) => r.type), days, startDow, answerSize: cur.length },
    };
    ex.explanation = explainCalendar(ex);
    return ex;
  }

  /* ----------------------------- verification ----------------------------- */

  function verify(ex) {
    const errors = [];
    const base = ex.data.base;
    const cs = ex.constraints;
    if (!same(cs.map(ruleText), ex.data.rules)) errors.push('rules text does not match constraints');
    if (ex.question !== questionText(base.names.length)) errors.push('question text does not match data');
    if (ex.data.intro !== introText(base)) errors.push('intro text does not match data');
    if (ex.meta.constraintCount !== cs.length) errors.push('constraintCount mismatch');
    if (![28, 29, 30, 31].includes(base.days)) errors.push('invalid month length');
    const sol = S.solveCalendar(specFromConstraints(base, cs));
    const indep = independentSolve(base, cs);
    if (indep === null) errors.push('no real calendar month matches days/startDow');
    else if (!same(indep, sol)) errors.push(`solver ${JSON.stringify(sol)} != independent Date-based solver ${JSON.stringify(indep)}`);
    if (!sol.length) errors.push('no date satisfies all rules');
    for (const c of cs) {
      if (c.type === 'holiday' && (c.day < 1 || c.day > base.days)) errors.push('holiday outside month');
    }
    if (!same(explainCalendar(ex), ex.explanation)) errors.push('explanation does not match solver output');
    return { errors, solutionCount: sol.length, solverAnswer: sol, optionValidity: null };
  }

  RT.registerModule({
    id: 'calendar',
    label: 'Calendar Logic',
    description: 'Find the dates when a whole team is available, given weekly, ordinal and conditional rules.',
    answerType: 'dates',
    generate,
    verify,
  });
  RT.calendarInternals = { ruleText, independentSolve, specFromConstraints, realMonthFor };
})();
