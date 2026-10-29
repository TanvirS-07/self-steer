import { WORLD_WIDTH, WORLD_HEIGHT } from './track.js';
import { CAR_LENGTH, CAR_WIDTH, TOP_SPEED } from './car.js';

const SLIDE_THRESHOLD = 25;
const MAX_SMOKE = 300;
const MAX_DUST = 200;
const MAX_SPARKS = 120;
const STREAK_SPEED = TOP_SPEED * 0.68; // speed streaks fade in above this

// Everything the car leaves behind: rubber on the track, tyre smoke, dust off
// the grass, sparks off the barriers, and a bit of screen shake on big hits.
// Marks are drawn onto their own canvas so they build up over time without
// having to remember every single one. The rest are small particle lists with a cap.
export class TyreEffects {
  constructor(scale = 2) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = WORLD_WIDTH * scale;
    this.canvas.height = WORLD_HEIGHT * scale;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(scale, scale);
    this.smoke = [];
    this.dust = [];
    this.sparks = [];
    this.shake = 0;
    this.lastWheels = new Map();
  }

  clear() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.smoke = [];
    this.dust = [];
    this.sparks = [];
    this.shake = 0;
    this.lastWheels.clear();
  }

  update(car, dt) {
    const sliding = car.locked || car.wheelspin || car.slip > SLIDE_THRESHOLD;
    const wheels = rearWheels(car);
    const last = this.lastWheels.get(car);

    if (sliding && last) {
      const ctx = this.ctx;
      ctx.strokeStyle = car.onRoad ? 'rgba(25, 25, 25, 0.35)' : 'rgba(70, 50, 20, 0.3)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      for (let i = 0; i < wheels.length; i++) {
        ctx.beginPath();
        ctx.moveTo(last[i].x, last[i].y);
        ctx.lineTo(wheels[i].x, wheels[i].y);
        ctx.stroke();
      }

      if (car.onRoad && this.smoke.length < MAX_SMOKE) {
        for (const w of wheels) {
          this.smoke.push({ x: w.x, y: w.y, r: 3, life: 1 });
        }
      }
    }
    this.lastWheels.set(car, sliding ? wheels : null);

    // dust thrown up by the rear wheels off the road
    if (!car.onRoad && car.speed > 40 && this.dust.length < MAX_DUST) {
      for (const w of wheels) {
        this.dust.push({ x: w.x, y: w.y, r: 2.5, life: 1 });
      }
    }

    if (car.impact > 0) this.hitBarrier(car);

    for (const puff of this.smoke) {
      puff.life -= dt * 1.2;
      puff.r += dt * 14;
    }
    for (const puff of this.dust) {
      puff.life -= dt * 1.6;
      puff.r += dt * 18;
    }
    for (const spark of this.sparks) {
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vx *= Math.exp(-4 * dt);
      spark.vy *= Math.exp(-4 * dt);
      spark.life -= dt * 2.5;
    }
    this.smoke = this.smoke.filter((puff) => puff.life > 0);
    this.dust = this.dust.filter((puff) => puff.life > 0);
    this.sparks = this.sparks.filter((spark) => spark.life > 0);
    this.shake *= Math.exp(-10 * dt);
  }

  // Sparks fly off along the barrier, away from it, and the harder the hit the more there are
  hitBarrier(car) {
    const { x, y, nx, ny } = car.contact;
    const count = Math.min(16, 3 + car.impact / 12);
    for (let i = 0; i < count && this.sparks.length < MAX_SPARKS; i++) {
      const along = (Math.random() - 0.5) * 2;
      const speed = 60 + Math.random() * 160;
      this.sparks.push({
        x,
        y,
        vx: (-ny * along - nx * Math.random()) * speed + car.vx * 0.5,
        vy: (nx * along - ny * Math.random()) * speed + car.vy * 0.5,
        life: 0.6 + Math.random() * 0.4,
      });
    }
    this.shake = Math.max(this.shake, Math.min(8, car.impact / 25));
  }

  // A random nudge for the camera while the screen is shaking, in screen pixels
  shakeOffset() {
    if (this.shake < 0.1) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * 2 * this.shake,
      y: (Math.random() - 0.5) * 2 * this.shake,
    };
  }

  drawMarks(ctx) {
    ctx.drawImage(this.canvas, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  drawDust(ctx) {
    for (const puff of this.dust) {
      ctx.fillStyle = `rgba(176, 145, 96, ${puff.life * 0.3})`;
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawSparks(ctx) {
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    for (const spark of this.sparks) {
      ctx.strokeStyle = `rgba(255, ${170 + spark.life * 80}, 60, ${Math.min(1, spark.life)})`;
      ctx.beginPath();
      ctx.moveTo(spark.x, spark.y);
      ctx.lineTo(spark.x - spark.vx * 0.03, spark.y - spark.vy * 0.03);
      ctx.stroke();
    }
  }

  // Faint white streaks trailing off the back corners near top speed
  drawSpeedStreaks(ctx, car) {
    const speed = car.speed;
    if (speed < STREAK_SPEED) return;
    const strength = Math.min(1, (speed - STREAK_SPEED) / (TOP_SPEED - STREAK_SPEED));
    const backX = -car.vx / speed;
    const backY = -car.vy / speed;
    const length = 14 + strength * 26;

    for (const w of rearWheels(car)) {
      const streak = ctx.createLinearGradient(w.x, w.y, w.x + backX * length, w.y + backY * length);
      streak.addColorStop(0, `rgba(255, 255, 255, ${0.35 * strength})`);
      streak.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.strokeStyle = streak;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w.x, w.y);
      ctx.lineTo(w.x + backX * length, w.y + backY * length);
      ctx.stroke();
    }
  }

  drawSmoke(ctx) {
    for (const puff of this.smoke) {
      ctx.fillStyle = `rgba(225, 225, 225, ${puff.life * 0.25})`;
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function rearWheels(car) {
  const cos = Math.cos(car.angle);
  const sin = Math.sin(car.angle);
  const back = -CAR_LENGTH / 2 + 6;
  return [-1, 1].map((side) => {
    const across = (side * (CAR_WIDTH - 2.4)) / 2;
    return {
      x: car.x + cos * back - sin * across,
      y: car.y + sin * back + cos * across,
    };
  });
}
