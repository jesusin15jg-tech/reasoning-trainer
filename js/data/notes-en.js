/**
 * notes-en.js — English versions of the explanations attached to the Spanish-authored bank items
 * (vocabulary.js / templates.js). The bank stores the Spanish notes next to each item; this overlay supplies the
 * English text for the same item id, option by option (same order as `options`). `RT.english.noteFor()` picks the
 * language at render time, so changing the language never changes which exercise is generated.
 *
 *   items   : id -> { notes: [one per option], rule?: string, diff?: string }
 *   claims  : passage id -> [one justification per claim, same order as the passage's `claims`]
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  RT.data = RT.data || {};
  const I = {};
  const add = (id, notes, extra) => { I[id] = Object.assign({ notes }, extra || {}); };

  /* vocabulary */
  add('voc-01', ['“Obscure” = unclear; it justifies asking for a written clarification.', '“Obvious” = clear; there would be no reason to ask for clarification.', '“Blunt” = direct, without softening: it describes tone, not lack of clarity.', '“Candid” = frank; it does not imply the text is confusing either.'], { diff: 'obscure (unclear) ≠ obvious (clear).' });
  add('voc-02', ['“Shrewd” = astute, with good judgement for turning a situation to advantage.', '“Efficient” = gets results without wasting resources; it does not express the cleverness of spotting a weakness.', '“Generous” contradicts having obtained a much lower price.', '“Hesitant” contradicts the decisive action described.'], { diff: 'shrewd = astute; efficient = productive without wasting resources.' });
  add('voc-03', ['“Disastrous” fits having to rebuild everything.', '“Unfailing” = constant, never failing; it does not describe a negative effect.', '“Negligible” = insignificant: it contradicts the total rebuild.', '“Marginal” = minimal: it contradicts the severity described.']);
  add('voc-04', ['“Unfailing” = constant, always reliable.', '“Disastrous” contradicts “rely on”.', '“Sporadic” = occasional: it contradicts “never missed”.', '“Reluctant” = unwilling: it contradicts the trust expressed.']);
  add('voc-05', ['“Serve a notice” is the usual collocation: to give formal notification.', '“Hold” goes with meetings or offices, not with “a notice”.', '“Take a notice” is not a collocation; “take notice of” has a different meaning.', '“Draw” does not combine with “notice” in this sense.'], { rule: 'Collocation: serve a notice (on someone).' });
  add('voc-06', ['“Binding on” = legally obliging; it is the exact collocation with the preposition “on”.', '“Flexible” is not used with “on both parties” and does not describe an obligation.', '“Optional” contradicts “unless and until it is revised”.', '“Provisional” does not take “on both parties” and does not express obligation.']);
  add('voc-07', ['“Meticulous” = very careful; consistent with zero errors.', '“Casual” = informal/careless: it contradicts the praise.', '“Superficial” = shallow: it contradicts the result.', '“Occasional” does not describe the praised attention “to detail”.']);
  add('voc-08', ['“Compress the programme” = shorten activity durations to recover time.', '“Suppress” = to hold back/ban; it is not applied to a programme in this sense.', '“Impress” = to make an impression: meaningless here.', '“Express” = to state: meaningless here.']);
  add('voc-09', ['“Scrupulous” = extremely correct and careful.', '“Careless” contradicts “always paying on the due date”.', '“Erratic” = irregular: it contradicts the punctuality described.', '“Hostile” contradicts suppliers wanting to work with them.']);
  add('voc-10', ['“Arbitrary” = without reasonable basis: fits rejecting compliant designs.', '“Ambiguous” describes lack of clarity, not lack of justification for a rejection.', '“Amenable” = willing to accept: it contradicts “refusal”.', '“Adjacent” = next to: meaningless here.']);
  add('voc-11', ['“Unwavering” = firm, steadfast.', '“Unwary” = careless of danger: it contradicts a commitment to safety.', '“Unwilling” contradicts “commitment”.', '“Unworldly” = naive/unsophisticated: it does not fit the context.']);
  add('voc-12', ['“Hairline cracks” = extremely thin cracks; a standard technical collocation.', '“Headline” = a newspaper title: it does not qualify cracks.', '“Deadline” = a time limit: it does not qualify cracks.', '“Skyline” = the outline of a city: it does not qualify cracks.']);
  add('voc-13', ['“Vague” = imprecise: consistent with avoiding clear conclusions.', '“Vivid” = striking and clear: it contradicts avoiding clarity.', '“Vital” = essential: it does not describe the style of the report.', '“Valid” does not fit “deliberately … avoiding any clear conclusion”.']);
  add('voc-14', ['“Ambiguous” = open to several readings; clarification is requested because of the contradiction.', '“Abundant” = plentiful: meaningless for a contract.', '“Abrupt” = sudden: it does not describe a clause.', '“Absolute” contradicts the need for clarification.']);
  add('voc-15', ['“Resourceful” = good at solving problems with limited means.', '“Resentful” = bitter: it does not fit solving a problem.', '“Reluctant” = unwilling: it contradicts the speed of the solution.', '“Resistant” = opposed: it contradicts the problem-solving attitude.']);
  add('voc-16', ['“Pragmatic” = practical, focused on what is feasible: costs split equally.', '“Dogmatic” = inflexible: it contradicts the compromise agreed.', '“Erratic” = unpredictable: it does not describe an agreed solution.', '“Symptomatic” does not fit “solution”.']);

  /* synonyms / antonyms */
  add('syn-01', ['“Terminate” = to put an end to; synonym of “end”.', '“Extend” = to prolong: the opposite meaning.', '“Amend” = to modify: it changes the contract but does not end it.', '“Ratify” = to confirm formally: the opposite meaning.']);
  add('syn-02', ['“Defer” = to postpone; synonym of “postpone”.', '“Accelerate” = to speed up: the opposite meaning.', '“Cancel” = to annul: the payment still exists, it is only delayed.', '“Confirm” does not imply postponement.']);
  add('syn-03', ['“Ambiguous” = open to several meanings; close to “unclear”.', '“Precise”: antonym.', '“Binding”: a different idea (obligation).', '“Invalid” = not valid: not the same as ambiguous.']);
  add('syn-04', ['“Liable” = legally responsible.', '“Immune”: antonym.', '“Exempt”: antonym.', '“Entitled” = having a right to something: it does not mean responsible.']);
  add('syn-05', ['“Mitigate” = to lessen the severity.', '“Worsen”: antonym.', '“Ignore”: the opposite of taking action.', '“Prove”: a different idea.']);
  add('syn-06', ['“Expedite” = to speed up a process or delivery.', '“Postpone”: antonym.', '“Inspect”: a different action.', '“Reject”: a different action.']);
  add('syn-07', ['“Concur” = to agree.', '“Objected”: antonym.', '“Hesitated” does not express agreement.', '“Intervened” does not express agreement.']);
  add('syn-08', ['“Ratify” = to confirm formally what was agreed.', '“Revoke”: antonym.', '“Amend” changes the text, it does not confirm it.', '“Suspend” does not confirm the agreement.']);
  add('syn-09', ['“Adjacent” = neighbouring; “next to”.', '“Opposite” = facing: not neighbouring.', '“Far from”: antonym.', '“Identical to”: a different meaning.']);
  add('syn-10', ['“Settled” = resolved, definitively established.', '“Contested”: antonym.', '“Suspended” is not a resolution.', '“Postponed” is not a resolution.']);
  add('syn-11', ['“Curtail” = to cut short, to reduce the duration.', '“Extend”: antonym.', '“Repeat”: a different idea.', '“Reward”: a different idea.']);
  add('ant-01', ['“Optional” = voluntary: antonym of “mandatory”.', '“Compulsory” = required: a synonym, not an antonym.', '“Binding” = obliging: a partial synonym.', '“Essential” = indispensable: a partial synonym.']);
  add('ant-02', ['“Delay” = to slow down: antonym of “accelerate”.', '“Hasten”: synonym.', '“Hurry”: synonym.', '“Advance” = to bring forward: a synonym in this context.']);
  add('ant-03', ['“Fixed” = installed at one point: antonym of “mobile”.', '“Portable”: synonym.', '“Movable”: synonym.', '“Compact” refers to size, not to mobility.']);
  add('ant-04', ['“Asset” is the accounting opposite of “liability”.', '“Debt” is a type of liability.', '“Obligation” is a synonym of liability/duty.', '“Charge” is a cost, not the opposite.']);
  add('ant-05', ['“Definite” = final: antonym of “tentative”.', '“Provisional”: synonym.', '“Draft”: a synonym in this context.', '“Uncertain”: synonym.']);
  add('ant-06', ['“Strict”: antonym of “lenient”.', '“Generous”: a close synonym.', '“Tolerant”: synonym.', '“Flexible”: synonym.']);

  /* contractual */
  add('con-01', ['“Variation” = change order that modifies scope, quantity or time.', '“Invoice” demands payment; it does not change the scope.', '“Warranty” = a commitment about defects.', '“Default” = failure to perform: it is not a change instruction.']);
  add('con-02', ['“Extension of time” = a prolongation of the completion period; a fixed term.', '“Extraction”: meaningless here.', '“Extinction”: meaningless here.', '“Extent” = degree/scope: it does not form the expression.'], { rule: 'Collocation: an extension of time (EOT).' });
  add('con-03', ['“Pre-determined” = fixed in advance in the contract: the essence of liquidated damages.', '“Fluctuating” = variable: it contradicts an agreed amount.', '“Voluntary”: they are a contractual obligation.', '“Refundable” does not define their nature.']);
  add('con-04', ['“Give notice of” = to notify formally.', '“Give news of” is not used in contract language and changes the register.', '“Give sign of” is not a collocation (“give a sign”).', '“Give measure of” is not a collocation.']);
  add('con-05', ['“Indemnify … against” = to compensate for a claim or loss.', '“To” is not used with “indemnify” in this sense.', '“At” is not the preposition of this verb.', '“By” is not the preposition of this verb.'], { rule: 'indemnify someone against a claim / loss.' });
  add('con-06', ['“Is conditional upon” = depends on; an adjective after the verb “to be”.', '“Conditioning” (gerund/noun) does not fit after “is … upon”.', '“Condition” is a noun: “is condition upon” is wrong.', '“Conditionally” is an adverb: it cannot be the complement of “is”.'], { rule: 'be + conditional + upon/on.' });
  add('con-07', ['“Unforeseen” = not anticipated; the usual collocation with “ground conditions”.', '“Unforgiven”: meaningless here.', '“Unfounded” = without basis: it contradicts claiming with grounds.', '“Unfulfilled” = not carried out: it does not qualify ground conditions.']);
  add('con-08', ['“Warranty” = a guarantee.', '“Warrant” = court order / authorisation: a different meaning.', '“Waiver” = giving up a right: it is not a guarantee.', '“Writ” = a court order: a different meaning.']);
  add('con-09', ['“Expired” = ended; it fits “time-barred”.', '“Explained”: meaningless here.', '“Expanded” = enlarged: it contradicts rejecting a late claim.', '“Exempted” does not apply to a time limit.']);
  add('con-10', ['“In accordance with” is the correct fixed expression.', '“In accordance to” is a common error: the preposition is “with”.', '“According with” does not exist: say “according to”.', '“In accord to” is wrong: it would be “in accord with”.'], { rule: 'in accordance with = conforming to.' });
  add('con-11', ['“Cost overruns” = spending above budget.', '“Overturns” = reversals/annulments: not a cost term.', '“Overlays” = layers laid on top: a different meaning.', '“Overtakes” = passes: meaningless here.']);
  add('con-12', ['“Notify someone” = to inform someone formally.', '“Notice” as a verb = to become aware; it does not mean “notify”.', '“Note” = to write down; it does not take a person object like this.', '“Know” does not express the action of informing.'], { diff: 'notify = inform formally; notice = become aware of.' });
  add('con-13', ['“Entitlement” = the right to claim; it is proven by a clause.', '“Enrolment” = registration: meaningless here.', '“Enrichment”: meaningless here.', '“Endorsement” = backing/approval: it is not the right to an extension.']);
  add('con-14', ['“Elapsed” = passed (for a period of time).', '“Eluded” = escaped: meaningless with a period.', '“Enclosed” = attached: meaningless here.', '“Embraced” = hugged/adopted: meaningless here.']);
  add('con-15', ['“Signed” = signed by both parties.', '“Designed”: it does not apply to a contract amendment.', '“Resigned” = quit: meaningless here.', '“Assigned” = transferred: a different contractual concept.']);
  add('con-16', ['“Is limited to” = passive: the liability is capped at.', '“Limiting” is an active participle: it does not fit “is … to”.', '“Limit” (noun/verb) does not complete “is … to”.', '“Limits” does not complete “is … to”.'], { rule: 'be limited to + amount.' });
  add('con-17', ['“Submit a claim to” = to present a claim to.', '“Admit a claim” = to acknowledge it (done by the recipient), and it does not take “to the Contractor”.', '“Permit” = to allow: not used like this.', '“Commit a claim” does not exist in this sense.']);
  add('con-18', ['“Milestone” = a project landmark, commonly used to link payments.', '“Mileage” = distance travelled: a different meaning.', '“Millstone” = a grinding stone (or heavy burden): not a milestone.', '“Miller” = flour maker: meaningless here.']);
  add('con-19', ['“Otherwise” = if not: it introduces the consequence of non-compliance.', '“Moreover” adds information: it does not express a consequence.', '“Therefore” expresses a result, not an alternative.', '“However” introduces contrast, and there is no opposing idea here.']);
  add('con-20', ['“Until” = up to the moment when; it fixes when the retention stops.', '“During” needs a noun, not a full clause.', '“Since” marks a starting point in the past: it does not fit.', '“Whereas” expresses contrast: it does not fit.']);
  add('con-21', ['“Arbitration” = a way of settling disputes, an alternative to the courts.', '“Arbitrage” = financial arbitrage: a different meaning.', '“Arbitrariness”: meaningless here.', '“Articulation” = joint/expression: meaningless here.']);
  add('con-22', ['“Breach of contract” = failure to perform the contract.', '“Branch” = a limb or office: it does not form the expression.', '“Breadth” = width: it does not form the expression.', '“Breath” = air taken in: it does not form the expression.']);

  /* FIDIC / project management */
  add('fid-01', ['“Engineer” is the usual term in the FIDIC models for whoever administers the contract.', '“Auditor” reviews accounts: they do not administer the contract.', '“Surveyor” measures/values; it is not the contract-administration role in FIDIC.', '“Inspector” checks specific works: they do not administer the contract.']);
  add('fid-02', ['“Claim” = a contractual request for time or money.', '“Complaint” = a grievance: not a formal request for time/money.', '“Appeal” = a challenge to a decision.', '“Petition” = a request of another kind (e.g. judicial).']);
  add('fid-03', ['“EPC” = Engineering, Procurement and Construction.', '“Commissioning” is part of the process, but it is not the “C” of the acronym.', '“Compliance” is not the “C” of the acronym.', '“Contracting” is not the “C” of the acronym.']);
  add('fid-04', ['“Float” = slack: the time an activity can be delayed without affecting the end date.', '“Deleted” is unrelated to float.', '“Duplicated”: meaningless here.', '“Dismissed”: meaningless here.']);
  add('fid-05', ['“Dependent” = chained by dependencies; they form the critical path.', '“Optional” activities do not determine the minimum duration.', '“Parallel” activities do not form a sequence.', '“Independent” activities do not form a chained sequence.']);
  add('fid-06', ['“Baseline programme” = the approved reference programme.', '“Bottleneck” is a different concept.', '“Backlog” = accumulated work: a different concept.', '“Breakdown” = breakdown/failure: a different concept.']);
  add('fid-07', ['“Was caused by” is the correct passive.', '“Caught by” changes the meaning (trapped/infected).', '“Was cause by” is wrong: the participle is missing.', '“Was causing by” mixes forms: it is not grammatical.'], { rule: 'Passive: was + past participle + by.' });
  add('fid-08', ['“Suspension” = a temporary stop of the works.', '“Suspicion”: meaningless here.', '“Suppression” = banning/ending: not a temporary stop.', '“Succession”: meaningless here.']);
  add('fid-09', ['“Quality control” inspects the finished product; it contrasts with “quality assurance”.', '“Quality circle” = an improvement group: it does not check products.', '“Quality time” = personal time together: not a project term.', '“Quality manual” = a quality-system document: it does not “check” products.']);
  add('fid-10', ['“Subcontractor” = a company hired for part of the works.', '“Sub-editor”: unrelated.', '“Subscriber”: unrelated.', '“Substitute” = a replacement: it does not imply subcontracting part of the works.']);

  /* prepositions */
  add('pre-01', ['“Arrive at” + airport, station or a specific place.', '“Arrive in” is used with cities and countries, not a specific airport.', '“Arrive on” is not used with places.', '“Arrive into” is not the standard form.'], { rule: 'arrive at (specific place) / arrive in (city, country).' });
  add('pre-02', ['“On the 18:30 flight”: with a specific flight we use “on”.', '“By” is used without an article: “by air”, “by plane”.', '“In” is not used with specific flights.', '“At” is not used with flights.'], { rule: 'on a flight / on the 18:30 flight; by air / by plane (no article).' });
  add('pre-03', ['“By boat” = means of transport in general, without an article.', '“On boat” without an article is wrong (it would be “on the boat”).', '“In boat” without an article is wrong.', '“With boat” does not express means of transport.'], { rule: 'by + means of transport (no article).' });
  add('pre-04', ['“On” + day of the week (even with “morning”).', '“In” is used with parts of the day without a specific day (“in the morning”).', '“At” is used with clock times or “night”.', '“By” = no later than: it changes the meaning.']);
  add('pre-05', ['“At” + exact time.', '“On” is used with days and dates.', '“In” is used with months, years or periods.', '“By” = no later than: it does not express the exact start time.']);
  add('pre-06', ['“Into place” is the fixed expression: to position something where it belongs.', '“To place” does not form the expression.', '“At place” does not form the expression.', '“On place” does not form the expression.'], { rule: 'into place (fixed expression).' });
  add('pre-07', ['“Award something to someone”.', '“For” is not used with “award” for the recipient.', '“At” does not fit.', '“By” would indicate who awards, not who receives.']);
  add('pre-08', ['“Signed by” introduces the agent in the passive.', '“From” would indicate origin, not the agent of the signature.', '“With” would indicate company or instrument.', '“At” does not fit.']);
  add('pre-09', ['“Within thirty days” = in a maximum period of thirty days.', '“Between” requires two reference points.', '“Among” is used with groups of people or things.', '“Along” expresses a path through space.']);
  add('pre-10', ['“On schedule” = as planned.', '“In schedule” does not exist.', '“At schedule” does not exist.', '“By schedule” does not exist.'], { rule: 'on schedule / ahead of schedule / behind schedule.' });
  add('pre-11', ['“At risk of” = in danger of.', '“In risk” is not used.', '“On risk” is not used.', '“By risk” is not used.']);
  add('pre-12', ['“In dispute” = being disputed.', '“On dispute” is not used.', '“At dispute” is not used.', '“By dispute” is not used.']);
  add('pre-13', ['“By email” = sent via email.', '“With email” does not express the means of sending.', '“In email” is not used like this.', '“On email” is not used like this.']);
  add('pre-14', ['“Comply with” = to follow a rule.', '“Comply to” is a common error.', '“Comply by” does not exist.', '“Comply at” does not exist.'], { rule: 'comply with (not “to”).' });
  add('pre-15', ['“Entitled to + infinitive” = having the right to.', '“Entitled for” is not used.', '“Entitled of” is not used.', '“Entitled on” is not used.']);
  add('pre-16', ['“At the rate of” = at a speed or price per unit.', '“By the rate of” is not used.', '“In the rate of” is not used.', '“On the rate of” is not used.']);
  add('pre-17', ['“On a business trip” = travelling for work.', '“In a business trip” is wrong.', '“At a business trip” is wrong.', '“By a business trip” is wrong.']);
  add('pre-18', ['“At Terminal 2” = at a specific point of the airport.', '“In Terminal 2” is not the usual choice with “lands”.', '“On Terminal 2” is not used.', '“Into Terminal 2” is not used.']);
  add('pre-19', ['“Arrive in” + country or city.', '“Arrive at” is reserved for specific places (airport, station, office).', '“Arrive to” is a common error.', '“Arrive on” is not used with places.']);
  add('pre-20', ['“On holiday” = away on vacation.', '“In holiday” is wrong.', '“At holiday” is wrong.', '“By holiday” is wrong.']);
  add('pre-21', ['“Responsible for” = in charge of.', '“Responsible of” is a common error.', '“Responsible about” is not used.', '“Responsible over” is not used.']);
  add('pre-22', ['“Prevent someone from + -ing”.', '“Prevent to” does not exist.', '“Prevent of” does not exist.', '“Prevent against” does not exist.'], { rule: 'prevent + object + from + -ing.' });
  add('pre-23', ['“Subject to” = conditional on.', '“Subject of” means “topic of”.', '“Subject on” is not used.', '“Subject with” is not used.']);
  add('pre-24', ['“In transit” = on the way (fixed expression).', '“On transit” is not used.', '“At transit” is not used.', '“By transit” is not used.']);
  add('pre-25', ['“Liable for” = responsible for.', '“Liable of” is not used.', '“Liable to” is used for “subject to” (“liable to a fine”).', '“Liable on” is not used.']);


  /* reading passages: justification of each claim, in the same order as the passage's `claims` */
  const C = {
    'rd-01': [
      'The text says the certificate of origin was missing.',
      'The certificate was obtained on the 13th and the release was on the 14th.',
      '“provided that the Engineer has accepted the foundations” is a condition.',
      'Sara obtained it “from Norvik”, who is the supplier.',
      'On 2 October it left Rotterdam; it reached Bilbao on the 9th.',
      'Delivery is planned for the 16th; installation starts on the 17th.',
      'The crane is needed on the morning of 16 October.',
      'The text only says the installation depends on the foundations being accepted; it does not say they already are.',
      'No fine is mentioned.',
      'The text does not talk about costs.',
    ],
    'rd-02': [
      'Mr Okafor instructed the excavation to stop.',
      '“we have still not received the Engineer\'s approval, so the foundation works remain suspended”.',
      'It says the claim will be sent once the extent of the delay is known.',
      '“an extension of time and any additional cost”.',
      'The method statement was submitted on 7 March; approval was still pending on the 10th.',
      'The visit on 5 March was made by the engineer, Ms Ruiz.',
      'The text says the suspension “may delay” completion, not that it will.',
      'It does not say who prepared the geotechnical report.',
      'The absence of an approval does not mean it has been rejected.',
      'It does not say who the addressee works for.',
    ],
    'rd-03': [
      '“Laura decided to postpone the pour until 16 June”.',
      '“Tom accepted the postponement”, and Tom is the Client\'s Representative.',
      '“within five days of receiving it” (the non-conformance report).',
      '“She will issue a non-conformance report”; “She” is Amira.',
      'Amira will issue it; Peter will submit the corrective action plan.',
      'Two tests did not reach the required strength.',
      '13 June was the planned date; it was postponed to the 16th.',
      'The rain is mentioned as the reason for the postponement, not as the cause of the test failures.',
      'The revised programme has not been sent yet (it will be sent before the 14th).',
      'Only her job title (Quality Manager) is given, not her company.',
    ],
    'rd-04': [
      '09:40: “Karim re-inspected the crane and released the lifting permit”.',
      'It was redirected to Gate 3 because Gate 1 was blocked.',
      '“Nobody was injured”.',
      '“Rosa will report the incident to the Project Manager, Elena”.',
      'Karim, the Safety Officer, stopped them; Hugo is the logistics coordinator.',
      'The re-inspection was at 09:40 and work resumed at 10:00.',
      'It was redirected to Gate 3 because Gate 1 was blocked.',
      'No disciplinary action is mentioned.',
      'It only says the gate was blocked by the crane, not for how long.',
      'The talk is “tomorrow” and the text only says Rosa will report; it does not say Elena will attend.',
    ],
    'rd-05': [
      'The instruction is dated 22 April and was received on the 24th.',
      '“increased the quantity of piping by approximately 30 percent”.',
      '“the Contractor has not yet agreed a revised price”.',
      '“Fully detailed particulars will be submitted within 28 days”.',
      'The quantity increased by approximately 30%.',
      'It was received on the 24th and the notice is dated the 30th: 6 days passed.',
      '“Nothing in this notice waives any of the Subcontractor\'s rights”.',
      'It is Delta Mechanical that considers the notice timely; the Contractor\'s position is not stated.',
      'The text does not explain the reason for the variation.',
      'Nothing is said about other subcontractors.',
    ],
    'rd-06': [
      '“Vertex has the lowest price”.',
      'Ivan signs any award above €2 million and Ridgeline offers €2.4 million.',
      '“I have not evaluated it” (Coastal\'s bid).',
      '“Please prepare the award recommendation for Ivan by Friday”.',
      'Vertex is the cheapest and Ridgeline is 6% more expensive.',
      'The incomplete bid was Coastal\'s.',
      'The decision belongs to the Project Director, Ivan Petrov.',
      'It says Vertex\'s programme “includes no weather contingency”.',
      'It only says Vertex is the cheapest; its amount is not given.',
      'Legal is asked to check it; it does not say Legal has approved it.',
      'Coastal\'s bid was not evaluated, so it cannot be known.',
    ],
  };

  RT.data.notesEn = { items: I, claims: C };
})();
