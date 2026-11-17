# Ripple Circuit 3D — release validation

## A. Product

The existing Ripple Circuit now has a real Three.js arena: glossy rolling spheres with readable numbered badges, receiving rings, thick aqua-edged platforms, dimensional obstacles and mechanisms, sunlight, environmental reflections and an aquatic setting. The classic gameplay remains authoritative under its existing physics. A separate spatial campaign introduces actual rigid-body gravity, ramps, falls, bridges, contact switches and momentum transfer.

This is a playable browser release, not evidence of commercial polish, player enjoyment or hardware-wide certification.

## B. Systems

- Three.js 0.187.0 WebGL2 renderer. Three.js documents WebGLRenderer's WebGL2 requirement: https://threejs.org/docs/pages/WebGLRenderer.html. WebGPURenderer was considered; no demonstrated benefit justified a second rendering backend for this release. Canvas2D remains the automatic classic fallback. Native puzzles explicitly require WebGL2.
- Rapier 0.21.0, independently namespaced as `rapier-0.21.0-rc3.1`, with 60 gameplay ticks/second and two 120 Hz physical steps per tick. Gravity is (0,-9.81,0). Spheres have real rigid-body rotations, CCD, contact collisions, friction, damping and restitution. Platforms and ramps use identical dimensions/quaternions for colliders and visible meshes (small decorative edge bevels only).
- Native pulses use actual XYZ distances, radius 3, quadratic falloff and a velocity-scale impulse of 14 for mass-one bodies. Coordinates quantize to .001 world units. Selected surface IDs and elevation are validated. Switch sensor contact immediately disables the linked collider between physical substeps; visual disappearance uses that exact state. Original v2 gates retain their immediate original rules.
- Three stable camera presets, bounded zoom and reset. Preset transitions interpolate briefly; Reduce Motion snaps instead. Pointer rays intersect the planar board for classic gameplay and real platform meshes for spatial gameplay. Explicit surface selection resolves overlapping elevations. Structures that obscure a marble or receiving ring become translucent without changing collisions or which surface the player selects. Normal gameplay dragging never rotates the camera.
- Quick tap, precision drag/release, cancellation, keyboard aiming, pause, retry, reference playback, personal replay, score records, share links and actual-render result PNGs. Matching numbers stay camera-facing. No accounts or public rankings.
- Twelve spatial circuits, `c3-1` through `c3-12`, plus a separately scored UTC `d3` daily using the same curated twelve entries. Its repetition interval is twelve days, not 28. `#daily` still means the frozen d2 schedule; `#daily3` is the new spatial schedule.
- Auto/Low/Medium/High graphics: pixel ratios capped at 1/1.5/2, optional shadows, bounded wave meshes and reusable scene resources. Auto begins at Medium and can lower once after observing slow frames. There is no aggressive quality oscillation or user-agent classification. Context loss pauses play; recovery requires explicit resume. Hidden tabs stop drawing and pause active games; idle scenes draw less often.
- Existing synthesized sound voice cap and mute controls, with physics contact, switch, docking and win feedback. No music download or autoplay. Rolling loops and camera-relative spatial audio are deferred.

## C. Source

`src/scene/coordinates.ts`: explicit game/world/screen conversion. `arena.ts`: shared scene data, actual meshes, camera, raycasting, materials, effects, resource lifecycle. `controls.ts`: view and quality controls.

`src/native/physics.ts`: independent physics and bounded replay verification. `levels.ts`: authored spatial geometry, reference inputs, UTC schedule. `ui.ts`: spatial play, map, persistence, sharing and playback.

`src/main.ts`: routes and classic renderer adapter; `storage.ts`: additive spatial records/progress in the existing key; `share-image.ts`: optional actual 3D thumbnail. Historical engine modules/catalogs/schedules are unchanged.

`tests/native.test.ts`, `tests/browser/native.spec.ts`, `scripts/audit-native.ts`, `native-audit.json` and `scripts/performance-3d.mjs` cover validation. Older browser tests now project their logical input coordinates through the actual camera rather than assuming a flat canvas.

## D. Compatibility and limits

Before implementation, production `version.json` and fetched main both identified `ac1007ec1ac454f29b0881361ed68723e3619bfb` (2.0). A clean development branch and remote `rollback/pre-3d` branch preserve that revision. Fresh baseline: 91 unit tests; 80 browser passes, one unsupported Firefox touch-emulation skip; production build passed.

c1/d1 and c2/s2/d2 simulations, level geometry, solutions and daily mappings remain untouched. Renderer changes do not change their score namespace. Local storage stays at `ripple-circuit-v1`, schema 1, with additive `unlocked3` and c3/d3 records. Native replay payloads include engine version, challenge code, XYZ pulse positions, surface IDs and integer ticks. The code resolves immutable authored configuration; no URL-supplied geometry or executable code is accepted. Payloads are capped at 4096 characters, eight inputs and 7200 simulation ticks (120 seconds). Native rounds have that two-minute simulation bound. Timers exclude pause and hidden-tab time. Catch-up is capped, so severe rendering stalls slow simulated time rather than taking unstable large steps.

Rapier documents cross-platform determinism with identical initialization and engine versions: https://rapier.rs/docs/user_guides/javascript/determinism/. This release tests its actual reference outcomes and a moving-state checkpoint across available browser engines; this is bounded empirical evidence, not a guarantee about all future engines or hardware. Native initial quaternions are fixed numeric constants. Local results are re-simulated before saving and are not trusted online rankings.

