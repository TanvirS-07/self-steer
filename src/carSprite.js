import { CAR_LENGTH, CAR_WIDTH } from './car.js';

const MAX_WHEEL_TURN = 0.5;
const SPRITE_SCALE = 6; // draw the body at 6x and shrink it, so it stays sharp when rotated
const PADDING = 4;

// The body only changes when the colour does, so each livery is drawn once and reused
const bodyCache = new Map();

// Draws a top-down GT car. Tyres and lights change every frame so they're drawn
// live; the body comes from a cached image.
export function drawCar(ctx, car) {
  const l = CAR_LENGTH;
  const w = CAR_WIDTH;

  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  // shadow, offset down-right like everything else in the scene
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.roundRect(-l / 2 + 2, -w / 2 + 2.5, l, w, 4);
  ctx.fill();

  // tyres poke out from under the body, and the fronts turn with the steering
  const wheelTurn = car.steer * MAX_WHEEL_TURN;
  drawTyre(ctx, -l / 2 + 6, -w / 2 + 1.2, 0);
  drawTyre(ctx, -l / 2 + 6, w / 2 - 1.2, 0);
  drawTyre(ctx, l / 2 - 7, -w / 2 + 1.2, wheelTurn);
  drawTyre(ctx, l / 2 - 7, w / 2 - 1.2, wheelTurn);

  const body = getBody(car.color);
  ctx.drawImage(body, -l / 2 - PADDING, -w / 2 - PADDING, l + PADDING * 2, w + PADDING * 2);

  // brake lights
  ctx.fillStyle = car.braking ? '#ff3b2a' : '#6e1a12';
  ctx.fillRect(-l / 2 + 0.6, -w / 2 + 2, 1, 2.4);
  ctx.fillRect(-l / 2 + 0.6, w / 2 - 4.4, 1, 2.4);
  if (car.braking) {
    const glow = ctx.createRadialGradient(-l / 2, 0, 0, -l / 2, 0, 9);
    glow.addColorStop(0, 'rgba(255, 50, 30, 0.45)');
    glow.addColorStop(1, 'rgba(255, 50, 30, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-l / 2 - 9, -9, 12, 18);
  }

  ctx.restore();
}

function drawTyre(ctx, x, y, turn) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.roundRect(-3.2, -1.9, 6.4, 3.8, 1);
  ctx.fill();
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(-3.2, -0.4, 6.4, 0.8);
  ctx.restore();
}

function getBody(color) {
  if (!bodyCache.has(color)) bodyCache.set(color, renderBody(color));
  return bodyCache.get(color);
}

// Outline of the body, nose pointing right. Wide over the wheel arches,
// pinched at the doors, with a pointed splitter at the front.
function bodyPath(ctx, l, w) {
  const half = w / 2;
  const top = [
    [-l / 2, -half + 1.6],
    [-l / 2 + 2, -half + 0.4],
    [-l / 2 + 8, -half],
    [-1, -half + 1],
    [l / 2 - 10, -half + 0.6],
    [l / 2 - 5, -half + 0.2],
    [l / 2 - 1.5, -half + 2.4],
    [l / 2, -1.8],
  ];
  ctx.beginPath();
  ctx.moveTo(top[0][0], top[0][1]);
  for (const [x, y] of top.slice(1)) ctx.lineTo(x, y);
  for (const [x, y] of top.slice().reverse()) ctx.lineTo(x, -y);
  ctx.closePath();
}

function renderBody(color) {
  const l = CAR_LENGTH;
  const w = CAR_WIDTH;
  const canvas = document.createElement('canvas');
  canvas.width = (l + PADDING * 2) * SPRITE_SCALE;
  canvas.height = (w + PADDING * 2) * SPRITE_SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SPRITE_SCALE, SPRITE_SCALE);
  ctx.translate(l / 2 + PADDING, w / 2 + PADDING);
  ctx.lineJoin = 'round';

  // paint, shaded darker towards the sides so the body looks rounded
  const shade = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
  shade.addColorStop(0, mix(color, '#000000', 0.45));
  shade.addColorStop(0.25, color);
  shade.addColorStop(0.45, mix(color, '#ffffff', 0.18));
  shade.addColorStop(0.75, color);
  shade.addColorStop(1, mix(color, '#000000', 0.5));
  bodyPath(ctx, l, w);
  ctx.fillStyle = shade;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // keep the livery inside the body outline
  ctx.save();
  bodyPath(ctx, l, w);
  ctx.clip();

  // white stripe from nose to tail
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(-l / 2, -1.3, l, 0.8);
  ctx.fillRect(-l / 2, 0.5, l, 0.8);

  // front splitter and bonnet vents
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(l / 2 - 1.2, -w / 2, 2, w);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(l / 2 - 6, -3.6, 2.2, 0.6);
  ctx.fillRect(l / 2 - 6, 3, 2.2, 0.6);
  ctx.restore();

  // cabin: dark glass all round with the roof panel on top, so you see the
  // windscreen at the front, a sliver of side window and the rear window
  ctx.fillStyle = '#16202a';
  ctx.beginPath();
  ctx.moveTo(4.6, -3.7);
  ctx.quadraticCurveTo(6, 0, 4.6, 3.7);
  ctx.lineTo(-4.2, 3.5);
  ctx.quadraticCurveTo(-5, 0, -4.2, -3.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = mix(color, '#000000', 0.1);
  ctx.beginPath();
  ctx.roundRect(-3, -3.2, 5.4, 6.4, 1.4);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(-3, -1.3, 5.4, 0.8);
  ctx.fillRect(-3, 0.5, 5.4, 0.8);
  // light catching the windscreen
  ctx.fillStyle = 'rgba(170, 210, 240, 0.4)';
  ctx.beginPath();
  ctx.moveTo(4.5, -3.2);
  ctx.lineTo(5.3, -1.2);
  ctx.lineTo(3.4, -1.4);
  ctx.closePath();
  ctx.fill();

  // wing mirrors
  ctx.fillStyle = mix(color, '#000000', 0.3);
  ctx.fillRect(3, -w / 2 - 0.6, 1.4, 1.2);
  ctx.fillRect(3, w / 2 - 0.6, 1.4, 1.2);

  // headlights
  ctx.fillStyle = '#fff4c2';
  ctx.beginPath();
  ctx.moveTo(l / 2 - 4, -w / 2 + 1);
  ctx.lineTo(l / 2 - 1.6, -w / 2 + 2.6);
  ctx.lineTo(l / 2 - 2.6, -w / 2 + 3.4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(l / 2 - 4, w / 2 - 1);
  ctx.lineTo(l / 2 - 1.6, w / 2 - 2.6);
  ctx.lineTo(l / 2 - 2.6, w / 2 - 3.4);
  ctx.closePath();
  ctx.fill();

  // rear wing with end plates
  ctx.fillStyle = '#1b1b1b';
  ctx.fillRect(-l / 2 - 1, -w / 2 - 0.2, 2.6, w + 0.4);
  ctx.fillStyle = '#333';
  ctx.fillRect(-l / 2 - 1, -w / 2 - 0.2, 2.6, 0.8);
  ctx.fillRect(-l / 2 - 1, w / 2 - 0.6, 2.6, 0.8);

  return canvas;
}

// Blends two hex colours. amount 0 = first colour, 1 = second.
function mix(a, b, amount) {
  const ca = parseInt(a.slice(1), 16);
  const cb = parseInt(b.slice(1), 16);
  const channel = (shift) =>
    Math.round(((ca >> shift) & 255) * (1 - amount) + ((cb >> shift) & 255) * amount);
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}
