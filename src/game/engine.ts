import * as legacy from './engine-v1';
/** Pure, versioned 60 Hz simulation. Rendering and wall-clock time never enter here. */
export const PHYSICS = { version: 2, size: 720, radius: 16, pulseRadius: 180, impulse: 850, maxSpeed: 900, drag: 1.25, dt: 1 / 60, substeps: 8 } as const;
export type Point = { x: number; y: number };
export type Orb = Point & { id: number; vx: number; vy: number; radius: number; mass: number; color: string; state: 'active' | 'docked' | 'destroyed'; collision: number };
export type Goal = Point & { orbId: number; radius: number };
export type Rect = Point & { w: number; h: number };
export type Circle = Point & { radius: number };
export type Pulse = Point & { tick: number };
export type Switch = Circle & { id: string };
export type Gate = Rect & { id: string; switchId: string };
export type Level = { id: number; version: number; title: string; difficulty: string; hint?: string; orbs: Orb[]; goals: Goal[]; obstacles: Rect[]; bumpers: Circle[]; hazards: Circle[]; pulseLimit: number; timeLimit: number; parPulses: number; solution: Pulse[]; switches?: Switch[]; gates?: Gate[]; skill?: string; decision?: string };
export type State = { activated: string[]; opened: string[];  orbs: Orb[]; tick: number; used: number; status: 'playing' | 'won' | 'lost'; reason: string; inputs: Pulse[]; started: boolean; paused: boolean; rest: number; impacts: { x: number; y: number; color: string; kind: string }[] };
export function createState(l: Level): State { return { activated: [], opened: [], orbs: structuredClone(l.orbs), tick: 0, used: 0, status: 'playing', reason: '', inputs: [], started: false, paused: false, rest: 0, impacts: [] }; }
export function pulse(l: Level, s: State, x: number, y: number): boolean {
  if(l.version===1)return legacy.pulse(l,s,x,y);
  if (s.paused || s.status !== 'playing' || s.used >= l.pulseLimit || !Number.isFinite(x + y) || x < 0 || y < 0 || x > 720 || y > 720) return false;
  x = Math.round(x * 4) / 4; y = Math.round(y * 4) / 4;
  s.inputs.push({ tick: s.tick, x, y }); s.used++; s.started = true; s.rest = 0;
  for (const o of s.orbs) if (o.state === 'active') {
    const dx = o.x - x, dy = o.y - y, d = Math.hypot(dx, dy);
    if (d < PHYSICS.pulseRadius) { const f = PHYSICS.impulse * (1 - d / PHYSICS.pulseRadius) ** 2 / o.mass; o.vx += (d ? dx / d : 1) * f; o.vy += (d ? dy / d : 0) * f; cap(o); }
  }
  return true;
}
function cap(o: Orb) { const v = Math.hypot(o.vx, o.vy); if (v > PHYSICS.maxSpeed) { o.vx *= PHYSICS.maxSpeed / v; o.vy *= PHYSICS.maxSpeed / v; } }
function hit(s: State, o: Orb, nx: number, ny: number, restitution = .78) {
  const v = o.vx * nx + o.vy * ny;
  if (v < 0) { o.vx -= (1 + restitution) * v * nx; o.vy -= (1 + restitution) * v * ny; if (Math.abs(v) > 30 && o.collision === 0) s.impacts.push({ x: o.x, y: o.y, color: o.color, kind: 'hit' }); o.collision = 6; }
}
function rectangle(s: State, o: Orb, r: Rect) {
  const qx = Math.max(r.x, Math.min(r.x + r.w, o.x)), qy = Math.max(r.y, Math.min(r.y + r.h, o.y));
  const dx = o.x - qx, dy = o.y - qy, d = Math.hypot(dx, dy);
  if (d >= o.radius) return;
  if (d > 0) { const nx = dx / d, ny = dy / d; o.x += nx * (o.radius - d); o.y += ny * (o.radius - d); hit(s, o, nx, ny); }
  else { // Deterministic minimum translation even for a center inside the rectangle.
    const sides = [{ d: o.x - r.x, nx: -1, ny: 0 }, { d: r.x + r.w - o.x, nx: 1, ny: 0 }, { d: o.y - r.y, nx: 0, ny: -1 }, { d: r.y + r.h - o.y, nx: 0, ny: 1 }].sort((a, b) => a.d - b.d);
    const n = sides[0]; o.x += n.nx * (n.d + o.radius); o.y += n.ny * (n.d + o.radius); hit(s, o, n.nx, n.ny);
  }
}
export function step(l: Level, s: State) {
  if(l.version===1){legacy.step(l,s);return;}
  if (s.paused || s.status !== 'playing' || !s.started) return;
  s.impacts = []; s.tick++;
  for (const o of s.orbs) o.collision = Math.max(0, o.collision - 1);
  const dt = PHYSICS.dt / PHYSICS.substeps;
  for (let k = 0; k < PHYSICS.substeps; k++) {
    for (const o of s.orbs) {
      if (o.state !== 'active') continue;
      cap(o); o.vx *= Math.exp(-PHYSICS.drag * dt); o.vy *= Math.exp(-PHYSICS.drag * dt); o.x += o.vx * dt; o.y += o.vy * dt;
      for(const sw of l.switches||[]) if(!s.activated.includes(sw.id)&&Math.hypot(o.x-sw.x,o.y-sw.y)<=o.radius+sw.radius){
        s.activated.push(sw.id); for(const gate of l.gates||[])if(gate.switchId===sw.id)s.opened.push(gate.id);
        s.impacts.push({x:sw.x,y:sw.y,color:'#168757',kind:'switch'});
      }
      for (const r of [...l.obstacles,...(l.gates||[]).filter(g=>!s.opened.includes(g.id))]) rectangle(s, o, r);
      for (const b of l.bumpers) { const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy), reach = o.radius + b.radius; if (d < reach) { const nx = d ? dx / d : 1, ny = d ? dy / d : 0; o.x = b.x + nx * reach; o.y = b.y + ny * reach; hit(s, o, nx, ny, 1.08); cap(o); } }
      if (o.x < o.radius) { o.x = o.radius; hit(s, o, 1, 0); } if (o.x > 720 - o.radius) { o.x = 720 - o.radius; hit(s, o, -1, 0); }
      if (o.y < o.radius) { o.y = o.radius; hit(s, o, 0, 1); } if (o.y > 720 - o.radius) { o.y = 720 - o.radius; hit(s, o, 0, -1); }
      for (const h of l.hazards) if (Math.hypot(o.x - h.x, o.y - h.y) < o.radius + h.radius) { o.state = 'destroyed'; s.status = 'lost'; s.reason = 'An orb touched a hazard.'; }
      const g = l.goals.find(g => g.orbId === o.id);
      if (g && Math.hypot(o.x - g.x, o.y - g.y) < g.radius) { o.state = 'docked'; o.x = g.x; o.y = g.y; o.vx = o.vy = 0; s.impacts.push({ x: o.x, y: o.y, color: o.color, kind: 'dock' }); }
    }
    for (let i = 0; i < s.orbs.length; i++) for (let j = i + 1; j < s.orbs.length; j++) {
      const a = s.orbs[i], b = s.orbs[j]; if (a.state !== 'active' || b.state !== 'active') continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), reach = a.radius + b.radius;
      if (d < reach) { const nx = d ? dx / d : 1, ny = d ? dy / d : 0, overlap = reach - d, inv = 1 / a.mass + 1 / b.mass;
        a.x -= nx * overlap / a.mass / inv; a.y -= ny * overlap / a.mass / inv; b.x += nx * overlap / b.mass / inv; b.y += ny * overlap / b.mass / inv;
        const v = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (v < 0) { if(v < -30 && !a.collision && !b.collision)s.impacts.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2,color:a.color,kind:'hit'}); const f = -1.85 * v / inv; a.vx -= f * nx / a.mass; a.vy -= f * ny / a.mass; b.vx += f * nx / b.mass; b.vy += f * ny / b.mass; a.collision = b.collision = 6; }
      }
    }
  }
  for (const o of s.orbs) if (Math.hypot(o.vx, o.vy) < 2) o.vx = o.vy = 0;
  if (s.orbs.every(o => o.state === 'docked')) { s.status = 'won'; s.reason = 'Every orb is home.'; }
  else if (s.status === 'playing') {
    s.rest = s.orbs.every(o => o.state !== 'active' || (o.vx === 0 && o.vy === 0)) ? s.rest + 1 : 0;
    if (l.timeLimit > 0 && s.tick >= l.timeLimit * 60) { s.status = 'lost'; s.reason = 'Time is up. Try a different angle.'; }
    else if (s.used >= l.pulseLimit && s.rest >= 30) { s.status = 'lost'; s.reason = 'No pulses left and the orbs have settled.'; }
  }
}
export function replay(l: Level, inputs: Pulse[], maxTicks = l.timeLimit ? l.timeLimit * 60 : Math.min(216000, (inputs.at(-1)?.tick || 0) + 2700)): State {
  const s = createState(l); let at = 0;
  for (let t = 0; t < maxTicks && s.status === 'playing'; t++) {
    while (at < inputs.length && inputs[at].tick === s.tick) { const p = inputs[at++]; if (!pulse(l, s, p.x, p.y)) return s; }
    step(l, s); if (!s.started) break;
  }
  return s;
}
export function validReplay(l: Level, inputs: unknown): inputs is Pulse[] {
  return Array.isArray(inputs) && inputs.length > 0 && inputs.length <= l.pulseLimit && inputs.every((p, i) => p && Number.isInteger(p.tick) && p.tick >= 0 && p.tick < (l.timeLimit ? l.timeLimit * 60 : 213300) && (i === 0 ? p.tick === 0 : p.tick >= inputs[i - 1].tick) && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 720 && p.y >= 0 && p.y <= 720);
}

