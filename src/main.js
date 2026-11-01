import { Track } from './track.js';
import { renderScenery } from './scenery.js';
import { Car } from './car.js';
import { drawCar } from './carSprite.js';
import { readKeyboard } from './input.js';
import { LapTimer } from './laps.js';
import { drawHud, drawTrainingHud } from './hud.js';
import { TyreEffects } from './effects.js';
import { StartLights } from './startLights.js';
import { Atmosphere } from './atmosphere.js';
import { Sensors } from './sensors.js';
import { AIDriver } from './driver.js';
import { Trainer } from './trainer.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const track = new Track();
let scenery = null;

const effects = new TyreEffects();
const lights = new StartLights();
const sensors = new Sensors();
let showSensors = false;
let aiDriver = null; // when set, a neural network drives instead of the keyboard

// Training mode runs a whole population at once in fixed time steps, several
// steps per frame when sped up, so results don't depend on the frame rate.
const TRAINING_STEP = 1 / 60;
const TRAINING_SPEEDS = [1, 3, 10];
let trainer = null;
let training = false;
let trainingSpeed = 1;
// clouds drift over a bit more than the track itself so they don't pop in at the edges
const atmosphere = new Atmosphere({
  x: track.bounds.x - 600,
  y: track.bounds.y - 600,
  width: track.bounds.width + 1200,
  height: track.bounds.height + 1200,
});
let car;
let timer;

// Puts the car back on the grid, clears the timer and skid marks and runs the
// start lights again. ABS and traction control settings carry over.
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
  lights.reset();
}

restart();

const restartButton = document.getElementById('restart');
restartButton.addEventListener('click', () => {
  if (training) trainer = new Trainer(track);
  else restart();
  restartButton.blur(); // so Space/Enter don't press it again while driving
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyB' && !e.repeat) car.abs = !car.abs;
  if (e.code === 'KeyT' && !e.repeat) car.tractionControl = !car.tractionControl;
  if (e.code === 'KeyR' && !e.repeat) {
    if (training) trainer = new Trainer(track);
    else restart();
  }
  // G switches between racing and training, F changes how fast training runs
  if (e.code === 'KeyG' && !e.repeat) {
    if (!trainer) trainer = new Trainer(track);
    training = !training;
  }
  if (e.code === 'KeyF' && !e.repeat && training) {
    const next = (TRAINING_SPEEDS.indexOf(trainingSpeed) + 1) % TRAINING_SPEEDS.length;
    trainingSpeed = TRAINING_SPEEDS[next];
  }
  if (e.code === 'KeyV' && !e.repeat) showSensors = !showSensors;
  // I hands the car to an untrained network, N swaps in a new random one
  if (e.code === 'KeyI' && !e.repeat) aiDriver = aiDriver ? null : new AIDriver();
  if (e.code === 'KeyN' && !e.repeat && aiDriver) aiDriver = new AIDriver();
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
  atmosphere.update(dt);
  if (training) {
    for (let i = 0; i < trainingSpeed; i++) trainer.update(TRAINING_STEP);
    return;
  }

  const controls = aiDriver ? aiDriver.drive(car, track) : readKeyboard();
  lights.update(controls, dt);

  // sat on the grid until the lights go out, though you can still turn the wheel
  if (!lights.racing) {
    controls.throttle = 0;
    controls.brake = 0;
  }

  car.update(controls, track, dt);
  if (showSensors && !aiDriver) sensors.read(car, track);
  if (lights.racing) timer.update(car, dt);
  effects.update(car, dt);
}

// While training: every car still in the running, with the leader drawn on top
// in full and its sensors showing so you can see what it's reacting to
function drawTraining() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(scenery, 0, 0);
  ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX, view.offsetY);

  const leader = trainer.leader;
  ctx.globalAlpha = 0.6;
  for (const r of trainer.racers) {
    if (r.alive && r !== leader) drawCar(ctx, r.car);
  }
  ctx.globalAlpha = 1;
  leader.driver.sensors.draw(ctx, leader.car);
  drawCar(ctx, leader.car);

  lights.draw(ctx, track);
  atmosphere.drawClouds(ctx);
  atmosphere.drawVignette(ctx);
  drawTrainingHud(ctx, trainer, trainingSpeed, window.devicePixelRatio || 1);
}

function draw() {
  if (training) {
    drawTraining();
    return;
  }

  // the whole scene shakes on a big barrier hit, but the HUD stays put
  const shake = effects.shakeOffset();
  ctx.setTransform(1, 0, 0, 1, shake.x, shake.y);
  ctx.drawImage(scenery, 0, 0);

  ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX + shake.x, view.offsetY + shake.y);
  effects.drawMarks(ctx);
  effects.drawDust(ctx);
  effects.drawSpeedStreaks(ctx, car);
  if (aiDriver) aiDriver.sensors.draw(ctx, car);
  else if (showSensors) sensors.draw(ctx, car);
  drawCar(ctx, car);
  effects.drawSmoke(ctx);
  effects.drawSparks(ctx);
  lights.draw(ctx, track);
  atmosphere.drawClouds(ctx);
  atmosphere.drawVignette(ctx);

  const pixelRatio = window.devicePixelRatio || 1;
  drawHud(ctx, timer, car, pixelRatio, aiDriver ? 'AI' : 'YOU');
  lights.drawMessage(ctx, pixelRatio);
}

requestAnimationFrame(frame);
