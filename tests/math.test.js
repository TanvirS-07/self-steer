import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerp, clamp, distance, catmullRom, seededRandom } from '../src/math.js';

test('lerp goes from a to b as t goes from 0 to 1', () => {
  assert.equal(lerp(2, 10, 0), 2);
  assert.equal(lerp(2, 10, 0.5), 6);
  assert.equal(lerp(2, 10, 1), 10);
});

test('clamp keeps values inside the range', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-3, 0, 10), 0);
  assert.equal(clamp(42, 0, 10), 10);
});

test('distance is the straight line between two points', () => {
  assert.equal(distance(0, 0, 3, 4), 5);
  assert.equal(distance(1, 1, 1, 1), 0);
});

test('catmullRom passes through the two middle points', () => {
  const p = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 10 }, { x: 30, y: 10 }];
  assert.deepEqual(catmullRom(...p, 0), { x: 10, y: 0 });
  assert.deepEqual(catmullRom(...p, 1), { x: 20, y: 10 });
});

test('seededRandom gives the same numbers for the same seed', () => {
  const a = seededRandom(7);
  const b = seededRandom(7);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});
