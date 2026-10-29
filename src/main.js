import { Track, WORLD_WIDTH, WORLD_HEIGHT } from './track.js';
import { renderScenery } from './scenery.js';
import { Car } from './car.js';
import { readKeyboard } from './input.js';
import { LapTimer } from './laps.js';
import { drawHud } from './hud.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const track = new Track();
const scenery = renderScenery(track);

const start = track.start;
const car = new Car(
  start.x - start.dirX * 30,
  start.y - start.dirY * 30,
  Math.atan2(start.dirY, start.dirX),
);
const timer = new LapTimer(track);

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyB' && !e.repeat) car.abs = !car.abs;
});

// how the world maps onto the screen, worked out on resize
const view = { scale: 1, offsetX: 0, offsetY: 0 };

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  // fit the whole world on screen and centre it
  view.scale = Math.min(canvas.width / WORLD_WIDTH, canvas.height / WORLD_HEIGHT);
  view.offsetX = (canvas.width - WORLD_WIDTH * view.scale) / 2;
  view.offsetY = (canvas.height - WORLD_HEIGHT * view.scale) / 2;
}

window.addEventListener('resize', resize);
resize();

let lastTime = performance.now();

function frame(now) {
  // cap dt so a backgrounded tab doesn't make everything jump
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  update(dt);
  draw();
  requestAnimationFrame(frame);
}

function update(dt) {
  car.update(readKeyboard(), track, dt);
  timer.update(car, dt);
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#7cb342';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
  ctx.drawImage(scenery, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  car.draw(ctx);

  drawHud(ctx, timer, car, window.devicePixelRatio || 1);
}

requestAnimationFrame(frame);
