import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Trainer } from '../src/trainer.js';
import { Track } from '../src/track.js';
import { track } from './helpers.js';

test('every driver gets a car on every track', () => {
  const reversed = new Track([...track.controlPoints].reverse().map((p) => [p.x, p.y]));
  const trainer = new Trainer([track, reversed]);
  assert.equal(trainer.racers.length, trainer.drivers.length * 2);
  for (const driver of trainer.drivers) {
    const tracks = trainer.racers.filter((r) => r.driver === driver).map((r) => r.track);
    assert.deepEqual(tracks, [track, reversed]);
  }
});

test('training cars have no ABS or traction control', () => {
  const trainer = new Trainer(track);
  for (const r of trainer.racers) {
    assert.equal(r.car.abs, false);
    assert.equal(r.car.tractionControl, false);
  }
});
