# Ripple Circuit 2.0 release report

## A. Original problems addressed

Inspection of `scripts/curate.ts` confirmed inverse-designed destinations and repeated starting layouts, including the final three circuits. `src/main.ts` fired touch pulses on pointerdown and excluded touch from hover aiming. The shared-result canvas used hardcoded dark colors despite the Aero site. All original levels imposed 45 seconds. The original daily algorithm repeated 22 campaign entries. The public README referred to private Sites files that were not actually in this repository.

Baseline is commit `d0c2320ffd94a3b607f643f47e1c7a9e9be40059`, matching the published original release and its successful Pages run 43932552512. A fresh clone of the authoritative default branch was used. Local development branch: `feature/ripple-circuit-2`; local tag and remote rollback branch: `rollback/pre-2.0`. No original catalog geometry was overwritten.

## B–C. Improvements and intended player benefit

- **Gameplay:** actual latching circular switches and opening gates, deterministic state, momentum-transfer cascade and two-switch finale. One input continues to operate the whole board. Gates cease colliding as soon as activated; opening effects do not delay control.
- **Level design:** 12 authored goals with separate c2 identifiers, meaningful learning objectives, verified reference runs, perturbation audits and distinct puzzle decisions. The old 25 levels remain playable through Legacy Campaign and c1 links. See LEVEL-DESIGN.md for each decision, alternatives and limitations.
- **Controls:** optional drag/release Precision Aim, outside-board/Escape/cancel/pointer-loss/orientation cancellation, primary-pointer accounting, same force arrows for mouse and touch. Quick tap remains the default. A canceled aim consumes nothing.
- **Presentation:** force arrows encode actual radial direction and quadratic falloff, connected switch/gate lines and state symbols, opening animation, connected destinations on victory, existing bounded ripple/trail/collision effects, readable shared visual materials. The arena stays stable. Reduced motion and high contrast remain available. No perfect-path prediction is shown.
- **Sound:** soft sine-based effects, distinct switch tone, pulse-strength pitch variation, collision cooldown and six-voice cap. Original browser autoplay rules and sound controls remain respected.
- **Replayability:** relaxed Flow has no automatic 45-second failure. Sprint is an optional per-level prototype with a separate code and record. Results compare actual prior pulse/time records. Both modes use identical force rules and aiming information; Precision Aim does not pause time.
- **Daily:** new d2 pool contains nine new mechanism-rich puzzles and six selected original archetypes. UTC mapping and replay validation are frozen. Completion, local best, reset countdown and an explicit Today's Circuit action are visible. A midnight rollover leaves the active puzzle intact. This is 15 entries, not the requested aspirational 28; its 15-day repetition interval is shorter than d1. Variety improves, long-term novelty is still limited.
- **Sharing:** aqua 1200×630 result card with actual score, challenge code and a miniature starting puzzle. Solutions remain excluded unless explicitly included. Locally verified friend comparisons, PNG download, clipboard fallback and no-account entry work. GitHub Pages cannot generate a distinct social crawler preview for every query; downloadable cards are the static-host alternative.
- **Technical:** frozen legacy physics module, new v2 dispatch, additive local saves, deterministic mechanisms, authored-config validator, local-only capped session observations, CI browser coverage and `version.json` release identification.

These benefits are design expectations and technical observations. No human enjoyment, retention or growth improvement has been measured.

## D. Compatibility and important files

