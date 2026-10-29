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

// Farmland around the circuit. Mostly off screen on a 16:9 display but it fills
// the edges on wider or taller screens.
const FIELDS = [
  { x: -260, y: 90, w: 290, h: 200, crop: 'wheat' },
  { x: -260, y: 320, w: 290, h: 210, crop: 'lettuce' },
  { x: 1650, y: 290, w: 250, h: 190, crop: 'ploughed' },
  { x: 1650, y: 510, w: 250, h: 180, crop: 'wheat' },
  { x: 960, y: 910, w: 300, h: 150, crop: 'lettuce' },
  { x: 250, y: -330, w: 330, h: 170, crop: 'ploughed' },
];
const FARMHOUSE = { x: -150, y: 560, w: 46, h: 34 };
const DIRT_ROADS = [
  [[-500, 305], [-120, 305], [20, 300], [40, 240], [30, -200]],
  [[1600, 500], [1700, 497], [1990, 505]],
  [[380, 956], [380, 1010], [900, 1000], [1300, 905], [1600, 700], [1640, 500]],
];

// Areas kept clear of trees because something else is built there
const CLEARINGS = [GRANDSTAND, PIT_BUILDING, PADDOCK, FARMHOUSE, ...FIELDS];

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
  drawFields(ctx);
  drawDirtRoads(ctx);
  drawFarmhouse(ctx);
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

const CROPS = {
  wheat: { base: '#d8b45a', row: '#c29a42' },
  lettuce: { base: '#5f9a3a', row: '#4a7f2c' },
  ploughed: { base: '#8a6a45', row: '#735638' },
};

// Fields are a base colour with darker rows across them and a hedge round the edge
function drawFields(ctx) {
  for (const f of FIELDS) {
    const crop = CROPS[f.crop];
    ctx.fillStyle = crop.base;
    ctx.fillRect(f.x, f.y, f.w, f.h);
    ctx.fillStyle = crop.row;
    for (let y = f.y + 3; y < f.y + f.h; y += 6) {
      ctx.fillRect(f.x, y, f.w, 2);
    }
    ctx.strokeStyle = '#3d6b26';
    ctx.lineWidth = 5;
    ctx.strokeRect(f.x, f.y, f.w, f.h);
  }
}

function drawDirtRoads(ctx) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [color, width] of [['#b8996b', 13], ['#d6bd8f', 9]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    for (const road of DIRT_ROADS) {
      ctx.beginPath();
      road.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
    }
  }
}

// A house with a pitched roof: two halves in different shades so it looks lit from one side
function drawFarmhouse(ctx) {
  const h = FARMHOUSE;
  drawShadow(ctx, h, 5);
  ctx.fillStyle = '#b5523b';
  ctx.fillRect(h.x, h.y, h.w, h.h / 2);
  ctx.fillStyle = '#8e3d2c';
  ctx.fillRect(h.x, h.y + h.h / 2, h.w, h.h / 2);
  ctx.fillStyle = '#6e2e21';
  ctx.fillRect(h.x, h.y + h.h / 2 - 1, h.w, 2);
  ctx.fillStyle = '#9e9e9e';
  ctx.fillRect(h.x + 8, h.y + 4, 6, 6);
}

function drawShadow(ctx, rect, depth) {
  ctx.fillStyle = 'rgba(20, 30, 15, 0.35)';
  ctx.fillRect(rect.x + depth, rect.y + depth, rect.w, rect.h);
}

