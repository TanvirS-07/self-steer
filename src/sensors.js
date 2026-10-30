// The AI's eyes: rays fired out from the car that report how far away the barrier is.
const ANGLES = [-90, -50, -25, -10, 0, 10, 25, 50, 90].map((deg) => (deg * Math.PI) / 180);
const RANGE = 260;
const MIN_STEP = 1.5;

export class Sensors {
  constructor() {
    this.angles = ANGLES;
    this.readings = ANGLES.map(() => 1);
    this.hits = ANGLES.map(() => null);
  }

  // Each reading is 0 (barrier right there) to 1 (nothing within range),
  // which is a nice range to feed into a neural network.
  read(car, track) {
    this.angles.forEach((offset, i) => {
      const angle = car.angle + offset;
      const length = castRay(track, car.x, car.y, Math.cos(angle), Math.sin(angle), car.trackIndex);
      this.readings[i] = length / RANGE;
      this.hits[i] = { x: car.x + Math.cos(angle) * length, y: car.y + Math.sin(angle) * length };
    });
    return this.readings;
  }

  draw(ctx, car) {
    ctx.save();
    ctx.lineWidth = 1;
    this.hits.forEach((hit, i) => {
      if (!hit) return;
      // green when there's lots of room, through yellow to red when the barrier's close
      const hue = this.readings[i] * 120;
      ctx.strokeStyle = `hsla(${hue}, 90%, 55%, 0.75)`;
      ctx.beginPath();
      ctx.moveTo(car.x, car.y);
      ctx.lineTo(hit.x, hit.y);
      ctx.stroke();
      if (this.readings[i] < 1) {
        ctx.fillStyle = `hsl(${hue}, 90%, 55%)`;
        ctx.beginPath();
        ctx.arc(hit.x, hit.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }
}

// Sphere tracing: if a point is d away from the centre line, the barrier is at
// least (barrier - d) away in any direction, so we can safely jump that far along
// the ray. Near the barrier the jumps get tiny, and we stop when we're on it.
// That's far fewer steps than walking along the ray a pixel at a time.
function castRay(track, x, y, dx, dy, hint) {
  let travelled = 0;
  while (travelled < RANGE) {
    const near = track.nearest(x + dx * travelled, y + dy * travelled, hint);
    hint = near.index;
    const room = track.barrier - near.distance;
    if (room <= 0.5) return travelled;
    travelled += Math.max(room, MIN_STEP);
  }
  return RANGE;
}
