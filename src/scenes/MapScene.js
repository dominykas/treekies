import Phaser from 'phaser';
import { CELL_SIZE, DEBUG, MAX_ZOOM, START_ZOOM } from '../config.js';
import { WalkMask } from '../world/WalkMask.js';
import { Character } from '../objects/Character.js';
import { Pet } from '../objects/Pet.js';
import { PlayerControls } from '../input/PlayerControls.js';
import { DebugOverlay } from '../world/DebugOverlay.js';

// The walkable world. Everything here is placed in MAP coordinates:
// (0, 0) is the top-left corner of map.png, one unit = one pixel of the map.
// The camera decides which part of the map is visible on screen.
export class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  create() {
    this.world = this.cache.json.get('world');
    this.characters = this.cache.json.get('characters');
    const characters = this.characters;

    // 1. The map picture, drawn behind everything (depth -1).
    const map = this.add.image(0, 0, 'map').setOrigin(0, 0).setDepth(-1);
    this.mapWidth = map.width;
    this.mapHeight = map.height;

    // 2. Where can you walk?
    this.mask = new WalkMask(this, 'walkmask', map.width, map.height, CELL_SIZE);

    // 3. Our hero and their pet.
    const heroDef = characters.heroes[0];
    const { x, y } = this.world.start;
    this.hero = new Character(this, x, y, heroDef);
    const petDef = characters.pets.find((p) => p.id === heroDef.pet);
    if (petDef) this.pet = new Pet(this, this.hero, petDef);

    // 4. Keyboard / mouse / touch.
    this.controls = new PlayerControls(this, this.hero, this.mask);

    // 5. Camera follows the hero and never shows outside the map.
    this.setupCamera();

    // 6. Places you can visit.
    this.places = this.world.places;
    this.currentPlace = null;

    // 7. The UI (text on top) lives in its own scene so it doesn't zoom with the map.
    this.scene.launch('UIScene');

    // 8. Developer view: press ` (backtick) or open the page with ?debug
    this.debug = new DebugOverlay(this);
    if (DEBUG) this.debug.toggle();
    this.input.keyboard.on('keydown-BACKTICK', () => this.debug.toggle());
  }

  setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.mapWidth, this.mapHeight);
    cam.startFollow(this.hero, true, 0.1, 0.1); // 0.1 = smooth "lazy" follow
    this.zoomTo(START_ZOOM);

    // Mouse wheel zoom
    this.input.on('wheel', (pointer, objects, dx, dy) => this.zoomTo(cam.zoom * (dy > 0 ? 0.9 : 1.1)));

    // Two-finger pinch zoom on tablets
    this.input.addPointer(1);
    this.input.on('pointermove', () => {
      const [a, b] = [this.input.pointer1, this.input.pointer2];
      if (!(a.isDown && b.isDown)) { this.pinchStart = null; return; }
      const dist = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      if (!this.pinchStart) this.pinchStart = { dist, zoom: cam.zoom };
      else this.zoomTo(this.pinchStart.zoom * (dist / this.pinchStart.dist));
    });

    // The browser window changed size (or the tablet rotated).
    this.scale.on('resize', () => this.zoomTo(cam.zoom));
  }

  /** Zoom, but never so far out that you'd see past the edge of the map. */
  zoomTo(z) {
    const minZoom = Math.max(this.scale.width / this.mapWidth, this.scale.height / this.mapHeight);
    this.cameras.main.setZoom(Phaser.Math.Clamp(z, minZoom, Math.max(minZoom, MAX_ZOOM)));
  }

  // Swap the main character's or sidekick's sprite-set, e.g. from the
  // character picker in UIScene. They're independent: picking a different
  // hero doesn't change who's following them, and vice versa. Position,
  // path and camera follow all carry over untouched.
  setHero(id) {
    const heroDef = this.characters.heroes.find((h) => h.id === id);
    if (heroDef) this.hero.setCharacterDef(heroDef);
  }

  setPet(id) {
    const petDef = this.characters.pets.find((p) => p.id === id);
    if (petDef && this.pet) this.pet.setCharacterDef(petDef);
  }

  update(time, delta) {
    this.controls.update(delta);
    this.checkPlaces();
    this.debug.update();
  }

  // Tell the UI when the hero walks into or out of a place.
  checkPlaces() {
    const here = this.places.find(
      (p) => Phaser.Math.Distance.Between(this.hero.x, this.hero.y, p.x, p.y) < p.radius,
    ) ?? null;
    if (here === this.currentPlace) return;
    if (this.currentPlace) this.events.emit('place-leave', this.currentPlace);
    this.currentPlace = here;
    if (here) this.events.emit('place-enter', here);
  }
}
