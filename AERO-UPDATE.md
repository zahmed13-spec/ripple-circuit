# Aero redesign — November 16, 2026

The previous release is preserved by Git tag `before-aero-redesign-20261116` and the original source/build archive.

Visual audit: the original dark flat field, oversized duplicate level title, uniform rectangular list, and minimal material detail lacked the requested aquatic identity. The redesigned release replaces the stylesheet with a token-based glass/gel material system and original lightweight SVG sky, clouds, hills, water and bubbles. The Canvas now renders a light water chamber, shaded marbles, frosted striped walls, bubble bumpers and concentric ripple highlights. Settings, results, navigation and level selection share the materials.

Gameplay improvements: optional guided practice stops simulation at each reference input and accepts taps near the highlighted marker. It is explicitly practice and does not save scores. Players can replay their own completed attempt using the actual input sequence without incrementing wins. Levels are grouped into Bubble Garden, Aqua Flow and Sky Circuit with personal performance shown beside each completed node. Sound is available beside the arena. Retry also resets the pause control's label correctly.

Compatibility: physics v1, all 25 level configurations, daily catalog algorithm, challenge codes, local storage key and score thresholds are unchanged. No save migration or reset is required. No new environmental mechanics, levels, creator, music or backend were added. These remain future work rather than nonfunctional controls.

Validation: strict TypeScript, 44 simulation/storage tests, and browser tests covering the original interactions plus guided redirect practice and personal replay. Production offline cache includes the new environment asset. Screenshots were inspected at desktop and phone sizes. Automated viewports cover 320×568, 390×844, 768×1024, 1366×768 and 1920×1080. Physical phones, player difficulty studies and performance certification remain untested.

Final redesign validation: 44 unit tests and 47 browser tests passed; one unsupported Firefox touch-emulation test skipped.
