// The walk mask is a second picture, the same shape as the map:
//   dark (black) pixels  = you can NOT walk here (trees, water, houses)
//   light or transparent = you CAN walk here
// It may be smaller than the map (e.g. half size); we scale coordinates.
//
// We also chop the map into a grid of cells (CELL_SIZE px each). Pathfinding
// works on the grid because searching every single pixel would be far too slow.
export class WalkMask {
  constructor(scene, textureKey, worldWidth, worldHeight, cellSize) {
    const src = scene.textures.get(textureKey).getSourceImage();
    // Draw the mask into an invisible canvas so we can read its pixels.
    const canvas = document.createElement('canvas');
    canvas.width = src.width;
    canvas.height = src.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(src, 0, 0);
    this.pixels = ctx.getImageData(0, 0, src.width, src.height).data; // RGBA, 4 bytes per pixel
    this.maskWidth = src.width;
    this.maskHeight = src.height;
    this.scaleX = src.width / worldWidth;
    this.scaleY = src.height / worldHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.cellSize = cellSize;
    this.cols = Math.ceil(worldWidth / cellSize);
    this.rows = Math.ceil(worldHeight / cellSize);
    this.grid = new Uint8Array(this.cols * this.rows); // 1 = walkable
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const { x, y } = this.cellCenter(c, r);
        this.grid[r * this.cols + c] = this.isWalkable(x, y) ? 1 : 0;
      }
    }
  }

  /** Is the map point (x, y) walkable? */
  isWalkable(x, y) {
    if (x < 0 || y < 0 || x >= this.worldWidth || y >= this.worldHeight) return false;
    const px = Math.floor(x * this.scaleX);
    const py = Math.floor(y * this.scaleY);
    const i = (py * this.maskWidth + px) * 4;
    const [r, g, b, a] = [this.pixels[i], this.pixels[i + 1], this.pixels[i + 2], this.pixels[i + 3]];
    if (a < 128) return true;               // transparent = walkable
    return (r + g + b) / 3 >= 128;          // bright = walkable, dark = blocked
  }

  /** Can you walk in a straight line from a to b without touching a blocked pixel? */
  isClearLine(ax, ay, bx, by, step = 4) {
    const dist = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.ceil(dist / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (!this.isWalkable(ax + (bx - ax) * t, ay + (by - ay) * t)) return false;
    }
    return true;
  }

  cellOf(x, y) {
    return { c: Math.floor(x / this.cellSize), r: Math.floor(y / this.cellSize) };
  }

  cellCenter(c, r) {
    return { x: (c + 0.5) * this.cellSize, y: (r + 0.5) * this.cellSize };
  }

  isCellWalkable(c, r) {
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return false;
    return this.grid[r * this.cols + c] === 1;
  }

  /** Nearest walkable cell to (c, r), searching outwards in growing squares. */
  nearestWalkableCell(c, r, maxRadius = 40) {
    if (this.isCellWalkable(c, r)) return { c, r };
    for (let rad = 1; rad <= maxRadius; rad++) {
      let best = null;
      let bestD = Infinity;
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== rad) continue; // only the ring
          if (!this.isCellWalkable(c + dc, r + dr)) continue;
          const d = dc * dc + dr * dr;
          if (d < bestD) { bestD = d; best = { c: c + dc, r: r + dr }; }
        }
      }
      if (best) return best;
    }
    return null;
  }
}
