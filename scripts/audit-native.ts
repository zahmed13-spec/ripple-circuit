import { writeFileSync } from "node:fs";
import { ready, replay3, summary, surfaceY } from "../src/native/physics";
import { nativeLevels } from "../src/native/levels";
await ready;
const result = [];
for (const l of nativeLevels) {
  const s = replay3(l, l.solution);
  const reference = summary(s);
  s.dispose();
  let wins = 0,
    total = 0;
  for (let i = 0; i < l.solution.length; i++)
    for (const [dx, dz] of [
      [0.04, 0],
      [-0.04, 0],
      [0, 0.04],
      [0, -0.04],
      [0.04, 0.04],
      [-0.04, -0.04],
    ]) {
      const p = structuredClone(l.solution);
      p[i].x += dx;
      p[i].z += dz;
      p[i].y = surfaceY(
        l.blocks.find((b) => b.id === p[i].surface)!,
        p[i].x,
        p[i].z,
      );
      const test = replay3(l, p);
      total++;
      if (test.status === "won") wins++;
      test.dispose();
    }
  let timing = 0,
    timingTotal = 0;
  for (const dt of [-6, 6]) {
    if (l.solution.length < 2) continue;
    const p = l.solution.map((p, i) => ({ ...p, tick: p.tick + (i ? dt : 0) }));
    const s = replay3(l, p);
    timingTotal++;
    if (s.status === "won") timing++;
    s.dispose();
  }
  result.push({
    id: l.id,
    title: l.title,
    reference,
    placement: { wins, total, offsetWorldUnits: 0.04 },
    timing: { wins: timing, total: timingTotal, offsetTicks: 6 },
  });
}
writeFileSync("native-audit.json", JSON.stringify(result, null, 2));
console.log(
  result.map((r) => ({
    id: r.id,
    tick: r.reference.tick,
    placement: r.placement,
    timing: r.timing,
  })),
);
