# Ideas and roadmap

Nothing here is decided. Pick whatever the kids are excited about next.

## Done: phase 1, a walkable map
- Map picture + walk mask, camera follows the hero, zoom with the wheel or a pinch
- Walk with keys (sliding along obstacles) or with a click/tap (A* pathfinding)
- A pet follows in the hero's footsteps
- Walking into a place shows a banner (Lithuanian/English)
- Developer view (the backtick key or `?debug`)

## Small next steps (one evening each)
- **Blinking:** the kids draw an eyes-closed version. Swap textures for 150 ms every few seconds.
- **Idle life:** characters breathe (a slow scale tween) and the pet looks around when you stand still.
- **Choose your hero:** a start screen with all the kids' characters. Each child picks theirs.
- **Sounds:** footsteps, a door chime when you arrive somewhere. The kids can record them.
- **Sparkles** at undiscovered places, and a "discovered" list.
- **Things on the map:** mushrooms or acorns to pick up, with a counter in the corner (counting in disguise).
- **Map layers:** draw trees on a separate transparent layer that goes *over* the characters, so you can walk "behind" a tree.

## Sub-games at places
Each place can open its own Phaser scene (`this.scene.start('BakeryScene', {...})`) and come back to the map when it's done. The kids decide what each place is for. That's the "find out what you can do here" part.

## Multiplayer without our own server
Plan: **WebRTC peer-to-peer**. Browsers talk to each other directly.

- WebRTC still needs a quick "introduction" (signalling) before peers can connect. The library **[Trystero](https://github.com/dmotz/trystero)** handles that over existing public networks (Nostr relays, BitTorrent trackers, MQTT and others), so we don't run anything. Players join a **room** by typing the same secret word.
- Each player sends only **their own** hero: `{ id, character, x, y, target }`, about 10 times a second or whenever they click. Other players show up as ordinary `Character`s driven with `walkTo([...])`, which is why `Character` doesn't know who controls it. Smooth the movement (interpolation) so they don't jump.
- For shared things (who picked up the acorn, the state of a sub-game), one player acts as the "host". The simplest rule: whoever has the smallest peer id. If they leave, the next one takes over.
- **Caveats:** the public signalling networks are free but can be flaky. On the same home Wi-Fi, WebRTC connects easily. Between houses or on mobile data it sometimes needs a **TURN relay** (hosted services like Cloudflare Realtime or Metered have free tiers). That's a config string, not a server we run. Check the current Trystero README for its API before building. It's still pre-1.0 and changes.
- Hosting stays static (GitHub Pages is fine, and it's HTTPS, which WebRTC needs).

## Hidden maths
The rule: **the maths is the tool you use to get something you want in the game**, never a quiz standing in your way. Wrong answers have a natural, funny result (flat buns, a boat that tips over), not a red ✗. Numbers adjust to each child's level (a per-player profile).

| Place | Activity | Maths hiding inside |
|---|---|---|
| Kepyklėlė (bakery) | Bake buns for everyone who's visiting. The recipe is for 4 but 6 are coming | multiplication, fractions, scaling |
| | Weigh flour on a balance with weights | addition, grams/kg, comparing |
| | The oven needs 25 min, and the clock shows when they're ready | time, clocks |
| Turgus (market) | Run a stall: set prices, give change with coins | money, subtraction, making amounts |
| | Swaps: 3 acorns = 1 mushroom, 2 mushrooms = 1 bun | ratios, multi-step reasoning |
| Ežeras (lake) | Fishing contest: measure your catch with a ruler, keep ones longer than 20 cm | measuring, comparing, ordering |
| | Build a raft: pick logs whose lengths add up to the lake width | addition, estimation |
| Medžių namelis (treehouse) | Repair the ladder: rungs every 30 cm, how many for 2 m? | division, measuring |
| | Share the berries you found fairly between the Treekies and their pets | division, remainders |
| Map itself | Treasure hunt: "3 steps north, 5 east", then a grid map with coordinates | coordinates, directions, negative numbers |
| | Pet needs feeding every 2 hours of game time | time, patterns |

Useful to know first: the kids' ages and school years, so the numbers fit. Another good trick is to make them **design** the puzzles for each other. That's even more maths, and it's disguised as game-making.
