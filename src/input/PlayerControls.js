import Phaser from 'phaser';
import { findPath } from '../world/pathfinding.js';

// Turns keyboard and mouse/touch into movement for ONE character (the local player).
//   - Arrow keys or WASD: walk directly, sliding along trees instead of sticking.
//   - Click / tap: find a route there and walk it.
export class PlayerControls {
  constructor(scene, character, mask) {
    this.scene = scene;
    this.character = character;
    this.mask = mask;
    this.enabled = true;

    const kb = scene.input.keyboard;
    this.keys = kb.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D');

    // A little ring that shows where you tapped.
    this.marker = scene.add.circle(0, 0, 14).setStrokeStyle(4, 0xfff4c2, 0.9).setVisible(false).setDepth(1);

    scene.input.on('pointerup', (pointer) => {
      if (!this.enabled) return;
      // Ignore the end of a two-finger pinch or a long drag.
      if (pointer.getDistance() > 20) return;
      const p = pointer.positionToCamera(scene.cameras.main);
      this.goTo(p.x, p.y);
    });
  }

  goTo(x, y) {
    const path = findPath(this.mask, this.character.x, this.character.y, x, y);
    if (!path || !path.length) return;
    this.character.walkTo(path);
    const end = path[path.length - 1];
    this.marker.setPosition(end.x, end.y).setVisible(true).setScale(1).setAlpha(1);
    this.scene.tweens.add({ targets: this.marker, scale: 0.4, alpha: 0, duration: 600 });
  }

  update(delta) {
    if (!this.enabled) return;
    const k = this.keys;
    let dx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
    let dy = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0);
    if (!dx && !dy) return;

    this.character.stop(); // keyboard cancels any click-walk in progress
    const len = Math.hypot(dx, dy); // so diagonal isn't faster
    const stepLen = (this.character.speed * delta) / 1000;
    dx = (dx / len) * stepLen;
    dy = (dy / len) * stepLen;

    const { x, y } = this.character;
    const ok = (nx, ny) => this.mask.isWalkable(nx, ny);
    if (ok(x + dx, y + dy)) this.character.step(dx, dy);
    else if (dx && ok(x + dx, y)) this.character.step(dx, 0);      // slide sideways
    else if (dy && ok(x, y + dy)) this.character.step(0, dy);      // slide up/down
    else if (dx) this.character.face(dx);                          // bump: at least turn around
  }
}
