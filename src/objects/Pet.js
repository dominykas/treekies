import { Character } from './Character.js';

// A pet walks behind its owner by following the owner's footsteps (trail).
export class Pet extends Character {
  constructor(scene, owner, def, followDistance = 70) {
    super(scene, owner.x - followDistance, owner.y, def);
    this.owner = owner;
    this.followDistance = followDistance;
    this.speed = (owner.speed ?? 200) * 1.3; // a bit faster so it can catch up
    // Pretend the owner just walked here from where the pet is standing,
    // so the pet doesn't run into the owner at the very start.
    owner.trail.unshift({ x: this.x, y: this.y });
  }

  preUpdate(time, delta) {
    // Walk back along the owner's trail until we're followDistance behind them.
    const trail = this.owner.trail;
    let remaining = this.followDistance;
    let target = trail[0];
    for (let i = trail.length - 1; i > 0; i--) {
      const a = trail[i], b = trail[i - 1];
      const seg = Math.hypot(a.x - b.x, a.y - b.y);
      if (seg >= remaining) {
        const t = remaining / seg;
        target = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        break;
      }
      remaining -= seg;
    }
    const far = Math.hypot(target.x - this.x, target.y - this.y);
    this.walkTo(far > 3 ? [target] : []);
    super.preUpdate(time, delta);
  }
}
