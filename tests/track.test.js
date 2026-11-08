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
