# Ripple Circuit 2.0 — authored puzzle notes

Goals are declared independently in `scripts/design-v2.ts`. The script computes inputs to authored waypoints and searches candidate bank/cascade inputs; it never relocates a goal to a simulated ending position. `catalog-v2.json` is the frozen output. Never regenerate published c2 geometry under the same identifier. Future edits require c3 or an explicit migration.

| Circuit | Notice / decision | Likely mistake | Intended strategy / difference |
|---|---|---|---|
| 1 First Ripple | Direction away from the tap | Tapping in front | Follow the initial marker; one generous destination |
| 2 Distance Matters | Force arrow changes with distance | A weak distant pulse stops short | Compare preview strength and reach; closer shots can also win, deliberately |
| 3 Around the Corner | Wall blocks direct travel | Firing directly toward the goal | Move above the wall, then redirect horizontally; planning with a settled orb |
| 4 Timing Changes Everything | Orb is moving toward a bumper | Ignoring existing rightward momentum | Intercept with a second pulse; reference turns at 2 seconds rather than waiting for rest |
| 5 Two With One | Both orbs lie in one radius | Solving each separately | Aim behind their midpoint; one input sends them in opposite diagonal directions |
| 6 Narrow Passage | Broad straight channel | Off-axis impulse | Center the force arrow along the lane; generous goal, 110-unit channel |
| 7 Bank Shot | Top edge offers a route around the wall | Directly hitting the wall | Reflect off the upper edge; shortened path improves input tolerance |
| 8 Pressure Point | Diamond connects to gate | Treating gate as permanent wall | Cross the switch; gate opens before arrival; one pulse teaches latching |
| 9 Open the Gate | Switch is off the direct route | Hitting gate before activating | Go upward, then across, then downward; three deliberate route stages |
| 10 Split Decision | Upper lane contains shared switch | Sending lower orb first | Upper orb opens both lanes; then lower orb can pass |
| 11 Precision Cascade | First orb can hit the second | Spending a pulse on each orb | Collision transfers momentum, second orb opens gate, first docks nearby |
| 12 Living Circuit | Two separate switch links | Firing the right orb before its gate opens | Upper and left routes activate independent mechanisms; finish with right-hand orb |

Known solutions are not optimality proofs. Levels 3 and 4 allow alternative timing and adjusted second shots; level 2 deliberately accepts stronger solutions. No claim that every mechanic is logically unavoidable. Coarse one-pulse search finds no one-pulse completion in 3, 4, 9, 10 or 12, but cannot prove none exists.

## Tolerance audit

`node --import tsx scripts/audit-v2.ts` writes `level-audit.json`. It perturbs each input separately by eight offsets of four logical units, leaving all other inputs fixed. On a 350px board, four units is about 1.9 screen pixels. It also shifts all later inputs by ±6 and ±12 ticks, and checks a 30-unit grid for single-pulse alternatives.

The final audit improves the bank shot from 1/8 to 7/8 placement perturbations and the cascade from 2/8 to 6/8. First-tap tutorials, dual-orb pulse, passage, pressure switch and split-order puzzle accept all tested placement offsets. Corner, moving redirect, three-stage gate route and finale remain more sensitive (10/16, 9/16, 10/24 and 16/24). A human can adapt later shots to the changed position; this fixed-script audit does not model that. These four puzzles are priorities for novice playtesting, not certified difficulty balance.

Each solution is run through the actual browser reference-playback UI at desktop and 390px phone widths, with start/end screenshots. Five viewport tests also exercise real input conversion. See RELEASE-2.0.md for run results and limitations.

## Daily content

The new d2 schedule has 15 frozen entries: nine new campaign puzzles (4–12) and six selected original archetypes (4, 7, 12, 16, 20, 23). This is a mixed catalog, not 15 additional original puzzles. It repeats every 15 days; it improves mechanism variety but not repetition interval over d1's 22-day loop. Expanding to 28 independently designed daily puzzles is deferred until player evidence identifies which mechanics are worth expanding. d1 links keep the original 22-day mapping forever.

## Native spatial campaign (physics 3)

All twelve configurations are authored in `src/native/levels.ts`; destinations were set before reference input tuning. `scripts/tune-native.ts` searches subsequent pulses toward the fixed goals; `scripts/refine-native.ts` compares placement tolerance without moving goals. Never regenerate published c3 configurations in place.

| Circuit | Physical idea | Validated reference |
|---|---|---|
| First Dimension | 3D radial impulse, actual floor contact | One horizontal launch |
| The Incline | Gravity and contact with a sloped cuboid | Pulse down the ramp |
| Over the Edge | Vertical fall, retained horizontal momentum | Launch from upper shelf to lower dock |
| The High Road | Elevated route selection | Cross upper walkway; lower route is a tempting alternative, not a validated second solution |
| Bridge Between | Narrow physical bridge with real fall risk | Align a pulse along bridge |
| Gravity’s Turn | Ramp exit, collision and redirect | Descend, then redirect toward side dock |
| Pressure Below | Falling contact activates a lower switch | Descend onto plate, then pass opened gate |
| Open the Sky | Switch at ramp elevation | Roll down plate-controlled passage |
| The Stepping Path | Two sequential height changes | Cross fixed stepping shelves; moving lift deliberately omitted |
| Falling Domino | Real marble momentum transfer | Falling marble collides with second, then finish through gate |
| Three Levels Deep | Three elevations and separate lanes | Guide two marbles to distinct lower docks |
| The Ripple Machine | Ramp, collision, switch, gate and return pulse | Complete two-orb mechanism in stages |

`native-audit.json` records completed reference runs, six .04-world-unit offsets per input and ±6-tick timing tests. Levels 6 and 12 reference inputs were refined for broader tolerance. Levels 7, 8, 10 and 12 remain priorities for real-player balancing. Twelve levels are available openly; the current progression marker recommends a next island rather than blocking exploration. The 3D daily repeats these twelve levels every twelve UTC days; it is not twelve additional designs.
