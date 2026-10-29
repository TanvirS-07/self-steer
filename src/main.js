import { Track } from './track.js';
import { renderScenery } from './scenery.js';
import { Car } from './car.js';
import { drawCar } from './carSprite.js';
import { readKeyboard } from './input.js';
import { LapTimer } from './laps.js';
import { drawHud } from './hud.js';
import { TyreEffects } from './effects.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const track = new Track();
let scenery = null;

const effects = new TyreEffects();
let car;
let timer;

// Puts the car back on the grid and clears the timer and skid marks.
// ABS and traction control settings carry over.
function restart() {
  const start = track.start;
  const previous = car;
  car = new Car(
    start.x - start.dirX * 30,
    start.y - start.dirY * 30,
    Math.atan2(start.dirY, start.dirX),
  );
  if (previous) {
    car.abs = previous.abs;
    car.tractionControl = previous.tractionControl;
  }
  timer = new LapTimer(track);
  effects.clear();
}

restart();

const restartButton = document.getElementById('restart');
restartButton.addEventListener('click', () => {
  restart();
  restartButton.blur(); // so Space/Enter don't press it again while driving
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyB' && !e.repeat) car.abs = !car.abs;
  if (e.code === 'KeyT' && !e.repeat) car.tractionControl = !car.tractionControl;
  if (e.code === 'KeyR' && !e.repeat) restart();
});

// how the world maps onto the screen, worked out on resize
const view = { scale: 1, offsetX: 0, offsetY: 0 };

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  // fit the whole track on screen and centre it
  const b = track.bounds;
  view.scale = Math.min(canvas.width / b.width, canvas.height / b.height);
  view.offsetX = (canvas.width - b.width * view.scale) / 2 - b.x * view.scale;
  view.offsetY = (canvas.height - b.height * view.scale) / 2 - b.y * view.scale;

  // redraw the scenery for exactly what's on screen so it stays sharp
  const visible = {
    x: -view.offsetX / view.scale,
    y: -view.offsetY / view.scale,
    width: canvas.width / view.scale,
    height: canvas.height / view.scale,
  };
  scenery = renderScenery(track, visible, view.scale);
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
  effects.update(car, dt);
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(scenery, 0, 0);

  ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);
  effects.drawMarks(ctx);
  drawCar(ctx, car);
  effects.drawSmoke(ctx);

  drawHud(ctx, timer, car, window.devicePixelRatio || 1);
}

requestAnimationFrame(frame);
