const FIRST_LIGHT = 0.8;   // seconds before the first light comes on
const LIGHT_GAP = 1;       // seconds between each light
const LIGHT_COUNT = 5;
const MESSAGE_TIME = 2;

// The five red lights over the grid. They come on one at a time, then all go
// out together after a random pause, which is the signal to go. The random
// pause means you can't just learn the timing and launch early.
export class StartLights {
  constructor() {
    this.reset();
  }

  reset() {
    this.time = 0;
    this.outAt = FIRST_LIGHT + LIGHT_GAP * (LIGHT_COUNT - 1) + 0.6 + Math.random() * 1.6;
    this.racing = false;
    this.jumpedStart = false;
    this.reaction = null;
    this.message = null;
    this.messageTime = 0;
  }

  get lightsOn() {
    if (this.racing) return 0;
    const lit = Math.floor((this.time - FIRST_LIGHT) / LIGHT_GAP) + 1;
    return Math.max(0, Math.min(LIGHT_COUNT, lit));
  }

  update(controls, dt) {
    this.time += dt;
    this.messageTime -= dt;

    if (!this.racing) {
      // flooring it before the lights go out doesn't move the car, but it's noted
      if (controls.throttle > 0 && this.lightsOn > 0 && !this.jumpedStart) {
        this.jumpedStart = true;
        this.show('JUMP START');
      }
      if (this.time >= this.outAt) this.racing = true;
      return;
    }

    if (this.reaction === null && controls.throttle > 0) {
      this.reaction = this.time - this.outAt;
      if (!this.jumpedStart) this.show(`REACTION ${this.reaction.toFixed(3)}s`);
    }
  }

  show(text) {
    this.message = text;
    this.messageTime = MESSAGE_TIME;
  }

  // The gantry spans the track just past the start line, barrier to barrier
  draw(ctx, track) {
    const p = track.start;
    const span = track.barrier + 8;

    ctx.save();
    ctx.translate(p.x + p.dirX * 8, p.y + p.dirY * 8);
    ctx.rotate(Math.atan2(p.dirY, p.dirX));

    // shadow falls down and to the right, onto the track
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(4, -span + 6, 7, span * 2);

    // legs either side of the track
    ctx.fillStyle = '#4a5057';
    ctx.fillRect(-4, -span - 5, 10, 10);
    ctx.fillRect(-4, span - 5, 10, 10);

    // the beam, with a lighter top edge
    ctx.fillStyle = '#5d646c';
    ctx.fillRect(-2, -span, 6, span * 2);
    ctx.fillStyle = '#7d858e';
    ctx.fillRect(-2, -span, 1.5, span * 2);

    // light housing in the middle with the five lights
    const housing = 34;
    ctx.fillStyle = '#1d2125';
    ctx.fillRect(-3.5, -housing / 2, 9, housing);
    const lit = this.lightsOn;
    for (let i = 0; i < LIGHT_COUNT; i++) {
      const y = -housing / 2 + 3.4 + i * 6.8;
      const on = i < lit;
      if (on) {
        const glow = ctx.createRadialGradient(1, y, 0, 1, y, 9);
        glow.addColorStop(0, 'rgba(255, 40, 30, 0.6)');
        glow.addColorStop(1, 'rgba(255, 40, 30, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(-8, y - 9, 18, 18);
      }
      ctx.fillStyle = on ? '#ff3b2f' : '#3a1513';
      ctx.beginPath();
      ctx.arc(1, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawMessage(ctx, pixelRatio) {
    if (!this.message || this.messageTime <= 0) return;

    ctx.save();
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const screenWidth = ctx.canvas.width / pixelRatio;
    ctx.globalAlpha = Math.min(1, this.messageTime * 2);
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.letterSpacing = '1.5px';
    const width = ctx.measureText(this.message).width + 32;
    const x = Math.round((screenWidth - width) / 2);
    ctx.fillStyle = this.jumpedStart ? 'rgba(211, 47, 47, 0.92)' : 'rgba(16, 20, 24, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x, 96, width, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.message, x + width / 2, 111);
    ctx.restore();
  }
}
