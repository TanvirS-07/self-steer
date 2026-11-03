import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Car } from '../src/car.js';
import { track, carOnGrid, run } from './helpers.js';

// an endless straight with no barriers, so only the braking is being tested
const openRoad = { width: 1e9, barrier: 1e9, path: [{ x: 0, y: 0 }], nearest: () => ({ index: 0, distance: 0 }) };

function brakeWhileSteering(abs) {
  const car = new Car(0, 0, 0);
  car.vx = 300;
  car.abs = abs;
  for (let i = 0; i < 60; i++) car.update({ throttle: 0, brake: 1, steer: 1 }, openRoad, 1 / 60);
  return car;
}

// The brakes take a moment to build up, so the locked car turns a tiny bit
// before the wheels lock. After that it just slides straight on.
test('locked wheels barely steer, but ABS keeps steering', () => {
  const locked = brakeWhileSteering(false);
  const withAbs = brakeWhileSteering(true);
  assert.ok(locked.angle < withAbs.angle / 5, 'locked car should hardly turn');
  assert.ok(withAbs.angle > 0.3, 'ABS car should turn');
});

test('the barrier keeps the car on the circuit', () => {
  const car = carOnGrid();
  run(car, { throttle: 1, brake: 0, steer: 1 }, 5);
  assert.ok(track.nearest(car.x, car.y).distance <= track.barrier);
});

test('the car speeds up on throttle and stops on the brakes', () => {
  const car = carOnGrid();
  run(car, { throttle: 1, brake: 0, steer: 0 }, 1.5);
  const fast = car.speed;
  assert.ok(fast > 100);
  // short enough that it stops without starting to reverse
  run(car, { throttle: 0, brake: 1, steer: 0 }, 0.8);
  assert.ok(car.speed < fast / 4);
});
