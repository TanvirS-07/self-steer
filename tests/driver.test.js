import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NeuralNetwork } from '../src/network.js';
import { AIDriver } from '../src/driver.js';
import { LapTimer } from '../src/laps.js';
import { track, carOnGrid } from './helpers.js';

test('the pre-trained driver gets round a lap without hitting anything', () => {
  const data = JSON.parse(readFileSync(new URL('../models/pro.json', import.meta.url)));
  const driver = new AIDriver(NeuralNetwork.fromJSON(data.brain));
  const car = carOnGrid();
  car.abs = false;
  car.tractionControl = false;
  const timer = new LapTimer(track);

  let hits = 0;
  for (let t = 0; t < 30 && timer.lap === 1; t += 1 / 60) {
    car.update(driver.drive(car, track), track, 1 / 60);
    timer.update(car, 1 / 60);
    if (car.hitBarrier) hits++;
  }

  assert.equal(timer.lap, 2, 'should finish a lap within 30 seconds');
  assert.equal(hits, 0);
});
