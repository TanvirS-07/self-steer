const CLOUD_COUNT = 7;
const WIND = { x: 9, y: 3 }; // world units per second
const CLOUD_RES = 0.25;      // clouds are blurry anyway, so draw them small and stretch them

// Soft cloud shadows drifting over the circuit, plus a dark vignette round the
// edge of the screen. Both are drawn on top of everything else.
export class Atmosphere {
  constructor(area) {
    this.area = area;
    this.clouds = [];
    this.vignette = null;
    this.still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    for (let i = 0; i < CLOUD_COUNT; i++) {
      const size = 300 + Math.random() * 350;
      this.clouds.push({
        x: area.x + Math.random() * area.width,
        y: area.y + Math.random() * area.height,
        size,
        image: renderCloud(size),
      });
    }
  }

  update(dt) {
    if (this.still) return;
    const a = this.area;
    for (const c of this.clouds) {
      c.x += WIND.x * dt;
      c.y += WIND.y * dt;
      // once a cloud has drifted fully off one side, bring it back on the other
      if (c.x - c.size > a.x + a.width) c.x = a.x - c.size;
      if (c.y - c.size > a.y + a.height) c.y = a.y - c.size;
    }
  }

  drawClouds(ctx) {
    for (const c of this.clouds) {
      ctx.drawImage(c.image, c.x - c.size, c.y - c.size, c.size * 2, c.size * 2);
    }
  }

  // The vignette only changes when the window does, so it's drawn once per resize
  drawVignette(ctx) {
    const { width, height } = ctx.canvas;
    if (!this.vignette || this.vignette.width !== width || this.vignette.height !== height) {
      this.vignette = renderVignette(width, height);
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.vignette, 0, 0);
    ctx.restore();
  }
}

// A cloud shadow is a handful of overlapping soft circles
function renderCloud(size) {
  const px = Math.ceil(size * 2 * CLOUD_RES);
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  ctx.scale(CLOUD_RES, CLOUD_RES);

  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const reach = Math.random() * size * 0.35;
    const x = size + Math.cos(angle) * reach;
    const y = size + Math.sin(angle) * reach * 0.6;
    const r = size * (0.35 + Math.random() * 0.3);
    const blob = ctx.createRadialGradient(x, y, 0, x, y, r);
    blob.addColorStop(0, 'rgba(15, 25, 35, 0.16)');
    blob.addColorStop(1, 'rgba(15, 25, 35, 0)');
    ctx.fillStyle = blob;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return canvas;
}

function renderVignette(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const radius = Math.hypot(width, height) / 2;
  const shade = ctx.createRadialGradient(width / 2, height / 2, radius * 0.55, width / 2, height / 2, radius);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
  return canvas;
}
