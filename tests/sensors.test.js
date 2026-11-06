import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Sensors } from '../src/sensors.js';
import { track, carOnGrid } from './helpers.js';

test('every reading is between 0 and 1', () => {
  const car = carOnGrid();
  const readings = new Sensors().read(car, track);
  assert.equal(readings.length, 9);
  for (const r of readings) assert.ok(r >= 0 && r <= 1, `reading ${r} out of range`);
});

test('on the start straight the car sees further ahead than to the sides', () => {
  const car = carOnGrid();
  const sensors = new Sensors();
  const readings = sensors.read(car, track);
  const ahead = readings[sensors.angles.indexOf(0)];
  assert.ok(ahead > readings[0]);
  assert.ok(ahead > readings[readings.length - 1]);
});

test('left and right rays are about even when the car is in the middle of the road', () => {
  const car = carOnGrid();
  const readings = new Sensors().read(car, track);
  assert.ok(Math.abs(readings[0] - readings[readings.length - 1]) < 0.05);
});

test('pointing straight at the barrier gives a short reading', () => {
  const car = carOnGrid();
  car.angle += Math.PI / 2; // face the side of the road
  const sensors = new Sensors();
  const readings = sensors.read(car, track);
  const ahead = readings[sensors.angles.indexOf(0)];
  assert.ok(ahead < 0.3, `expected the barrier to be close, got ${ahead}`);
});
