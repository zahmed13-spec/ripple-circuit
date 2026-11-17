import { ready, replay3, surfaceY } from "../src/native/physics";
import { nativeLevels } from "../src/native/levels";
await ready;
for (const id of [6, 12]) {
  const l = structuredClone(nativeLevels[id - 1]);
  let best = 0;
  for (const tick of [90, 120, 180, 240, 300])
    for (let x = 1.8; x <= 5.1; x += 0.3)
      for (let z = -1.5; z <= 0.01; z += 0.3) {
        const p = [l.solution[0], { tick, x, y: 0, z, surface: "base" }];
        const s = replay3(l, p);
        const won = s.status === "won";
        s.dispose();
        if (!won) continue;
        let wins = 0;
        for (let i = 0; i < 2; i++)
          for (const [dx, dz] of [
            [0.04, 0],
            [-0.04, 0],
            [0, 0.04],
            [0, -0.04],
            [0.04, 0.04],
            [-0.04, -0.04],
          ]) {
            const q = structuredClone(p);
            q[i].x += dx;
            q[i].z += dz;
            q[i].y = surfaceY(
              l.blocks.find((b) => b.id === q[i].surface)!,
              q[i].x,
              q[i].z,
            );
            const t = replay3(l, q);
            if (t.status === "won") wins++;
            t.dispose();
          }
        if (wins > best) {
          best = wins;
          console.log(id, best, JSON.stringify(p));
        }
        if (best === 12) break;
      }
}
