# Miškinukės / Treekies

A browser game we're building together as a family. The kids draw the characters, pets and map, and we turn them into a world you can walk around in.

## Run it

You need [Node.js](https://nodejs.org) 20 or newer and [pnpm](https://pnpm.io) (run `corepack enable pnpm` if you don't have it yet).

```bash
pnpm install
pnpm dev
```

Open the address it prints (http://localhost:5173). `pnpm dev` also prints a **Network** address, so a tablet on the same Wi‑Fi can open the game too. Save any file and the browser reloads on its own.

- **Walk:** arrow keys or WASD, or click/tap where you want to go
- **Zoom:** mouse wheel, or pinch on a tablet
- **Developer view:** press <kbd>`</kbd> (backtick) or open `http://localhost:5173/?debug`
- **English:** add `?lang=en` to the address

`pnpm build` puts a finished copy in `dist/`. You can host that folder on any static host, such as GitHub Pages, Netlify or itch.io.

## What's where

```
public/                     ← things the game loads (pictures, data). Kids' art goes here.
  assets/map/map.png        the map picture
  assets/map/walkmask.png   black = can't walk, white/transparent = can walk
  assets/characters/*.png   characters and pets (transparent background)
  data/world.json           start position + places (name, position, radius, text)
  data/characters.json      which drawings are heroes/pets, how tall, how fast
src/
  main.js                   creates the Phaser game and lists the scenes
  config.js                 knobs: language, zoom, pathfinding cell size
  scenes/BootScene.js       loads the JSON, then the pictures (with a progress bar)
  scenes/MapScene.js        the world: map, hero, pet, camera, places
  scenes/UIScene.js         things on top of the map that don't zoom (place banner)
  objects/Character.js      a drawing that can walk, with a bouncy walk and a shadow
  objects/Pet.js            a character that follows another one's footsteps
  input/PlayerControls.js   keyboard + click/tap → movement
  world/WalkMask.js         reads walkmask.png, answers "can I stand here?"
  world/pathfinding.js      A* route-finding for click-to-walk
  world/DebugOverlay.js     the developer view
tools/cutout.py             scanned drawing → sprite with a transparent background
docs/ART-GUIDE.md           how to scan and prepare the kids' drawings
docs/IDEAS.md               roadmap: animations, sub-games, multiplayer, hidden maths
```

## Game programming in five minutes

If you've done web or backend work, these are the new ideas:

1. **The game loop.** About 60 times a second Phaser calls `update(time, delta)` on each scene, and `preUpdate` on objects like `Character`. You move things a little each frame. `delta` is the number of milliseconds since the last frame, so you write `speed * delta / 1000` and movement comes out the same speed on a fast or a slow computer.
2. **Scenes.** These are separate "screens" or layers. `MapScene` is the world and `UIScene` sits on top of it. They talk through events, for example `place-enter`.
3. **World vs screen coordinates.** Everything on the map uses map pixels, where (0, 0) is the top-left corner of `map.png`. The **camera** decides which part of the world you see and how zoomed in it is. To get world coordinates from a click, use `pointer.positionToCamera(camera)`.
4. **Origin and depth.** A character's position is where its **feet** are (origin `0.5, 1`). Depth is set to `y`, so whoever is lower on the screen is drawn in front. That gives a cheap sense of 3D.
5. **Data-driven.** Places and characters live in JSON. Adding a new place means adding an entry to `world.json`, not writing code.

## Adding a place

1. Run with `?debug` and click the spot. The top-left corner shows its `x` and `y`, and so does the browser console.
2. Add an entry to `public/data/world.json`:
   ```json
   { "id": "well", "name": { "lt": "Šulinys", "en": "Well" }, "x": 900, "y": 700, "radius": 90,
     "text": { "lt": "...", "en": "..." } }
   ```
3. Save. The browser reloads, and walking there shows the banner.

## Phaser version

This uses **Phaser 4**. Most tutorials and Stack Overflow answers online are for Phaser 3. The basics (scenes, sprites, tweens, input, cameras) are almost the same, but effects and masks changed. Phaser ships up-to-date guides inside `node_modules/phaser/skills/` (one folder per topic, `SKILL.md` in each). Claude Code reads them too; see `CLAUDE.md`.