// Covered grandstand facing the start straight. From above you see the roof over
// the back rows, tiers of seats with people in them, and advertising boards along the front.
function drawGrandstand(ctx, random) {
  const g = GRANDSTAND;
  drawShadow(ctx, g, 7);

  // concrete tiers, each row a little lighter as it steps down towards the track
  const rows = 6;
  const rowHeight = (g.h - 18) / rows;
  for (let r = 0; r < rows; r++) {
    ctx.fillStyle = `hsl(210, 8%, ${48 + r * 3}%)`;
    ctx.fillRect(g.x, g.y + 14 + r * rowHeight, g.w, rowHeight);
  }

  // seats and spectators, with gaps for the stairs every so often
  const shirts = ['#e53935', '#1e88e5', '#fdd835', '#fafafa', '#43a047', '#fb8c00', '#263238', '#8e24aa'];
  for (let r = 0; r < rows; r++) {
    const y = g.y + 14 + r * rowHeight + rowHeight / 2;
    for (let x = g.x + 4; x < g.x + g.w - 3; x += 3.2) {
      if ((x - g.x) % 56 < 5) continue;
      if (random() < 0.3) {
        ctx.fillStyle = '#3d6fa8';
        ctx.fillRect(x - 1, y - 0.8, 2, 1.6);
        continue;
      }
      ctx.fillStyle = shirts[Math.floor(random() * shirts.length)];
      ctx.fillRect(x - 1.2, y - 0.4, 2.4, 1.6);
      ctx.fillStyle = random() < 0.5 ? '#3b2a20' : '#d9a066';
      ctx.beginPath();
      ctx.arc(x, y - 0.6, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // stairs
  ctx.fillStyle = '#b8bcc0';
  for (let x = g.x; x < g.x + g.w; x += 56) {
    ctx.fillRect(x + 0.5, g.y + 14, 3, g.h - 18);
  }

  // roof, lit from the top left so the back edge is brightest
  const roof = ctx.createLinearGradient(0, g.y - 6, 0, g.y + 16);
  roof.addColorStop(0, '#f4f5f6');
  roof.addColorStop(1, '#c9cdd1');
  ctx.fillStyle = roof;
  ctx.fillRect(g.x - 4, g.y - 6, g.w + 8, 22);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let x = g.x + 10; x < g.x + g.w; x += 22) {
    ctx.fillRect(x, g.y - 6, 1, 22);
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(g.x - 4, g.y + 15, g.w + 8, 1.5);

  // advertising boards along the front
  const boards = ['#c62828', '#fafafa', '#1565c0', '#f9a825', '#2e7d32'];
  for (let x = g.x, i = 0; x < g.x + g.w; x += 40, i++) {
    ctx.fillStyle = boards[i % boards.length];
    ctx.fillRect(x, g.y + g.h - 4, Math.min(40, g.x + g.w - x), 4);
  }
}

// Pit garages behind the barrier on the start straight: a long flat roof with
// team colours over each garage door along the front
function drawPitBuilding(ctx) {
  const p = PIT_BUILDING;
  drawShadow(ctx, p, 6);

  const roof = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
  roof.addColorStop(0, '#5b6168');
  roof.addColorStop(1, '#40454b');
  ctx.fillStyle = roof;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = '#2c3035';
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);

  // one garage per team, each with its colour on the awning
  const teams = ['#1e88e5', '#e53935', '#fdd835', '#43a047', '#fafafa', '#fb8c00', '#8e24aa'];
  const garage = 25;
  for (let x = p.x + 2, i = 0; x + garage <= p.x + p.w - 2; x += garage, i++) {
    ctx.fillStyle = teams[i % teams.length];
    ctx.fillRect(x + 1, p.y + 1.5, garage - 2, 4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(x + 1, p.y + 5.5, garage - 2, 1);
    ctx.fillRect(x, p.y + 7, 1, p.h - 9);
  }

  // skylights and air conditioning units on the roof
  for (let x = p.x + 18; x < p.x + p.w - 20; x += 50) {
    ctx.fillStyle = '#8fb3c9';
    ctx.fillRect(x, p.y + 10, 14, 5);
    ctx.fillStyle = '#a9afb5';
    ctx.fillRect(x + 22, p.y + 12, 9, 9);
    ctx.fillStyle = '#6f757c';
    ctx.beginPath();
    ctx.arc(x + 26.5, p.y + 16.5, 3, 0, Math.PI * 2);
    ctx.fill();
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

  // articulated team trucks, cab at the top, all parked nose-out
  const liveries = ['#1e88e5', '#e53935', '#fdd835', '#43a047', '#fb8c00', '#8e24aa'];
  for (let x = p.x + 12, i = 0; x < p.x + p.w - 20; x += 38, i++) {
    if (random() < 0.2) continue;
    const colour = liveries[i % liveries.length];
    const cab = { x, y: p.y + 6, w: 14, h: 11 };
    const trailer = { x, y: p.y + 19, w: 14, h: 44 };
    drawShadow(ctx, { x, y: cab.y, w: 14, h: 57 }, 3);

    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.roundRect(cab.x, cab.y, cab.w, cab.h, 2);
    ctx.fill();
    ctx.fillStyle = '#1c262d';
    ctx.fillRect(cab.x + 1.5, cab.y + 1, cab.w - 3, 2.5);

    ctx.fillStyle = '#f3f4f5';
    ctx.fillRect(trailer.x, trailer.y, trailer.w, trailer.h);
    ctx.fillStyle = colour;
    ctx.fillRect(trailer.x, trailer.y + trailer.h - 12, trailer.w, 12);
    ctx.fillRect(trailer.x + 5.5, trailer.y, 3, trailer.h);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(trailer.x + trailer.w - 2, trailer.y, 2, trailer.h);
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
  const minGap = track.barrier + 14;
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

// A round canopy made of a few overlapping blobs, lit from the top left.
// Each layer is drawn for every blob before the next layer, so the darkest
// colour ends up as an outline round the whole canopy.
function drawLeafyTree(ctx, t) {
  const lobes = 6;
  const blobs = [];
  for (let i = 0; i < lobes; i++) {
    const angle = (i / lobes) * Math.PI * 2 + t.seed * 6;
    const reach = t.r * (0.38 + ((t.seed * 7 + i) % 1) * 0.14);
    blobs.push({ x: t.x + Math.cos(angle) * reach, y: t.y + Math.sin(angle) * reach });
  }

  const layers = [
    [0.66, 0, 14],
    [0.6, 0, 22],
    [0.5, -0.1, 30],
    [0.32, -0.2, 38],
  ];
  for (const [size, offset, lightness] of layers) {
    ctx.fillStyle = `hsl(${t.hue}, 42%, ${lightness + t.light}%)`;
    for (const b of blobs) {
      // blobs on the lit side get the highlight, the shaded side doesn't
      if (size < 0.4 && b.x + b.y > t.x + t.y) continue;
      ctx.beginPath();
      ctx.arc(b.x + t.r * offset, b.y + t.r * offset, t.r * size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // a few bright leaf clusters catching the sun
  ctx.fillStyle = `hsla(${t.hue - 15}, 50%, ${52 + t.light}%, 0.8)`;
  for (let i = 0; i < 4; i++) {
    const angle = t.seed * 20 + i * 1.7;
    const d = t.r * 0.25 * ((i % 3) + 1) * 0.6;
    ctx.beginPath();
    ctx.arc(t.x - t.r * 0.25 + Math.cos(angle) * d, t.y - t.r * 0.25 + Math.sin(angle) * d, t.r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Pines from above: rings of needles getting lighter towards the tip
function drawPine(ctx, t) {
  const points = 14;
  const layers = [
    [1.05, 0.72, 11],
    [0.95, 0.72, 17],
    [0.68, 0.7, 24],
    [0.4, 0.65, 32],
  ];
  layers.forEach(([size, inner, lightness], layer) => {
    ctx.fillStyle = `hsl(${t.hue + 25}, 38%, ${lightness + t.light}%)`;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0 ? t.r : t.r * inner) * size;
      const angle = (i / (points * 2)) * Math.PI * 2 + t.seed + layer * 0.2;
      const x = t.x - layer * 0.4 + Math.cos(angle) * r;
      const y = t.y - layer * 0.4 + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  });
}
