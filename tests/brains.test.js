import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { saveBrain, loadSavedBrain } from '../src/brains.js';
import { NeuralNetwork } from '../src/network.js';

// Node has no localStorage, so stand in a simple one
function fakeStorage() {
  const items = new Map();
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
  };
}

beforeEach(() => {
  globalThis.localStorage = fakeStorage();
});

test('a saved driver loads back with the same brain and lap time', () => {
  const brain = new NeuralNetwork([3, 4, 2]);
  saveBrain({ brain, bestLap: 17.25 });
  const loaded = loadSavedBrain();
  assert.equal(loaded.bestLap, 17.25);
  assert.deepEqual(loaded.brain.predict([0.1, 0.5, -0.3]), brain.predict([0.1, 0.5, -0.3]));
});
