export type LiftCycle = {period:number; hold:number; distance:number; offset:number};

/** Match the authored departure schedule on both physics substeps and rendering. */
export function liftOffset(cycle:LiftCycle, tick:number) {
  const phase=(tick+cycle.offset)%cycle.period;
  if(phase<=cycle.hold)return 0;
  const t=(phase-cycle.hold)/(cycle.period-cycle.hold);
  return -cycle.distance*Math.sin(Math.PI*t)**2;
}
