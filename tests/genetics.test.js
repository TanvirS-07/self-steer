import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NeuralNetwork } from '../src/network.js';
import { crossover, mutate, tournament } from '../src/genetics.js';

function filled(value) {
  const net = new NeuralNetwork([3, 2]);
  net.layers[0].weights = net.layers[0].weights.map((row) => row.map(() => value));
  net.layers[0].biases = net.layers[0].biases.map(() => value);
  return net;
}

test('every gene in a child comes from one of the parents', () => {
  const child = crossover(filled(1), filled(-1));
  const genes = [...child.layers[0].weights.flat(), ...child.layers[0].biases];
  assert.ok(genes.every((g) => g === 1 || g === -1));
});

test('crossover does not change the parents', () => {
  const mum = filled(1);
  crossover(mum, filled(-1));
  assert.ok(mum.layers[0].weights.flat().every((g) => g === 1));
});

test('a mutation rate of 0 changes nothing', () => {
  const net = filled(0.5);
  mutate(net, 0, 10);
  assert.ok(net.layers[0].weights.flat().every((g) => g === 0.5));
});

test('a mutation rate of 1 changes every gene', () => {
  const net = filled(0.5);
  mutate(net, 1, 1);
  assert.ok(net.layers[0].weights.flat().every((g) => g !== 0.5));
});

test('mutation nudges the biases as well as the weights', () => {
  const net = filled(0.5);
  mutate(net, 1, 1);
  assert.ok(net.layers[0].biases.every((b) => b !== 0.5));
});

test('tournament picks the fittest entrant', () => {
  const ranked = [{ fitness: 1 }, { fitness: 1 }, { fitness: 1 }];
  const champion = { fitness: 99 };
  // with only the champion to choose from, it always wins
  assert.equal(tournament([champion], 3), champion);
  assert.equal(tournament(ranked, 3).fitness, 1);
});
