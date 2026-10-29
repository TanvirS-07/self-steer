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
  for (let clump = 0; clump < 900; clump++) {
    const cx = SCENE.x + random() * SCENE.width;
    const cy = SCENE.y + random() * SCENE.height;
    const count = 4 + Math.floor(random() * 10);
    for (let i = 0; i < count; i++) {
      const x = cx + (random() - 0.5) * 90;
      const y = cy + (random() - 0.5) * 90;
      if (track.nearest(x, y).distance < minGap) continue;
      trees.push({ x, y, r: 9 + random() * 9 });
    }
  }

  // draw top to bottom so lower trees overlap the ones behind them
  trees.sort((a, b) => a.y - b.y);

  for (const t of trees) {
    ctx.fillStyle = COLORS.treeShadow;
    ctx.beginPath();
    ctx.arc(t.x + 4, t.y + 5, t.r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const t of trees) {
    ctx.fillStyle = COLORS.treeDark;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.treeMid;
    ctx.beginPath();
    ctx.arc(t.x - t.r * 0.2, t.y - t.r * 0.2, t.r * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.treeLight;
    ctx.beginPath();
    ctx.arc(t.x - t.r * 0.35, t.y - t.r * 0.4, t.r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}
