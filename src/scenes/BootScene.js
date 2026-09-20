import Phaser from 'phaser';

// Loads everything the game needs before we show the map.
// Step 1 (preload): the JSON files that describe the world.
// Step 2 (create):  the pictures those JSON files point to, with a progress bar.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.json('world', 'data/world.json');
    this.load.json('characters', 'data/characters.json');
  }

  create() {
    const world = this.cache.json.get('world');
    const characters = this.cache.json.get('characters');

    this.load.image('map', world.map.image);
    this.load.image('walkmask', world.map.walkmask);
    for (const c of [...characters.heroes, ...characters.pets]) {
      this.load.image(c.id, c.image);
      // Optional extra drawings for walking away from / toward the camera.
      if (c.imageFront) this.load.image(`${c.id}-front`, c.imageFront);
      if (c.imageBack) this.load.image(`${c.id}-back`, c.imageBack);
    }

    this.drawProgressBar();
    this.load.once('complete', () => this.scene.start('MapScene'));
    this.load.start();
  }

  drawProgressBar() {
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    const label = this.add
      .text(width / 2, height / 2 - 40, 'Miškinukės', { fontFamily: 'sans-serif', fontSize: '32px', color: '#f5efd8' })
      .setOrigin(0.5);
    this.load.on('progress', (p) => {
      bar.clear();
      bar.fillStyle(0xf5efd8, 1);
      bar.fillRect(width / 2 - 150, height / 2, 300 * p, 16);
      bar.lineStyle(2, 0xf5efd8, 1);
      bar.strokeRect(width / 2 - 150, height / 2, 300, 16);
    });
    this.load.once('complete', () => { bar.destroy(); label.destroy(); });
  }
}