- `src/game/engine-v1.ts`: byte-for-byte preserved original simulation.
- `src/game/engine.ts`: v1 dispatch, v2 switches/gates, optional deadline, validation and bounded replay processing. No force constants changed.
- `src/game/catalog.json`: unchanged original content. `catalog-v2.json`: new immutable release catalog.
- `levels.ts`: c1/d1 unchanged; c2 Flow, s2 Sprint and d2 pool routing.
- `storage.ts`: same `ripple-circuit-v1` key/schema version, additional `unlocked2` and precision setting. Legacy records survive. New mode/version identifiers keep incomparable scores apart.
- `challenge.ts`: replay payload version follows the resolved level. Arbitrary geometry is never accepted from a URL. Legacy encoded v1 runs remain valid.
- `main.ts`, `render.ts`, `style.css`: controls, modes, current-level map state, daily status, results and feedback.
- `aim.ts`, `share-image.ts`, `observations.ts`, `audio.ts`: isolated input accounting, share card, local research log and bounded sound.
- `scripts/design-v2.ts`, `scripts/audit-v2.ts`: reproducible authored-content validation and tolerance evidence.
- `.github/workflows/pages.yml`, `vite.config.ts`: tests before deployment, correct Pages base, offline cache and revision metadata.

Legacy achievements based on existing best records remain derivable; records, stars, unlocks and successful-run total are retained. A real retry win remains a successful run, while each challenge has one best entry. Practice and replay do not create records or extra wins.

## E. Verification

Environment: macOS desktop, Node 24.22.1; locked dependencies Vite 7.3.8, Vitest 4.1.12. npm is unavailable here. pnpm's automatic dependency check rejected the shared local dependency symlink, so local checks invoked the same installed CLI entry points directly. CI installs the committed lockfile normally.

Commands executed:

```
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5173 --strictPort
node node_modules/@playwright/test/cli.js test
node --import tsx scripts/design-v2.ts
node --import tsx scripts/audit-v2.ts
node scripts/performance.mjs
BASE_PATH=/ripple-circuit/ node node_modules/vite/bin/vite.js build
```

Fresh baseline: 44 unit tests, strict TypeScript and production build passed; 47 browser cases passed, one unsupported Firefox touch-emulation case skipped. No baseline game failures.

Current results are recorded in the delivery addendum below. The suite covers all 25 historical replay results, every new solution, closed/open gate collisions, reset, determinism, malformed configs, persistence/migration, separate modes, quick/precision input, cancellation, pause/retry, offline reload, UTC rollover, share inclusion/exclusion, PNG downloads, clipboard fallback and local-log export.

Five viewports: 320×568, 390×844, 768×1024, 1366×768, 1920×1080. All authored solutions are visibly replayed at 390×844 and 1366×900 in Chromium, Firefox and WebKit with screenshot artifacts. These are desktop engines and emulated dimensions, not physical phones or shipping Safari certification. Small screens may scroll to secondary controls instead of shrinking the board below 250px.

During development, one run mixed new source catalog inputs with an older production bundle and failed three replay comparisons; rebuilding a fixed catalog resolved those. A later WebKit tablet case missed a raw coordinate click; test helpers now use stable, actionability-checked canvas clicks. Final results supersede these development runs without hiding them.

## F. Assessment

- Control clarity: direction/relative force is visible; touch gains optional positioning. First-time comprehension remains unmeasured.
- Gameplay depth/distinctiveness: latching gates add actual board-state dependencies; the cascade transfers momentum through another orb rather than canned animation.
- Difficulty: each new level has an explicit skill and solution. Corner, timing, gate-routing and finale still need human balancing. Reference solutions do not establish minima.
- Replayability: real personal comparisons and separate timed prototype support optimization. Daily pool size remains limited.
- Visual quality: consistent aquatic palette and functional mechanism states; screenshot inspection supports layout correctness, not universal aesthetic preference.
- Stability: deterministic compatibility and browser tests support this release; physical-device edge cases and long-duration sessions remain unverified.
- Accessibility: numbers, keyboard controls, contrast and reduced-motion retained. Canvas gameplay is not fully nonvisual/screen-reader-equivalent.
- Retention potential: plausible reasons to retry and share, but no measured retention or claimed rankings.

## G–H. Outstanding work and next direction

Recruit the 10–15 first-time testers described in PLAYTEST-PLAN.md, including physical Android and iPhone users. Use voluntary local log exports and moderator observation. No participants, quotations, measured retention or analytics results are fabricated. No data is transmitted by the session log.

