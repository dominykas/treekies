import Phaser from 'phaser';

// A character on the map: one of the kids' drawings plus a soft shadow.
//
// It doesn't care WHO is controlling it. The local player's keyboard/clicks,
// a pet following along, or (later) another player over the network all just
// call walkTo(...) or step(...). That's what will make multiplayer easy to add.
//
// Position (x, y) is where the FEET touch the ground, not the middle of the picture.
export class Character extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} def   entry from characters.json ({ id, height, facing, speed, imageFront, imageBack })
   */
  constructor(scene, x, y, def) {
    super(scene, x, y);
    this.path = [];                          // points still to walk to
    this.moving = false;
    this.walkTime = 0;                       // drives the bouncy walk
    this.trail = [{ x, y }];                 // recent footsteps, pets follow these

    this.shadow = scene.add.ellipse(0, 0, 1, 1, 0x000000, 0.22);
    this.sprite = scene.add.image(0, 0, def.id).setOrigin(0.5, 1); // origin at the feet
    this.add([this.shadow, this.sprite]);
    scene.add.existing(this);

    this.pose = null;
    this.setCharacterDef(def);
  }

  // Swap which set of drawings this character uses, e.g. when the player
  // picks a different character. Keeps its position, path and pet intact.
  setCharacterDef(def) {
    this.def = def;
    this.speed = def.speed ?? 200; // map pixels per second

    // Which drawing to show for which direction. "side" (def.id) always
    // exists; front/back are optional extra drawings (see characters.json).
    this.textures = { side: def.id };
    if (def.imageFront) this.textures.front = `${def.id}-front`;
    if (def.imageBack) this.textures.back = `${def.id}-back`;
    this.pose = null; // force setPose('side') below to actually apply
    this.sprite.setFlipX(false);
    this.setPose('side');

    const h = def.height ?? 100;
    this.shadow.setSize(h * 0.55, h * 0.14);
  }

  // Drawings can be any size scan - rescale so the character is always
  // `height` map-pixels tall, however wide or tall its source picture is.
  applyHeight() {
    const h = this.def.height ?? 100;
    this.sprite.setScale(h / this.sprite.height);
    this.baseScale = this.sprite.scaleX;
  }

  setPose(pose) {
    if (pose === this.pose) return;
    const key = this.textures[pose];
    if (!key) return;
    this.pose = pose;
    this.sprite.setTexture(key);
    this.applyHeight(); // the new drawing likely has different pixel dimensions
  }

  /** Walk through a list of {x, y} points (e.g. from pathfinding). */
  walkTo(points) {
    this.path = points ? [...points] : [];
  }

  stop() {
    this.path = [];
  }

  /** Move by (dx, dy) right now, used for keyboard control. */
  step(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.face(dx, dy);
    this.moving = true;
  }

  face(dx, dy) {
    // Mostly up/down movement: show the front/back drawing if we have one.
    // Otherwise use the side drawing, flipped to face left or right.
    const preferVertical = Math.abs(dy) > Math.abs(dx) * 1.5;
    if (preferVertical) {
      const pose = dy < 0 ? 'back' : 'front';
      if (this.textures[pose]) {
        this.setPose(pose);
        return;
      }
    }
    this.setPose('side');
    if (!dx) return;
    const drawnFacingRight = (this.def.facing ?? 'right') === 'right';
    this.sprite.setFlipX(drawnFacingRight ? dx < 0 : dx > 0);
  }

  preUpdate(time, delta) {
    const dt = delta / 1000;

    if (this.path.length) {
      const target = this.path[0];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      const stepLen = this.speed * dt;
      if (dist <= stepLen) {
        this.x = target.x;
        this.y = target.y;
        this.path.shift();
      } else {
        this.x += (dx / dist) * stepLen;
        this.y += (dy / dist) * stepLen;
      }
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) this.face(dx, dy);
      this.moving = true;
    }

    this.recordTrail();
    this.animateWalk(dt);
    this.setDepth(this.y); // things lower on the screen are drawn in front
    this.moving = false;   // must be set again next frame by step() or a path
  }

  recordTrail() {
    const last = this.trail[this.trail.length - 1];
    if (Math.hypot(this.x - last.x, this.y - last.y) >= 4) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 200) this.trail.shift();
    }
  }

  // No animation frames needed: we make the drawing hop and wobble as it walks.
  // (Blinking, waving etc. could be added here later with extra drawings.)
  animateWalk(dt) {
    if (this.moving) {
      this.walkTime += dt * 12;
    } else {
      // settle back down smoothly when we stop
      this.walkTime = Math.abs(Math.sin(this.walkTime)) < 0.1 ? 0 : this.walkTime + dt * 12;
    }
    const hop = Math.abs(Math.sin(this.walkTime));
    const h = this.def.height ?? 100;
    this.sprite.y = -hop * h * 0.08;
    this.sprite.rotation = Math.sin(this.walkTime) * 0.06;
    // a little squash when landing makes it feel alive
    const squash = this.walkTime ? (1 - hop) * 0.05 : 0;
    this.sprite.scaleY = this.baseScale * (1 - squash);
    this.sprite.scaleX = this.baseScale * (1 + squash);
    this.shadow.scaleX = 1 - hop * 0.2;
  }
}
