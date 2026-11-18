import R from "@dimforge/rapier3d-compat";
import type { Block, SceneData, SceneOrb } from "../scene/arena";
export const ready = R.init();
export const ENGINE = "rapier-0.21.0-rc3.1";
export type Vec = { x: number; y: number; z: number };
export type Input = Vec & { tick: number; surface: string };
export const STORY_ENGINE = "rapier-0.21.0-rc4.1";
export type Current = { id: string; x: number; y: number; z: number; w: number; d: number; force: Vec; switchId?: string };
export type NativeLevel = {
  id: number;
  version: 3 | 4;
  title: string;
  chapter: string;
  hint: string;
  skill: string;
  blocks: Block[];
  orbs: SceneOrb[];
  goals: SceneData["goals"];
  switches: SceneData["switches"];
  pulseLimit: number;
  solution: Input[];
  currents?: Current[];
  requiredSwitches?: string[];
};
export const LIMIT = 7200,
  RADIUS = 3;
export function validate(l: NativeLevel) {
  const errors: string[] = [];
  const finite = (...n: number[]) => n.every(Number.isFinite);
  if (![3, 4].includes(l.version) || !Number.isInteger(l.id) || l.id < 1)
    errors.push("version");
  if (l.pulseLimit < 1 || l.pulseLimit > 8 || !Number.isInteger(l.pulseLimit))
    errors.push("limit");
  if (
    !l.orbs.length ||
    l.orbs.length > 6 ||
    new Set(l.orbs.map((o) => o.id)).size !== l.orbs.length
  )
    errors.push("orbs");
  if (
    l.blocks.length > 60 ||
    new Set(l.blocks.map((b) => b.id)).size !== l.blocks.length
  )
    errors.push("blocks");
  for (const b of l.blocks) {
    if (
      !finite(b.x, b.y, b.z, b.w, b.h, b.d) ||
      Math.max(Math.abs(b.x), Math.abs(b.z)) > 8 ||
      Math.min(b.w, b.h, b.d) <= 0
    )
      errors.push("block bounds");
    if (b.rotation && !finite(...Object.values(b.rotation)))
      errors.push("rotation");
    if (b.kind === "gate" && !l.switches.some((s) => s.id === b.switchId))
      errors.push("gate");
  }
  for (const o of l.orbs) {
    if (!finite(o.x, o.y, o.z, o.radius) || o.radius <= 0 || o.radius > 1)
      errors.push("orb");
    if (l.goals.filter((g) => g.id === o.id).length !== 1) errors.push("goal");
  }
  for (const g of [...l.goals, ...l.switches])
    if (!finite(g.x, g.y, g.z, g.radius) || g.radius <= 0)
      errors.push("sensor");
  if (l.version === 3 && (l.currents || l.requiredSwitches)) errors.push("story mechanics");
  if ((l.currents?.length ?? 0) > 12 ||
      new Set(l.currents?.map(c => c.id)).size !== (l.currents?.length ?? 0))
    errors.push("currents");
  for (const c of l.currents ?? []) {
    if (!finite(c.x,c.y,c.z,c.w,c.d,...Object.values(c.force)) ||
        c.w <= 0 || c.d <= 0 || Math.hypot(c.force.x,c.force.y,c.force.z) > 18 ||
        c.switchId && !l.switches.some(s => s.id === c.switchId)) errors.push("current bounds");
  }
  if (l.requiredSwitches?.some(id => !l.switches.some(s => s.id === id))) errors.push("required switch");
  return errors;
}
export const currentActive = (c: Current, activated: readonly string[]) =>
  !c.switchId || activated.includes(c.switchId);
export const inCurrent = (c: Current, p: Vec, radius: number) =>
  Math.abs(p.x - c.x) <= c.w / 2 && Math.abs(p.z - c.z) <= c.d / 2 &&
  Math.abs(p.y - radius - c.y) <= 0.45;

