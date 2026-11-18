import type { NativeLevel, Input } from "./physics";
import { surfaceY } from "./physics";
import type { Block } from "../scene/arena";
const platform = (
  id: string,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
): Block => ({ id, x, y: y - 0.2, z, w, h: 0.4, d });
const wall = (
  id: string,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
): Block => ({ id, x, y: y + 0.4, z, w, h: 0.8, d, kind: "wall" });
const ramp = (
  id: string,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
): Block => ({
  ...platform(id, x, y, z, w, d),
  rotation: { x: 0, y: 0, z: -0.1601822430069672, w: 0.9870874576374967 },
});
const orb = (id: number, x: number, y: number, z: number) => ({
  id,
  x,
  y: y + 0.28,
  z,
  radius: 0.28,
  color: ["#32bcd4", "#f4b94a", "#a48ddb"][id],
  state: "active",
});
const goal = (id: number, x: number, y: number, z: number, radius = 0.65) => ({
  id,
  x,
  y,
  z,
  radius,
  color: ["#159ab9", "#c58c24", "#795eb6"][id],
});
const input = (
  x: number,
  y: number,
  z: number,
  surface: string,
  tick = 0,
): Input => ({ x, y, z, surface, tick });
const base = () => [platform("base", 0, 0, 0, 11, 9)];
const level = (
  id: number,
  title: string,
  skill: string,
  blocks: Block[],
  orbs: NativeLevel["orbs"],
  goals: NativeLevel["goals"],
  solution: Input[],
  switches: NativeLevel["switches"] = [],
): NativeLevel => ({
  id,
  version: 3,
  title,
  chapter:
    id <= 3
      ? "Discovering Depth"
      : id <= 6
        ? "Momentum & Elevation"
        : id <= 9
          ? "Mechanisms"
          : "Chain Reactions",
  hint: skill,
  skill,
  blocks,
  orbs,
  goals,
  switches,
  pulseLimit: Math.max(3, solution.length + 1),
  solution,
});
const incline = ramp("incline", -1, 1, 0, 6, 3);
const iy = (x: number) => surfaceY(incline, x, 0);
export const nativeLevels: NativeLevel[] = [
  level(
    1,
    "First Dimension",
    "Tap behind marble 1. The ring marks its home. Try the camera views.",
    base(),
    [orb(0, -3, 0, 0)],
    [goal(0, 2, 0, 0)],
    [input(-4, 0, 0, "base")],
  ),
  level(
    2,
    "The Incline",
    "A gentle pulse starts the descent. Gravity carries the marble down the ramp.",
    [...base(), incline],
    [orb(0, -3, iy(-3), 0)],
    [goal(0, 3, 0, 0)],
    [input(-3.7, iy(-3.7), 0, "incline")],
  ),
  level(
    3,
    "Over the Edge",
    "Send the marble from the high shelf onto the receiving island below.",
    [...base(), platform("upper", -3, 2, 0, 4, 3)],
    [orb(0, -3, 2, 0)],
    [goal(0, 2, 0, 0, 0.8)],
    [input(-4, 2, 0, "upper")],
  ),
  level(
    4,
    "The High Road",
    "Choose the wide elevated route or the narrow lower path. Both lead home.",
    [
      ...base(),
      platform("upper", -3, 1.5, 0, 3, 4),
      platform("high-road", 0, 1.5, -1, 4, 1.4),
      platform("arrival", 3, 1.5, 0, 3, 4),
      platform("lower-road", 0, 0.5, 1.3, 4, 1.2),
    ],
    [orb(0, -3, 1.5, -1)],
    [goal(0, 3, 1.5, -1)],
    [input(-4, 1.5, -1, "upper")],
  ),
  level(
    5,
    "Bridge Between",
    "Keep the force along the bridge. Falling off loses the marble.",
    [
      platform("departure", -3.8, 1, 0, 3, 4),
      platform("bridge", 0, 1, 0, 5, 1.5),
      platform("arrival", 3.8, 1, 0, 3, 4),
    ],
    [orb(0, -3.8, 1, 0)],
    [goal(0, 3.8, 1, 0)],
    [input(-4.7, 1, 0, "departure")],
  ),
  level(
    6,
    "Gravity’s Turn",
    "Roll down the ramp, then redirect toward the side dock.",
    [...base(), incline, wall("stop", 4.8, 0, 0, 0.3, 5)],
    [orb(0, -3, iy(-3), 0)],
    [goal(0, 3, 0, 2.7)],
    [input(-3.7, iy(-3.7), 0, "incline"), input(4.2, 0, -1.5, "base", 90)],
  ),
  level(
    7,
    "Pressure Below",
    "The falling marble touches the lower plate and opens its gate.",
    [
      ...base(),
      platform("upper", -3, 2, 0, 4, 3),
      { ...wall("gate", 2, 0, 0, 0.3, 5), kind: "gate", switchId: "a" },
    ],
    [orb(0, -3, 2, 0)],
    [goal(0, 3.5, 0, 0)],
    [input(-4, 2, 0, "upper"), input(-0.525, 0, -0.45, "base", 120)],
    [{ id: "a", x: 0, y: 0, z: 0, radius: 1 }],
  ),
  level(
    8,
    "Open the Sky",
    "Touch the plate on the ramp to open the elevated crossing.",
    [
      ...base(),
      incline,
      { ...wall("gate", 1.4, 0.2, 0, 0.3, 3), kind: "gate", switchId: "a" },
    ],
    [orb(0, -3, iy(-3), 0)],
    [goal(0, 3.8, 0, 0)],
    [input(-3.7, iy(-3.7), 0, "incline")],
    [{ id: "a", x: -1, y: iy(-1), z: 0, radius: 0.8 }],
  ),
  level(
    9,
    "The Stepping Path",
    "Three fixed shelves replace a moving lift. Carry momentum across both drops.",
    [
      ...base(),
      platform("upper", -3.5, 2.4, 0, 3, 3),
      platform("middle", -0.5, 1.2, 0, 3, 3),
    ],
    [orb(0, -3.5, 2.4, 0)],
    [goal(0, 3.5, 0, 0, 0.8)],
    [input(-4.5, 2.4, 0, "upper")],
  ),
  level(
    10,
    "Falling Domino",
    "The first marble falls into the second. Their collision transfers momentum.",
    [
      ...base(),
      platform("upper", -3.5, 1.2, 0, 3, 3),
      { ...wall("gate", 2, 0, 0, 0.3, 5), kind: "gate", switchId: "a" },
    ],
    [orb(0, -3.5, 1.2, 0), orb(1, -0.5, 0, 0)],
    [goal(0, 0, 0, 0, 0.6), goal(1, 3.5, 0, 0, 0.7)],
    [input(-4.5, 1.2, 0, "upper"), input(-1.405, 0, -0.6, "base", 90)],
    [{ id: "a", x: 1, y: 0, z: 0, radius: 0.65 }],
  ),
  level(
    11,
    "Three Levels Deep",
    "Each height has a different reach. Guide both marbles down to their numbered docks.",
    [
      ...base(),
      platform("upper", -3.5, 2.4, -1.5, 3, 2),
      platform("middle", -0.5, 1.2, -1.5, 3, 2),
      platform("second", -3, 1.2, 1.5, 4, 2),
    ],
    [orb(0, -3.5, 2.4, -1.5), orb(1, -3, 1.2, 1.5)],
    [goal(0, 3.5, 0, -1.5, 0.8), goal(1, 3.5, 0, 1.5, 0.8)],
    [input(-4.5, 2.4, -1.5, "upper"), input(-4, 1.2, 1.5, "second", 240)],
  ),
  level(
    12,
    "The Ripple Machine",
    "A ramp, a collision, and a pressure gate. Connect the machine in stages.",
    [
      ...base(),
      incline,
      { ...wall("gate", 2, 0, 0, 0.3, 5), kind: "gate", switchId: "a" },
    ],
    [orb(0, -3, iy(-3), 0), orb(1, 1, 0, 0)],
    [goal(0, 0.5, 0, 0, 0.6), goal(1, 3.7, 0, 0, 0.7)],
    [input(-3.7, iy(-3.7), 0, "incline"), input(4.5, 0, 0, "base", 120)],
    [{ id: "a", x: 1.3, y: 0, z: 0, radius: 0.65 }],
  ),
];
export function daily3(date = new Date()) {
  const day = date.toISOString().slice(0, 10),
    n = Math.floor(Date.parse(day + "T00:00:00Z") / 86400000);
  return {
    code: "d3-" + day,
    level: nativeLevels[(((n * 5 + 1) % 12) + 12) % 12],
    reset: (n + 1) * 86400000,
  };
}
export function resolve3(code: string) {
  if (/^c3-(?:[1-9]|1[0-2])$/.test(code))
    return nativeLevels[Number(code.slice(3)) - 1];
  if (/^d3-\d{4}-\d{2}-\d{2}$/.test(code)) {
    const d = new Date(code.slice(3) + "T00:00:00Z");
    if (Number.isFinite(+d) && d.toISOString().slice(0, 10) === code.slice(3))
      return daily3(d).level;
  }
  return null;
}
