import Phaser from 'phaser';
import { t } from '../config.js';

// Everything drawn on top of the map: the place banner, debug info.
// It runs at the same time as MapScene and listens to its events.
export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    const map = this.scene.get('MapScene');

    this.banner = this.add.container(0, 0).setAlpha(0);
    this.bannerBg = this.add.graphics();
    this.bannerTitle = this.add.text(0, 0, '', {
      fontFamily: 'sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#4a2f1d', resolution: window.devicePixelRatio,
    }).setOrigin(0.5, 0);
    this.bannerText = this.add.text(0, 0, '', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#4a2f1d', align: 'center', resolution: window.devicePixelRatio,
    }).setOrigin(0.5, 0);
    this.banner.add([this.bannerBg, this.bannerTitle, this.bannerText]);

    this.debugText = this.add.text(10, 10, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffff00', backgroundColor: '#000a', padding: { x: 6, y: 4 },
    }).setVisible(false);

    map.events.on('place-enter', (place) => this.showBanner(place));
    map.events.on('place-leave', () => this.hideBanner());
    map.events.on('debug', (on) => {
      this.debugText.setVisible(on).setText('DEBUG: click to get map coordinates  ( ` to close )');
    });
    map.events.on('debug-click', ({ x, y, walkable }) => {
      this.debugText.setText(`x: ${x}  y: ${y}  ${walkable ? 'walkable' : 'BLOCKED'}   ( \` to close )`);
    });

    this.scale.on('resize', () => this.layoutBanner());
  }

  showBanner(place) {
    this.bannerTitle.setText(t(place.name));
    this.bannerText.setText(t(place.text));
    this.layoutBanner();
    this.tweens.killTweensOf(this.banner);
    this.banner.y = this.bannerY + 30;
    this.tweens.add({ targets: this.banner, alpha: 1, y: this.bannerY, duration: 250, ease: 'Back.Out' });
  }

  hideBanner() {
    this.tweens.killTweensOf(this.banner);
    this.tweens.add({ targets: this.banner, alpha: 0, duration: 200 });
  }

  // Paper-like box near the bottom of the screen, sized to fit its text.
  layoutBanner() {
    const { width, height } = this.scale;
    this.bannerText.setWordWrapWidth(null); // measure the unwrapped text first
    const w =Math.min(width - 32, Math.max(this.bannerTitle.width, this.bannerText.width) + 60);
    this.bannerText.setWordWrapWidth(w - 40);
    const h = 30 + this.bannerTitle.height + 8 + this.bannerText.height;
    this.bannerTitle.setPosition(0, 14);
    this.bannerText.setPosition(0, 14 + this.bannerTitle.height + 8);
    this.bannerBg.clear()
      .fillStyle(0xf8f0d8, 0.95).fillRoundedRect(-w / 2, 0, w, h, 16)
      .lineStyle(4, 0x8a5a36, 1).strokeRoundedRect(-w / 2, 0, w, h, 16);
    this.bannerY = height - h - 24;
    this.banner.x = width / 2;
    if (!this.tweens.isTweening(this.banner)) this.banner.y = this.bannerY;
  }
}
