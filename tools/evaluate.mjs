// Races the hand-written driver and the trained AI on the tracks the AI trained
// on and on tracks it has never seen, and prints the lap times as a table.
//
//   node tools/evaluate.mjs [brain file]
import { readFileSync } from 'node:fs';
import { Track } from '../src/track.js';
import { Car } from '../src/car.js';
import { LapTimer } from '../src/laps.js';
import { AIDriver } from '../src/driver.js';
import { NeuralNetwork } from '../src/network.js';
import { HandDriver } from './handDriver.mjs';
import { TRAINING_TRACKS, TEST_TRACKS } from './tracks.mjs';

const brainFile = process.argv[2] ?? 'models/pro.json';
const brain = NeuralNetwork.fromJSON(JSON.parse(readFileSync(brainFile)).brain);
const RACE_TIME = 120; // seconds

function race(track, driver, aids) {
  const s = track.start;
  const car = new Car(s.x - s.dirX * 30, s.y - s.dirY * 30, Math.atan2(s.dirY, s.dirX));
  car.abs = aids;
  car.tractionControl = aids;
  const timer = new LapTimer(track);
  let barrierHits = 0;

  for (let t = 0; t < RACE_TIME; t += 1 / 60) {
    car.update(driver.drive(car, track), track, 1 / 60);
    timer.update(car, 1 / 60);
    if (car.hitBarrier) barrierHits++;
  }
  return { laps: timer.lap - 1, best: timer.bestLap, barrierHits };
}

const format = (r) => (r.laps === 0 ? `no lap (${Math.round(r.barrierHits / 60)}s on barrier)` : `${r.best.toFixed(2)}s × ${r.laps}${r.barrierHits ? `, ${(r.barrierHits / 60).toFixed(1)}s on barrier` : ''}`);

console.log('| Track | Hand-written (ABS + TC on) | Hand-written (no aids) | AI (no aids) | AI (ABS + TC on) |');
console.log('| --- | --- | --- | --- | --- |');
const tracks = [
  ...Object.entries(TRAINING_TRACKS).map(([name, points]) => [`${name} (trained on)`, points]),
  ...Object.entries(TEST_TRACKS).map(([name, points]) => [`${name} (never seen)`, points]),
];
for (const [name, points] of tracks) {
  const track = new Track(points);
  const results = [
    race(track, new HandDriver(track), true),
    race(track, new HandDriver(track), false),
    race(track, new AIDriver(brain.copy()), false),
    race(track, new AIDriver(brain.copy()), true),
  ];
  console.log(`| ${name} | ${results.map(format).join(' | ')} |`);
}
