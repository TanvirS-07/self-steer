// A hand-written driver to compare the AI against. Unlike the AI it gets to
// cheat: it knows the shape of the whole track, so it can work out the safe
// speed for every corner coming up and brake in time for it.
import { clamp } from '../src/math.js';

const CORNER_GRIP = 400;   // sideways grip it plans to use (the car has 500)
const BRAKING = 240;       // deceleration it plans to brake at
const LOOK_STEER = 45;     // how far ahead it aims, in world units
const LOOK_BRAKE = 400;    // how far ahead it checks for corners

export class HandDriver {
  constructor(track) {
    const path = track.path;
    const n = path.length;
    this.gaps = path.map((p, i) => Math.hypot(path[(i + 1) % n].x - p.x, path[(i + 1) % n].y - p.y));

    // the fastest you can take each point: v = sqrt(grip * radius)
    this.safeSpeed = path.map((_, i) => {
      const a = path[(i - 3 + n) % n];
      const b = path[(i + 3) % n];
      const turn = Math.abs(Math.atan2(a.dirX * b.dirY - a.dirY * b.dirX, a.dirX * b.dirX + a.dirY * b.dirY));
      let length = 0;
      for (let k = -3; k < 3; k++) length += this.gaps[(i + k + n) % n];
      return turn < 1e-4 ? Infinity : Math.sqrt(CORNER_GRIP * (length / turn));
    });
  }

  drive(car, track) {
    const path = track.path;
    const n = path.length;
    const here = car.trackIndex ?? track.nearest(car.x, car.y).index;

    // the speed we can be doing now and still slow down in time for every corner ahead
    let target = Infinity;
    let aim = null;
    for (let k = 0, ahead = 0; ahead < LOOK_BRAKE; k++) {
      const i = (here + k) % n;
      target = Math.min(target, Math.sqrt(this.safeSpeed[i] ** 2 + 2 * BRAKING * ahead));
      if (!aim && ahead >= LOOK_STEER) aim = path[i];
      ahead += this.gaps[i];
    }

    let turn = Math.atan2(aim.y - car.y, aim.x - car.x) - car.angle;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    const speed = car.forwardSpeed;

    return {
      steer: clamp(turn * 3, -1, 1),
      throttle: speed < target ? 1 : 0,
      brake: speed > target + 5 ? clamp((speed - target) / 40, 0, 1) : 0,
    };
  }
}
