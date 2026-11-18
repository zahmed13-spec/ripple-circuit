# Ripple Circuit 5.0 — The Animated Story

The eight Aero Haven story films use original, authored 3D animation. Luma approaches, startles, waits, listens, and relaxes through shot-specific blocking and facial gestures. Ripple answers through poses and pulses. The aqueduct goes dark in phases, the reservoir starts flowing, the relay turns, the Crown rises, and a growing vine stops abruptly in the Eco preview. NULL remains an incomplete seal. The cast was modeled, rigged, and exported with Blender 4.5.16 LTS. The browser stages the finished cel-shaded sets and plays the cast assets in real time. No generated media, external font, or voice service was used.

| Film | Shots | Duration | Placement |
| --- | ---: | ---: | --- |
| The Last Spark | 5 | 60 s | Before Aero 1 |
| The First Beacon | 3 | 22 s | After Aero 1 |
| The Reservoir Awakens | 3 | 27 s | After Aero 2 |
| The Stability Directive | 4 | 36 s | After Aero 3 |
| Luma’s Memory | 4 | 36 s | After Aero 4 |
| Guardian of the Aqueduct | 5 | 42 s | Before Aero 5 |
| The Water Returns | 5 | 60 s | After Aero 5 |
| Beyond the Canopy | 4 | 34 s | Eco Canopy preview |

The player provides pause, playback, shot navigation, scrubbing, skip, and an accessible transcript. It pauses for reduced motion and draws static poses until the viewer advances. Captions remain visible without WebGL, and the story can proceed. The Archive offers reruns of unlocked films. Watching or skipping changes view history only. Actual deterministic puzzle results control progression and unlocks. The new after-clear films use the current result screen action and respect the story scene bypass preference.

The original physics, level configurations, replay IDs, solver inputs, and non-story save module match 4.5. Existing story scores, preferences and view history remain readable. The release rollback is `rollback/pre-animated-story` at `771abb0b2f79fa5be3bcbc83ea99b2739117e76b`.

- `src/story/film/boards.ts`: authoritative shot-by-shot boards and subtitle/cue timing.
- `src/story/film/timeline.ts`: held and interpolated actor/energy tracks.
- `src/story/film/rigs.ts`, `sets.ts`, `stage.ts`: original actor, set, cel shading, water, and camera layer.
- `src/story/film/assets/cast.glb`: Blender cast, 11 short reusable clips, four mouth shapes.
- `cinematics/`: editable .blend animatic and reproducible export tools.
- `src/story/cinematics.ts`, `route.ts`, `map.ts`: the player and Story Mode integration.

The films are subtitle-only. Synthesized motifs and the existing water soundscape provide sound. Approximate mouth timing uses authored A, E, O, and rest cues. No full Blender video render or recorded voice track is included. Eco is a cinematic preview; the living bridge is not playable.

Use Node 24 and pnpm 11.25. Install with `pnpm install --frozen-lockfile`. Run `pnpm dev`, `pnpm test`, and `pnpm run build`. Browser checks use `pnpm test:browser` after installing Playwright's browsers. GitHub Pages requires `BASE_PATH=/ripple-circuit/`. See `cinematics/README.md` for the Blender export.
