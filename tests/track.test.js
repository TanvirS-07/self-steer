import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Track } from '../src/track.js';
import { track } from './helpers.js';

test('the centre line is a closed loop with no big gaps', () => {
  const { path } = track;
  for (let i = 0; i < path.length; i++) {
    const a = path[i];
    const b = path[(i + 1) % path.length];
    assert.ok(Math.hypot(b.x - a.x, b.y - a.y) < 40, `gap after point ${i}`);
  }
});

test('every point has a unit direction and a normal at right angles to it', () => {
  for (const p of track.path) {
    assert.ok(Math.abs(Math.hypot(p.dirX, p.dirY) - 1) < 1e-9);
    assert.ok(Math.abs(p.dirX * p.normalX + p.dirY * p.normalY) < 1e-9);
  }
});

test('a hint near the car finds the same point as searching the whole loop', () => {
  for (const i of [0, 57, 200, track.path.length - 3]) {
    const p = track.path[i];
    const x = p.x + p.normalX * 10;
    const y = p.y + p.normalY * 10;
    assert.deepEqual(track.nearest(x, y, i + 5), track.nearest(x, y));
  }
});

test('a hint from the wrong side of the track still finds the nearest point', () => {
  const p = track.path[100];
  const far = (100 + Math.floor(track.path.length / 2)) % track.path.length;
  assert.equal(track.nearest(p.x, p.y, far).index, 100);
});

test('the centre line is on track and past the barrier is not', () => {
  const p = track.path[40];
  assert.ok(track.isOnTrack(p.x, p.y));
  assert.ok(!track.isOnTrack(p.x + p.normalX * (track.barrier + 5), p.y + p.normalY * (track.barrier + 5)));
});

test('a wider track has its barrier further out', () => {
  assert.ok(new Track(undefined, 100).barrier > track.barrier);
});
