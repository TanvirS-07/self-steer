import { WORLD_WIDTH, WORLD_HEIGHT } from './track.js';
import { seededRandom } from './math.js';

const COLORS = {
  grass: '#74a845',
  grassDark: '#62933a',
  grassLight: '#86b955',
  sand: '#e2cd97',
  sandDark: '#c9b07a',
  gravel: '#b39b6a',
  asphalt: '#55585c',
  asphaltEdge: '#4a4d51',
  kerbRed: '#d83a2e',
  white: '#f4f4f0',
  treeShadow: 'rgba(20, 50, 15, 0.35)',
  treeDark: '#2e7d32',
  treeMid: '#3f9b3c',
  treeLight: '#5cb64a',
};

// Scenery is generated over a much bigger area than the track so there's
// always something to see at the edges, however wide or tall the screen is.
const SCENE = { x: -800, y: -600, width: WORLD_WIDTH + 1600, height: WORLD_HEIGHT + 1200 };

// Buildings round the start straight. Positions were picked to sit just behind the barriers.
const GRANDSTAND = { x: 420, y: 630, w: 440, h: 42 };
const PIT_BUILDING = { x: 380, y: 850, w: 500, h: 28 };
const PADDOCK = { x: 380, y: 886, w: 500, h: 70 };

// Areas kept clear of trees because something else is built there
const CLEARINGS = [GRANDSTAND, PIT_BUILDING, PADDOCK];

function isBlocked(x, y) {
  return CLEARINGS.some((r) => x > r.x - 20 && x < r.x + r.w + 20 && y > r.y - 20 && y < r.y + r.h + 20);
}

// The track and scenery never change, so we draw them once to an offscreen
// canvas and just copy that every frame. `area` is the part of the world that's
// on screen and `scale` is screen pixels per world unit.
export function renderScenery(track, area, scale) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(area.width * scale);
  canvas.height = Math.ceil(area.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.translate(-area.x, -area.y);

  const random = seededRandom(7);

  drawGrass(ctx, random);
  drawSandTraps(ctx, track, random);
  drawRoad(ctx, track, random);
  drawBarriers(ctx, track, area, scale);
  drawStartLine(ctx, track);
  drawTyreStacks(ctx, track);
  drawPaddock(ctx, random);
  drawPitBuilding(ctx);
  drawGrandstand(ctx, random);
  drawTrees(ctx, track, random);

  return canvas;
}

function drawGrass(ctx, random) {
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(SCENE.x, SCENE.y, SCENE.width, SCENE.height);

  // big soft patches of lighter and darker grass, like uneven ground
  for (let i = 0; i < 500; i++) {
    const x = SCENE.x + random() * SCENE.width;
    const y = SCENE.y + random() * SCENE.height;
    const r = 40 + random() * 140;
    const light = random() < 0.5;
    const patch = ctx.createRadialGradient(x, y, 0, x, y, r);
    patch.addColorStop(0, light ? 'rgba(160, 200, 100, 0.18)' : 'rgba(60, 100, 35, 0.16)');
    patch.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = patch;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // little tufts so it doesn't look like a flat fill
  for (let i = 0; i < 30000; i++) {
    ctx.fillStyle = random() < 0.5 ? COLORS.grassDark : COLORS.grassLight;
    ctx.fillRect(SCENE.x + random() * SCENE.width, SCENE.y + random() * SCENE.height, 1.5, 2.5);
  }
}

function strokeLoop(ctx, path) {
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.closePath();
  ctx.stroke();
}

// Gravel traps on the outside of the tighter corners. Consecutive corner points
// are joined into one band so each trap is a single smooth shape.
function drawSandTraps(ctx, track, random) {
  const half = track.width / 2;
  const path = track.path;
  const runs = [];
  let run = null;

  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    const side = p.curve > 0 ? -1 : 1;
    if (Math.abs(p.curve) < 0.1 || (run && run.side !== side)) {
      run = null;
      if (Math.abs(p.curve) < 0.1) continue;
    }
    if (!run) {
      run = { side, points: [] };
      runs.push(run);
    }
    run.points.push({
      x: p.x + p.normalX * side * (half + 14),
      y: p.y + p.normalY * side * (half + 14),
    });
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [color, width] of [[COLORS.sandDark, 26], [COLORS.sand, 22]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    for (const r of runs) {
      ctx.beginPath();
      r.points.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.stroke();
    }
  }

  // gravel texture
  for (const r of runs) {
    for (const pt of r.points) {
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = random() < 0.6 ? COLORS.gravel : '#efe2bb';
        ctx.fillRect(pt.x + (random() - 0.5) * 20, pt.y + (random() - 0.5) * 20, 1.5, 1.5);
      }
    }
  }
}

