/**
 * templates.js — question templates and reading passages for the English module.
 *
 * Reading passages are written by hand (natural corporate English, 100–250 words).
 * Each passage carries:
 *   facts  : dated events (kind 'past' | 'planned', day = sortable number) -> ordering questions are COMPUTED
 *   claims : statements labelled supported / contradicted / unsupported, each with a Spanish justification
 * Question types are generated from those labels, so the answer key can be re-derived by the validator.
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  RT.data = RT.data || {};

  const C = (label, text, why) => ({ label, text, why });
  const S = (text, why) => C('supported', text, why);
  const X = (text, why) => C('contradicted', text, why);
  const U = (text, why) => C('unsupported', text, why);

  const readings = [
    {
      id: 'rd-01', level: 1, type: 'Email',
      text: `Subject: Transformer delivery – update

Hi team,

Here is a quick update on the transformer. The supplier, Norvik, shipped it from Rotterdam on 2 October. It reached the port of Bilbao on 9 October, but customs clearance was delayed because the certificate of origin was missing. Our logistics coordinator, Sara, obtained the certificate from Norvik on 13 October, and customs released the transformer on 14 October. The haulage company, TransIber, will deliver it to site on 16 October. Please make sure that the crane and the rigging team are available that morning. The transformer weighs about 60 tonnes, so the road permit must be shown at the gate. Installation will start on 17 October, provided that the Engineer has accepted the foundations by then.

Regards,
Tomás`,
      facts: [
        { kind: 'past', day: 2, text: 'Norvik shipped the transformer from Rotterdam' },
        { kind: 'past', day: 9, text: 'The transformer reached the port of Bilbao' },
        { kind: 'past', day: 13, text: 'Sara obtained the certificate of origin' },
        { kind: 'past', day: 14, text: 'Customs released the transformer' },
      ],
      claims: [
        S('Customs clearance was delayed because a document was missing.', 'El texto dice que faltaba el certificado de origen.'),
        S('Customs released the transformer the day after the certificate was obtained.', 'El certificado se obtuvo el 13 y la liberación fue el 14.'),
        S('The start of the installation depends on the Engineer accepting the foundations.', '«provided that the Engineer has accepted the foundations» es una condición.'),
        S('Sara obtained the certificate of origin from the supplier.', 'Sara la obtuvo «from Norvik», que es el proveedor.'),
        X('The transformer reached Bilbao on 2 October.', 'El 2 de octubre salió de Rotterdam; llegó a Bilbao el 9.'),
        X('TransIber will deliver the transformer on 17 October.', 'La entrega está prevista el 16; el 17 empieza la instalación.'),
        X('The crane will be needed on 14 October.', 'La grúa se necesita la mañana del 16 de octubre.'),
        U('The foundations have already been accepted.', 'El texto solo dice que la instalación depende de que se acepten; no dice que ya lo estén.'),
        U('Norvik was fined for the missing certificate.', 'No se menciona ninguna sanción.'),
        U('The delay increased the transport cost.', 'El texto no habla de costes.'),
      ],
    },
    {
      id: 'rd-02', level: 1, type: 'Delay notice',
      text: `Subject: Notice of delay – Pump House foundations

Dear Ms Alvarez,

On Monday 3 March our site team found that the soil under the Pump House foundation was softer than the geotechnical report had indicated. I informed the Site Manager, Mr Okafor, the same day, and he instructed us to stop the excavation until the Engineer could inspect the area. The Engineer, Ms Ruiz, visited the site on Wednesday 5 March and asked us to submit a method statement for ground improvement. Our design team sent the method statement on Friday 7 March. Today, 10 March, we have still not received the Engineer's approval, so the foundation works remain suspended. We therefore give notice that this suspension may delay the completion of the Pump House, and we reserve the right to claim an extension of time and any additional cost. We will send a detailed claim once the extent of the delay is known.

Kind regards,
Daniel Marsh
Project Manager, Brightwell Subcontractors`,
      facts: [
        { kind: 'past', day: 3, text: 'The site team found softer soil' },
        { kind: 'past', day: 5, text: 'The Engineer visited the site' },
        { kind: 'past', day: 7, text: 'The method statement was sent' },
        { kind: 'past', day: 10, text: 'The notice of delay was written' },
      ],
      claims: [
        S('The excavation was stopped on the instruction of the Site Manager.', 'Mr Okafor instruyó parar la excavación.'),
        S('The foundation works are suspended because the method statement has not been approved.', '«we have still not received the Engineer\'s approval, so the foundation works remain suspended».'),
        S('Brightwell has not yet submitted a detailed claim.', 'Dice que la enviará cuando se conozca la magnitud del retraso.'),
        S('Brightwell reserves its right to claim both time and cost.', '«an extension of time and any additional cost».'),
        X('The Engineer approved the method statement on 7 March.', 'El 7 de marzo el método se envió; la aprobación sigue pendiente el 10.'),
        X('Mr Okafor visited the site on 5 March.', 'La visita del 5 de marzo fue de la ingeniera, Ms Ruiz.'),
        U('The Pump House will be completed late.', 'El texto dice que la suspensión «may delay» la finalización, no que la retrasará.'),
        U('The geotechnical report was prepared by Brightwell.', 'No se dice quién preparó el informe geotécnico.'),
        U('The Engineer has rejected the method statement.', 'Que no haya aprobación no significa que se haya rechazado.'),
        U('Ms Alvarez works for the Employer.', 'No se indica para quién trabaja la destinataria.'),
      ],
    },
    {
      id: 'rd-03', level: 2, type: 'Meeting minutes',
      text: `Minutes of the Weekly Coordination Meeting – 12 June

Present: Laura Chen (Project Manager), Peter Novak (Civil Subcontractor), Amira Haddad (Quality Manager), Tom Reyes (Client's Representative).

1. Concrete pour, Tank T-204. Peter reported that the rebar inspection was completed on 9 June and that the pour was planned for 13 June. Because heavy rain was forecast, Laura decided to postpone the pour until 16 June. Tom accepted the postponement but asked for a revised programme.

2. Quality. Amira said that two cube tests from the previous pour had failed to reach the required strength. She will issue a non-conformance report by 15 June. Peter agreed to submit a corrective action plan within five days of receiving it.

3. Next steps. Laura will send the revised programme to Tom by 14 June. The next meeting will be held on 19 June.`,
      facts: [
        { kind: 'past', day: 9, text: 'The rebar inspection was completed' },
        { kind: 'past', day: 12, text: 'The coordination meeting was held' },
        { kind: 'planned', day: 14, text: 'Laura sends the revised programme to Tom' },
        { kind: 'planned', day: 15, text: 'Amira issues the non-conformance report' },
        { kind: 'planned', day: 16, text: 'The concrete pour takes place' },
        { kind: 'planned', day: 19, text: 'The next meeting is held' },
      ],
      claims: [
        S('Laura decided to postpone the concrete pour.', '«Laura decided to postpone the pour until 16 June».'),
        S('The Client’s Representative accepted the postponement.', '«Tom accepted the postponement», y Tom es el Client\'s Representative.'),
        S('Peter has to submit a corrective action plan after receiving the non-conformance report.', '«within five days of receiving it» (el informe de no conformidad).'),
        S('Amira is responsible for issuing the non-conformance report.', '«She will issue a non-conformance report»; «She» es Amira.'),
        X('Peter will issue the non-conformance report.', 'Lo emitirá Amira; Peter presentará el plan de acciones correctivas.'),
        X('All the cube tests from the previous pour reached the required strength.', 'Dos ensayos no alcanzaron la resistencia requerida.'),
        X('The pour will take place on 13 June as planned.', '13 de junio era la fecha prevista; se pospuso al 16.'),
        U('The heavy rain caused the cube tests to fail.', 'La lluvia se menciona para el aplazamiento, no como causa del fallo de los ensayos.'),
        U('Tom has approved the revised programme.', 'El programa revisado aún no se ha enviado (se enviará antes del 14).'),
        U('Amira works for the Client.', 'Solo se indica su cargo (Quality Manager), no su empresa.'),
      ],
    },
    {
      id: 'rd-04', level: 2, type: 'Site diary',
      text: `Site Diary – Tuesday

07:30 – Karim, the Safety Officer, stopped lifting operations at Crane 2 after noticing that the outrigger pads were not fully extended.

08:15 – Rosa, the Lifting Supervisor, confirmed the fault and ordered the rigger crew to reposition the crane.

09:40 – Karim re-inspected the crane and released the lifting permit.

10:00 – Operations resumed. Meanwhile, the steel delivery planned for 09:00 had been redirected to Gate 3 by Hugo, the Logistics Coordinator, because Gate 1 was blocked by the crane. The delay to the steel erection was approximately two hours. Nobody was injured. Rosa will report the incident to the Project Manager, Elena, at tomorrow's toolbox talk.`,
      facts: [
        { kind: 'past', day: 450, text: 'Karim stopped the lifting operations' },
        { kind: 'past', day: 495, text: 'Rosa confirmed the fault' },
        { kind: 'past', day: 580, text: 'Karim released the lifting permit' },
        { kind: 'past', day: 600, text: 'Lifting operations resumed' },
      ],
      claims: [
        S('Karim released the lifting permit after re-inspecting the crane.', '09:40: «Karim re-inspected the crane and released the lifting permit».'),
        S('The steel delivery was moved to a different gate.', 'Se redirigió a la Puerta 3 porque la 1 estaba bloqueada.'),
        S('Nobody was hurt.', '«Nobody was injured».'),
        S('Rosa will report the incident to the Project Manager.', '«Rosa will report the incident to the Project Manager, Elena».'),
        X('Hugo stopped the lifting operations.', 'Las paró Karim, el Safety Officer; Hugo es el coordinador de logística.'),
        X('Operations resumed before the crane was re-inspected.', 'La re-inspección fue a las 09:40 y se reanudó a las 10:00.'),
        X('The steel was delivered through Gate 1.', 'Se redirigió a la Puerta 3 porque la Puerta 1 estaba bloqueada.'),
        U('The crane operator was disciplined.', 'No se menciona ninguna medida disciplinaria.'),
        U('Gate 1 stayed blocked for the rest of the day.', 'Solo se dice que estaba bloqueada por la grúa; no cuánto duró.'),
        U('Elena attended the toolbox talk.', 'La charla es «mañana» y solo se dice que Rosa informará; no que Elena vaya a asistir.'),
      ],
    },
    {
      id: 'rd-05', level: 3, type: 'Contractual notice',
      text: `Re: Notice of claim – Variation No. 7

Under Clause 14 of the Subcontract, Delta Mechanical gives notice that it intends to claim additional payment and an extension of time arising from Variation No. 7, which the Contractor issued on 22 April. The variation increased the quantity of piping by approximately 30 percent and requires the installation to be re-sequenced. Delta Mechanical received the instruction on 24 April, although it is dated 22 April. Clause 14.2 requires notice to be given within 14 days of the Subcontractor becoming aware of the event. This notice is sent on 30 April and Delta Mechanical therefore considers it timely. Fully detailed particulars will be submitted within 28 days. Delta Mechanical also notes that the Contractor has not yet agreed a revised price for the variation, and asks the Contractor to confirm the valuation method. Nothing in this notice waives any of the Subcontractor's rights.`,
      facts: [
        { kind: 'past', day: 22, text: 'The Contractor issued Variation No. 7' },
        { kind: 'past', day: 24, text: 'Delta Mechanical received the instruction' },
        { kind: 'past', day: 30, text: 'Delta Mechanical sent the notice' },
      ],
      claims: [
        S('The Subcontractor received the instruction two days after the date written on it.', 'La instrucción lleva fecha 22 de abril y se recibió el 24.'),
        S('The variation increased the amount of piping.', '«increased the quantity of piping by approximately 30 percent».'),
        S('The price of Variation No. 7 has not yet been agreed.', '«the Contractor has not yet agreed a revised price».'),
        S('Delta Mechanical will give further details of its claim later.', '«Fully detailed particulars will be submitted within 28 days».'),
        X('The variation reduced the quantity of piping.', 'La cantidad aumentó un 30 % aproximadamente.'),
        X('The notice was sent more than 14 days after the Subcontractor received the instruction.', 'Se recibió el 24 y el aviso es del 30: pasaron 6 días.'),
        X('Delta Mechanical has waived its rights.', '«Nothing in this notice waives any of the Subcontractor\'s rights».'),
        U('The Contractor has accepted that the notice is timely.', 'Es Delta Mechanical quien la considera oportuna; no se recoge la postura del Contractor.'),
        U('The variation was necessary because of a design error.', 'El texto no explica el motivo de la variación.'),
        U('Delta Mechanical is the Contractor’s only subcontractor.', 'No se dice nada sobre otros subcontratistas.'),
      ],
    },
    {
      id: 'rd-06', level: 3, type: 'Internal email',
      text: `From: Hana Sato, Procurement Manager
To: Marco Bellini, Contracts Manager
Subject: Pipework subcontract – bid evaluation

Marco,

I have reviewed the three bids we received on 5 September. Vertex has the lowest price, but its programme assumes two shifts and includes no weather contingency. Ridgeline is 6% more expensive and offers a recovery plan with a named Safety Lead. Coastal's bid was returned incomplete because the insurance certificates were missing, so I have not evaluated it. I recommend Ridgeline. However, the decision rests with the Project Director, Ivan Petrov, who must sign any award above €2 million, and Ridgeline's price is €2.4 million. Please prepare the award recommendation for Ivan by Friday, and ask Legal to check Ridgeline's proposed liability cap before we send the letter of intent.

Hana`,
      facts: [{ kind: 'past', day: 5, text: 'The three bids were received' }],
      claims: [
        S('Vertex submitted the lowest price.', '«Vertex has the lowest price».'),
        S('Ivan Petrov must sign an award to Ridgeline.', 'Ivan firma cualquier adjudicación superior a 2 M€ y Ridgeline ofrece 2,4 M€.'),
        S('Hana has not evaluated Coastal’s bid.', '«I have not evaluated it» (la oferta de Coastal).'),
        S('Marco has been asked to prepare the award recommendation.', '«Please prepare the award recommendation for Ivan by Friday».'),
        S('Ridgeline’s price is higher than Vertex’s.', 'Vertex es la más barata y Ridgeline es un 6 % más cara.'),
        X('Ridgeline’s bid was incomplete.', 'La oferta incompleta fue la de Coastal.'),
        X('Hana has the authority to sign the award.', 'La decisión corresponde al Project Director, Ivan Petrov.'),
        X('Vertex’s programme includes a weather contingency.', 'Dice que el programa de Vertex «includes no weather contingency».'),
        U('Vertex’s price is below €2 million.', 'Solo se dice que es la más barata; no se da su importe.'),
        U('Legal has already approved Ridgeline’s liability cap.', 'Se pide a Legal que lo revise; no se dice que lo haya aprobado.'),
        U('Coastal would have been the cheapest bidder.', 'La oferta de Coastal no se evaluó, así que no se puede saber.'),
      ],
    },
  ];

  const categories = {
    vocabulary: { label: 'Vocabulary & Collocations', weight: 2, instruction: 'Choose the word or phrase that best completes the sentence.' },
    synonyms: { label: 'Synonyms / Antonyms', weight: 2, instruction: null }, // per item (syn / ant)
    contractual: { label: 'Contractual English', weight: 3, instruction: 'Choose the word or phrase that best completes the sentence.' },
    fidic: { label: 'FIDIC / Project Management', weight: 1, instruction: 'Choose the word or phrase that best completes the sentence.' },
    prepositions: { label: 'Prepositions', weight: 2, instruction: 'Choose the preposition that correctly completes the sentence.' },
    sva: { label: 'Subject–Verb Agreement', weight: 3, instruction: 'Choose the verb form that correctly completes the sentence.' },
    reading: { label: 'Reading & Inference', weight: 2, instruction: 'Read the text and answer the question.' },
  };

  const SYN_INSTR = { syn: 'Choose the word or phrase closest in meaning to the word in capitals.', ant: 'Choose the word or phrase opposite in meaning to the word in capitals.' };

  RT.data.templates = { readings, categories, SYN_INSTR };
})();
