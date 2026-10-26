import { catmullRom } from './math.js';

export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 900;

// Hand-placed points around the circuit (clockwise). The spline smooths them out.
const CONTROL_POINTS = [
  [320, 770], [620, 780], [900, 760], [1120, 780], [1330, 740],
  [1460, 620], [1450, 470], [1330, 400], [1180, 430], [1060, 500],
  [930, 470], [880, 360], [960, 250], [1140, 210], [1330, 205],
  [1460, 190], [1530, 130], [1500, 65], [1400, 40], [1260, 45], [1000, 70],
  [720, 110], [560, 210],
  [520, 350], [400, 420], [250, 400], [150, 480], [140, 640],
  [200, 740],
];

const SAMPLES_PER_SEGMENT = 20;

export class Track {
  constructor(points = CONTROL_POINTS, width = 60) {
    this.width = width;
    this.controlPoints = points.map(([x, y]) => ({ x, y }));
    this.path = this.buildPath();
  }

  // Turn the control points into a dense loop of points along the centre line
  buildPath() {
    const cp = this.controlPoints;
    const n = cp.length;
    const path = [];

    for (let i = 0; i < n; i++) {
      const p0 = cp[(i - 1 + n) % n];
      const p1 = cp[i];
      const p2 = cp[(i + 1) % n];
      const p3 = cp[(i + 2) % n];
      for (let s = 0; s < SAMPLES_PER_SEGMENT; s++) {
        path.push(catmullRom(p0, p1, p2, p3, s / SAMPLES_PER_SEGMENT));
      }
    }

    // direction and normal at each point, used for kerbs and sand traps
    for (let i = 0; i < path.length; i++) {
      const prev = path[(i - 1 + path.length) % path.length];
      const next = path[(i + 1) % path.length];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy);
      path[i].dirX = dx / len;
      path[i].dirY = dy / len;
      path[i].normalX = -path[i].dirY;
      path[i].normalY = path[i].dirX;
    }

    // curvature: how much the direction changes between neighbours (signed)
    for (let i = 0; i < path.length; i++) {
      const a = path[(i - 3 + path.length) % path.length];
      const b = path[(i + 3) % path.length];
      path[i].curve = a.dirX * b.dirY - a.dirY * b.dirX;
    }

    return path;
  }

  // Finds the closest centre-line point. Returns its index and the distance to it.
  nearest(x, y) {
    let best = Infinity;
    let index = 0;
    for (let i = 0; i < this.path.length; i++) {
      const dx = this.path[i].x - x;
      const dy = this.path[i].y - y;
      const d = dx * dx + dy * dy;
      if (d < best) {
        best = d;
        index = i;
      }
    }
    return { index, distance: Math.sqrt(best) };
  }

  isOnTrack(x, y) {
    return this.nearest(x, y).distance <= this.width / 2;
  }

  get start() {
    return this.path[0];
  }
}