function drawRoad(ctx, track, random) {
  const w = track.width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // white outer line
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = w + 8;
  strokeLoop(ctx, track.path);

  // asphalt, a touch darker at the edges where cars don't clean it
  ctx.strokeStyle = COLORS.asphaltEdge;
  ctx.lineWidth = w;
  strokeLoop(ctx, track.path);
  ctx.strokeStyle = COLORS.asphalt;
  ctx.lineWidth = w - 10;
  strokeLoop(ctx, track.path);

  // speckle the asphalt a bit, only where it's actually road
  for (const p of track.path) {
    for (let i = 0; i < 6; i++) {
      const offset = (random() - 0.5) * w * 0.9;
      const along = (random() - 0.5) * 8;
      const x = p.x + p.normalX * offset + p.dirX * along;
      const y = p.y + p.normalY * offset + p.dirY * along;
      ctx.fillStyle = random() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.07)';
      ctx.fillRect(x, y, 2, 2);
    }
  }

  drawKerbs(ctx, track);
  drawSkidMarks(ctx, track, random);
}

// Red and white blocks along both edges, only through the corners like a real circuit
function drawKerbs(ctx, track) {
  const path = track.path;
  const inner = track.width / 2 - 1;
  const outer = inner + 7;

  for (let i = 0; i < path.length; i++) {
    const a = path[i];
    const b = path[(i + 1) % path.length];
    if (Math.abs(a.curve) < 0.06) continue;

    ctx.fillStyle = i % 2 === 0 ? COLORS.kerbRed : COLORS.white;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(a.x + a.normalX * side * inner, a.y + a.normalY * side * inner);
      ctx.lineTo(b.x + b.normalX * side * inner, b.y + b.normalY * side * inner);
      ctx.lineTo(b.x + b.normalX * side * outer, b.y + b.normalY * side * outer);
      ctx.lineTo(a.x + a.normalX * side * outer, a.y + a.normalY * side * outer);
      ctx.closePath();
      ctx.fill();
    }
  }
}

