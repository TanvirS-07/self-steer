import { clamp } from './math.js';

// Units are world pixels and seconds. Roughly 5px is a metre.
const ENGINE = 300;        // acceleration at a standstill
const TOP_SPEED = 420;
const BRAKE = 600;        // more than the tyres can take, so slamming them on locks the wheels
const REVERSE = 90;
const GRIP = 500;          // most acceleration the tyres can give in any direction
const ROLLING_DRAG = 0.15;
const SLIDING_GRIP = 0.7;  // a skidding tyre grips worse than a rolling one
const ABS_LIMIT = 0.95;    // ABS keeps braking just under the point where the wheels lock
const BRAKE_BIAS = 0.6;    // share of braking done by the front tyres
const WEIGHT_TRANSFER = 0.15;
const OVERSTEER = 0.6;
const MAX_OVERSTEER = 0.8; // rad/s, so a slide stays catchable
const WHEELBASE = 14;
const MAX_STEER = 0.55;    // radians the front wheels can turn
const BARRIER_BOUNCE = 0.3;
const BARRIER_FRICTION = 0.85;
const STEER_SPEED = 3;     // how quickly the wheel turns towards full lock, per second
const CENTRE_SPEED = 6;    // and how quickly it comes back when you let go
const STEER_FALLOFF = 100; // the faster you go, the less lock you get