## E–G. Validation and visual evidence

Final results and measured performance are recorded in the delivery addendum after the final production run. `native-audit.json` contains actual authored-run outcomes and input perturbation results. It tests six .04-unit placement offsets for each input and ±6 ticks for later actions. It does not model a human adapting the next move. Later levels, especially 7, 8, 10 and 12, still need novice balancing.

Browser viewports are simulated desktop/phone sizes, not physical-device tests. A visual UI check completed the first classic puzzle and the native ramp tutorial through keyboard input with verified results. Automated screenshot review covers native start/end scenes and responsive layouts. No participants or player testimonials were invented.

## H. Deferred / not established

- Physical iPhone/Android and low-end hardware certification; representative mobile-network loading; long-duration GPU-driver memory profiling.
- Human enjoyment, accessibility and difficulty study. Numeric keyboard aiming is supported, but this is not a fully narrated nonvisual game.
- Cinematic chapter/gate flyovers, free-orbit camera gestures, pinch zoom, elaborate particle trails, water shaders, expensive transmission/refraction/postprocessing. Camera presets and bounded zoom provide the supported controls.
- Rolling audio, stereo spatialization, music, haptics and bespoke recorded audio.
- Moving lifts: level 9 deliberately uses fixed stepping shelves. Additional advanced levels and an independently authored 28-day daily library are deferred.
- Global rankings, accounts, backend anti-cheat, telemetry, multiplayer, cloud saves, user-authored levels and social-crawler images per challenge.
- The campaign map is accessible HTML with dimensional island styling, not a second navigable Three.js scene. No claim that every puzzle has a unique or optimal solution, or that every tempting alternate route has been proven solvable.

## I. Deployment and rollback

Development branch: `feature/ripple-circuit-3d`. Authoritative host remains https://zahmed13-spec.github.io/ripple-circuit/ . CI tests and builds before deploying a main-branch merge. `BASE_PATH=/ripple-circuit/` is mandatory for the Pages build; `version.json` records the deployed commit. Offline caches are versioned by build assets and wait for old tabs to close before activation.

Rollback source: `rollback/pre-3d` at `ac1007ec1ac454f29b0881361ed68723e3619bfb`. Before rollback, export the browser's `ripple-circuit-v1` value; older releases do not understand spatial fields and may drop them when saving. Restore that backup when returning to 3D. Re-deploy the rollback commit through the Pages workflow and verify `version.json`; existing open clients may need all game tabs closed and reopened for the worker update. The 2.0 fallback does not support c3/d3 URLs, but preserves c1/d1/c2/s2/d2.

## J. Next three priorities

1. Observe first-time phone players solving the first three spatial tutorials and levels 7/8/10/12; improve selected-surface clarity and adjust input tolerance from real mistakes.
2. Test physical iOS/Android devices and a low-end laptop, including context recovery, thermal behavior, prolonged retries and slow-network loading; tune quality thresholds from those measurements.
3. Author and test genuinely different spatial daily puzzles before lengthening the current twelve-day rotation; keep published challenge geometry and physics versions immutable.

## Delivery measurements

Final local source passes strict TypeScript and **114 unit tests**. A standalone Chromium 159.0.8154.6 run on this arm64 macOS host at 1366×900 measured 180 animation-frame samples: reference-play median 16.7 ms, p95 33.4 ms, maximum 49.9 ms. Idle animation callbacks had median 16.7 ms; actual idle rendering is deliberately throttled and those callbacks are not a claim of continuous rendering. First native arena readiness was observed at 1,487 ms over local loopback; navigation load was 54.9 ms. Neither number represents production mobile-network loading.

Median automated retry round trip: 35.4 ms across 100 retries. Renderer counters stayed at 27 geometries and 11 textures before/after retries and across twenty map/level cycles. Coarsely reported JS heap stayed at 17.1 MB. These counters are useful bounded observations, not proof of zero driver-level leaks. Raw data and limitations are in `performance-3d.json`.

Build sizes: main application/Three.js approximately 627 kB (160 kB gzip), native physics/catalog lazy chunk 4.34 MB (1.65 MB gzip), native UI 12.4 kB (5.1 kB gzip), CSS 17.9 kB (5.2 kB gzip). Vite correctly warns about large chunks. The WASM compatibility package embeds its binary; separate WASM delivery and a smaller physics build are future loading optimizations.

Two preliminary full browser runs identified aggregate test time limits, a WebKit context-warmup limit, and local disk exhaustion while writing large PNG/trace artifacts. Aggregate test budgets now account for scene initialization, context recovery gets a bounded 20-second completion window, screenshots use JPEG, and local traces are disabled (CI retains failure traces). These changes do not accelerate or alter simulation rules. The final browser/production status is recorded in the pull request and accompanying delivery report; no early failed run is represented as a clean pass.

The actual `/ripple-circuit/` local production-path probe passed with no page errors or asset failures: classic switch win, historical offline win, native ramp win, native WASM offline win, query/hash refresh, correctly scoped worker, classic PNG download, native PNG request, fullscreen entry and exit. `pages-smoke-3d.json` records the checks. The Pages workflow now runs this probe after its subpath build and before uploading the deployment artifact. `scripts/pages-smoke.mjs` and the retained classic performance probe project input coordinates through the real camera.