/** Independent, fixed 60 Hz simulation. No wall clock, renderer or random source. */
export class Simulation {
  world: R.World;
  queue = new R.EventQueue(true);
  bodies: R.RigidBody[] = [];
  gates = new Map<string, R.Collider>();
  sensors = new Map<string, R.Collider>();
  orbs: SceneOrb[];
  tick = 0;
  used = 0;
  started = false;
  paused = false;
  status: "playing" | "won" | "lost" = "playing";
  reason = "";
  inputs: Input[] = [];
  activated: string[] = [];
  opened: string[] = [];
  rest = 0;
  events: string[] = [];
  disposed = false;
  constructor(public level: NativeLevel) {
    const errors = validate(level);
    if (errors.length) throw Error(errors.join(", "));
    this.world = new R.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = 1 / 120;
    this.orbs = structuredClone(level.orbs);
    for (const b of level.blocks) {
      let c = R.ColliderDesc.cuboid(b.w / 2, b.h / 2, b.d / 2)
        .setTranslation(b.x, b.y, b.z)
        .setFriction(0.4)
        .setRestitution(0.25);
      if (b.rotation) c = c.setRotation(b.rotation);
      const collider = this.world.createCollider(c);
      if (b.kind === "gate") this.gates.set(b.id, collider);
    }
    for (const s of level.switches) {
      this.sensors.set(
        s.id,
        this.world.createCollider(
          R.ColliderDesc.cylinder(0.12, s.radius)
            .setTranslation(s.x, s.y + 0.12, s.z)
            .setSensor(true),
        ),
      );
    }
    for (const o of this.orbs) {
      const body = this.world.createRigidBody(
        R.RigidBodyDesc.dynamic()
          .setTranslation(o.x, o.y, o.z)
          .setLinearDamping(0.45)
          .setAngularDamping(0.6)
          .setCcdEnabled(true),
      );
      this.world.createCollider(
        R.ColliderDesc.ball(o.radius)
          .setMass(1)
          .setFriction(0.4)
          .setRestitution(0.35)
          .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS),
        body,
      );
      this.bodies.push(body);
    }
  }
  pulse(p: Vec, surface: string) {
    if (
      this.paused ||
      this.status !== "playing" ||
      this.used >= this.level.pulseLimit ||
      !validPoint(this.level, p, surface)
    )
      return false;
    const v = {
      x: Math.round(p.x * 1000) / 1000,
      y: Math.round(p.y * 1000) / 1000,
      z: Math.round(p.z * 1000) / 1000,
    };
    this.inputs.push({ ...v, tick: this.tick, surface });
    this.used++;
    this.started = true;
    this.rest = 0;
    this.bodies.forEach((b, i) => {
      if (this.orbs[i].state !== "active") return;
      const pos = b.translation(),
        dx = pos.x - v.x,
        dy = pos.y - v.y,
        dz = pos.z - v.z,
        d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d >= RADIUS) return;
      const f = (14 * (1 - d / RADIUS) ** 2) / (d || 1);
      b.applyImpulse({ x: d ? dx * f : 14, y: dy * f, z: dz * f }, true);
    });
    this.events.push("pulse");
    return true;
  }
  step() {
    this.events = [];
    if (
      this.disposed ||
      this.paused ||
      !this.started ||
      this.status !== "playing"
    )
      return;
    this.events = [];
    this.tick++;
    for (let k = 0; k < 2; k++) {
      if (this.level.version === 4) {
        for (const current of this.level.currents ?? []) {
          if (!currentActive(current, this.activated)) continue;
          this.bodies.forEach((body, i) => {
            const orb = this.orbs[i];
            if (orb.state === "active" && inCurrent(current, body.translation(), orb.radius)) {
              body.applyImpulse({
                x: current.force.x * this.world.timestep,
                y: current.force.y * this.world.timestep,
                z: current.force.z * this.world.timestep,
              }, true);
            }
          });
        }
      }
      this.world.step(this.queue);
      this.queue.drainCollisionEvents((_a, _b, started) => {
        if (started && !this.events.includes("hit")) this.events.push("hit");
      });
      for (const [id, sensor] of this.sensors) {
        if (this.activated.includes(id)) continue;
        if (
          this.bodies.some(
            (b, i) =>
              this.orbs[i].state === "active" &&
              this.world.intersectionPair(sensor, b.collider(0)),
          )
        ) {
          this.activated.push(id);
          this.events.push("switch");
          for (const block of this.level.blocks.filter(
            (b) => b.switchId === id,
          )) {
            const gate = this.gates.get(block.id);
            if (gate) {
              gate.setEnabled(false);
              this.opened.push(block.id);
            }
          }
        }
      }
      this.bodies.forEach((body, i) => {
        const o = this.orbs[i];
        if (o.state !== "active") return;
        const p = body.translation();
        Object.assign(o, p, { rotation: body.rotation() });
        if (p.y < -4 || Math.abs(p.x) > 12 || Math.abs(p.z) > 12) {
          o.state = "destroyed";
          this.status = "lost";
          this.reason = "A marble fell into the water. Try a gentler angle.";
          return;
        }
        const g = this.level.goals.find((g) => g.id === o.id)!;
        if (
          Math.hypot(p.x - g.x, p.z - g.z) < g.radius &&
          Math.abs(p.y - (g.y + o.radius)) < 0.35
        ) {
          o.state = "docked";
          Object.assign(o, { x: g.x, y: g.y + o.radius, z: g.z });
          body.setBodyType(R.RigidBodyType.Fixed, true);
          body.setTranslation(o, true);
          body.collider(0).setEnabled(false);
          this.events.push("dock");
        }
      });
    }
    if (this.orbs.every((o) => o.state === "docked") &&
        (this.level.requiredSwitches ?? []).every(id => this.activated.includes(id))) {
      this.status = "won";
      this.reason = "Every marble is home.";
    } else if (this.status === "playing") {
      this.rest = this.bodies.every(
        (b, i) =>
          this.orbs[i].state !== "active" ||
          Math.hypot(...Object.values(b.linvel())) < 0.035,
      )
        ? this.rest + 1
        : 0;
      if (
        this.tick >= LIMIT ||
        (this.used === this.level.pulseLimit && this.rest > 120)
      ) {
        this.status = "lost";
        this.reason =
          "The circuit has settled. Retry or watch the reference solution.";
      }
    }
  }
  dispose() {
    if (!this.disposed) {
      this.disposed = true;
      this.world.free();
      this.queue.free();
    }
  }
}
/** Surface height uses the same authored cuboid quaternion as its collider. */
export function surfaceY(b: Block, x: number, z: number) {
  const q = b.rotation || { x: 0, y: 0, z: 0, w: 1 };
  const nx = 2 * (q.x * q.y - q.w * q.z),
    ny = 1 - 2 * (q.x * q.x + q.z * q.z),
    nz = 2 * (q.y * q.z + q.w * q.x);
  return b.y + (b.h / 2 - nx * (x - b.x) - nz * (z - b.z)) / ny;
}
export function validPoint(l: NativeLevel, p: Vec, id: string) {
  if (![p.x, p.y, p.z].every(Number.isFinite)) return false;
  const b = l.blocks.find(
    (b) => b.id === id && b.kind !== "gate" && b.kind !== "wall",
  );
  if (!b) return false;
  const q = b.rotation || { x: 0, y: 0, z: 0, w: 1 };
  const dx = p.x - b.x,
    dy = p.y - b.y,
    dz = p.z - b.z;
  // Inverse quaternion rotates the selected point into the collider's local space.
  const ix = q.w * dx - q.y * dz + q.z * dy,
    iy = q.w * dy - q.z * dx + q.x * dz,
    iz = q.w * dz - q.x * dy + q.y * dx,
    iw = q.x * dx + q.y * dy + q.z * dz;
  const x = ix * q.w + iw * q.x + iy * q.z - iz * q.y,
    y = iy * q.w + iw * q.y + iz * q.x - ix * q.z,
    z = iz * q.w + iw * q.z + ix * q.y - iy * q.x;
  return (
    Math.abs(x) <= b.w / 2 + 0.003 &&
    Math.abs(z) <= b.d / 2 + 0.003 &&
    Math.abs(y - b.h / 2) < 0.01
  );
}
export function validInputs(l: NativeLevel, p: unknown): p is Input[] {
  return (
    Array.isArray(p) &&
    p.length > 0 &&
    p.length <= l.pulseLimit &&
    p.every(
      (v, i) =>
        v &&
        Number.isInteger(v.tick) &&
        v.tick >= 0 &&
        v.tick < LIMIT &&
        (i ? v.tick >= p[i - 1].tick : v.tick === 0) &&
        validPoint(l, v, v.surface),
    )
  );
}
export function replay3(l: NativeLevel, inputs: Input[]) {
  const s = new Simulation(l);
  if (!validInputs(l, inputs)) return s;
  let at = 0;
  for (let i = 0; i < LIMIT && s.status === "playing"; i++) {
    while (inputs[at]?.tick === s.tick) {
      const p = inputs[at++];
      if (!s.pulse(p, p.surface)) return s;
    }
    s.step();
    if (!s.started) break;
  }
  return s;
}
export function summary(s: Simulation) {
  return {
    status: s.status,
    tick: s.tick,
    used: s.used,
    orbs: s.orbs,
    activated: s.activated,
    opened: s.opened,
  };
}
