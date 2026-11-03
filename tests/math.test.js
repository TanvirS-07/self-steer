import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, catmullRom, seededRandom } from '../src/math.js';

test('clamp keeps values inside the range', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-3, 0, 10), 0);
  assert.equal(clamp(42, 0, 10), 10);
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
