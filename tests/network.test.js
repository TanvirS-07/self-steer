import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NeuralNetwork } from '../src/network.js';

test('a neuron is tanh of the weighted sum plus bias', () => {
  const net = new NeuralNetwork([2, 1]);
  net.layers[0].weights = [[2, -1]];
  net.layers[0].biases = [0.5];
  const [out] = net.predict([0.25, 0.5]);
  assert.ok(Math.abs(out - Math.tanh(2 * 0.25 - 0.5 + 0.5)) < 1e-12);
});

test('outputs are always between -1 and 1', () => {
  const net = new NeuralNetwork([11, 10, 2]);
  for (const v of net.predict(new Array(11).fill(1000))) {
    assert.ok(v >= -1 && v <= 1);
  }
});

test('a copy gives the same answers but can be changed on its own', () => {
  const net = new NeuralNetwork([3, 4, 2]);
  const input = [0.1, 0.5, 0.9];
  const before = net.predict(input);
  const copy = net.copy();
  assert.deepEqual(copy.predict(input), before);

  copy.layers[0].weights[0][0] += 5;
  assert.deepEqual(net.predict(input), before);
});

test('toJSON and fromJSON round trip', () => {
  const net = new NeuralNetwork([3, 4, 2]);
  const loaded = NeuralNetwork.fromJSON(JSON.parse(JSON.stringify(net.toJSON())));
  assert.deepEqual(loaded.predict([0.2, 0.4, 0.6]), net.predict([0.2, 0.4, 0.6]));
});
