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
