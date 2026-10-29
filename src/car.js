import { clamp } from './math.js';

// Units are world pixels and seconds. Roughly 5px is a metre.
const ENGINE = 300;        // acceleration at a standstill
const TOP_SPEED = 420;
const BRAKE = 600;        // more than the tyres can take, so slamming them on locks the wheels
const REVERSE = 90;
const GRIP = 430;          // most acceleration the tyres can give in any direction
const ROLLING_DRAG = 0.15;
const SLIDING_GRIP = 0.7;  // a skidding tyre grips worse than a rolling one
const ABS_LIMIT = 0.95;    // ABS keeps braking just under the point where the wheels lock
const WHEELBASE = 14;
const MAX_STEER = 0.55;    // radians the front wheels can turn

// grass has much less grip and slows you down
const SURFACE = {
  road: { grip: 1, drag: 0 },
  grass: { grip: 0.45, drag: 1.6 },
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
    this.abs = true;
    this.locked = false;
    this.slip = 0;
  }

  get speed() {
    return Math.hypot(this.vx, this.vy);
  }

  // How fast the car is going in the direction it's pointing (negative when reversing)
  get forwardSpeed() {
    return this.vx * Math.cos(this.angle) + this.vy * Math.sin(this.angle);
  }

  update(controls, track, dt) {
    this.onRoad = track.isOnTrack(this.x, this.y);
    const surface = this.onRoad ? SURFACE.road : SURFACE.grass;
    const grip = GRIP * surface.grip;

    let forward = this.forwardSpeed;

    // Braking harder than the tyres can handle locks the wheels. ABS stops that
    // by easing off the brakes just before they lock.
    const braking = controls.brake > 0 && forward > 5;
    const brakeForce = controls.brake * BRAKE;
    this.locked = braking && !this.abs && brakeForce > grip;

    if (this.locked) {
      this.skid(grip, surface, dt);
      return;
    }

    // Engine and brakes. Holding brake once stopped puts it in reverse.
    let push = 0;
    if (braking) {
      push = -Math.min(brakeForce, grip * ABS_LIMIT);
    } else if (controls.brake > 0) {
      push = -controls.brake * REVERSE;
    } else if (controls.throttle > 0) {
      push = controls.throttle * ENGINE * (1 - forward / TOP_SPEED);
    }

    // The tyres can only push so hard, and whatever grip goes into
    // speeding up or slowing down isn't available for cornering (the friction circle)
    push = clamp(push, -grip, grip);
    const cornerGrip = Math.sqrt(grip * grip - push * push);

    this.vx += Math.cos(this.angle) * push * dt;
    this.vy += Math.sin(this.angle) * push * dt;

    const drag = Math.exp(-(ROLLING_DRAG + surface.drag) * dt);
    this.vx *= drag;
    this.vy *= drag;

    // Steering: the front wheels try to carve an arc. Going round it at speed v
    // needs v * turnRate of sideways grip, so if the tyres can't give that much
    // the car turns less than you asked for and runs wide (understeer).
    forward = this.forwardSpeed;
    let turnRate = (forward * Math.tan(controls.steer * MAX_STEER)) / WHEELBASE;
    const maxTurnRate = cornerGrip / Math.max(Math.abs(forward), 1);
    turnRate = clamp(turnRate, -maxTurnRate, maxTurnRate);
    this.angle += turnRate * dt;

    // After turning, some of the velocity now points out the side of the car.
    // The tyres scrub that off, but only as fast as the grip allows; the rest is a slide.
    const fx = Math.cos(this.angle);
    const fy = Math.sin(this.angle);
    forward = this.vx * fx + this.vy * fy;
    let sideways = this.vx * -fy + this.vy * fx;
    const scrub = Math.min(Math.abs(sideways), cornerGrip * dt);
    sideways -= Math.sign(sideways) * scrub;

    this.vx = fx * forward - fy * sideways;
    this.vy = fy * forward + fx * sideways;
    this.slip = Math.abs(sideways);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  // With the wheels locked the tyres just slide. Friction acts against the direction
  // of travel, not the way the car is pointing, so steering does nothing.
  skid(grip, surface, dt) {
    const speed = this.speed;
    if (speed > 0) {
      const slowBy = Math.min(speed, grip * SLIDING_GRIP * dt);
      this.vx -= (this.vx / speed) * slowBy;
      this.vy -= (this.vy / speed) * slowBy;
    }

    const drag = Math.exp(-(ROLLING_DRAG + surface.drag) * dt);
    this.vx *= drag;
    this.vy *= drag;
    this.slip = this.speed;

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
