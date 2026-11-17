# First-time player study and measurement plan

No participant study or retention results have been collected. Recruit 10–15 consenting first-time players, roughly half on their own phones. Use an external moderator; do not collect names inside the game. Allocate comparable participants to the preserved legacy campaign and 2.0. A small sample is directional evidence, not statistical proof.

1. Ask the participant to open the assigned build without coaching. Record browser/device, first interaction delay, explanation of force direction, tutorial outcomes, and observed confusion.
2. Let them play for ten minutes. Record voluntary next-level starts, retries, unclear failures, fairness comments and points where they stop.
3. Ask: What was satisfying? Confusing? Which puzzle required thought? Felt unfair? Did you feel in control? Did you improve? Would you play or share another?
4. Invite optional next-day and day-seven follow-ups using moderator-managed anonymous participant codes. Do not invent persistent user identifiers or infer return rates from an in-memory session log.
5. Ask permission before downloading their local session log from Feedback. The game does not send it anywhere. Transfer only with their consent, store under the anonymous code and delete after the agreed review period.

## Local instrumentation

The session-only ring buffer records attempt, level-start, pulse, complete/fail, continue and image-share events with relative milliseconds and challenge codes. It is capped at 2,000 events, clears on reload, contains no device identifiers, and makes no network calls. Export is a voluntary JSON download. Reference/practice results are excluded from completion events. A recorded share-image event means a download was requested, not that a friend received it. `continue` is navigation intent, not proven enjoyment. Home starts an attempt before a pulse, so define first-play from the first pulse event.

## Denominators and decisions

- First-play rate = participants emitting a pulse / participants who opened the assigned build.
- Tutorial completion = participants finishing levels 1–3 / participants starting tutorial 1.
- Voluntary continuation = tutorial completers starting level 4 without prompting / tutorial completers.
- Post-win retry/continue = successful participants voluntarily starting another attempt / successful participants.
- Session duration: observed wall-clock start-to-exit; in-memory last event only provides a lower bound.
- Daily participation = participants starting d2 / participants observed in that session.
- Actual share and D1/D7 return: moderator follow-up, not inferred from downloads or local clock.

Provisional decision thresholds from the brief: 70% tutorial completion, 40% voluntary continuation, 30% post-win retry/continue, most participants correctly explaining force direction, zero critical mobile input failures. Report counts as well as percentages, device distribution and uncertainty. Use comments and observed failures to choose what to fix. Do not install online analytics before a consent/disclosure design is approved.

Next priorities: improve the corner/gate route if users struggle, verify physical iPhone/Android cancellation and orientation behavior, then author a larger daily pool. Consider ghosts only if players voluntarily optimize records; accounts/global leaderboards only with demonstrated demand and a trusted validation plan.
