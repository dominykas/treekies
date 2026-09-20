# Art guide: from paper to game

## Characters and pets

**Drawing tips for the kids**
- Draw on **plain white paper**, one character per sheet.
- Go around the whole character with a **dark, closed outline** (a marker is best). The cut-out tool removes the white paper that touches the edge of the sheet. White parts *inside* a closed outline, such as eyes and teeth, stay white.
- Draw it **from the side, facing right**, standing on its feet. The game flips it to face left. If the drawing faces left, set `"facing": "left"` in `characters.json`.
- Colour it in fully. Gaps in the colouring are fine, but gaps in the outline let the "paper remover" leak inside.
- For later: a second drawing of the same character with **eyes closed** gives us blinking. A few drawings of legs in different positions give a proper walk.
- **Optional: front and back views.** Draw the same character standing the same way, but seen from the front and from the back. The game shows these when you walk up or down instead of just flipping the side view. Not required - without them the character just flips left/right as before.

**Scanning**
- A scanner at 150–300 dpi is ideal. A phone photo also works: use daylight, no shadow, shoot from straight above, and crop to the paper.
- Put the raw scans in `scans/`, cropped to one character each. It's a good idea to also keep the full, unedited photo (even if it has several characters on one page) in `public/assets/original/`.

**Turning a scan into a sprite**
```bash
pip install pillow        # once
python3 tools/cutout.py scans/fox.jpg public/assets/characters/fox.png
```
If grey paper or shadows survive, try `--white 200`. If parts of the drawing vanish, try `--white 235`.

Name the files after the character's `id`: `<id>.png` for the side view, `<id>-front.png` / `<id>-back.png` for the optional extra views (for example `fox.png`, `fox-front.png`, `fox-back.png`). The game doesn't care what the files are called - it just reads whatever path you put in `characters.json` - but keeping this pattern makes the asset folder easy to scan.

Then add it to `public/data/characters.json`, in the `heroes` list (playable characters) or `pets` list:
```json
{ "id": "fox", "name": "Lapė", "image": "assets/characters/fox.png", "height": 70, "facing": "right" }
```
`height` is how tall it looks on the map, in map pixels. Compare it with the houses on the map to get the size right.

If you also made front/back drawings (see above), point to them the same way - process each with `cutout.py` separately and add:
```json
{ "id": "fox", "name": "Lapė", "image": "assets/characters/fox.png",
  "imageFront": "assets/characters/fox-front.png", "imageBack": "assets/characters/fox-back.png",
  "height": 70, "facing": "right" }
```

**More than one hero or pet:** `heroes` and `pets` can each hold several entries - every kid can have their own character and their own sidekick. In the game, pressing <kbd>C</kbd> opens a picker to choose a character and a sidekick independently (see `src/scenes/UIScene.js`).

## The map

**Drawing tips**
- Use big paper (A3 or two A4 sheets taped together). The map is seen from above, like a real map.
- Draw **paths wide enough** for a character to walk along. Around a thumb's width on A3 is plenty.
- Give every place a clear **open spot in front of it** where characters will stand.
- Houses and trees drawn "from the front" look lovely even on a top-down map. That's what most cartoon maps do.

**Scanning**
- Scan it (a photo works too). Crop to the drawing and straighten it.
- Resize so the long side is about **2000–3000 px**. Bigger looks sharper when zoomed in but loads slower. Save as `public/assets/map/map.png` (JPG is fine too; update `world.json`).

## The walk mask

The game has to know where you can walk. That's a second picture, **exactly the same shape as the map**:

- **black** = blocked (trees, water, houses, the edge of the world)
- **white or transparent** = walkable

Two ways to make it:

1. **With the kids, on paper.** Put tracing paper, or a photocopy, over the map. Colour everything you *can't* walk on in black marker. Scan it the same way as the map, then crop and resize it to match the map exactly.
2. **On the computer** (in a free editor such as [Krita](https://krita.org), [GIMP](https://www.gimp.org) or [Photopea](https://www.photopea.com) in the browser). Open the map and add a new transparent layer on top. Paint the blocked areas black with a big brush. Hide the map layer and export only the painted layer as `walkmask.png`. Transparent means walkable, so you only paint the obstacles.

The mask can be smaller than the map (for example half size), as long as it has the **same proportions**.

**Check it:** run the game with `?debug`. Blocked areas show in red over the map. Walk around and look for places where you get stuck, or places where you can walk through a tree. Then touch up the mask.

## Places

Once the map is in, open `?debug` and click the middle of each place to get its coordinates. Then write the places into `public/data/world.json`. Also set `start` to the spot where the hero begins.