// grass has much less grip and slows you down
const SURFACE = {
  road: { grip: 1, drag: 0 },
  grass: { grip: 0.6, drag: 1.4 },
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
    this.wheelspin = false;
    this.slip = 0;
    this.loadShift = 0;
    this.steer = 0;
    this.hitBarrier = false;
  }

  get speed() {
    return Math.hypot(this.vx, this.vy);
  }

  // How fast the car is going in the direction it's pointing (negative when reversing)
  get forwardSpeed() {
    return this.vx * Math.cos(this.angle) + this.vy * Math.sin(this.angle);
  }

  update(controls, track, dt) {
    this.drive(controls, track, dt);
    this.keepInsideBarriers(track);
  }

  drive(controls, track, dt) {
    // Turn the wheel gradually towards where the driver wants it, instead of
    // snapping straight to full lock like a keyboard would
    const centring = Math.abs(controls.steer) < Math.abs(this.steer);
    const rate = (centring ? CENTRE_SPEED : STEER_SPEED) * dt;
    this.steer += clamp(controls.steer - this.steer, -rate, rate);

    this.onRoad = track.isOnTrack(this.x, this.y);
    const surface = this.onRoad ? SURFACE.road : SURFACE.grass;
    const grip = GRIP * surface.grip;

    let forward = this.forwardSpeed;

    // Weight transfer: braking pitches the car forward and loads up the front tyres,
    // accelerating squats it onto the rear. More load on a tyre means more grip.
    // It eases in rather than snapping, like the suspension settling.
    const frontLoad = 0.5 + this.loadShift;
    const frontGrip = grip * frontLoad;
    const rearGrip = grip * (1 - frontLoad);

    // The fronts do most of the braking, so they're the ones that lock.
    // ABS stops that by easing off just before they would.
    const braking = controls.brake > 0 && forward > 5;
    const frontBrake = controls.brake * BRAKE * BRAKE_BIAS;
    this.locked = braking && !this.abs && frontBrake > frontGrip;

    if (this.locked) {
      this.skid(grip, surface, dt);
      this.settle(-grip * SLIDING_GRIP, dt);
      return;
    }

    // How hard each axle is pushing the car forwards or backwards
    let frontPush = 0;
    let rearPush = 0;
    if (braking) {
      const total = Math.min(
        controls.brake * BRAKE,
        (frontGrip * ABS_LIMIT) / BRAKE_BIAS,
        (rearGrip * ABS_LIMIT) / (1 - BRAKE_BIAS),
      );
      frontPush = -total * BRAKE_BIAS;
      rearPush = -total * (1 - BRAKE_BIAS);
    } else if (controls.brake > 0) {
      rearPush = -controls.brake * REVERSE;
    } else if (controls.throttle > 0) {
      // rear wheel drive: too much power at low speed spins the rears up
      rearPush = controls.throttle * ENGINE * (1 - forward / TOP_SPEED);
    }

    this.wheelspin = rearPush > rearGrip;
    frontPush = clamp(frontPush, -frontGrip, frontGrip);
    rearPush = clamp(rearPush, -rearGrip, rearGrip);
    const push = frontPush + rearPush;

    // Whatever grip each tyre spends on speeding up or slowing down isn't
    // available for cornering (the friction circle)
    const frontCornerGrip = Math.sqrt(frontGrip ** 2 - frontPush ** 2);
    const rearCornerGrip = Math.sqrt(rearGrip ** 2 - rearPush ** 2);

    this.vx += Math.cos(this.angle) * push * dt;
    this.vy += Math.sin(this.angle) * push * dt;

    const drag = Math.exp(-(ROLLING_DRAG + surface.drag) * dt);
    this.vx *= drag;
    this.vy *= drag;

    // Steering: the front wheels try to carve an arc. Going round it at speed v
    // needs v * turnRate of sideways grip, shared between the axles by weight.
    // If the fronts can't give their share the car turns less than you asked
    // and runs wide (understeer).
    forward = this.forwardSpeed;
    const speed = Math.max(Math.abs(forward), 1);
    // Like speed-sensitive power steering: full lock at walking pace, much less on
    // a straight at full speed, so a tap of the key doesn't throw the car sideways
    const lock = MAX_STEER / (1 + speed / STEER_FALLOFF);
    let turnRate = (forward * Math.tan(this.steer * lock)) / WHEELBASE;
    const maxTurnRate = frontCornerGrip / (frontLoad * speed);
    turnRate = clamp(turnRate, -maxTurnRate, maxTurnRate);

    // If the rears can't hold their share the back steps out and the car
    // rotates more than you asked (oversteer)
    const rearNeeded = Math.abs(turnRate) * speed * (1 - frontLoad);
    const rearShortfall = Math.max(0, rearNeeded - rearCornerGrip);
    turnRate += Math.sign(turnRate) * Math.min((rearShortfall / speed) * OVERSTEER, MAX_OVERSTEER);

    this.angle += turnRate * dt;

    // After turning, some of the velocity now points out the side of the car.
    // The tyres scrub that off, but only as fast as the grip allows; the rest is a slide.
    const fx = Math.cos(this.angle);
    const fy = Math.sin(this.angle);
    forward = this.vx * fx + this.vy * fy;
    let sideways = this.vx * -fy + this.vy * fx;
    const scrub = Math.min(Math.abs(sideways), (frontCornerGrip + rearCornerGrip) * dt);
    sideways -= Math.sign(sideways) * scrub;

    this.settle(push, dt);

    this.vx = fx * forward - fy * sideways;
    this.vy = fy * forward + fx * sideways;
    this.slip = Math.abs(sideways);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  // The barrier is a fixed distance from the centre line. If the car ends up past it,
  // put it back on the barrier and bounce off whatever speed was heading into it.
  keepInsideBarriers(track) {
    const { index, distance } = track.nearest(this.x, this.y);
    this.hitBarrier = distance > track.barrier;
    if (!this.hitBarrier) return;

    const p = track.path[index];
    const nx = (this.x - p.x) / distance;
    const ny = (this.y - p.y) / distance;
    this.x = p.x + nx * track.barrier;
    this.y = p.y + ny * track.barrier;

    const intoWall = this.vx * nx + this.vy * ny;
    if (intoWall > 0) {
      this.vx -= nx * intoWall * (1 + BARRIER_BOUNCE);
      this.vy -= ny * intoWall * (1 + BARRIER_BOUNCE);
    }
    this.vx *= BARRIER_FRICTION;
    this.vy *= BARRIER_FRICTION;
  }

  // Moves weight towards the front under braking and the rear under power
  settle(push, dt) {
    const target = clamp(-push / GRIP, -1, 1) * WEIGHT_TRANSFER;
    this.loadShift += (target - this.loadShift) * Math.min(1, 6 * dt);
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
