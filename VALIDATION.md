# Current release

See [RELEASE-2.0.md](RELEASE-2.0.md) for fresh 2.0 validation. The report below is historical evidence for the initial release, not a claim that those commands were rerun unchanged.

# Validation report

Executed November 15, 2026 on this macOS development machine with Node 24.22.1.

## Passed

- TypeScript strict check and Vite production build.
- 44 Vitest tests across two files: quadratic impulse/falloff, exact-center impulse, input limits, velocity cap, wall reflection, one-unit-thick obstacle at maximum speed, embedded-orb recovery, orb momentum transfer, bumpers, capture, hazards, timeout, settled failure, pause, reset, frame schedule independence, every catalog solution twice, geometry/association checks, UTC daily selection, challenge parsing, bounded replay decoding, score ordering and persistence denial/corruption.
- The browser suite runs against the actual production build, not a mock rendering.
- Browser engines: Playwright Chromium 159, Firefox 159, WebKit 27.2. Each accepts all 25 reference replay links through the same verifier used for shared player results.
- Real pointer-generated first-level completion, genuine score saving and reload, unlocks, next level, exact retry reset, pause/resume and keyboard pulse control.
- Settled failure and visible reference playback; reference playback does not save records.
- Settings persistence; daily route; invalid challenge codes; privacy navigation; local-storage denial while winning.
- Responsive widths 320×568, 390×844, 768×1024, 1366×768 and 1920×1080: arena fits within the viewport height and width, no horizontal document overflow, same coordinate-mapped pulse completes the first level.
- Emulated touch consumes exactly one pulse; orientation/viewport resize preserves the active round in Chromium and WebKit.
- Shared result excludes solution by default; explicit replay opt-in; recipient-side replay recalculation and comparison; PNG result download.
- Production service worker: install, disconnect network, reload, and complete a puzzle offline in all three engines.
- Final browser run: 41 passed, 1 explicitly skipped. The skipped test is Firefox touch emulation, which Playwright does not support. Other Firefox pointer and viewport tests pass.

## Measured artifact size

Vite output: JavaScript ~41.01 kB (13.33 kB gzip), CSS ~12.10 kB (3.45 kB gzip), HTML ~1.36 kB (0.69 kB gzip), plus a ~0.84 kB worker and tiny static metadata/icon files. Initial compressed HTML/CSS/JS totals approximately 17.5 kB, well below the proposed 3 MB asset target. This is a build-size measurement, not a mobile network loading benchmark.

## Bugs found and corrected

- A goal generated near an edge was visually clipped; frozen target coordinates are bounded and all solutions were revalidated.
- The first Redirect layout's banked outcome did not teach the intended turn clearly; it now uses an upward pulse followed by a lateral redirect over the wall.
- Phone grid minimum sizing caused horizontal overflow; mobile layout now uses constrained sizing and a compact playable view.
- A persistence test looked for level-one's best on the next unlocked level after reload; it now revisits level one before checking the record.
- Chromium offline reload did not recover the script/style network-first requests; immutable assets now use cached responses first. All offline recovery tests pass after this change.

## Not validated or deferred

These checks do not substitute for physical-device certification. Real Chrome on Android, Safari on iPhone, shipping Safari desktop and tablet hardware were not operated. WebKit is an engine-level automated proxy for Safari, not the actual Safari application. Native device share sheets, platform fullscreen differences, real background-tab lifecycle behavior, safe-area cutouts, long-duration memory behavior and sustained low-end FPS need physical-device testing.

No representative connection performance test, ten-player usability study, retention experiment, accessibility audit or human campaign-balancing session has been performed. No backend/leaderboard exists, so server validation, rate limiting, online rankings and backend failure recovery are deferred rather than simulated.

No minimum-solution proof is claimed. Every layout has at least one automated winning run; the catalog uses some related templates and rotations. Human testing should assess difficulty and discover confusing/trivial alternative solutions.

No analytics data or player activity is fabricated. No optional analytics are transmitted. Deployment access may be private; a public beta requires an intentional sharing/access decision and the outstanding product checks above.
