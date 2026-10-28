import { clamp } from './math.js';

const ENGINE = 260;
const REVERSE = 120;
const TURN_RATE = 3.2;

// on grass the car loses grip and gets dragged down a lot harder
const SURFACE = {
  road: { grip: 9, drag: 0.7 },
  grass: { grip: 3, drag: 2.8 },
};

export const CAR_LENGTH = 22;
export const CAR_WIDTH = 11;

export class Car {
  constructor(x, y, angle, color = '#1e88e5') {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
    this.onRoad = true;
  }

  get speed() {
    return Math.hypot(this.vx, this.vy);
  }

  update(controls, track, dt) {
    const fx = Math.cos(this.angle);
    const fy = Math.sin(this.angle);

    // split the velocity into the part going where the car points and the sideways slide
    let forward = this.vx * fx + this.vy * fy;
    let sideways = this.vx * -fy + this.vy * fx;

    this.onRoad = track.isOnTrack(this.x, this.y);
    const surface = this.onRoad ? SURFACE.road : SURFACE.grass;

    if (controls.throttle > 0) forward += controls.throttle * ENGINE * dt;
    else if (controls.throttle < 0) forward += controls.throttle * REVERSE * dt;

    forward *= Math.exp(-surface.drag * dt);
    sideways *= Math.exp(-surface.grip * dt);

    // you can't turn a car that isn't moving, and reversing flips the steering
    const turnAmount = clamp(forward / 80, -1, 1);
    this.angle += controls.steer * TURN_RATE * turnAmount * dt;

    const nfx = Math.cos(this.angle);
    const nfy = Math.sin(this.angle);
    this.vx = nfx * forward - nfy * sideways;
    this.vy = nfy * forward + nfx * sideways;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const l = CAR_LENGTH;
    const w = CAR_WIDTH;

    // shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    roundRect(ctx, -l / 2 + 2, -w / 2 + 2, l, w, 3);

    // wheels
    ctx.fillStyle = '#1b1b1b';
    for (const wx of [-l / 2 + 2, l / 2 - 7]) {
      ctx.fillRect(wx, -w / 2 - 1.5, 5, 3);
      ctx.fillRect(wx, w / 2 - 1.5, 5, 3);
    }

    // body
    ctx.fillStyle = this.color;
    roundRect(ctx, -l / 2, -w / 2 + 1, l, w - 2, 3);

    // stripe down the middle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(-l / 2, -1, l, 2);

    // windscreen
    ctx.fillStyle = '#263238';
    roundRect(ctx, 0, -w / 2 + 2.5, 5, w - 5, 1.5);

    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
