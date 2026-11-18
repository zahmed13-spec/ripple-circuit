import { ready, replay3, Simulation, surfaceY } from "../src/native/physics";
import { nativeLevels } from "../src/native/levels";
await ready;
for (const id of [6, 7, 10, 12]) {
  const l = structuredClone(nativeLevels[id - 1]);
  l.solution = l.solution.slice(0, 1);
  let found = false;
  for (const tick of [90, 120, 180, 240, 300, 360]) {
    const start = new Simulation(l);
    start.pulse(l.solution[0], l.solution[0].surface);
    for (let t = 0; t < tick; t++) start.step();
    const o = start.orbs.find((o) => o.state === "active")!;
    console.log("position", id, tick, o?.x, o?.z);
    start.dispose();
    if (!o) continue;
    for (let dx = -1.8; dx <= 1.81 && !found; dx += 0.15)
      for (let dz = -1.8; dz <= 1.81 && !found; dz += 0.15) {
        const input = { x: o.x + dx, y: 0, z: o.z + dz, surface: "base", tick };
        const inputs = [...l.solution, input];
        const s = replay3(l, inputs);
        if (s.status === "won") {
          console.log("SOLUTION", id, JSON.stringify(inputs), s.tick);
          found = true;
        }
        s.dispose();
      }
    if (found) break;
  }
}
