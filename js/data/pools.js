/**
 * pools.js — shared name pools used by the logic modules (A, B, C).
 * Pure data: no logic here.
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});

  RT.pools = {
    positional: {
      people: { noun: 'people', names: ['Grace', 'David', 'Erika', 'Ian', 'Hannah', 'Carlos', 'Fiona', 'Marcus', 'Alice', 'Bruno'] },
      contractors: { noun: 'contractors', names: ['Atlas', 'Borealis', 'Cobalt', 'Delta', 'Everest', 'Falcon', 'Granite', 'Helix', 'Ironclad', 'Juniper'] },
      departments: { noun: 'departments', names: ['Procurement', 'Legal', 'Finance', 'Engineering', 'Planning', 'Quality', 'Safety', 'Logistics', 'Commissioning'] },
      meetings: { noun: 'meetings', names: ['Kick-off', 'Design Review', 'Budget Review', 'Risk Workshop', 'Progress Meeting', 'Safety Briefing', 'Client Update', 'Handover'] },
      activities: { noun: 'activities', names: ['Excavation', 'Piling', 'Formwork', 'Rebar Fixing', 'Concreting', 'Curing', 'Backfilling', 'Surveying'] },
      deliverables: { noun: 'deliverables', names: ['Drawings', 'Method Statement', 'Inspection Plan', 'Schedule', 'Budget', 'Risk Register', 'Test Report', 'Manual'] },
    },
    machines: ['Crane', 'Mixer', 'Pump', 'Drill Rig', 'Generator', 'Compressor', 'Welding Unit', 'Excavator', 'Hoist', 'Conveyor'],
    jobs: ['Concrete pour', 'Pipe testing', 'Steel erection', 'Calibration run', 'Grouting', 'Cable pulling', 'Pressure test', 'Hydrotest', 'Coating', 'Lifting operation'],
    maintenance: ['Lubrication', 'Inspection', 'Filter change', 'Safety check', 'Overhaul'],
    people: ['Linda', 'Mike', 'Jasmine', 'Naomi', 'Ken', 'Oscar', 'Priya', 'Tom', 'Elena', 'Raj', 'Sofia', 'Victor', 'Grace', 'Hugo'],
  };
})();
