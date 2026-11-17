# Ripple Circuit 2.0

The GitHub Pages game now has a separately versioned 12-puzzle campaign, pressure switches and gates, force arrows, optional drag/release Precision Aim, relaxed Puzzle Flow and separately scored Pulse Sprint. Original c1/d1 links and records remain supported.

Read [RELEASE-2.0.md](RELEASE-2.0.md) for current validation and limitations, [LEVEL-DESIGN.md](LEVEL-DESIGN.md) for authored puzzle decisions, and [PLAYTEST-PLAN.md](PLAYTEST-PLAN.md) for the unperformed human study. The older sections below document the original 1.0 baseline and are retained as history.

## Develop and validate 2.0

Use Node 24 and pnpm 11.25: `pnpm install --frozen-lockfile`, `pnpm dev`, `pnpm test`, `pnpm run build`. For browser tests, run `pnpm exec playwright install chromium firefox webkit`, serve the production build with `pnpm preview -- --port 5173`, and run `pnpm test:browser`. npm script equivalents work with a normal npm installation, but npm does not use the supplied pnpm lockfile.

For GitHub Pages build with `BASE_PATH=/ripple-circuit/ pnpm run build`. The CI workflow builds this subpath automatically. Test at the subpath before merging. Local default root builds are for the browser suite.

Identifiers: c1/d1 use preserved physics v1; c2 uses v2 Puzzle Flow; s2 uses v2 with a 45-second Sprint limit; d2 uses the frozen 15-entry daily pool with Sprint rules. Never mutate a published catalog under the same code. Records remain in the existing local-storage key; new progress uses an additive unlocked2 field.

Precision aim does not pause time or change force. Drag outside the board, press Escape, cancel, rotate or lose the pointer to abandon the input. Quick tap remains immediate. Flow has no gameplay timeout; bounded shared replay verification supports up to one hour of simulation and inputs before 59m15s, rather than accepting arbitrarily expensive payloads.

No new runtime dependencies. No analytics transmitted. Session-only playtest events can be voluntarily exported from Feedback. No global scores, accounts, or fictitious activity.

---

# GitHub development and publishing

Run `npm install` and `npm run dev` for local development. Push changes to `main` to test, build and deploy to GitHub Pages automatically. Pull requests run tests and build without deploying. In Settings → Pages, select GitHub Actions as the source.

The Pages URL uses a new origin, so browser progress on the previous site stays there and does not automatically transfer. Challenge identifiers remain compatible.

# Ripple Circuit

One tap changes everything. A playable browser physics puzzle built with TypeScript, Vite and Canvas 2D. No game framework, accounts, server, paid API, runtime CDN, or remote inference is required.

## Run

Use Node 22.12+ (Node 24 was used for validation).

```sh
npm install
npm run dev
```

Open the printed URL. The homepage arena is already playable: tap behind the numbered orb, or use Play now. A native pointer event consumes one pulse; touch does not also trigger a mouse pulse.

```sh
npm test
npm run build
npm run preview -- --port 5173
```

`dist/` is the production build included in this delivery. Serve it over HTTP(S), not by double-clicking index.html. To run the browser suite, leave the production preview running on port 5173, then in another terminal:

```sh
npx playwright install chromium firefox webkit
npm run test:browser
```

A `pnpm-lock.yaml` is included for pinned reproducibility. With pnpm 11: `pnpm install --frozen-lockfile`, then use the equivalent pnpm scripts. esbuild's install script is allowed in `pnpm-workspace.yaml`. npm works but does not use that lockfile.

## Play

- Tap near and behind an orb to push it away. Closer pulses are stronger.
- Match numbered orbs to numbered dashed targets. Every required orb must dock to win.
- Striped rectangles are walls, purple stars are bumpers. Hazards are supported by the engine and tested, but are not used in the initial catalog.
- Move orbs while they are moving, or wait and plan. The timer starts on your first pulse, with a 45-second simulation limit.
- Escape pauses; R retries. Focus the arena, use arrow keys to aim and Enter/Space to pulse. The keyboard's initial aim solves the first tutorial.
- Pause, retries and completed rounds do not count elapsed wall-clock time. Backgrounding pauses the round. A settings dialog pauses an active attempt; use Resume afterward.
- Fewer pulses always rank above faster time. Equal pulse counts compare completion ticks. Three stars means par or better; two means one pulse above par; one means any other completion. Par is a stored successful solution, not a proven mathematical minimum.
- A failed attempt offers a visible reference replay. Reference runs never save records.

## Implemented

