import { beforeAll, describe, it, expect } from "vitest";
import {
  ready,
  Simulation,
  replay3,
  validInputs,
  validate,
  summary,
  ENGINE,
  validPoint,
} from "../src/native/physics";
import { nativeLevels, resolve3, daily3 } from "../src/native/levels";
import {
  gameToWorld,
  worldToGame,
  screenToWorld,
  worldToScreen,
} from "../src/scene/coordinates";
import { OrthographicCamera, Vector3 } from "three";
beforeAll(() => ready);
for (const l of nativeLevels)
  it(`native ${l.id}: authored solution, repeatable outcome and restart`, () => {
    expect(validate(l)).toEqual([]);
    const a = replay3(l, l.solution),
      b = replay3(l, l.solution);
    expect(a.status).toBe("won");
    expect(summary(a)).toEqual(summary(b));
    const fresh = new Simulation(l);
    expect(fresh.tick).toBe(0);
    expect(fresh.activated).toEqual([]);
    expect(fresh.orbs).toEqual(l.orbs);
    a.dispose();
    b.dispose();
    fresh.dispose();
  });
it("gravity, actual vertical fall and fixed step pause", () => {
  const s = new Simulation(nativeLevels[2]);
  s.pulse(nativeLevels[2].solution[0], "upper");
  let min = 9,
    max = -9;
  for (let i = 0; i < 70; i++) {
    s.step();
    min = Math.min(min, s.orbs[0].y);
    max = Math.max(max, s.orbs[0].y);
  }
  expect(max - min).toBeGreaterThan(1.5);
  s.dispose();
  const p = new Simulation(nativeLevels[1]);
  p.pulse(nativeLevels[1].solution[0], "incline");
  p.paused = true;
  p.step();
  expect(p.tick).toBe(0);
  p.dispose();
});
it("switch contact disables real gate colliders", () => {
  const l = nativeLevels[6],
    s = replay3(l, l.solution);
  expect(s.activated).toContain("a");
  expect(s.gates.get("gate")!.isEnabled()).toBe(false);
  s.dispose();
});
it("spherical pulse ignores projected-near marble at another elevation", () => {
  const l = structuredClone(nativeLevels[0]);
  l.orbs[0].y = 5;
  const s = new Simulation(l);
  s.pulse({ x: -3, y: 0, z: 0 }, "base");
  expect(s.bodies[0].linvel()).toEqual({ x: 0, y: 0, z: 0 });
  s.dispose();
});
it("rejects unsupported, nonfinite, out-of-surface and oversized replays", () => {
  const l = nativeLevels[0];
  expect(resolve3("c3-13")).toBe(null);
  expect(resolve3("d3-2026-02-30")).toBe(null);
  expect(validInputs(l, [{ ...l.solution[0], x: NaN }])).toBe(false);
  expect(validInputs(l, [{ ...l.solution[0], tick: 7200 }])).toBe(false);
  expect(validInputs(l, Array(9).fill(l.solution[0]))).toBe(false);
  expect(validInputs(l, [{ ...l.solution[0], surface: "missing" }])).toBe(
    false,
  );
  expect(validPoint(l, { x: 0, y: 2, z: 0 }, "base")).toBe(false);
  expect(ENGINE).toContain("0.21.0");
});
it("daily version has 12-day repetition without changing historical namespaces", () => {
  expect(daily3(new Date("2026-11-17")).level.id).toBe(
    daily3(new Date("2026-11-29")).level.id,
  );
  expect(
    new Set(
      Array.from(
        { length: 12 },
        (_, i) => daily3(new Date(Date.UTC(2026, 10, 1 + i))).level.id,
      ),
    ).size,
  ).toBe(12);
});
it("world coordinates and ray projection roundtrip for all camera views", () => {
  const r = { left: 15, top: 31, width: 390, height: 390 } as DOMRect;
  for (const eye of [
    [11, 17, 13],
    [0, 20, 12],
    [0, 22, 0.001],
  ]) {
    const c = new OrthographicCamera(-9.3, 9.3, 9.3, -9.3, 0.1, 100);
    c.position.set(...(eye as [number, number, number]));
    c.lookAt(0, 0, 0);
    c.updateMatrixWorld();
    for (const [x, y] of [
      [0, 0],
      [720, 720],
      [165, 360],
      [360, 360],
    ]) {
      const p = gameToWorld(x, y);
      expect(worldToGame(p)).toEqual({ x, y });
      const screen = worldToScreen(p, c, r.width, r.height),
        back = screenToWorld(screen.x + r.left, screen.y + r.top, r, c)!;
      expect(back.distanceTo(p)).toBeLessThan(1e-10);
      expect(screen.x).toBeGreaterThan(0);
      expect(screen.x).toBeLessThan(390);
    }
  }
});
it("momentum transfers to a marble outside the initial spherical pulse", () => {
  const l = nativeLevels[9],
    s = new Simulation(l);
  s.pulse(l.solution[0], l.solution[0].surface);
  expect(s.bodies[1].linvel().x).toBe(0);
  let transferred = false;
  for (let i = 0; i < 90; i++) {
    s.step();
    if (s.bodies[1].linvel().x > 1) transferred = true;
  }
  expect(transferred).toBe(true);
  s.dispose();
});
it("gravity accelerates a marble down an inclined physical collider", () => {
  const l = nativeLevels[1],
    s = new Simulation(l);
  s.pulse({ x: 5, y: 0, z: 3 }, "base");
  for (let i = 0; i < 80; i++) s.step();
  expect(s.orbs[0].x).toBeGreaterThan(-2);
  expect(s.orbs[0].y).toBeLessThan(l.orbs[0].y);
  s.dispose();
});
it("native save migration preserves historical records alongside spatial progress", async () => {
  const { load, persist, record } = await import("../src/services/storage");
  const previous = globalThis.matchMedia;
  globalThis.matchMedia = (() => ({ matches: false })) as unknown as typeof matchMedia;
  let data = JSON.stringify({
    version: 1,
    unlocked: 7,
    unlocked2: 5,
    wins: 2,
    best: {
      "c1-1": { pulses: 1, ticks: 68, stars: 3 },
      "c2-1": { pulses: 1, ticks: 68, stars: 3 },
    },
    settings: { precision: true },
  });
  const storage = {
    getItem: () => data,
    setItem: (_k: string, v: string) => {
      data = v;
    },
  };
  const save = load(storage);
  record(save, "c3-1", { pulses: 1, ticks: 71, stars: 3 }, 1);
  persist(save, storage);
  const restored = load(storage);
  expect(restored.unlocked3).toBe(2);
  expect(restored.unlocked).toBe(7);
  expect(restored.unlocked2).toBe(5);
  expect(Object.keys(restored.best)).toEqual(["c1-1", "c2-1", "c3-1"]);
  globalThis.matchMedia = previous;
});
it("falling out of an arena fails through gravity, not a scripted outcome", () => {
  const l = nativeLevels[4],
    s = new Simulation(l);
  s.pulse({ x: -3.8, y: 1, z: -1 }, "departure");
  for (let i = 0; i < 500 && s.status === "playing"; i++) s.step();
  expect(s.status).toBe("lost");
  expect(s.orbs[0].y).toBeLessThan(-4);
  s.dispose();
});
it('invalid authored configurations are rejected before allocating a world',()=>{const l=structuredClone(nativeLevels[0]);l.blocks[0].w=-1;expect(validate(l)).toContain('block bounds');expect(()=>new Simulation(l)).toThrow('block bounds');const missing=structuredClone(nativeLevels[6]);missing.switches=[];expect(validate(missing)).toContain('gate');});
