import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LapTimer } from '../src/laps.js';
import { track, carOnGrid, run } from './helpers.js';

test('driving forwards adds progress', () => {
  const car = carOnGrid();
  const timer = new LapTimer(track);
  run(car, { throttle: 1, brake: 0, steer: 0 }, 2, () => timer.update(car, 1 / 60));
  assert.ok(timer.progress > 10);
});

test('reversing back and forth over the line never counts as a lap', () => {
  const car = carOnGrid();
  const timer = new LapTimer(track);
  for (let i = 0; i < 6; i++) {
    run(car, { throttle: 1, brake: 0, steer: 0 }, 0.6, () => timer.update(car, 1 / 60));
    run(car, { throttle: 0, brake: 1, steer: 0 }, 1.5, () => timer.update(car, 1 / 60));
  }
  assert.equal(timer.lap, 1);
});

test('a fresh timer starts on lap 1 just behind the line', () => {
  const car = carOnGrid();
  const timer = new LapTimer(track);
  run(car, { throttle: 0, brake: 0, steer: 0 }, 0.1, () => timer.update(car, 1 / 60));
  assert.equal(timer.lap, 1);
  assert.equal(timer.lastLap, null);
  assert.ok(timer.lapFraction <= 0.01);
});

test('lap time keeps counting while the car sits still', () => {
  const car = carOnGrid();
  const timer = new LapTimer(track);
  run(car, { throttle: 0, brake: 0, steer: 0 }, 2, () => timer.update(car, 1 / 60));
  assert.ok(Math.abs(timer.lapTime - 2) < 0.05);
});