// Dark rubber lines through the corners, roughly on the racing line
function drawSkidMarks(ctx, track, random) {
  ctx.strokeStyle = 'rgba(30, 30, 30, 0.25)';
  ctx.lineWidth = 1.5;
  const path = track.path;
  for (let i = 0; i < path.length; i++) {
    if (Math.abs(path[i].curve) < 0.15 || random() > 0.15) continue;
    const offset = (random() - 0.5) * track.width * 0.5;
    ctx.beginPath();
    for (let j = 0; j < 12; j++) {
      const p = path[(i + j) % path.length];
      const x = p.x + p.normalX * offset;
      const y = p.y + p.normalY * offset;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawStartLine(ctx, track) {
  const p = track.start;
  const half = track.width / 2;
  const square = 5;
  const rows = 2;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.atan2(p.dirY, p.dirX));

  // checkered line across the road
  for (let r = 0; r < rows; r++) {
    for (let y = -half; y < half; y += square) {
      const dark = (Math.round((y + half) / square) + r) % 2 === 0;
      ctx.fillStyle = dark ? '#222' : COLORS.white;
      ctx.fillRect(r * square, y, square, square);
    }
  }

  // grid boxes behind the line, staggered like a real grid
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 2;
  for (let slot = 0; slot < 6; slot++) {
    const x = -24 - slot * 22;
    const y = slot % 2 === 0 ? -half / 2 : half / 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 8);
    ctx.lineTo(x, y - 8);
    ctx.lineTo(x, y + 8);
    ctx.lineTo(x + 8, y + 8);
    ctx.stroke();
  }

  ctx.restore();
}

// Grey steel barriers all the way round. The barrier sits at a fixed distance from
// the centre line, so it's the outline of a very wide stroke along the track. Drawing
// that stroke and then cutting out the middle leaves just the outline.
function drawBarriers(ctx, track, area, scale) {
  const layer = document.createElement('canvas');
  layer.width = ctx.canvas.width;
  layer.height = ctx.canvas.height;
  const lctx = layer.getContext('2d');
  lctx.scale(scale, scale);
  lctx.translate(-area.x, -area.y);
  lctx.lineJoin = 'round';

  lctx.strokeStyle = '#5f646b';
  lctx.lineWidth = track.barrier * 2 + 6;
  strokeLoop(lctx, track.path);
  lctx.strokeStyle = '#c3c7cc';
  lctx.lineWidth = track.barrier * 2 + 4;
  strokeLoop(lctx, track.path);

  lctx.globalCompositeOperation = 'destination-out';
  lctx.lineWidth = track.barrier * 2;
  strokeLoop(lctx, track.path);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.drawImage(layer, area.x, area.y, area.width, area.height);
  ctx.restore();

  // posts holding the barrier up, skipped where the barrier from another
  // part of the track is closer (inside tight corners)
  ctx.fillStyle = '#4b4f55';
  for (let i = 0; i < track.path.length; i += 2) {
    const p = track.path[i];
    for (const side of [-1, 1]) {
      const x = p.x + p.normalX * side * (track.barrier + 1);
      const y = p.y + p.normalY * side * (track.barrier + 1);
      if (track.nearest(x, y).distance < track.barrier - 1) continue;
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
  }
}

function drawShadow(ctx, rect, depth) {
  ctx.fillStyle = 'rgba(20, 30, 15, 0.35)';
  ctx.fillRect(rect.x + depth, rect.y + depth, rect.w, rect.h);
}

// Covered grandstand facing the start straight: roof at the back, crowd at the front
function drawGrandstand(ctx, random) {
  const g = GRANDSTAND;
  drawShadow(ctx, g, 6);

  // seating, with a dot for each person
  ctx.fillStyle = '#8d9399';
  ctx.fillRect(g.x, g.y, g.w, g.h);
  const shirts = ['#e53935', '#1e88e5', '#fdd835', '#ffffff', '#43a047', '#fb8c00', '#212121', '#8e24aa'];
  for (let row = g.y + 20; row < g.y + g.h - 3; row += 5) {
    ctx.fillStyle = '#6d7379';
    ctx.fillRect(g.x, row + 2.5, g.w, 1);
    for (let x = g.x + 3; x < g.x + g.w - 3; x += 3.5) {
      if (random() < 0.2) continue;
      ctx.fillStyle = shirts[Math.floor(random() * shirts.length)];
      ctx.fillRect(x, row, 2.5, 2.5);
    }
  }

  // roof panels
  ctx.fillStyle = '#e6e8ea';
  ctx.fillRect(g.x - 4, g.y - 4, g.w + 8, 22);
  ctx.fillStyle = '#c4c8cc';
  for (let x = g.x; x < g.x + g.w; x += 20) {
    ctx.fillRect(x, g.y - 4, 1.5, 22);
  }
  ctx.fillStyle = '#b0b5ba';
  ctx.fillRect(g.x - 4, g.y + 16, g.w + 8, 2);
}

// Pit garages behind the barrier on the start straight
function drawPitBuilding(ctx) {
  const p = PIT_BUILDING;
  drawShadow(ctx, p, 5);

  ctx.fillStyle = '#3e4349';
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.fillStyle = '#4c5258';
  ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);

  // a red stripe of team awnings along the front
  for (let x = p.x + 4; x < p.x + p.w - 20; x += 24) {
    ctx.fillStyle = '#c62828';
    ctx.fillRect(x, p.y + 2, 20, 5);
  }

  // air conditioning units on the roof
  ctx.fillStyle = '#9ea4aa';
  for (let x = p.x + 30; x < p.x + p.w - 20; x += 70) {
    ctx.fillRect(x, p.y + 12, 10, 8);
    ctx.fillStyle = '#7d838a';
    ctx.beginPath();
    ctx.arc(x + 5, p.y + 16, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9ea4aa';
  }
}

// Concrete paddock behind the pits with team trucks parked in a row
function drawPaddock(ctx, random) {
  const p = PADDOCK;
  ctx.fillStyle = '#a7a9a4';
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  for (let x = p.x; x < p.x + p.w; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, p.y);
    ctx.lineTo(x, p.y + p.h);
    ctx.stroke();
  }

  const liveries = ['#1e88e5', '#e53935', '#fdd835', '#43a047', '#ffffff', '#fb8c00'];
  for (let x = p.x + 10; x < p.x + p.w - 20; x += 40) {
    if (random() < 0.25) continue;
    const truck = { x, y: p.y + 12, w: 16, h: 46 };
    drawShadow(ctx, truck, 3);
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(truck.x, truck.y + 10, truck.w, truck.h - 10);
    ctx.fillStyle = liveries[Math.floor(random() * liveries.length)];
    ctx.fillRect(truck.x, truck.y, truck.w, 9);
    ctx.fillRect(truck.x + 6, truck.y + 12, 4, truck.h - 14);
  }
}

// Stacks of tyres on the inside of the sharpest corners
function drawTyreStacks(ctx, track) {
  const half = track.width / 2;
  const path = track.path;
  for (let i = 0; i < path.length; i += 3) {
    const p = path[i];
    if (Math.abs(p.curve) < 0.2) continue;
    const side = p.curve > 0 ? 1 : -1;
    const x = p.x + p.normalX * side * (track.barrier - 5);
    const y = p.y + p.normalY * side * (track.barrier - 5);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = i % 2 === 0 ? COLORS.kerbRed : COLORS.white;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawTrees(ctx, track, random) {
  const minGap = track.width / 2 + 40;
  const trees = [];

  // trees grow in clumps, which looks a lot more natural than spreading them evenly
  for (let clump = 0; clump < 1100; clump++) {
    const cx = SCENE.x + random() * SCENE.width;
    const cy = SCENE.y + random() * SCENE.height;
    const count = 4 + Math.floor(random() * 12);
    const pine = random() < 0.25;
    for (let i = 0; i < count; i++) {
      const x = cx + (random() - 0.5) * 100;
      const y = cy + (random() - 0.5) * 100;
      if (track.nearest(x, y).distance < minGap || isBlocked(x, y)) continue;
      trees.push({
        x,
        y,
        r: pine ? 7 + random() * 5 : 8 + random() * 10,
        pine,
        // every tree a slightly different shade of green
        hue: 95 + random() * 30,
        light: random() * 8,
        seed: random(),
      });
    }
  }

  // draw top to bottom so lower trees overlap the ones behind them
  trees.sort((a, b) => a.y - b.y);

  ctx.fillStyle = 'rgba(25, 45, 15, 0.3)';
  for (const t of trees) {
    ctx.beginPath();
    ctx.ellipse(t.x + t.r * 0.45, t.y + t.r * 0.55, t.r * 1.05, t.r * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const t of trees) {
    if (t.pine) drawPine(ctx, t);
    else drawLeafyTree(ctx, t);
  }
}

// A round canopy made of a few overlapping blobs, lit from the top left
function drawLeafyTree(ctx, t) {
  const lobes = 5;
  const blobs = [];
  for (let i = 0; i < lobes; i++) {
    const angle = (i / lobes) * Math.PI * 2 + t.seed * 6;
    blobs.push({ x: t.x + Math.cos(angle) * t.r * 0.45, y: t.y + Math.sin(angle) * t.r * 0.45 });
  }

  ctx.fillStyle = `hsl(${t.hue}, 45%, ${20 + t.light}%)`;
  for (const b of blobs) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, t.r * 0.62, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = `hsl(${t.hue}, 42%, ${30 + t.light}%)`;
  for (const b of blobs) {
    ctx.beginPath();
    ctx.arc(b.x - t.r * 0.12, b.y - t.r * 0.12, t.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = `hsl(${t.hue - 10}, 45%, ${42 + t.light}%)`;
  ctx.beginPath();
  ctx.arc(t.x - t.r * 0.3, t.y - t.r * 0.32, t.r * 0.32, 0, Math.PI * 2);
  ctx.fill();
}

// Pines from above look like a dark star
function drawPine(ctx, t) {
  const points = 9;
  const layers = [
    [1, `hsl(${t.hue + 20}, 40%, ${16 + t.light}%)`],
    [0.65, `hsl(${t.hue + 20}, 38%, ${24 + t.light}%)`],
    [0.3, `hsl(${t.hue + 15}, 35%, ${32 + t.light}%)`],
  ];
  for (const [size, color] of layers) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0 ? t.r : t.r * 0.55) * size;
      const angle = (i / (points * 2)) * Math.PI * 2 + t.seed;
      const x = t.x + Math.cos(angle) * r;
      const y = t.y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
}
