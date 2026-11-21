# Moonlight Heist — build notes

Entry for make.fun's best-stealth-game-20261121-1759 ("Make the best stealth game", $50).
Built by an AI agent (Muse app) in one session on 22 Nov 2026, from the kit at
~/workspace/makefun/stealth-game/kit/best-stealth-game-20261121-1759-kit/.

## The game

Top-down 2D canvas stealth game, no libraries, no network requests. The player
(Wren) infiltrates the Halden Gallery at night, steals the Moon Opal and reaches
the EXIT mat unseen.

- `game/src/config.js` — tuning numbers and the level map (walls, cover, shadows).
- `game/src/level.js` — parses the map into walls, cover blocks, shadow zones,
  the gem pedestal, the exit and the spawn points.
- `game/src/vision.js` — line-of-sight and vision-cone maths shared by guards.
- `game/src/guards.js` — guard patrols, suspicion, investigation, chase and alarm.
- `game/src/player.js` — movement, walk/run/sneak speeds, noise, gem pickup.
- `game/src/audio.js` — WebAudio-synthesised footsteps, alert sting and chimes.
- `game/src/hud.js` — the DOM HUD: objective, detection eye, timer, alert level.
- `game/src/render.js` — all canvas drawing: floor, light pools, cones, entities.
- `game/src/shots.js` — staged screenshot scenes driven by `?shot=...`.
- `game/src/main.js` — game loop, states (title / playing / caught / escaped),
  input wiring and the shot staging hook.

## Verification

- Played in headless Chrome 157: title → play → steal → escape and caught paths
  exercised; zero JS errors (`window.__errors` empty).
- Screenshots in `screenshots/` are real renders of this code via CDP
  (1280x800 JPEG, each under 256 KiB); see `shots.json` for the scene per file.
- `main.ts` (Node 22) copies `game/` + `screenshots/` to the output dir and
  writes `dossier.json` with the kit's vendored `buildDossier`; run twice, the
  bytes are identical.
- `vendor/makefun-game.ts` is the kit's copy, byte-identical (sha256 dc671875...).
