/**
 * pools.js — shared name pools used by the logic modules (A, B, C).
 * Pure data. Every pool exists in English and Spanish with the SAME ORDER and length, and RT.pools exposes the
 * list for the CURRENT language through getters: generators draw indexes with the RNG, so the same seed picks the
 * same items in both languages (language never changes random draws).
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});
  const lang = () => RT.i18n.lang;

  const SRC = {
    positional: {
      people: { noun: ['people', 'personas'], names: [['Grace', 'David', 'Erika', 'Ian', 'Hannah', 'Carlos', 'Fiona', 'Marcus', 'Alice', 'Bruno']] },
      contractors: { noun: ['contractors', 'contratistas'], names: [['Atlas', 'Borealis', 'Cobalt', 'Delta', 'Everest', 'Falcon', 'Granite', 'Helix', 'Ironclad', 'Juniper']] },
      departments: {
        noun: ['departments', 'departamentos'],
        names: [['Procurement', 'Legal', 'Finance', 'Engineering', 'Planning', 'Quality', 'Safety', 'Logistics', 'Commissioning'],
          ['Compras', 'Jurídico', 'Finanzas', 'Ingeniería', 'Planificación', 'Calidad', 'Seguridad', 'Logística', 'Puesta en marcha']],
      },
      meetings: {
        noun: ['meetings', 'reuniones'],
        names: [['Kick-off', 'Design Review', 'Budget Review', 'Risk Workshop', 'Progress Meeting', 'Safety Briefing', 'Client Update', 'Handover'],
          ['Arranque', 'Revisión de diseño', 'Revisión de presupuesto', 'Taller de riesgos', 'Reunión de avance', 'Charla de seguridad', 'Informe al cliente', 'Entrega']],
      },
      activities: {
        noun: ['activities', 'actividades'],
        names: [['Excavation', 'Piling', 'Formwork', 'Rebar Fixing', 'Concreting', 'Curing', 'Backfilling', 'Surveying'],
          ['Excavación', 'Pilotaje', 'Encofrado', 'Armado de acero', 'Hormigonado', 'Curado', 'Relleno', 'Topografía']],
      },
      deliverables: {
        noun: ['deliverables', 'entregables'],
        names: [['Drawings', 'Method Statement', 'Inspection Plan', 'Schedule', 'Budget', 'Risk Register', 'Test Report', 'Manual'],
          ['Planos', 'Procedimiento de ejecución', 'Plan de inspección', 'Cronograma', 'Presupuesto', 'Registro de riesgos', 'Informe de pruebas', 'Manual']],
      },
    },
    machines: [['Crane', 'Mixer', 'Pump', 'Drill Rig', 'Generator', 'Compressor', 'Welding Unit', 'Excavator', 'Hoist', 'Conveyor'],
      ['Grúa', 'Hormigonera', 'Bomba', 'Perforadora', 'Generador', 'Compresor', 'Equipo de soldadura', 'Excavadora', 'Polipasto', 'Cinta transportadora']],
    jobs: [['Concrete pour', 'Pipe testing', 'Steel erection', 'Calibration run', 'Grouting', 'Cable pulling', 'Pressure test', 'Hydrotest', 'Coating', 'Lifting operation'],
      ['Hormigonado', 'Prueba de tuberías', 'Montaje de estructura', 'Prueba de calibración', 'Inyección de lechada', 'Tendido de cables', 'Prueba de presión', 'Prueba hidrostática', 'Recubrimiento', 'Operación de izado']],
    maintenance: [['Lubrication', 'Inspection', 'Filter change', 'Safety check', 'Overhaul'], ['Lubricación', 'Inspección', 'Cambio de filtros', 'Revisión de seguridad', 'Revisión general']],
    people: [['Linda', 'Mike', 'Jasmine', 'Naomi', 'Ken', 'Oscar', 'Priya', 'Tom', 'Elena', 'Raj', 'Sofia', 'Victor', 'Grace', 'Hugo']],
  };
  const idx = () => (lang() === 'es' ? 1 : 0);
  const pick = (pair) => pair[Math.min(idx(), pair.length - 1)];

  const pools = {};
  const positional = {};
  for (const key of Object.keys(SRC.positional)) {
    const def = SRC.positional[key];
    Object.defineProperty(positional, key, { enumerable: true, get: () => ({ noun: pick(def.noun), names: pick(def.names) }) });
  }
  pools.positional = positional;
  for (const key of ['machines', 'jobs', 'maintenance', 'people']) Object.defineProperty(pools, key, { enumerable: true, get: () => pick(SRC[key]) });
  RT.pools = pools;
  RT.poolsSource = SRC;
})();
