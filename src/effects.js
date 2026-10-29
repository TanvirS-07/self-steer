import { WORLD_WIDTH, WORLD_HEIGHT } from './track.js';
import { CAR_LENGTH, CAR_WIDTH } from './car.js';

const SLIDE_THRESHOLD = 25;
const MAX_SMOKE = 300;

// Rubber left on the track and smoke from sliding tyres.
// Marks are drawn onto their own canvas so they build up over time without
// having to remember every single one.
export class TyreEffects {
  constructor(scale = 2) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = WORLD_WIDTH * scale;
    this.canvas.height = WORLD_HEIGHT * scale;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(scale, scale);
    this.smoke = [];
    this.lastWheels = new Map();
  }

  clear() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    this.smoke = [];
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

    for (const puff of this.smoke) {
      puff.life -= dt * 1.2;
      puff.r += dt * 14;
    }
    this.smoke = this.smoke.filter((puff) => puff.life > 0);
  }

  drawMarks(ctx) {
    ctx.drawImage(this.canvas, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
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
  const back = -CAR_LENGTH / 2 + 4;
  return [-1, 1].map((side) => {
    const across = (side * CAR_WIDTH) / 2;
    return {
      x: car.x + cos * back - sin * across,
      y: car.y + sin * back + cos * across,
    };
  });
}