Prioritize evidence from the four most sensitive multi-stage puzzles, real touch/orientation behavior, then author more daily content toward 28. Larger systems (ghosts, editor, community discovery, accounts, global leaderboard, monetization) remain deferred until demonstrated player demand. No background music added.

Shared Flow replay verification is bounded to one hour of simulation (inputs before 59m15s); exceptionally long attempts beyond that may play but cannot produce a verified record. This keeps untrusted URL replay work finite. Device-clock daily selection and editable local records are not anti-cheat guarantees. The initial load/frame/heap measurements are local observations, not a mobile performance certification. No sustained low-end-device or long-session memory study was performed.

## I. Delivery and rollback

Repository: https://github.com/zahmed13-spec/ripple-circuit

Development branch: `feature/ripple-circuit-2`. Production: https://zahmed13-spec.github.io/ripple-circuit/

Review and release identifiers and verified status are recorded in the final delivery message/addendum. Public source and publication were explicitly authorized in this conversation. Deployment runs only after tests and build succeed; old tabs may retain the previous service-worker version until closed.

Rollback: revert the release PR merge commit in a new commit on main and allow the Pages workflow to publish. Do not force-push away history. `rollback/pre-2.0` and original commit d0c2320 preserve the complete previous source. Before rolling back, export or copy the browser’s `ripple-circuit-v1` local-storage value. The old application filters unknown c2 fields and can overwrite them on its next save; restore that backup when returning to v2. Original c1 records remain compatible. Rollback is source-safe but is not a reversible save migration without this backup.


## Delivery verification addendum — November 16, 2026

- Final unit suite: **91 passed**, across three files. Strict TypeScript passed.
- Final production browser suite: **80 passed, 1 skipped** in 3.2 minutes. The skip is unsupported Firefox touch emulation. No failing cases in that fixed build.
- Pages subpath production output: JS 63.04 kB (18.23 kB gzip), CSS 15.37 kB (4.70 kB gzip), HTML 1.38 kB (0.68 kB gzip); no new runtime dependencies.
- Local Chromium 159 sample at 1366×768: DOMContentLoaded 49.2ms, load event 54ms over loopback; 180-frame idle/active samples had median 16.7ms and p95 16.8/16.7ms. Automated pulse-to-HUD round trip 175ms and median retry round trip 33ms include automation overhead and are not direct input-latency measurements. Approximate heap reported 10MB before and after 100 retries; its coarse resolution is not evidence of no leaks. Raw values: performance-local.json.
- Every authored board was visually reviewed at phone size; representative desktop, result and share-card captures were inspected. Full screenshot artifacts remain in the local delivery’s sibling `ripple-2-evidence` folder, rather than bloating the public repository.
- Human participants: **0**. Physical phones: **0**. Retention/engagement measurements: **none**. The local experiment plan is preparation, not completed research.
- Exact `/ripple-circuit/` build smoke probe passed: assets, real gate completion, historical offline completion, query/hash refresh, scoped service worker, result PNG, Chromium fullscreen entry/exit. Zero captured page errors or HTTP errors. Raw result: pages-smoke.json.


### Linux CI rendering follow-up

The first PR run passed Chromium and Firefox but timed out in eight Linux WebKit cases. Trace snapshots showed accepted inputs and slow progress (for example 0.8 simulation seconds after four wall-clock seconds), rather than a replay mismatch. The old Canvas always allocated 720×DPR pixels per side regardless of displayed size and used per-orb shadow blur. The follow-up sizes its backing buffer to actual displayed pixels, replaces expensive shadow blur with a small radial glow, and runs CI browser cases serially to avoid three software-rendered engines competing for the same runner. CI wall-clock assertion budgets are also longer because the fixed-step game deliberately slows simulated time under rendering stalls. Local budgets remain unchanged. These tests assert correctness, not a Linux performance threshold. Physics ticks, geometry, scoring and input coordinates remain unchanged. Final CI status is reported in the delivery message; the 80/1 result above is the local macOS baseline before this optimization.
