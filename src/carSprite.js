import { CAR_LENGTH, CAR_WIDTH } from './car.js';

const MAX_WHEEL_TURN = 0.5;

// Draws a top-down GT car. Everything is drawn pointing right (+x) and then
// rotated to the car's heading, so the numbers below are in the car's own space.
export function drawCar(ctx, car) {
  const l = CAR_LENGTH;
  const w = CAR_WIDTH;

  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  // soft shadow, offset the same way as the buildings and trees
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.roundRect(-l / 2 + 1.5, -w / 2 + 2, l, w, 4);
  ctx.fill();

  // tyres, with the fronts turned to show the steering
  drawTyre(ctx, -l / 2 + 4.5, -w / 2 + 0.5, 0);
  drawTyre(ctx, -l / 2 + 4.5, w / 2 - 0.5, 0);
  drawTyre(ctx, l / 2 - 5, -w / 2 + 0.5, car.steer * MAX_WHEEL_TURN);
  drawTyre(ctx, l / 2 - 5, w / 2 - 0.5, car.steer * MAX_WHEEL_TURN);

  // body, rounder at the nose, with shading across it so it looks curved
  const shade = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
  shade.addColorStop(0, darken(car.color, 0.35));
  shade.addColorStop(0.3, car.color);
  shade.addColorStop(0.7, car.color);
  shade.addColorStop(1, darken(car.color, 0.45));
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(-l / 2 + 1, -w / 2 + 1);
  ctx.lineTo(l / 2 - 4, -w / 2 + 1);
  ctx.quadraticCurveTo(l / 2, -w / 2 + 1.5, l / 2, 0);
  ctx.quadraticCurveTo(l / 2, w / 2 - 1.5, l / 2 - 4, w / 2 - 1);
  ctx.lineTo(-l / 2 + 1, w / 2 - 1);
  ctx.quadraticCurveTo(-l / 2, 0, -l / 2 + 1, -w / 2 + 1);
  ctx.fill();

  // twin racing stripes over the bonnet and roof
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(-l / 2 + 1, -1.6, l - 2, 1);
  ctx.fillRect(-l / 2 + 1, 0.6, l - 2, 1);

  // windscreen, roof and rear window
  ctx.fillStyle = '#1c262d';
  ctx.beginPath();
  ctx.moveTo(4.5, -w / 2 + 2.2);
  ctx.lineTo(1, -w / 2 + 2.5);
  ctx.lineTo(1, w / 2 - 2.5);
  ctx.lineTo(4.5, w / 2 - 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-5.5, -w / 2 + 2.5, 2, w - 5);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(2.5, -w / 2 + 2.8, 0.8, 2);

  // rear wing
  ctx.fillStyle = '#222';
  ctx.fillRect(-l / 2 - 0.5, -w / 2 + 0.5, 2, w - 1);

  // headlights, and brake lights that glow when the brakes are on
  ctx.fillStyle = '#fff6c8';
  ctx.fillRect(l / 2 - 2, -w / 2 + 1.8, 1.2, 1.6);
  ctx.fillRect(l / 2 - 2, w / 2 - 3.4, 1.2, 1.6);
  ctx.fillStyle = car.braking ? '#ff2a1a' : '#7a1810';
  ctx.fillRect(-l / 2 + 1.5, -w / 2 + 1.5, 1, 2);
  ctx.fillRect(-l / 2 + 1.5, w / 2 - 3.5, 1, 2);
  if (car.braking) {
    ctx.fillStyle = 'rgba(255, 40, 20, 0.35)';
    ctx.beginPath();
    ctx.arc(-l / 2, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawTyre(ctx, x, y, turn) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.fillStyle = '#151515';
  ctx.beginPath();
  ctx.roundRect(-2.5, -1.4, 5, 2.8, 0.8);
  ctx.fill();
  ctx.restore();
}

// Mixes a hex colour towards black. amount 0 = unchanged, 1 = black.
function darken(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}
