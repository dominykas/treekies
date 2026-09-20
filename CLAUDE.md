# Miškinukės / Treekies: notes for Claude

## What this is

A browser game a dad (Dominykas, a software engineer who is new to game and graphics programming) is building **with his kids**. The kids draw the characters, pets and the map. The point is to have fun building it together, and the game grows step by step.

What that means for how you work:

- **Teach while you build.** When you use a game-dev concept (game loop, delta time, camera, tweens, depth sorting, pathfinding, netcode), explain it briefly in plain words, in the chat and in code comments. Add comments that explain *why*, not *what*.
- **Keep it small and readable.** Plain ES modules, no TypeScript, no state-management libraries, no premature abstractions. One idea per file. Prefer 30 clear lines over 10 clever ones.
- **Kids' art comes first.** Never redraw, restyle, recolour or "improve" the kids' drawings. Process them only with `tools/cutout.py` (background removal, crop, resize). Animate them with transforms (hop, wobble, squash, flip), not by generating new art. Extra poses or blinking eyes should come from new drawings the kids make.
- **Make small steps the kids can see.** Each change should give something visible to try in the browser.
- **Bilingual.** User-facing text is Lithuanian first, with English next to it: `{ "lt": "...", "en": "..." }` and `t()` from `src/config.js`. Don't hard-code UI strings in only one language.

## Tech

- **Phaser 4** (currently 4.2.x) with **Vite**. `pnpm dev` gives a dev server with auto-reload, and `pnpm build` writes `dist/`. Package manager is **pnpm** (not npm) — use `corepack enable pnpm` if it's missing.
- Phaser 4 is *not* Phaser 3. Most examples on the internet are v3. Before writing Phaser code for anything beyond the basics, read the relevant guide in `node_modules/phaser/skills/<topic>/SKILL.md` (for example `cameras`, `tweens`, `input-keyboard-mouse-touch`, `scenes`, `v3-to-v4-migration`). Masks, FX and pipelines changed a lot between versions (FX and masks are now "filters").
- Scale mode is `RESIZE` (the canvas fills the window), so layout must react to `this.scale.on('resize')`.
- No backend and no server we run. Static hosting only.

## Conventions

- **Coordinates:** the world uses map-image pixels, (0, 0) at the top-left of `map.png`. `walkmask.png` may be a different resolution; `WalkMask` scales between them.
- **Characters:** position is at the feet (`origin 0.5, 1`), and `depth = y`. Sprites are scaled to `height` from `characters.json`, so scans can be any size.
- **`Character` does not know who controls it.** Local input (`PlayerControls`), `Pet` following and, later, network players all drive it through `walkTo(points)` / `step(dx, dy)`. Keep that separation, because multiplayer depends on it.
- **Data-driven:** places, characters and future content go in `public/data/*.json`. Code reads data and doesn't hard-code places.
- **Scenes talk through events** (for example `MapScene` emits `place-enter` / `place-leave` and `UIScene` listens). `UIScene` holds anything that must not zoom with the camera.
- Anything you might tune goes in `src/config.js`.

## Checking your work

- Run `pnpm build` to catch import and syntax errors.
- Open `?debug`, or press the backtick key, for the developer view: the red overlay marks blocked areas, circles mark places, the cyan line shows the current path, and clicking prints map coordinates.
- `window.game` is exposed for poking in the console, for example `game.scene.getScene('MapScene').hero`.
- If Playwright is available, a quick headless check is useful: load the page, call `MapScene.controls.goTo(x, y)`, wait, and read `hero.x/y` and `currentPlace`. In headless Chromium, launch with `--use-gl=swiftshader`.

## Where things are going

See `docs/IDEAS.md`: character animations, more characters, sub-games at each place, **peer-to-peer multiplayer without a server** (WebRTC), and **hidden, practical maths** built into activities. Don't make it look like a textbook exercise.
