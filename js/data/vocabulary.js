/**
 * vocabulary.js — curated item bank for the English module (categories:
 * vocabulary · synonyms · contractual · fidic).
 *
 * Item format (authoring order; options are shuffled at generation time):
 *   it(id, level, stem, options, answerIndex, notes, extra)
 *     notes[i] = Spanish note for option i: why it is right (answer) or wrong (others)
 *     extra.rule / extra.diff = optional grammar rule / semantic-difference remark
 * Every wrong option MUST have a written reason: the lint in english.js rejects the item otherwise.
 * FIDIC items only use generally accepted terminology — no invented clause rules.
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  RT.data = RT.data || {};

  const it = (id, level, stem, options, answer, notes, extra) => Object.assign({ id, level, stem, options, answer, notes }, extra || {});
  const SYN = (id, level, word, sentence, options, answer, notes, extra) => it(id, level, `${word.toUpperCase()} — “${sentence}”`, options, answer, notes, Object.assign({ mode: 'syn', target: word }, extra || {}));
  const ANT = (id, level, word, sentence, options, answer, notes, extra) => it(id, level, `${word.toUpperCase()} — “${sentence}”`, options, answer, notes, Object.assign({ mode: 'ant', target: word }, extra || {}));

  /* ------------------------ A. Vocabulary & collocations ------------------ */
  const vocabulary = [
    it('voc-01', 1, "The contractor's explanation of the delay was so ____ that the Engineer asked for a written clarification.", ['obscure', 'obvious', 'blunt', 'candid'], 0,
      ['«Obscure» = poco claro; justifica que se pida una aclaración por escrito.', '«Obvious» = evidente; no habría motivo para pedir aclaración.', '«Blunt» = directo, sin rodeos: describe el tono, no la falta de claridad.', '«Candid» = franco; tampoco implica que sea confuso.'],
      { diff: 'obscure (poco claro) ≠ obvious (evidente).' }),
    it('voc-02', 2, 'As a ____ negotiator, she spotted the weakness in the other party’s position and secured a much lower price.', ['shrewd', 'efficient', 'generous', 'hesitant'], 0,
      ['«Shrewd» = astuto, con buen juicio para sacar ventaja de una situación.', '«Efficient» = eficiente (ahorra tiempo y recursos); no expresa astucia para detectar una debilidad.', '«Generous» = generoso: contradice el hecho de haber conseguido un precio mucho menor.', '«Hesitant» = indeciso: contradice la acción decidida descrita.'],
      { diff: 'shrewd = astuto; efficient = que rinde sin desperdiciar recursos.' }),
    it('voc-03', 1, 'The storm had a ____ effect on the programme: the entire cofferdam had to be rebuilt.', ['disastrous', 'unfailing', 'negligible', 'marginal'], 0,
      ['«Disastrous» = desastroso; encaja con tener que reconstruir todo.', '«Unfailing» = constante, que nunca falla; no describe un efecto negativo.', '«Negligible» = insignificante: contradice la reconstrucción total.', '«Marginal» = mínimo: contradice la gravedad descrita.']),
    it('voc-04', 2, 'We rely on his ____ support: in ten years he has never missed a deadline.', ['unfailing', 'disastrous', 'sporadic', 'reluctant'], 0,
      ['«Unfailing» = constante, en el que siempre se puede confiar.', '«Disastrous» = desastroso: contradice «rely on».', '«Sporadic» = esporádico: contradice «never missed».', '«Reluctant» = reticente: contradice la confianza expresada.']),
    it('voc-05', 1, 'The subcontractor failed to ____ the notice within the 28 days required by the subcontract.', ['serve', 'hold', 'take', 'draw'], 0,
      ['«Serve a notice» es la colocación habitual: notificar formalmente.', '«Hold» se usa con reuniones o cargos, no con «a notice».', '«Take a notice» no es colocación; «take notice of» tiene otro sentido.', '«Draw» no se combina con «notice» en este sentido.'],
      { rule: 'Colocación: serve a notice (on someone).' }),
    it('voc-06', 2, 'The adjudicator’s decision is ____ on both parties unless and until it is revised in arbitration.', ['binding', 'flexible', 'optional', 'provisional'], 0,
      ['«Binding on» = vinculante para; es la colocación exacta con la preposición «on».', '«Flexible» no se usa con «on both parties» ni describe una obligación.', '«Optional» = opcional: contradice «unless and until it is revised».', '«Provisional» no admite «on both parties» y no expresa obligatoriedad.']),
    it('voc-07', 2, 'She was praised for her ____ attention to detail: not a single error appeared in the 400-page report.', ['meticulous', 'casual', 'superficial', 'occasional'], 0,
      ['«Meticulous» = minucioso; coherente con cero errores.', '«Casual» = informal/poco cuidadoso: contradice el elogio.', '«Superficial» = poco profundo: contradice el resultado.', '«Occasional» = ocasional: no califica una atención «to detail» elogiada.']),
    it('voc-08', 1, 'We need to ____ the programme to recover the two weeks lost to bad weather.', ['compress', 'suppress', 'impress', 'express'], 0,
      ['«Compress the programme» = acortar los plazos de las actividades para recuperar tiempo.', '«Suppress» = suprimir/reprimir; no se aplica a un programa en este sentido.', '«Impress» = impresionar: sin sentido aquí.', '«Express» = expresar: sin sentido aquí.']),
    it('voc-09', 2, 'The client’s ____ approach to payment — always paying on the due date and never disputing an invoice without reason — makes suppliers eager to work with them.', ['scrupulous', 'careless', 'erratic', 'hostile'], 0,
      ['«Scrupulous» = escrupuloso, muy correcto y cuidadoso.', '«Careless» = descuidado: contradice «always paying on the due date».', '«Erratic» = irregular: contradice la puntualidad descrita.', '«Hostile» = hostil: contradice que los proveedores quieran trabajar con ellos.']),
    it('voc-10', 3, 'The Employer’s ____ refusal to approve the design, despite repeated submissions that complied with the specification, amounted to obstruction.', ['arbitrary', 'ambiguous', 'amenable', 'adjacent'], 0,
      ['«Arbitrary» = arbitrario, sin base razonable: encaja con rechazar diseños conformes.', '«Ambiguous» = ambiguo: describe falta de claridad, no la falta de justificación de un rechazo.', '«Amenable» = dispuesto a aceptar: contradice «refusal».', '«Adjacent» = adyacente: sin sentido aquí.']),
    it('voc-11', 3, 'Her ____ commitment to safety, never compromised even under schedule pressure, earned the team’s respect.', ['unwavering', 'unwary', 'unwilling', 'unworldly'], 0,
      ['«Unwavering» = firme, inquebrantable.', '«Unwary» = incauto: contradice un compromiso con la seguridad.', '«Unwilling» = reacio: contradice «commitment».', '«Unworldly» = ingenuo/poco mundano: no encaja con el contexto.']),
    it('voc-12', 1, 'The inspection revealed ____ cracks in the foundation: they were barely visible to the naked eye.', ['hairline', 'headline', 'deadline', 'skyline'], 0,
      ['«Hairline cracks» = grietas finísimas; colocación técnica habitual.', '«Headline» = titular: no califica grietas.', '«Deadline» = fecha límite: no califica grietas.', '«Skyline» = silueta urbana: no califica grietas.']),
    it('voc-13', 2, 'The consultant’s report was deliberately ____, avoiding any clear conclusion that could be used against the client.', ['vague', 'vivid', 'vital', 'valid'], 0,
      ['«Vague» = vago, impreciso: coherente con evitar conclusiones claras.', '«Vivid» = vívido: contradice evitar claridad.', '«Vital» = esencial: no describe la forma del informe.', '«Valid» = válido: no encaja con «deliberately … avoiding any clear conclusion».']),
    it('voc-14', 3, 'Because the two clauses contradict each other, the contract is ____ on this point and the parties must seek clarification.', ['ambiguous', 'abundant', 'abrupt', 'absolute'], 0,
      ['«Ambiguous» = ambiguo; se pide aclaración por la contradicción.', '«Abundant» = abundante: sin sentido para un contrato.', '«Abrupt» = brusco: no describe una cláusula.', '«Absolute» = absoluto: contradice la necesidad de aclarar.']),
    it('voc-15', 2, 'The new site manager is very ____: she solved the access problem in an afternoon at no extra cost.', ['resourceful', 'resentful', 'reluctant', 'resistant'], 0,
      ['«Resourceful» = ingenioso para resolver problemas con pocos medios.', '«Resentful» = rencoroso: no encaja con resolver un problema.', '«Reluctant» = reacio: contradice la rapidez de la solución.', '«Resistant» = resistente/opuesto: contradice la actitud resolutiva.']),
    it('voc-16', 3, 'To avoid a dispute, the parties agreed to a ____ solution: each would bear half of the additional cost.', ['pragmatic', 'dogmatic', 'erratic', 'symptomatic'], 0,
      ['«Pragmatic» = práctico, orientado a lo viable: reparto a partes iguales.', '«Dogmatic» = dogmático, inflexible: contradice el acuerdo de compromiso.', '«Erratic» = errático: no describe una solución pactada.', '«Symptomatic» = sintomático: no encaja con «solution».']),
  ];

  /* ------------------------ D. Synonyms / antonyms ------------------------ */
  const synonyms = [
    SYN('syn-01', 1, 'terminate', 'The Employer may terminate the subcontract for persistent default.', ['end', 'extend', 'amend', 'ratify'], 0,
      ['«Terminate» = poner fin; sinónimo de «end».', '«Extend» = prolongar: sentido contrario.', '«Amend» = modificar: cambia el contrato pero no lo finaliza.', '«Ratify» = confirmar formalmente: sentido contrario.']),
    SYN('syn-02', 1, 'defer', 'The parties agreed to defer the final payment until the defects were corrected.', ['postpone', 'accelerate', 'cancel', 'confirm'], 0,
      ['«Defer» = aplazar; sinónimo de «postpone».', '«Accelerate» = acelerar: sentido contrario.', '«Cancel» = anular: el pago sigue existiendo, solo se aplaza.', '«Confirm» = confirmar: no implica aplazamiento.']),
    SYN('syn-03', 2, 'ambiguous', 'The wording of Clause 9 is ambiguous.', ['unclear', 'precise', 'binding', 'invalid'], 0,
      ['«Ambiguous» = que admite varios sentidos; cercano a «unclear».', '«Precise» = preciso: antónimo.', '«Binding» = vinculante: otra idea (obligatoriedad).', '«Invalid» = no válido: no es lo mismo que ambiguo.']),
    SYN('syn-04', 2, 'liable', 'The Contractor remains liable for any defects that appear in the first year.', ['responsible', 'immune', 'exempt', 'entitled'], 0,
      ['«Liable» = legalmente responsable.', '«Immune» = inmune: antónimo.', '«Exempt» = exento: antónimo.', '«Entitled» = con derecho a algo: no significa responsable.']),
    SYN('syn-05', 2, 'mitigate', 'The Contractor must take reasonable steps to mitigate the effect of the delay.', ['reduce', 'worsen', 'ignore', 'prove'], 0,
      ['«Mitigate» = atenuar, reducir la gravedad.', '«Worsen» = empeorar: antónimo.', '«Ignore» = ignorar: lo opuesto a tomar medidas.', '«Prove» = probar: otra idea.']),
    SYN('syn-06', 2, 'expedite', 'We asked the supplier to expedite the delivery of the valves.', ['speed up', 'postpone', 'inspect', 'reject'], 0,
      ['«Expedite» = acelerar un trámite o entrega.', '«Postpone» = aplazar: antónimo.', '«Inspect» = inspeccionar: otra acción.', '«Reject» = rechazar: otra acción.']),
    SYN('syn-07', 3, 'concur', 'The Engineer concurred with the Contractor’s assessment of the delay.', ['agreed', 'objected', 'hesitated', 'intervened'], 0,
      ['«Concur» = coincidir, estar de acuerdo.', '«Objected» = se opuso: antónimo.', '«Hesitated» = dudó: no expresa acuerdo.', '«Intervened» = intervino: no expresa acuerdo.']),
    SYN('syn-08', 3, 'ratify', 'The board met to ratify the agreement signed by the project director.', ['confirm', 'revoke', 'amend', 'suspend'], 0,
      ['«Ratify» = confirmar formalmente lo ya acordado.', '«Revoke» = revocar: antónimo.', '«Amend» = modificar: cambia el texto, no lo confirma.', '«Suspend» = suspender: no confirma el acuerdo.']),
    SYN('syn-09', 1, 'adjacent', 'The laydown area is adjacent to the main gate.', ['next to', 'opposite', 'far from', 'identical to'], 0,
      ['«Adjacent» = contiguo; «next to».', '«Opposite» = enfrente: no es contiguo.', '«Far from» = lejos de: antónimo.', '«Identical to» = idéntico: otro significado.']),
    SYN('syn-10', 2, 'settled', 'After years of dispute, the boundary is now settled.', ['resolved', 'contested', 'suspended', 'postponed'], 0,
      ['«Settled» = resuelto, establecido definitivamente.', '«Contested» = en disputa: antónimo.', '«Suspended» = suspendido: no es una resolución.', '«Postponed» = aplazado: no es una resolución.']),
    SYN('syn-11', 3, 'curtail', 'Heavy rain forced us to curtail the night shift.', ['reduce', 'extend', 'repeat', 'reward'], 0,
      ['«Curtail» = recortar, reducir la duración.', '«Extend» = alargar: antónimo.', '«Repeat» = repetir: otra idea.', '«Reward» = recompensar: otra idea.']),
    ANT('ant-01', 2, 'mandatory', 'Attendance at the safety induction is mandatory.', ['optional', 'compulsory', 'binding', 'essential'], 0,
      ['«Optional» = voluntario: antónimo de «mandatory».', '«Compulsory» = obligatorio: sinónimo, no antónimo.', '«Binding» = vinculante: sinónimo parcial.', '«Essential» = imprescindible: sinónimo parcial.']),
    ANT('ant-02', 1, 'accelerate', 'The Contractor proposed to accelerate the works.', ['delay', 'hasten', 'hurry', 'advance'], 0,
      ['«Delay» = retrasar: antónimo de «accelerate».', '«Hasten» = apresurar: sinónimo.', '«Hurry» = dar prisa: sinónimo.', '«Advance» = adelantar: sinónimo en este contexto.']),
    ANT('ant-03', 1, 'mobile', 'We hired a mobile crusher for the duration of the earthworks.', ['fixed', 'portable', 'movable', 'compact'], 0,
      ['«Fixed» = fijo, instalado en un punto: antónimo de «mobile».', '«Portable» = portátil: sinónimo.', '«Movable» = móvil/desplazable: sinónimo.', '«Compact» = compacto: habla del tamaño, no de la movilidad.']),
    ANT('ant-04', 2, 'liability', 'The retention is shown as a liability in the accounts.', ['asset', 'debt', 'obligation', 'charge'], 0,
      ['«Asset» = activo: lo opuesto contable a «liability» (pasivo).', '«Debt» = deuda: es un tipo de pasivo.', '«Obligation» = obligación: sinónimo de pasivo/deber.', '«Charge» = cargo: es un coste, no lo contrario.']),
    ANT('ant-05', 2, 'tentative', 'The parties reached a tentative agreement on the price.', ['definite', 'provisional', 'draft', 'uncertain'], 0,
      ['«Definite» = definitivo: antónimo de «tentative».', '«Provisional» = provisional: sinónimo.', '«Draft» = borrador: sinónimo en este contexto.', '«Uncertain» = incierto: sinónimo.']),
    ANT('ant-06', 3, 'lenient', 'The Engineer was lenient when assessing the late submissions.', ['strict', 'generous', 'tolerant', 'flexible'], 0,
      ['«Strict» = estricto: antónimo de «lenient».', '«Generous» = generoso: sinónimo cercano.', '«Tolerant» = tolerante: sinónimo.', '«Flexible» = flexible: sinónimo.']),
  ];

  /* ------------------------ E. Contractual English ------------------------ */
  const contractual = [
    it('con-01', 1, 'A ____ is a formal instruction that changes the scope, quantity or timing of the Works.', ['variation', 'invoice', 'warranty', 'default'], 0,
      ['«Variation» = orden de cambio (change order) que modifica alcance, cantidad o plazo.', '«Invoice» = factura: reclama pago, no cambia el alcance.', '«Warranty» = garantía: compromiso sobre defectos.', '«Default» = incumplimiento: no es una instrucción de cambio.']),
    it('con-02', 1, 'If the Contractor is delayed by force majeure, it may be entitled to an ____ of time.', ['extension', 'extraction', 'extinction', 'extent'], 0,
      ['«Extension of time» = prórroga del plazo; término fijo.', '«Extraction» = extracción: sin sentido.', '«Extinction» = extinción: sin sentido.', '«Extent» = alcance/grado: no forma la expresión.'],
      { rule: 'Colocación: an extension of time (EOT).' }),
    it('con-03', 2, 'Liquidated damages are a ____ sum payable for each day of delay.', ['pre-determined', 'fluctuating', 'voluntary', 'refundable'], 0,
      ['«Pre-determined» = fijada de antemano en el contrato: es la esencia de los liquidated damages.', '«Fluctuating» = variable: contradice la idea de importe pactado.', '«Voluntary» = voluntario: son una obligación contractual.', '«Refundable» = reembolsable: no define su naturaleza.']),
    it('con-04', 1, 'The Subcontractor must give ____ of any event likely to cause delay.', ['notice', 'news', 'sign', 'measure'], 0,
      ['«Give notice of» = notificar formalmente.', '«Give news of» no se usa en lenguaje contractual y cambia el registro.', '«Give sign of» no es colocación («give a sign»).', '«Give measure of» no es una colocación.']),
    it('con-05', 2, 'The Contractor shall indemnify the Employer ____ any claim arising from its negligence.', ['against', 'to', 'at', 'by'], 0,
      ['«Indemnify … against» = indemnizar frente a una reclamación.', '«To» no se usa con «indemnify» en este sentido.', '«At» no es la preposición de este verbo.', '«By» no es la preposición de este verbo.'],
      { rule: 'indemnify someone against a claim / loss.' }),
    it('con-06', 2, 'Payment of the final instalment is ____ upon the Engineer’s certificate of completion.', ['conditional', 'conditioning', 'condition', 'conditionally'], 0,
      ['«Is conditional upon» = depende de; adjetivo tras el verbo «to be».', '«Conditioning» (gerundio/sustantivo) no encaja tras «is … upon».', '«Condition» es un sustantivo: «is condition upon» es incorrecto.', '«Conditionally» es un adverbio: no puede ser atributo de «is».'],
      { rule: 'be + conditional + upon/on.' }),
    it('con-07', 1, 'The Contractor claimed additional costs due to ____ ground conditions.', ['unforeseen', 'unforgiven', 'unfounded', 'unfulfilled'], 0,
      ['«Unforeseen» = imprevisto; colocación habitual con «ground conditions».', '«Unforgiven» = no perdonado: sin sentido.', '«Unfounded» = infundado: contradice que se reclame con base.', '«Unfulfilled» = incumplido: no califica condiciones del terreno.']),
    it('con-08', 2, 'A ____ is a promise that defects appearing within a stated period will be repaired at no cost to the Employer.', ['warranty', 'warrant', 'waiver', 'writ'], 0,
      ['«Warranty» = garantía.', '«Warrant» = orden judicial / autorización: otro significado.', '«Waiver» = renuncia a un derecho: no es una garantía.', '«Writ» = orden judicial: otro significado.']),
    it('con-09', 1, 'The Subcontractor submitted its claim after the time limit had ____, so it was rejected as time-barred.', ['expired', 'explained', 'expanded', 'exempted'], 0,
      ['«Expired» = vencido; encaja con «time-barred».', '«Explained» = explicado: sin sentido.', '«Expanded» = ampliado: contradice el rechazo por extemporáneo.', '«Exempted» = eximido: no se aplica a un plazo.']),
    it('con-10', 2, 'The acceptance certificate confirms that the Works were completed ____ the requirements of the Contract.', ['in accordance with', 'in accordance to', 'according with', 'in accord to'], 0,
      ['«In accordance with» es la expresión fija correcta.', '«In accordance to» es un error frecuente: la preposición es «with».', '«According with» no existe: se dice «according to».', '«In accord to» es incorrecta: sería «in accord with».'],
      { rule: 'in accordance with = conforme a.' }),
    it('con-11', 2, 'Under a lump-sum EPC contract, the Contractor normally bears the risk of cost ____ unless the Contract provides otherwise.', ['overruns', 'overturns', 'overlays', 'overtakes'], 0,
      ['«Cost overruns» = sobrecostes.', '«Overturns» = vuelcos/anulaciones: no es un término de costes.', '«Overlays» = capas superpuestas: otro significado.', '«Overtakes» = adelanta: sin sentido aquí.']),
    it('con-12', 1, 'A party affected by force majeure must ____ the other party promptly.', ['notify', 'notice', 'note', 'know'], 0,
      ['«Notify someone» = notificar a alguien.', '«Notice» como verbo = darse cuenta; no es «notificar».', '«Note» = anotar; no lleva complemento de persona así.', '«Know» no expresa la acción de comunicar.'],
      { diff: 'notify = comunicar formalmente; notice = percibir.' }),
    it('con-13', 2, 'The Contractor must demonstrate its ____ to an extension of time by reference to a specific clause.', ['entitlement', 'enrolment', 'enrichment', 'endorsement'], 0,
      ['«Entitlement» = derecho a reclamar; se prueba con una cláusula.', '«Enrolment» = matrícula: sin sentido.', '«Enrichment» = enriquecimiento: sin sentido.', '«Endorsement» = aval/respaldo: no es el derecho a una prórroga.']),
    it('con-14', 3, 'The retention is released once the defects notification period has ____ and all defects have been corrected.', ['elapsed', 'eluded', 'enclosed', 'embraced'], 0,
      ['«Elapsed» = transcurrido (para un periodo de tiempo).', '«Eluded» = eludido: sin sentido con un periodo.', '«Enclosed» = adjuntado: sin sentido.', '«Embraced» = abrazado/adoptado: sin sentido.']),
    it('con-15', 1, 'Any amendment to the subcontract must be made in writing and ____ by both parties.', ['signed', 'designed', 'resigned', 'assigned'], 0,
      ['«Signed» = firmado por ambas partes.', '«Designed» = diseñado: no se aplica a una modificación contractual.', '«Resigned» = dimitido: sin sentido.', '«Assigned» = cedido/asignado: otro concepto contractual.']),
    it('con-16', 2, 'The Contractor’s total liability is ____ to 10% of the Contract Price.', ['limited', 'limiting', 'limit', 'limits'], 0,
      ['«Is limited to» = pasiva: la responsabilidad está limitada a.', '«Limiting» es participio activo: no encaja con «is … to».', '«Limit» (sustantivo/verbo) no completa «is … to».', '«Limits» no completa «is … to».'],
      { rule: 'be limited to + cantidad.' }),
    it('con-17', 2, 'The Subcontractor decided to ____ a claim for the extra work to the Contractor.', ['submit', 'admit', 'permit', 'commit'], 0,
      ['«Submit a claim to» = presentar una reclamación a.', '«Admit a claim» = reconocer una reclamación (lo haría el destinatario), y no admite «to the Contractor».', '«Permit» = permitir: no se usa así.', '«Commit a claim» no existe en este sentido.']),
    it('con-18', 1, 'Payment of 20% is linked to the achievement of the second ____.', ['milestone', 'mileage', 'millstone', 'miller'], 0,
      ['«Milestone» = hito del proyecto, habitual para vincular pagos.', '«Mileage» = kilometraje: otro significado.', '«Millstone» = piedra de molino (o carga pesada): no es un hito.', '«Miller» = molinero: sin sentido.']),
    it('con-19', 3, 'The notice must be given in writing; ____, it will have no contractual effect.', ['otherwise', 'moreover', 'therefore', 'however'], 0,
      ['«Otherwise» = de lo contrario: introduce la consecuencia de no cumplir.', '«Moreover» añade información: no expresa consecuencia.', '«Therefore» expresa resultado, no una alternativa.', '«However» introduce contraste, y aquí no hay una idea opuesta.']),
    it('con-20', 3, 'The Employer reserves the right to withhold payment ____ the Contractor remedies the defects.', ['until', 'during', 'since', 'whereas'], 0,
      ['«Until» = hasta que; fija el momento en que cesa la retención.', '«During» necesita un sustantivo, no una oración completa.', '«Since» marca un punto de partida en el pasado: no encaja.', '«Whereas» expresa contraste: no encaja.']),
    it('con-21', 2, 'The parties agreed to refer the dispute to ____ rather than going to court.', ['arbitration', 'arbitrage', 'arbitrariness', 'articulation'], 0,
      ['«Arbitration» = arbitraje, alternativa a los tribunales.', '«Arbitrage» = arbitraje financiero: otro significado.', '«Arbitrariness» = arbitrariedad: sin sentido.', '«Articulation» = articulación/expresión: sin sentido.']),
    it('con-22', 3, '“Time is of the essence” means that failure to meet a deadline is a ____ of contract.', ['breach', 'branch', 'breadth', 'breath'], 0,
      ['«Breach of contract» = incumplimiento del contrato.', '«Branch» = rama: no forma la expresión.', '«Breadth» = amplitud: no forma la expresión.', '«Breath» = aliento: no forma la expresión.']),
  ];

  /* ------------------------ F. FIDIC / project management ----------------- */
  const fidic = [
    it('fid-01', 1, 'In FIDIC-style contracts, the person who administers the contract on behalf of the Employer is commonly called the ____.', ['Engineer', 'Auditor', 'Surveyor', 'Inspector'], 0,
      ['«Engineer» es el término habitual en los modelos FIDIC para quien administra el contrato.', '«Auditor» revisa cuentas: no administra el contrato.', '«Surveyor» mide/valora; no es el rol de administración contractual en FIDIC.', '«Inspector» comprueba trabajos concretos: no administra el contrato.']),
    it('fid-02', 1, 'A ____ is a formal request by a contracting party for additional time or money under the contract.', ['claim', 'complaint', 'appeal', 'petition'], 0,
      ['«Claim» = reclamación contractual de tiempo o dinero.', '«Complaint» = queja: no es una solicitud formal de tiempo/dinero.', '«Appeal» = recurso contra una decisión.', '«Petition» = petición/solicitud de otro tipo (p. ej. judicial).']),
    it('fid-03', 1, 'The abbreviation EPC stands for Engineering, Procurement and ____.', ['Construction', 'Commissioning', 'Compliance', 'Contracting'], 0,
      ['«EPC» = Engineering, Procurement and Construction.', '«Commissioning» forma parte del proceso, pero no es la «C» de la sigla.', '«Compliance» = cumplimiento: no es la «C» de la sigla.', '«Contracting» no es la «C» de la sigla.']),
    it('fid-04', 2, 'Float is the amount of time an activity can be ____ without delaying the project completion date.', ['delayed', 'deleted', 'duplicated', 'dismissed'], 0,
      ['«Float» = holgura: tiempo que una actividad puede retrasarse sin afectar a la fecha final.', '«Deleted» = eliminada: no tiene que ver con la holgura.', '«Duplicated» = duplicada: sin sentido.', '«Dismissed» = descartada: sin sentido.']),
    it('fid-05', 2, 'The critical path is the longest sequence of ____ activities that determines the shortest possible project duration.', ['dependent', 'optional', 'parallel', 'independent'], 0,
      ['«Dependent» = encadenadas por dependencias; forman la ruta crítica.', '«Optional» = opcionales: no determinan la duración mínima.', '«Parallel» = paralelas: no forman una secuencia.', '«Independent» = independientes: no forman una secuencia encadenada.']),
    it('fid-06', 2, 'The approved ____ programme is the reference against which actual progress is measured.', ['baseline', 'bottleneck', 'backlog', 'breakdown'], 0,
      ['«Baseline programme» = programa de referencia aprobado.', '«Bottleneck» = cuello de botella: otro concepto.', '«Backlog» = trabajo acumulado: otro concepto.', '«Breakdown» = desglose/avería: otro concepto.']),
    it('fid-07', 2, 'To prove causation, the Contractor must show that the delay was ____ by the event it relies on.', ['caused', 'caught', 'cause', 'causing'], 0,
      ['«Was caused by» = pasiva correcta.', '«Caught by» cambia el significado (atrapado/contagiado).', '«Was cause by» es incorrecto: falta el participio.', '«Was causing by» mezcla formas: no es gramatical.'],
      { rule: 'Pasiva: was + participio + by.' }),
    it('fid-08', 2, 'A ____ is a temporary halt to the work which may, depending on the contract terms, entitle the Contractor to time and cost.', ['suspension', 'suspicion', 'suppression', 'succession'], 0,
      ['«Suspension» = suspensión temporal de los trabajos.', '«Suspicion» = sospecha: sin sentido.', '«Suppression» = supresión: no es una parada temporal.', '«Succession» = sucesión: sin sentido.']),
    it('fid-09', 3, '____ checks the finished product against the specification, whereas quality assurance focuses on the process.', ['Quality control', 'Quality circle', 'Quality time', 'Quality manual'], 0,
      ['«Quality control» inspecciona el producto terminado; se contrapone a «quality assurance».', '«Quality circle» = grupo de mejora: no verifica producto.', '«Quality time» = tiempo de calidad personal: no es un término de proyecto.', '«Quality manual» = documento del sistema de calidad: no «checks» productos.']),
    it('fid-10', 3, 'A ____ is a person or company appointed by the Contractor to carry out part of the Works.', ['subcontractor', 'sub-editor', 'subscriber', 'substitute'], 0,
      ['«Subcontractor» = subcontratista.', '«Sub-editor» = corrector de textos: sin relación.', '«Subscriber» = suscriptor: sin relación.', '«Substitute» = sustituto: no implica subcontratar parte de la obra.']),
  ];

  RT.data.vocabulary = { vocabulary, synonyms, contractual, fidic };
})();
