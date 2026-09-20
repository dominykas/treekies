import { t } from '../config.js';

// A "developer view" to help build the world (toggle with the ` key):
//   - red tint over everything that is NOT walkable
//   - circles around places, with their ids
//   - the route the hero is currently walking
//   - click anywhere to see (and copy from the console) its map coordinates,
//     handy for adding new places to public/data/world.json
export class DebugOverlay {
  constructor(scene) {
    this.scene = scene;
    this.on = false;
    this.objects = [];
  }

  toggle() {
    this.on = !this.on;
    if (this.on) this.build();
    else this.clear();
    this.scene.events.emit('debug', this.on);
  }

  build() {
    const { scene } = this;
    const { mask } = scene;

    // Red overlay made from the walk mask.
    if (!scene.textures.exists('mask-debug')) {
      const canvas = document.createElement('canvas');
      canvas.width = mask.maskWidth;
      canvas.height = mask.maskHeight;
      const ctx = canvas.getContext('2d');
      const img = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < mask.pixels.length; i += 4) {
        const p = mask.pixels;
        const blocked = p[i + 3] >= 128 && (p[i] + p[i + 1] + p[i + 2]) / 3 < 128;
        if (blocked) { img.data[i] = 255; img.data[i + 3] = 90; }
      }
      ctx.putImageData(img, 0, 0);
      scene.textures.addCanvas('mask-debug', canvas);
    }
    const overlay = scene.add.image(0, 0, 'mask-debug').setOrigin(0, 0).setDepth(9000);
    overlay.setDisplaySize(scene.mapWidth, scene.mapHeight);
    this.objects.push(overlay);

    for (const p of scene.places) {
      this.objects.push(
        scene.add.circle(p.x, p.y, p.radius).setStrokeStyle(3, 0xffff00).setDepth(9001),
        scene.add.text(p.x, p.y, `${p.id}\n${t(p.name)}`, { fontSize: '18px', color: '#ffff00', align: 'center', backgroundColor: '#0008' })
          .setOrigin(0.5).setDepth(9001),
      );
    }

    this.pathGfx = scene.add.graphics().setDepth(9002);
    this.objects.push(this.pathGfx);

    this.onClick = (pointer) => {
      const p = pointer.positionToCamera(scene.cameras.main);
      const x = Math.round(p.x), y = Math.round(p.y);
      console.log(`"x": ${x}, "y": ${y}, walkable: ${mask.isWalkable(x, y)}`);
      scene.events.emit('debug-click', { x, y, walkable: mask.isWalkable(x, y) });
    };
    scene.input.on('pointerdown', this.onClick);
  }

  clear() {
    this.objects.forEach((o) => o.destroy());
    this.objects = [];
    this.pathGfx = null;
    this.scene.input.off('pointerdown', this.onClick);
  }

  update() {
    if (!this.on || !this.pathGfx) return;
    const { hero } = this.scene;
    this.pathGfx.clear();
    if (!hero.path.length) return;
    this.pathGfx.lineStyle(4, 0x00ffff, 1);
    this.pathGfx.beginPath();
    this.pathGfx.moveTo(hero.x, hero.y);
    for (const pt of hero.path) this.pathGfx.lineTo(pt.x, pt.y);
    this.pathGfx.strokePath();
  }
}
