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

// Give each driver a made-up score instead of racing them
function scoreDrivers(trainer, scoreFor) {
  trainer.racers.forEach((r) => (r.fitness = scoreFor(trainer.drivers.indexOf(r.driver))));
}

test('a new generation records the scores and keeps the same population size', () => {
  const trainer = new Trainer(track);
  const size = trainer.drivers.length;
  scoreDrivers(trainer, (i) => i);
  trainer.nextGeneration();
  assert.equal(trainer.generation, 2);
  assert.equal(trainer.drivers.length, size);
  assert.equal(trainer.history[0].best, size - 1);
  assert.equal(trainer.history[0].average, (size - 1) / 2);
});
