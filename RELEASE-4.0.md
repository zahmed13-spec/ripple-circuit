# Ripple Circuit 4.0 — The Fractured Ripple

Aero Haven is the first playable story chapter. The other four regions appear on the world map as future chapters. Completing Aero Haven opens the Eco Canopy preview.

| Circuit | Mechanic | Reference pulses | Reference ticks |
| --- | --- | ---: | ---: |
| 1-1 A New Ripple | Shockwave direction and matching receiver | 1 | 49 |
| 1-2 The Flowing Path | A weak pulse introduces a continuous directional current | 1 | 162 |
| 1-3 Beneath the Surface | Upper terrace, rigid ramp and lower current | 1 | 169 |
| 1-4 Reconnect the Stream | A pressure plate opens a gate and powers marble 2's channel | 2 | 193 |
| 1-5 Guardian of the Aqueduct | Three linked stages, two gates and three receivers | 3 | 341 |

The current acts on active marble centers within the visible footprint and a 0.45-world-unit elevation band around the channel surface. At each 120 Hz Rapier substep it applies an impulse equal to the configured force times the substep duration. Aero Haven uses 6 N along the channel on mass-one marbles. Pressure plates latch at contact, so linked force is applied from the subsequent substep. Leaving the channel, changing elevation, docking, and resetting all affect current eligibility. Current arrows and locked gate visuals use the same activation state as physics. The finale also requires all three plates to latch before it can win.

## Architecture

- `src/story/chapters.ts` and `themes.ts` hold chapter metadata, prerequisites, palette, prop, and audio motif profiles. `levels.ts` holds the five authored story configurations and reference inputs. The story routes and level bundle load on demand.
- `src/story/environment.ts` adds island props, Luma, current strips, an aqueduct crystal and paired dormant and powered states to the existing Three.js arena. Decorative objects have no colliders. The map is accessible HTML with responsive region illustrations. The opening and restoration sequences use actual 3D scenes with no running simulation.
- `src/story/save.ts` stores contiguous progress, best results and viewed scenes under `ripple-circuit-story-v1`. Unlocks and restoration are derived from verified results. Replays and story skipping do not write a win. Better results compare pulse count first and ticks second.
- `src/native/ui.ts` reuses the native puzzle controls and bounded replay verification. Story codes are `st4-aero-1` through `st4-aero-5`, with engine `rapier-0.21.0-rc4.1`. Shared links to later circuits require unlocking them first. Legacy data remains on its existing key, and the historical engines/catalogs and v3 level definitions are unchanged.
- `tests/story.test.ts` verifies authored runs, repeatable replay results, actual current force, elevation, plate/gate/reset, loss, progression and migration. `tests/browser/story.spec.ts` uses live browser pointer input to complete the chapter and checks story routing, skipping, restoration, saved records, and offline touch input.

## Development and rollback

Use Node 24 and pnpm 11.25. Run `pnpm install --frozen-lockfile`, `pnpm dev`, `pnpm test`, and `pnpm run build`. For browser validation, run `pnpm exec playwright install chromium firefox webkit` and `pnpm test:browser` after the root build. The browser configuration starts a local preview automatically. The local Story Mode URL from `pnpm dev` is `http://127.0.0.1:5173/#story`. The deploy workflow uses `BASE_PATH=/ripple-circuit/` and publishes main after its checks pass.

`rollback/pre-story` points to the published 3.0 revision `ca968137add72bd54105df84da66b6443a70460d`. The 3.0 code does not write the separate story key. Keep published story geometry, timing and physics immutable within this namespace. Use a new version for future changes that affect solved outcomes.

## Validation limits and next chapter

All 72 local input-perturbation trials passed when one pulse at a time was offset by the nine combinations of 0 and ±0.08 world units in X and Z. This only measures tolerance near the known solutions. Gameplay observations came from automation and visual review. Physical devices and human enjoyment or difficulty studies remain unverified.

The Aero Haven ending includes a short generated musical motif and visual restoration. Continuous ambience, longer cinematics, and boss checkpoints are deferred. The finale reference needs three pulses and 5.68 seconds of simulation. No account, telemetry or online ranking is required.

For Eco Canopy, first author one greenhouse prototype with a plate-controlled bridge. Bind visible bridge activation and collider enabling to the same fixed substep, then verify contact, restart and replay. Follow it with four authored puzzles and a tree finale, and reuse the green theme and chapter settings. Move Eco from preview to playable only once all five levels pass and human playtesting has informed their difficulty. Terra, Metro and the Null Zone currently have theme and narrative metadata only.
