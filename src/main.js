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
import { loadProBrain, loadSavedBrain, saveBrain } from './brains.js';
import { drawFitnessChart, drawBrain } from './panels.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const track = new Track();
let scenery = null;

const effects = new TyreEffects();
const lights = new StartLights();
const sensors = new Sensors();
let showSensors = false;
let aiDriver = null; // when set, a neural network drives instead of the keyboard
let driverName = 'YOU';
let untrained = false; // whether the AI driving is the random one from the N key

// The pre-trained driver loads in the background; until then I falls back to the others
let proDriver = null;
loadProBrain().then((pro) => (proDriver = pro));
let savedBest = null;

// Picks the fastest driver available: the one that ships with the game, the best
// one you've trained before (saved in the browser), or one from this session
function bestDriver() {
  const options = [
    proDriver && { ...proDriver, name: 'PRO' },
    loadSavedBrain() && { ...loadSavedBrain(), name: 'YOURS' },
    trainer?.best && { ...trainer.best, name: 'YOURS' },
  ].filter((d) => d && d.bestLap !== null);
  options.sort((a, b) => a.bestLap - b.bestLap);
  return options[0] ?? null;
}

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

// Race mode: the best trained AI lines up on pole and you start just behind it.
// The cars are ghosts to each other, so it's a pure race against the clock.
let racingRival = false;
let rival = null;

// Puts the car back on the grid, clears the timer and skid marks and runs the
// start lights again. ABS and traction control settings carry over.
// A spot on the starting grid: how far back from the line and how far across
function gridSlot(back, across, color) {
  const s = track.start;
  return new Car(
    s.x - s.dirX * back + s.normalX * across,
    s.y - s.dirY * back + s.normalY * across,
    Math.atan2(s.dirY, s.dirX),
    color,
  );
}

function restart() {
  const previous = car;
  car = racingRival ? gridSlot(46, 15) : gridSlot(30, 0);
  if (previous) {
    car.abs = previous.abs;
    car.tractionControl = previous.tractionControl;
  }
  timer = new LapTimer(track);
  effects.clear();
  lights.reset();

  rival = null;
  const best = bestDriver();
  if (racingRival && best) {
    rival = { car: gridSlot(24, -15, '#e53935'), driver: new AIDriver(best.brain.copy()), timer: new LapTimer(track) };
  }
}

restart();

const controlsLegend = document.getElementById('controls');
const controlsButton = document.getElementById('show-controls');

// the controls list stays tucked away under its button until asked for
function toggleControls() {
  controlsLegend.hidden = !controlsLegend.hidden;
  controlsButton.setAttribute('aria-expanded', String(!controlsLegend.hidden));
}
controlsButton.addEventListener('click', () => {
  toggleControls();
  controlsButton.blur();
});
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
  if (e.code === 'KeyP' && !e.repeat && !training) {
    racingRival = !racingRival;
    restart();
  }
  if (e.code === 'KeyC' && !e.repeat) {
    chase = !chase;
    if (chase) renderChaseScenery();
    else chaseScenery = null; // it's big, so let it go when not needed
  }
  if (e.code === 'KeyH' && !e.repeat) toggleControls();
  // I hands the car to the best trained driver, N to a random untrained one.
  // Pressing the same key again hands it back to you; pressing the other
  // one swaps straight from one AI to the other.
  if (e.code === 'KeyI' && !e.repeat) {
    const best = bestDriver();
    const trainedDriving = aiDriver && !untrained;
    aiDriver = trainedDriving ? null : new AIDriver(best ? best.brain.copy() : null);
    untrained = false;
    driverName = aiDriver ? (best ? best.name : 'RANDOM') : 'YOU';
  }
  if (e.code === 'KeyN' && !e.repeat) {
    untrained = !(aiDriver && untrained);
    aiDriver = untrained ? new AIDriver() : null;
    driverName = untrained ? 'RANDOM' : 'YOU';
  }
});

// how the world maps onto the screen, worked out on resize
const view = { scale: 1, offsetX: 0, offsetY: 0 };

// Chase cam: zoomed in and following one car. It needs its own sharper copy of
// the scenery, which is only drawn while the chase cam is switched on.
const CHASE_ZOOM = 2.2;
let chase = false;
let chaseScenery = null;
const chaseCamera = { x: 0, y: 0, ease: 0 };

function renderChaseScenery() {
  const b = track.bounds;
  const area = { x: b.x - 250, y: b.y - 250, width: b.width + 500, height: b.height + 500 };
  chaseScenery = { area, image: renderScenery(track, area, view.scale * CHASE_ZOOM) };
}