- Pure deterministic physics v1: 720×720 world, 60 fixed ticks/second, eight collision substeps/tick, quadratic radial impulses, speed cap, drag/sleep, arena walls, orb momentum transfer, rectangular obstacles, circular bumpers, hazards and matching-target capture.
- Actual input-driven movement; rendering and effects do not determine physics. Inputs are quarter-unit quantized, recorded with ticks and ordered stably. Zero-distance impulses use the positive X direction.
- Three interactive tutorials and 22 further fixed campaign layouts, including validated rotations. Every shipped level includes a replay-validated solution. No unverified random geometry is generated at runtime.
- Full win/fail/retry/pause/next-level loop, progression map, unlocks, best scores, stars, four small achievements, successful-run totals and daily history.
- Validated local save loading with storage-denial fallback to session memory.
- Shared daily selection: frozen catalog/algorithm v1, UTC midnight, accurate reset countdown, unlimited retries, local daily records. Daily catalog repeats every 22 days; it does not generate unlimited unique puzzles.
- Versioned campaign/daily guest challenge URLs, invalid-code handling, optional replay comparison, input/payload validation and local replay-based result recalculation. Challenge links can open later levels without campaign unlocks.
- Copy challenge link, copy result text, optional native sharing, and downloadable PNG result cards. Clipboard failure falls back to selected text. Native sharing depends on browser support.
- Shared results exclude solutions by default. Explicitly checking “Include replay” includes pulse data for local comparison and reveals the solution.
- Responsive Canvas/UI, pointer/touch, keyboard aiming, focus styles, numbered matching, high contrast, reduced motion, adjustable original synthesized effects, fullscreen when supported. No music track or music control is included.
- Production service worker pre-caches local gameplay for offline recovery after its first successful installation. Cache access may be unavailable in private browsing; ordinary online gameplay still works. Updates wait until the previous app tabs close, preventing physics changes during a round.
- Home/game/daily/levels/how-to/privacy/feedback views using hash routes. Feedback copies diagnostics; it does not submit to an invented contact address or backend. Metadata, canonical URL, structured data, icon, robots and homepage sitemap are present.
- No advertising, fake rankings, fictional users or tracking requests.

## Validation and limits

See `VALIDATION.md` for actual checks and results. This is a playable beta, not a claim that every requirement of the long-term product vision or public launch criteria has been completed.

Important limitations:

- Local replay verification is not server verification or an anti-cheat guarantee. Device owners can edit local saves. No public leaderboard is shown.
- Daily selection depends on the device's UTC date; there is no trusted time server.
- Level solvability is automated, not human difficulty validation. Some campaign levels are related templates/rotations. Unexpected easier solutions are allowed. No optimality claim is made.
- JavaScript floating-point math with fixed ticks is replay-tested across the installed browser engines. Bit-identical arithmetic across every future device/engine is not formally guaranteed; physics/catalog versions must be preserved when rules change.
- A fixed-step accumulator caps catch-up to six ticks per frame. Severe rendering stalls slow simulated time rather than introducing unstable giant steps. This is acceptable for local records; online competition would need trusted replay acceptance policy.
- Canvas is not a fully narrated nonvisual game. Numbered targets and keyboard input improve access; screen-reader gameplay equivalence requires further work.
- No ten-player usability study, real phone/tablet testing, physical lower-end hardware benchmark, or public-beta retention data was fabricated.

## Deferred

- Trusted backend, global leaderboards, rate limiting, accounts and cloud saves.
- Custom-level editor, community discovery/moderation, advanced generation, ghosts and visual replay exports.
- Cosmetic unlocks, ambient music, monetization, localization.
- Optional consent-based analytics and retention measurement. This version transmits no analytics. First-play/tutorial/replay/share/retention funnels require a future analytics design with explicit denominators and cross-device limitations.
- Trademark/domain clearance and legal review. “Ripple Circuit” remains a provisional working title.
- Real-device/browser certification, player difficulty balancing, long-session memory profiling and performance benchmarks under representative mobile networks.

## Source map

- `src/game/engine.ts`: shared authoritative local simulation, replay and input validation.
- `src/game/catalog.json`: frozen versioned geometry and reference inputs for 25 levels.
- `scripts/curate.ts`: offline inverse-design/rotation tool; regenerates and verifies the frozen catalog. Runtime does not run this tool.
- `src/game/levels.ts`: catalog lookup, validated codes and UTC daily schedule.
- `src/game/render.ts`: Canvas arena, numbered objects, trails and bounded effects.
- `src/main.ts`: navigation, fixed-step accumulator, input, results, settings and share UI.
- `src/services/`: persistence/scoring, challenge encoding/recalculation and synthesized audio.
- `tests/`: unit/content tests and browser interaction tests.
- `vite.config.ts`: production build and versioned offline-worker emission.
- The original requirements attachment was not published in this repository; the private original project retains it.

## Deploy

Upload the contents of `dist/` to any static HTTPS host at the domain root. Keep hashed asset files intact. Serve `sw.js` with revalidation (`Cache-Control: no-cache`) and hashed assets with long-lived immutable caching. Set appropriate standard security headers on your chosen host. No secrets or environment variables are required.

Before moving to another domain, update the canonical/OG URLs in `index.html`, plus `public/robots.txt` and `public/sitemap.xml`, then rebuild. Hash navigation and query challenge codes work without server-side route rewrites. HTTPS (or localhost) is needed for service workers and reliable sharing/clipboard support.

This public repository contains no Sites project configuration. GitHub Pages is the authoritative release.

Next priorities: observe ten first-time players without coaching; fix clarity/difficulty issues; test physical iPhone/Android devices and slow hardware; then decide whether trusted online rankings justify backend complexity.
