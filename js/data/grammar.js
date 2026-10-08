/**
 * grammar.js — grammar data and rule engine for the English module.
 *
 *  1. Subject–verb agreement (SVA): a RULE ENGINE. Sentences are generated from
 *     noun lexicons + frames; the correct verb form is COMPUTED from the head noun
 *     and the time cue, so every distractor is provably wrong (see validForm).
 *     Collective nouns (committee, team…) and "none of / neither of" are
 *     deliberately excluded: British/American usage accepts both numbers there,
 *     which would create two correct answers.
 *  2. Prepositions: hand-curated bank (only items with a single natural answer).
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  RT.data = RT.data || {};

  const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ------------------------------ SVA data -------------------------------- */

  const LEX = {
    doc: {
      count: [['invoice', 'invoices'], ['variation order', 'variation orders'], ['claim', 'claims'], ['drawing', 'drawings'], ['certificate', 'certificates'], ['method statement', 'method statements'], ['inspection report', 'inspection reports']],
      unc: [],
    },
    mat: {
      count: [['valve', 'valves'], ['pipe spool', 'pipe spools'], ['cable drum', 'cable drums'], ['steel plate', 'steel plates']],
      unc: ['concrete', 'equipment', 'machinery', 'scaffolding', 'piping', 'cement', 'insulation'],
    },
    info: {
      count: [['record', 'records'], ['photograph', 'photographs']],
      unc: ['information', 'correspondence', 'documentation', 'evidence', 'feedback', 'advice'],
    },
    people: {
      count: [['engineer', 'engineers'], ['subcontractor', 'subcontractors'], ['inspector', 'inspectors'], ['welder', 'welders']],
      unc: [],
    },
    quant: {
      count: [['delay', 'delays'], ['defect', 'defects'], ['variation request', 'variation requests'], ['safety incident', 'safety incidents'], ['change order', 'change orders']],
      unc: [],
    },
  };

  // {S} = subject, capitalised; {s} = subject, lower-case (sentence-internal)
  const FRAMES = {
    doc: {
      present: [{ t: '{S} ____ currently under review by the Engineer.', cue: 'currently' }, { t: 'At the moment, {s} ____ waiting for the Employer’s approval.', cue: 'at the moment' }],
      past: [{ t: '{S} ____ submitted late last month.', cue: 'last month' }, { t: 'Yesterday, {s} ____ rejected by the Employer.', cue: 'yesterday' }],
      perfect: [{ t: '{S} ____ not been approved to date.', cue: 'to date' }, { t: 'Since January, {s} ____ been logged in the register.', cue: 'since January' }],
    },
    mat: {
      present: [{ t: '{S} ____ stored in the laydown area at present.', cue: 'at present' }, { t: 'Currently, {s} ____ being checked on arrival.', cue: 'currently' }],
      past: [{ t: '{S} ____ delivered to site last Tuesday.', cue: 'last Tuesday' }, { t: 'Last week, {s} ____ inspected by the Quality Manager.', cue: 'last week' }],
      perfect: [{ t: '{S} ____ been inspected to date.', cue: 'to date' }, { t: 'Since the start of the project, {s} ____ been checked on arrival.', cue: 'since the start of the project' }],
    },
    info: {
      present: [{ t: '{S} ____ available on the project portal at the moment.', cue: 'at the moment' }, { t: 'Currently, {s} ____ stored on the shared drive.', cue: 'currently' }],
      past: [{ t: '{S} ____ incomplete when the audit started last week.', cue: 'last week' }, { t: 'Last month, {s} ____ shared with the Subcontractor.', cue: 'last month' }],
      perfect: [{ t: '{S} ____ not been shared with the Subcontractor to date.', cue: 'to date' }, { t: 'Since January, {s} ____ been filed on the portal.', cue: 'since January' }],
    },
    people: {
      present: [{ t: '{S} ____ currently working on the night shift.', cue: 'currently' }, { t: 'At the moment, {s} ____ attending the safety briefing.', cue: 'at the moment' }],
      past: [{ t: '{S} ____ late for the safety briefing yesterday.', cue: 'yesterday' }, { t: 'Last week, {s} ____ on leave.', cue: 'last week' }],
      perfect: [{ t: '{S} ____ completed the induction course to date.', cue: 'to date' }, { t: 'Since March, {s} ____ worked on the pipe racks.', cue: 'since March' }],
    },
    quant: {
      present: [{ t: '{S} ____ a concern for the Project Manager at the moment.', cue: 'at the moment' }, { t: 'At present, {s} ____ a cause for concern.', cue: 'at present' }],
      past: [{ t: '{S} ____ a concern at last month’s audit.', cue: 'last month' }, { t: 'Last week, {s} ____ discussed at length in the coordination meeting.', cue: 'last week' }],
      perfect: [{ t: '{S} ____ been reported to date.', cue: 'to date' }, { t: 'Since January, {s} ____ been recorded in the log.', cue: 'since January' }],
    },
    there: {
      present: [{ t: 'At present, there ____ {NP} on this issue.', cue: 'at present' }],
      past: [{ t: 'Last week, there ____ {NP} on this issue.', cue: 'last week' }],
      perfect: [{ t: 'To date, there ____ been {NP} on this issue.', cue: 'to date' }],
    },
  };

  const THERE_NP = {
    sg: ['a delay', 'one defect', 'a complaint', 'no progress', 'little information', 'no evidence', 'a problem'],
    pl: ['several delays', 'many defects', 'a few complaints', 'two safety incidents', 'no claims', 'some problems'],
  };

  const INTERVENING = {
    sg: ['The list of approved subcontractors', 'The register of open claims', 'The summary of the site inspections', 'The schedule of rates', 'The file of the signed certificates', 'The record of the safety incidents'],
    pl: ['The drawings for the new pump house', 'The invoices from the main contractor', 'The certificates for the second phase', 'The inspection reports on the north gate', 'The method statements for the piling works'],
  };

  /** which noun domains each pattern may draw from */
  const PATTERNS = [
    { id: 'there', level: 1, weight: 3 },
    { id: 'each-of', level: 1, weight: 2 },
    { id: 'every', level: 1, weight: 2 },
    { id: 'plain', level: 1, weight: 2 },
    { id: 'quant-of', level: 2, weight: 4 },
    { id: 'a-number-of', level: 2, weight: 2 },
    { id: 'the-number-of', level: 2, weight: 3 },
    { id: 'amount-of', level: 2, weight: 2 },
    { id: 'one-of', level: 2, weight: 2 },
    { id: 'majority', level: 3, weight: 2 },
    { id: 'rest-of', level: 3, weight: 2 },
    { id: 'intervening', level: 3, weight: 4 },
  ];

  const FORMS = {
    is: { num: 'sg', tense: 'present' }, are: { num: 'pl', tense: 'present' },
    was: { num: 'sg', tense: 'past' }, were: { num: 'pl', tense: 'past' },
    has: { num: 'sg', tense: 'perfect' }, have: { num: 'pl', tense: 'perfect' },
    had: { num: 'any', tense: 'pastperfect' }, having: { num: 'any', tense: 'nonfinite' },
  };
  const FAMILY_OPTIONS = { be: ['is', 'are', 'was', 'were'], have: ['has', 'have', 'had', 'having'] };
  const TENSE_ES = { present: 'presente', past: 'pasado', perfect: 'presente perfecto', pastperfect: 'pasado perfecto', nonfinite: 'forma no personal' };

  /* ------------------------------ engine ----------------------------------- */

  const nounOf = (rng, domains, kinds) => {
    // kinds: subset of ['pl','unc','sg']; returns {text, number, domain}
    for (let guard = 0; guard < 50; guard++) {
      const domain = rng.pick(domains);
      const kind = rng.pick(kinds);
      const lex = LEX[domain];
      if (kind === 'unc' && lex.unc.length) return { text: rng.pick(lex.unc), number: 'sg', domain, kind };
      if (kind === 'pl' && lex.count.length) return { text: rng.pick(lex.count)[1], number: 'pl', domain, kind };
      if (kind === 'sg' && lex.count.length) return { text: rng.pick(lex.count)[0], number: 'sg', domain, kind };
    }
    throw new Error('nounOf failed');
  };

  /** Build the subject noun phrase + its computed grammatical number. */
  function buildSubject(rng, pattern) {
    switch (pattern) {
      case 'there': {
        const num = rng.pick(['sg', 'pl']);
        const np = rng.pick(THERE_NP[num]);
        return { np, number: num, domain: 'there', ruleEs: `En «there is / there are» el verbo concuerda con el sustantivo que sigue: «${np}» es ${num === 'sg' ? 'singular o incontable' : 'plural'}.` };
      }
      case 'each-of': {
        const n = nounOf(rng, ['doc', 'people', 'quant'], ['pl']);
        return { np: `Each of the ${n.text}`, number: 'sg', domain: n.domain, ruleEs: 'El sujeto es «each» (cada uno), no el plural que sigue a «of»: verbo en singular.' };
      }
      case 'every': {
        const n = nounOf(rng, ['doc', 'people'], ['sg']);
        return { np: `Every ${n.text}`, number: 'sg', domain: n.domain, ruleEs: '«Every» + sustantivo singular → verbo en singular.' };
      }
      case 'plain': {
        const n = nounOf(rng, ['doc', 'people', 'mat'], ['pl', 'sg', 'unc']);
        return { np: `The ${n.text}`, number: n.number, domain: n.domain, ruleEs: `El núcleo del sujeto es «${n.text}», que es ${n.number === 'sg' ? 'singular o incontable' : 'plural'}.` };
      }
      case 'quant-of': {
        const q = rng.pick(['Most of', 'Some of', 'All of', 'Half of', 'A lot of', 'Plenty of']);
        const n = nounOf(rng, ['doc', 'mat', 'info', 'people'], ['pl', 'unc']);
        return { np: `${q} the ${n.text}`, number: n.number, domain: n.domain, ruleEs: `Con «${q.toLowerCase()}» el verbo concuerda con el sustantivo que sigue a «of»: «${n.text}» es ${n.number === 'pl' ? 'plural' : 'incontable (singular)'}.` };
      }
      case 'a-number-of': {
        const n = nounOf(rng, ['doc', 'people', 'quant'], ['pl']);
        return { np: `A number of ${n.text}`, number: 'pl', domain: n.domain, ruleEs: '«A number of» + plural equivale a «varios»: el verbo va en plural.' };
      }
      case 'the-number-of': {
        const n = nounOf(rng, ['quant'], ['pl']);
        return { np: `The number of ${n.text}`, number: 'sg', domain: 'quant', ruleEs: '«The number of» + plural = «la cifra de»: el sujeto es «number» (singular) → verbo en singular.' };
      }
      case 'amount-of': {
        const q = rng.pick(['A large amount of', 'A great deal of', 'The amount of']);
        const n = nounOf(rng, ['mat', 'info'], ['unc']);
        return { np: `${q} ${n.text}`, number: 'sg', domain: n.domain, ruleEs: `«${q}» + sustantivo incontable («${n.text}») → verbo en singular.` };
      }
      case 'one-of': {
        const n = nounOf(rng, ['doc', 'people', 'quant', 'mat'], ['pl']);
        return { np: `One of the ${n.text}`, number: 'sg', domain: n.domain, ruleEs: 'El sujeto es «one» (uno de ellos), no el plural que sigue a «of»: verbo en singular.' };
      }
      case 'majority': {
        const n = nounOf(rng, ['doc', 'people', 'quant'], ['pl']);
        return { np: `The majority of the ${n.text}`, number: 'pl', domain: n.domain, ruleEs: `«The majority of» + plural: el verbo concuerda con «${n.text}» (plural).` };
      }
      case 'rest-of': {
        const q = rng.pick(['The rest of the', 'The remainder of the']);
        const n = nounOf(rng, ['doc', 'mat', 'info'], ['pl', 'unc']);
        return { np: `${q} ${n.text}`, number: n.number, domain: n.domain, ruleEs: `Con «${q.toLowerCase().replace('the ', '')}» el verbo concuerda con el sustantivo que sigue: «${n.text}» es ${n.number === 'pl' ? 'plural' : 'incontable (singular)'}.` };
      }
      case 'intervening': {
        const num = rng.pick(['sg', 'pl']);
        const np = rng.pick(INTERVENING[num]);
        return { np, number: num, domain: 'doc', ruleEs: num === 'sg' ? 'El núcleo del sujeto es singular; el sintagma con «of» que lo acompaña no cambia la concordancia.' : 'El núcleo del sujeto es plural; el complemento singular tras la preposición no cambia la concordancia.' };
      }
      default: throw new Error('unknown SVA pattern ' + pattern);
    }
  }

  /** the single correct form for (family, tense, number) */
  function correctForm(family, tense, number) {
    if (family === 'be') return tense === 'present' ? (number === 'sg' ? 'is' : 'are') : number === 'sg' ? 'was' : 'were';
    return number === 'sg' ? 'has' : 'have';
  }

  /** option validity — the ground truth used by the validator */
  const validForm = (spec, form) => form === correctForm(spec.family, spec.tense, spec.number);

  function renderStem(spec) {
    let t = spec.frame.t;
    if (spec.pattern === 'there') return t.replace('{NP}', spec.np);
    return t.replace('{S}', cap(spec.np)).replace('{s}', lc(spec.np));
  }

  /** Spanish note for one option (why right / why wrong), derived from the engine */
  function noteFor(spec, form) {
    const info = FORMS[form];
    const nm = spec.number === 'sg' ? 'singular' : 'plural';
    if (validForm(spec, form)) return `Correcta: el sujeto es ${nm} y «${spec.cue}» pide ${TENSE_ES[spec.tense]} → «${form}».`;
    if (info.tense === 'nonfinite') return '«having» no es una forma personal: no puede ser el verbo principal de la oración.';
    if (info.tense === 'pastperfect') return `«had» es pasado perfecto; «${spec.cue}» pide presente perfecto (has/have).`;
    const numOk = info.num === spec.number;
    const tenseOk = info.tense === spec.tense;
    if (!numOk && tenseOk) return `«${form}» es ${info.num === 'sg' ? 'singular' : 'plural'}, pero el sujeto es ${nm}.`;
    if (numOk && !tenseOk) return `«${form}» concuerda en número, pero está en ${TENSE_ES[info.tense]} y «${spec.cue}» exige ${TENSE_ES[spec.tense]}.`;
    return `«${form}» falla en número (el sujeto es ${nm}) y en tiempo («${spec.cue}» exige ${TENSE_ES[spec.tense]}).`;
  }

  function makeSva(rng, level) {
    const pool = PATTERNS.filter((p) => p.level <= level && (level === 1 ? p.level === 1 : level === 2 ? p.level >= 1 && p.level <= 2 : p.level >= 2));
    const pattern = rng.weighted(pool.map((p) => [p.id, p.weight]));
    const subj = buildSubject(rng, pattern);
    const family = pattern === 'there' ? rng.pick(['be', 'be', 'have']) : rng.chance(0.65) ? 'be' : 'have';
    const tense = family === 'have' ? 'perfect' : rng.pick(['present', 'past']);
    const frameKey = pattern === 'there' ? 'there' : subj.domain;
    const frame = rng.pick(FRAMES[frameKey][tense]);
    const spec = { pattern, np: subj.np, number: subj.number, family, tense, frame, cue: frame.cue, ruleEs: subj.ruleEs };
    return {
      spec,
      stem: renderStem(spec),
      forms: FAMILY_OPTIONS[family].slice(),
      correct: correctForm(family, tense, subj.number),
    };
  }

  RT.grammar = { makeSva, validForm, correctForm, noteFor, renderStem, FORMS, FAMILY_OPTIONS, PATTERNS, TENSE_ES };

  /* ------------------------------ prepositions ----------------------------- */

  const P = (id, level, stem, options, answer, notes, extra) => Object.assign({ id, level, stem, options, answer, notes }, extra || {});
  const prepositions = [
    P('pre-01', 1, 'We will arrive ____ Madrid airport at 10:15.', ['at', 'in', 'on', 'into'], 0,
      ['«Arrive at» + aeropuerto, estación o lugar concreto.', '«Arrive in» se usa con ciudades y países, no con un aeropuerto concreto.', '«Arrive on» no se usa con lugares.', '«Arrive into» no es la forma estándar.'],
      { rule: 'arrive at (lugar concreto) / arrive in (ciudad, país).' }),
    P('pre-02', 1, 'She is travelling ____ the 18:30 flight to Doha.', ['on', 'by', 'in', 'at'], 0,
      ['«On the 18:30 flight»: con un vuelo concreto se usa «on».', '«By» se usa sin artículo: «by air», «by plane».', '«In» no se usa con vuelos concretos.', '«At» no se usa con vuelos.'],
      { rule: 'on a flight / on the 18:30 flight; by air / by plane (sin artículo).' }),
    P('pre-03', 1, 'The site engineers commute to the offshore platform ____ boat.', ['by', 'on', 'in', 'with'], 0,
      ['«By boat» = medio de transporte en general, sin artículo.', '«On boat» sin artículo es incorrecto (sería «on the boat»).', '«In boat» sin artículo es incorrecto.', '«With boat» no expresa medio de transporte.'],
      { rule: 'by + medio de transporte (sin artículo).' }),
    P('pre-04', 1, 'The progress meeting will take place ____ Thursday morning.', ['on', 'in', 'at', 'by'], 0,
      ['«On» + día de la semana (incluso con «morning»).', '«In» se usa con partes del día sin día concreto («in the morning»).', '«At» se usa con horas o con «night».', '«By» = no más tarde de: cambia el sentido.']),
    P('pre-05', 1, 'The pre-start meeting begins ____ 14:00 sharp.', ['at', 'on', 'in', 'by'], 0,
      ['«At» + hora exacta.', '«On» se usa con días y fechas.', '«In» se usa con meses, años o periodos.', '«By» = no más tarde de: no expresa el momento exacto de inicio.']),
    P('pre-06', 2, 'The crane lifted the module slowly ____ place.', ['into', 'to', 'at', 'on'], 0,
      ['«Into place» es la expresión fija: colocar algo en su sitio.', '«To place» no forma la expresión.', '«At place» no forma la expresión.', '«On place» no forma la expresión.'],
      { rule: 'into place (expresión fija).' }),
    P('pre-07', 1, 'The subcontract was awarded ____ the lowest bidder.', ['to', 'for', 'at', 'by'], 0,
      ['«Award something to someone».', '«For» no se usa con «award» para el beneficiario.', '«At» no encaja.', '«By» indicaría quién concede, no quién recibe.']),
    P('pre-08', 1, 'The report must be signed ____ the project director.', ['by', 'from', 'with', 'at'], 0,
      ['«Signed by» introduce el agente en pasiva.', '«From» indicaría origen, no el agente de la firma.', '«With» indicaría compañía o instrumento.', '«At» no encaja.']),
    P('pre-09', 2, 'Payment is due ____ thirty days of receipt of a valid invoice.', ['within', 'between', 'among', 'along'], 0,
      ['«Within thirty days» = en un plazo máximo de treinta días.', '«Between» requiere dos puntos de referencia.', '«Among» se usa con grupos de personas o cosas.', '«Along» expresa recorrido en el espacio.']),
    P('pre-10', 1, 'The works were completed ____ schedule despite the weather.', ['on', 'in', 'at', 'by'], 0,
      ['«On schedule» = según lo previsto.', '«In schedule» no existe.', '«At schedule» no existe.', '«By schedule» no existe.'],
      { rule: 'on schedule / ahead of schedule / behind schedule.' }),
    P('pre-11', 2, 'The delivery is ____ risk of delay because of the port strike.', ['at', 'in', 'on', 'by'], 0,
      ['«At risk of» = en riesgo de.', '«In risk» no se usa.', '«On risk» no se usa.', '«By risk» no se usa.']),
    P('pre-12', 1, 'The two parties are ____ dispute over the final account.', ['in', 'on', 'at', 'by'], 0,
      ['«In dispute» = en disputa.', '«On dispute» no se usa.', '«At dispute» no se usa.', '«By dispute» no se usa.']),
    P('pre-13', 1, 'Please send the signed documents ____ email.', ['by', 'with', 'in', 'on'], 0,
      ['«By email» = por correo electrónico.', '«With email» no expresa el medio de envío.', '«In email» no se usa así.', '«On email» no se usa así.']),
    P('pre-14', 1, 'The Contractor shall comply ____ all applicable safety regulations.', ['with', 'to', 'by', 'at'], 0,
      ['«Comply with» = cumplir con.', '«Comply to» es un error frecuente.', '«Comply by» no existe.', '«Comply at» no existe.'],
      { rule: 'comply with (no «to»).' }),
    P('pre-15', 1, 'The Employer is entitled ____ terminate the contract if the Contractor abandons the Works.', ['to', 'for', 'of', 'on'], 0,
      ['«Entitled to + infinitivo» = con derecho a.', '«Entitled for» no se usa.', '«Entitled of» no se usa.', '«Entitled on» no se usa.']),
    P('pre-16', 2, 'Delay damages are payable ____ the rate of 0.1% per day.', ['at', 'by', 'in', 'on'], 0,
      ['«At the rate of» = a razón de.', '«By the rate of» no se usa.', '«In the rate of» no se usa.', '«On the rate of» no se usa.']),
    P('pre-17', 1, 'He is currently ____ a business trip in Lisbon.', ['on', 'in', 'at', 'by'], 0,
      ['«On a business trip» = de viaje de negocios.', '«In a business trip» es incorrecto.', '«At a business trip» es incorrecto.', '«By a business trip» es incorrecto.']),
    P('pre-18', 1, 'Our flight lands ____ Terminal 2 at 08:40.', ['at', 'in', 'on', 'into'], 0,
      ['«At Terminal 2» = en un punto concreto del aeropuerto.', '«In Terminal 2» no es lo habitual con «lands».', '«On Terminal 2» no se usa.', '«Into Terminal 2» no se usa.']),
    P('pre-19', 1, 'The delegation arrived ____ Qatar on Sunday evening.', ['in', 'at', 'to', 'on'], 0,
      ['«Arrive in» + país o ciudad.', '«Arrive at» se reserva para lugares concretos (aeropuerto, estación, oficina).', '«Arrive to» es un error frecuente.', '«Arrive on» no se usa con lugares.']),
    P('pre-20', 1, 'The Project Manager is ____ holiday until the 15th.', ['on', 'in', 'at', 'by'], 0,
      ['«On holiday» = de vacaciones.', '«In holiday» es incorrecto.', '«At holiday» es incorrecto.', '«By holiday» es incorrecto.']),
    P('pre-21', 2, 'The Contractor is responsible ____ the safety of all personnel on site.', ['for', 'of', 'about', 'over'], 0,
      ['«Responsible for» = responsable de.', '«Responsible of» es un error frecuente.', '«Responsible about» no se usa.', '«Responsible over» no se usa.']),
    P('pre-22', 3, 'The Subcontractor was prevented ____ starting work by the lack of access.', ['from', 'to', 'of', 'against'], 0,
      ['«Prevent someone from + -ing».', '«Prevent to» no existe.', '«Prevent of» no existe.', '«Prevent against» no existe.'],
      { rule: 'prevent + objeto + from + -ing.' }),
    P('pre-23', 3, 'The Engineer’s approval is subject ____ the Employer’s prior consent.', ['to', 'of', 'on', 'with'], 0,
      ['«Subject to» = sujeto a, condicionado a.', '«Subject of» significa «tema de».', '«Subject on» no se usa.', '«Subject with» no se usa.']),
    P('pre-24', 2, 'The shipment is currently ____ transit between Rotterdam and Bilbao.', ['in', 'on', 'at', 'by'], 0,
      ['«In transit» = en tránsito (expresión fija).', '«On transit» no se usa.', '«At transit» no se usa.', '«By transit» no se usa.']),
    P('pre-25', 2, 'The Subcontractor is liable ____ any damage caused to existing structures.', ['for', 'of', 'to', 'on'], 0,
      ['«Liable for» = responsable de.', '«Liable of» no se usa.', '«Liable to» se usa con «sujeto a» («liable to a fine»).', '«Liable on» no se usa.']),
  ];
  RT.data.prepositions = prepositions;
})();
