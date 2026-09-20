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
    this.map = map;

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

    // Character picker: press C to swap the hero's / sidekick's sprite-set.
    this.buildPicker();
    this.input.keyboard.on('keydown-C', () => this.togglePicker());
    this.input.keyboard.on('keydown-ESC', () => { if (this.picker.visible) this.togglePicker(); });
    this.input.keyboard.on('keydown-LEFT', () => this.movePickerCol(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.movePickerCol(1));
    this.input.keyboard.on('keydown-UP', () => this.movePickerRow(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.movePickerRow(1));
    this.pickerHint = this.add.text(10, 0, t({ lt: '[C] veikėjas', en: '[C] character' }), {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffffa0',
    });
    this.scale.on('resize', () => { this.pickerHint.y = this.scale.height - 24; });
    this.pickerHint.y = this.scale.height - 24;

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

  // A modal with two independent rows - hero and sidekick - each a strip of
  // portraits. Arrow keys move within a row (left/right) or between rows
  // (up/down) and apply the pick immediately; click works too. Escape or C
  // closes it. See MapScene.setHero / setPet for what "applying" means.
  buildPicker() {
    const characters = this.cache.json.get('characters');
    this.pickerRows = [
      { items: characters.heroes, title: { lt: 'Veikėjas', en: 'Character' }, current: () => this.map.hero.def.id, pick: (id) => this.map.setHero(id) },
      { items: characters.pets, title: { lt: 'Augintinis', en: 'Sidekick' }, current: () => this.map.pet.def.id, pick: (id) => this.map.setPet(id) },
    ];
    this.pickerRow = 0;

    // Dims the map and swallows clicks so they can't reach it while the
    // modal is open. A plain rectangle, not inside the panel container,
    // so it can cover the full (resizable) screen independently.
    this.pickerBackdrop = this.add.rectangle(0, 0, 10, 10, 0x000000, 0.5)
      .setOrigin(0, 0).setInteractive().setVisible(false).setDepth(1999);
    this.pickerBackdrop.input.enabled = false;
    this.pickerBackdrop.on('pointerdown', () => this.togglePicker());

    this.picker = this.add.container(0, 0).setVisible(false).setDepth(2000);
    const bg = this.add.graphics();
    this.picker.add(bg);

    const cardW = 130;
    const hint = this.add.text(0, 0, t({ lt: '← → rinktis   ↑ ↓ keisti eilutę   Esc uždaryti', en: '← → choose   ↑ ↓ switch row   Esc to close' }), {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#4a2f1d99',
    }).setOrigin(0.5, 0);
    this.picker.add(hint);

    let y = 16;
    this.pickerRows.forEach((row) => {
      const rowTop = y - 10; // a bit of breathing room above the title

      row.titleText = this.add.text(0, y, '', {
        fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#4a2f1d',
      }).setOrigin(0.5, 0);
      y += row.titleText.height + 10;

      const portraitH = 90;
      let labelH = 0;
      const startX = -((row.items.length - 1) * cardW) / 2;
      row.cards = row.items.map((item, i) => {
        const cardX = startX + i * cardW;
        const key = item.imageFront ? `${item.id}-front` : item.id;
        const portrait = this.add.image(cardX, y, key).setOrigin(0.5, 0);
        portrait.setScale(portraitH / portrait.height);
        const label = this.add.text(cardX, y + portraitH + 6, item.name, {
          fontFamily: 'sans-serif', fontSize: '15px', color: '#4a2f1d',
        }).setOrigin(0.5, 0);
        labelH = label.height;
        const highlight = this.add.rectangle(cardX, y - 6, cardW - 16, portraitH + labelH + 22, 0xf2b134, 0.25)
          .setOrigin(0.5, 0).setStrokeStyle(3, 0xf2b134, 1).setVisible(false);
        portrait.setInteractive({ useHandCursor: true });
        portrait.input.enabled = false;
        portrait.on('pointerdown', () => {
          this.pickerRow = this.pickerRows.indexOf(row);
          row.pick(item.id);
          this.updatePickerHighlights();
        });
        this.picker.add([highlight, portrait, label]);
        return { id: item.id, highlight, portrait };
      });
      y += portraitH + labelH + 24;
      row.top = rowTop;
      row.bottom = y;
      y += 10; // gap between rows, outside the band
    });

    hint.setPosition(0, y - 2);
    y += hint.height + 16;

    const w = Math.max(...this.pickerRows.map((r) => r.items.length * cardW)) + 40;
    bg.fillStyle(0xf8f0d8, 0.95).fillRoundedRect(-w / 2, 0, w, y, 16)
      .lineStyle(4, 0x8a5a36, 1).strokeRoundedRect(-w / 2, 0, w, y, 16);

    // A band behind the whole row, shown for whichever row the arrow keys
    // currently act on - the individual gold card highlight alone didn't
    // make it obvious that Up/Down even does something.
    this.pickerRows.forEach((row) => {
      row.band = this.add.rectangle(0, row.top, w - 16, row.bottom - row.top, 0xf2b134, 0.14)
        .setOrigin(0.5, 0).setStrokeStyle(2, 0xf2b134, 0.6).setVisible(false);
      this.picker.addAt(row.band, 1); // just above bg, behind titles/cards
    });

    this.scale.on('resize', () => this.layoutPicker());
    this.layoutPicker();
  }

  layoutPicker() {
    const { width, height } = this.scale;
    this.pickerBackdrop.setSize(width, height);
    this.picker.setPosition(width / 2, height / 2 - 170);
  }

  togglePicker() {
    const opening = !this.picker.visible;
    this.picker.setVisible(opening);
    this.pickerBackdrop.setVisible(opening);
    // Phaser's input hit-testing ignores .visible, so a hidden-but-still-
    // interactive backdrop/portrait would keep swallowing clicks meant for
    // the map underneath. Toggle .input.enabled explicitly to actually turn
    // them off.
    this.pickerBackdrop.input.enabled = opening;
    this.pickerRows.forEach((row) => row.cards.forEach((card) => { card.portrait.input.enabled = opening; }));
    this.map.controls.enabled = !opening; // don't walk into a tree while browsing the menu
    if (opening) {
      this.pickerRow = 0;
      this.updatePickerHighlights();
    }
  }

  // Move the keyboard cursor left/right within the focused row, applying
  // the newly-highlighted item immediately (it's a picker, not a form).
  movePickerCol(dir) {
    if (!this.picker.visible) return;
    const row = this.pickerRows[this.pickerRow];
    const from = row.items.findIndex((it) => it.id === row.current());
    const to = Phaser.Math.Wrap(from + dir, 0, row.items.length);
    row.pick(row.items[to].id);
    this.updatePickerHighlights();
  }

  movePickerRow(dir) {
    if (!this.picker.visible) return;
    this.pickerRow = Phaser.Math.Clamp(this.pickerRow + dir, 0, this.pickerRows.length - 1);
    this.updatePickerHighlights();
  }

  // Redraw: every row always shows its currently-equipped item highlighted;
  // the row the keyboard is about to affect also gets its whole band lit up
  // and a bolder title, so Up/Down's effect is obvious.
  updatePickerHighlights() {
    this.pickerRows.forEach((row, r) => {
      const focused = r === this.pickerRow;
      row.band.setVisible(focused);
      row.titleText.setText(`${focused ? '▸ ' : ''}${t(row.title)}`);
      row.titleText.setColor(focused ? '#8a3a1d' : '#4a2f1d');
      const currentId = row.current();
      row.cards.forEach((card) => card.highlight.setVisible(card.id === currentId));
    });
  }
}
