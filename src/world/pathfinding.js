// A* ("A-star") pathfinding: finds the shortest route on the WalkMask grid
// from where the character stands to where you clicked, going around trees.
//
// Idea in one sentence: keep a list of cells to explore, always explore the
// one that looks cheapest (distance walked so far + straight-line guess of the
// distance left), until you reach the goal.

const SQRT2 = Math.SQRT2;
const NEIGHBOURS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, SQRT2], [1, -1, SQRT2], [-1, 1, SQRT2], [-1, -1, SQRT2],
];

/**
 * Returns a list of {x, y} map points to walk through (not including the start),
 * or null if there is no way to get there.
 */
export function findPath(mask, fromX, fromY, toX, toY) {
  const s = mask.cellOf(fromX, fromY);
  const g = mask.cellOf(toX, toY);
  const start = mask.nearestWalkableCell(s.c, s.r);
  const goal = mask.nearestWalkableCell(g.c, g.r); // clicked on a tree? go to the nearest path
  if (!start || !goal) return null;

  const cols = mask.cols;
  const idx = (c, r) => r * cols + c;
  const startI = idx(start.c, start.r);
  const goalI = idx(goal.c, goal.r);

  const cost = new Float32Array(mask.cols * mask.rows).fill(Infinity);
  const cameFrom = new Int32Array(mask.cols * mask.rows).fill(-1);
  const closed = new Uint8Array(mask.cols * mask.rows);
  const guess = (c, r) => Math.hypot(goal.c - c, goal.r - r);

  const open = new MinHeap();
  cost[startI] = 0;
  open.push(startI, guess(start.c, start.r));

  while (open.size) {
    const cur = open.pop();
    if (cur === goalI) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const c = cur % cols;
    const r = (cur - c) / cols;
    for (const [dc, dr, stepCost] of NEIGHBOURS) {
      const nc = c + dc;
      const nr = r + dr;
      if (!mask.isCellWalkable(nc, nr)) continue;
      // don't squeeze diagonally between two blocked cells
      if (dc && dr && (!mask.isCellWalkable(c + dc, r) || !mask.isCellWalkable(c, r + dr))) continue;
      const ni = idx(nc, nr);
      const newCost = cost[cur] + stepCost;
      if (newCost < cost[ni]) {
        cost[ni] = newCost;
        cameFrom[ni] = cur;
        open.push(ni, newCost + guess(nc, nr));
      }
    }
  }

  if (goalI !== startI && cameFrom[goalI] === -1) return null; // unreachable

  // Walk backwards from the goal to rebuild the route.
  const cells = [];
  for (let i = goalI; i !== -1 && i !== startI; i = cameFrom[i]) cells.push(i);
  cells.reverse();
  const points = cells.map((i) => mask.cellCenter(i % cols, Math.floor(i / cols)));

  // If you clicked on a walkable spot, finish exactly there instead of the cell centre.
  if (mask.isWalkable(toX, toY)) points.push({ x: toX, y: toY });
  return smooth(mask, { x: fromX, y: fromY }, points);
}

// Grid paths zig-zag. "String pulling": from each point, skip ahead to the
// furthest later point you can reach in a straight line.
function smooth(mask, start, points) {
  const out = [];
  let from = start;
  let i = 0;
  while (i < points.length) {
    let j = points.length - 1;
    while (j > i && !mask.isClearLine(from.x, from.y, points[j].x, points[j].y)) j--;
    out.push(points[j]);
    from = points[j];
    i = j + 1;
  }
  return out;
}

// A tiny priority queue: pop() always returns the item with the smallest priority.
class MinHeap {
  constructor() { this.items = []; this.prios = []; }
  get size() { return this.items.length; }
  push(item, prio) {
    const a = this.items, p = this.prios;
    a.push(item); p.push(prio);
    let i = a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (p[parent] <= p[i]) break;
      [a[i], a[parent]] = [a[parent], a[i]];
      [p[i], p[parent]] = [p[parent], p[i]];
      i = parent;
    }
  }
  pop() {
    const a = this.items, p = this.prios;
    const top = a[0];
    const lastItem = a.pop(), lastPrio = p.pop();
    if (a.length) {
      a[0] = lastItem; p[0] = lastPrio;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && p[l] < p[m]) m = l;
        if (r < a.length && p[r] < p[m]) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        [p[i], p[m]] = [p[m], p[i]];
        i = m;
      }
    }
    return top;
  }
}