/** Reject malformed authored configurations before publishing. Legacy catalog is frozen. */
export function validateLevel(l: Level): string[] {
 const errors:string[]=[]; const finite=(...v:number[])=>v.every(Number.isFinite);
 if(![1,2].includes(l.version)||!Number.isInteger(l.id)||l.id<1)errors.push('version/id');
 if(!Number.isInteger(l.pulseLimit)||l.pulseLimit<1||l.pulseLimit>8||l.timeLimit<0||!Number.isFinite(l.timeLimit))errors.push('limits');
 const ids=l.orbs.map(o=>o.id);
 if(!ids.length||ids.length>8||new Set(ids).size!==ids.length)errors.push('orb ids');
 for(const o of l.orbs)if(!finite(o.x,o.y,o.vx,o.vy,o.radius,o.mass)||o.mass<=0||o.radius<=0||o.x<o.radius||o.x>720-o.radius||o.y<o.radius||o.y>720-o.radius)errors.push('orb bounds');
 for(const o of l.orbs)if(l.goals.filter(g=>g.orbId===o.id).length!==1)errors.push('goal association');
 for(const g of l.goals)if(!ids.includes(g.orbId)||!finite(g.x,g.y,g.radius)||g.radius<=0||g.x<g.radius||g.x>720-g.radius||g.y<g.radius||g.y>720-g.radius)errors.push('goal bounds');
 const switches=l.switches||[], gates=l.gates||[];
 if(new Set(switches.map(s=>s.id)).size!==switches.length||new Set(gates.map(g=>g.id)).size!==gates.length)errors.push('mechanism ids');
 for(const g of gates)if(!switches.some(s=>s.id===g.switchId))errors.push('missing switch');
 for(const r of [...l.obstacles,...gates])if(!finite(r.x,r.y,r.w,r.h)||r.w<=0||r.h<=0||r.x<0||r.y<0||r.x+r.w>720||r.y+r.h>720)errors.push('wall bounds');
 for(const c of [...l.bumpers,...l.hazards,...switches])if(!finite(c.x,c.y,c.radius)||c.radius<=0||c.x<c.radius||c.y<c.radius||c.x+c.radius>720||c.y+c.radius>720)errors.push('circle bounds');
 return errors;
}
