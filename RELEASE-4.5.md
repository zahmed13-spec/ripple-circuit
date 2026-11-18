# Ripple Circuit 4.5 — The Living World

Aero Haven now restores a visible landmark after each verified clear. The Landing Beacon lights first, the Glass Reservoir begins to spill, a hidden line links the Observation Terminal, the Relay Turbine starts turning, and the Aqueduct Crown sends a signal to Eco Canopy. The render state follows the saved completed-puzzle prefix. Retry and reference playback have no independent restoration rewards.

The opening shows the connected world before the fracture, then follows Luma to Ripple and the first receiver. The lower channel reveals a stability directive. The relay prompts a partial memory. The finale stages still use the published switch, gate, and water mechanics. Each real latch changes the guide line and adds energy to the Crown. Completion unlocks a 3D glimpse of Eco's greenhouses, energy tree, dormant bridge, and warning. The Current Archive reads discoveries from verified progress. It also contains music, dialogue size, and scene bypass settings.

## Architecture

- `src/story/narrative.ts` holds reusable camera shots, scene beats, emotional direction, level contexts, landmarks, and archive text.
- `src/story/cinematics.ts` presents the opening, aqueduct survey, restoration, and Eco preview using the shared Three.js arena. Scenes have manual next/skip controls and optional auto advance. Reduced motion snaps instead of interpolating shots. Scenes do not instantiate a physics simulation.
- `src/story/luma.ts` animates eight expression states with gaze, blink, body tilt, lift, glow, and bounded celebration motes. Luma occupies the perimeter and is excluded from picking and collision.
- `src/story/play-feedback.ts` observes pulse, current entry, plate, receiver and result events. No presentation event writes to simulation state. First-clear text and discoveries derive from the previously saved stage.
- `src/story/landmarks.ts` and `environment.ts` build the procedural props, moving water, current arrows, phase effects, and restored flow. Geometries are reused within a scene and disposed with the arena. Low quality caps story rendering near 30 Hz during movement while keeping the fixed simulation rate and dropping extra visual detail. No large image, model, or audio downloads were added.
- `src/story/soundscape.ts` synthesizes a filtered water loop and a bounded chord bed. It uses the shared Web Audio context after a gesture and stops/disconnects owned nodes on navigation. Existing sound effects and the new music have separate controls. A short Luma motif accompanies discoveries.
- `src/story/save.ts` reads the 4.0 schema and adds optional validated presentation preferences. Archive entries and restoration stages are derived, so old complete and partial saves get the correct environment immediately. The legacy save key is untouched.

## Compatibility and development

Published `st4-aero-1` through `st4-aero-5` still use engine `rapier-0.21.0-rc4.1`. The physics module, geometry, reference inputs, historical catalogs, and existing save module match the 4.0 rollback. Expect the same reference outcomes (49, 162, 169, 193, 341 ticks). The five published challenges and scores do not need migration to a new physics version.

Use Node 24 and pnpm 11.25. Install with `pnpm install --frozen-lockfile`, open `/#story` through `pnpm dev`, and run `pnpm test` and `pnpm run build`. Browser validation uses `pnpm exec playwright install chromium firefox webkit` and `pnpm test:browser`. Build GitHub Pages with `BASE_PATH=/ripple-circuit/ pnpm run build`. The workflow publishes after checks on main. Roll back to branch `rollback/pre-living-world` at `44b4725fccbdfc70dddeb1e6f5c4b486a248b230` if needed.

## Next chapters

| Region | Theme | Narrative and physics prototype |
| --- | --- | --- |
| Eco Canopy | Growth | A greenhouse classified as unstable. Prototype a visual living bridge and fixed-step collider activated by the same plate, then validate reset, obstruction, and replays. |
| Terra Core | Balance | A stabilizer that preserves structures by stopping motion. Prototype clearly marked, deterministic gravity changes. |
| Metro Pulse | Connection | Transit circuits show how the original design protected adaptability. Prototype visible, predictable machinery timing. |
| The Null Zone | Understanding | The network believes disconnection is protective. End with a cooperative sequence of earlier mechanics that restores a stable, changing Current. |

Eco's preview has no playable bridge. Longer finale physics, the other chapters, human narrative and difficulty testing, physical mobile certification, and long-term GPU or battery profiling remain outstanding. A delivery addendum records actually run browser checks and captures.