function resize() {
  // A page loaded in a hidden tab or panel can have no size yet. There's
  // nothing to draw, so wait for the resize that comes when it's shown.
  if (window.innerWidth === 0 || window.innerHeight === 0) return;

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
  if (chase) renderChaseScenery();
}

window.addEventListener('resize', resize);
resize();

let lastTime = performance.now();

function frame(now) {
  // cap dt so a backgrounded tab doesn't make everything jump
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  // nothing runs until the page has a size and the scenery has been drawn
  if (scenery) {
    update(dt);
    draw();
  }
  requestAnimationFrame(frame);
}

function update(dt) {
  atmosphere.update(dt);
  chaseCamera.ease = 1 - Math.exp(-8 * dt);
  if (training) {
    for (let i = 0; i < trainingSpeed; i++) trainer.update(TRAINING_STEP);
    // save a new best driver as soon as one turns up
    if (trainer.best && trainer.best !== savedBest) {
      savedBest = trainer.best;
      if (savedBest.bestLap !== null) saveBrain(savedBest);
    }
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

  if (rival) {
    const rivalControls = rival.driver.drive(rival.car, track);
    if (!lights.racing) {
      rivalControls.throttle = 0;
      rivalControls.brake = 0;
    }
    rival.car.update(rivalControls, track, dt);
    if (lights.racing) rival.timer.update(rival.car, dt);
  }
  effects.update(car, dt);
}

// While training: every car still in the running, with the leader drawn on top
// in full and its sensors showing so you can see what it's reacting to
// Draws the scenery and leaves the canvas set up for drawing in world units,
// either showing the whole track or following `target` with the chase cam
function drawBackground(target, shake = { x: 0, y: 0 }) {
  if (!chase) {
    ctx.setTransform(1, 0, 0, 1, shake.x, shake.y);
    ctx.drawImage(scenery, 0, 0);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.offsetX + shake.x, view.offsetY + shake.y);
    return;
  }

  // the camera eases towards the car rather than being glued to it, which feels smoother
  chaseCamera.x += (target.x - chaseCamera.x) * chaseCamera.ease;
  chaseCamera.y += (target.y - chaseCamera.y) * chaseCamera.ease;

  const scale = view.scale * CHASE_ZOOM;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#74a845';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(
    scale, 0, 0, scale,
    canvas.width / 2 - chaseCamera.x * scale + shake.x,
    canvas.height / 2 - chaseCamera.y * scale + shake.y,
  );
  const { image, area } = chaseScenery;
  ctx.drawImage(image, area.x, area.y, area.width, area.height);
}

// The chart and brain sit in the top-left corner, which is only ever forest
const CHART_RECT = { x: 12, y: 12, w: 250, h: 140 };
const BRAIN_RECT = { x: 12, y: 160, w: 250, h: 170 };

function drawPanels(network, history = null) {
  ctx.save();
  const pixelRatio = window.devicePixelRatio || 1;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  if (history) {
    drawFitnessChart(ctx, history, CHART_RECT);
    drawBrain(ctx, network, BRAIN_RECT);
  } else {
    drawBrain(ctx, network, { ...BRAIN_RECT, y: CHART_RECT.y });
  }
  ctx.restore();
}

function drawTraining() {
  const leader = trainer.leader;
  drawBackground(leader.car);

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
  drawPanels(leader.driver.brain, trainer.history);
}

function draw() {
  if (training) {
    drawTraining();
    return;
  }

  // the whole scene shakes on a big barrier hit, but the HUD stays put
  drawBackground(car, effects.shakeOffset());
  effects.drawMarks(ctx);
  effects.drawDust(ctx);
  effects.drawSpeedStreaks(ctx, car);
  if (aiDriver) aiDriver.sensors.draw(ctx, car);
  else if (showSensors) sensors.draw(ctx, car);
  if (rival) drawCar(ctx, rival.car);
  drawCar(ctx, car);
  effects.drawSmoke(ctx);
  effects.drawSparks(ctx);
  lights.draw(ctx, track);
  atmosphere.drawClouds(ctx);
  atmosphere.drawVignette(ctx);

  const pixelRatio = window.devicePixelRatio || 1;
  drawHud(ctx, timer, car, pixelRatio, driverName, rival?.timer);
  if (aiDriver) drawPanels(aiDriver.brain);
  lights.drawOverlay(ctx, pixelRatio);
  lights.drawMessage(ctx, pixelRatio);
}

requestAnimationFrame(frame);
