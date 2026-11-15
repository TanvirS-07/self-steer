// Races the hand-written driver and the trained AI on the tracks the AI trained
// on, the validation track and the test tracks it has never seen, and prints
// the lap times as a table.
//
//   node tools/evaluate.mjs [brain file]
import { readFileSync } from 'node:fs';
import { Track } from '../src/track.js';
import { AIDriver } from '../src/driver.js';
import { NeuralNetwork } from '../src/network.js';
import { HandDriver } from './handDriver.mjs';
import { TRAINING_TRACKS, VALIDATION_TRACKS, TEST_TRACKS } from './tracks.mjs';
import { race, format } from './race.mjs';

const brainFile = process.argv[2] ?? 'models/pro.json';
const brain = NeuralNetwork.fromJSON(JSON.parse(readFileSync(brainFile)).brain);
console.log('| Track | Hand-written (ABS + TC on) | Hand-written (no aids) | AI (no aids) | AI (ABS + TC on) |');
console.log('| --- | --- | --- | --- | --- |');
const tracks = [
  ...Object.entries(TRAINING_TRACKS).map(([name, points]) => [`${name} (trained on)`, points]),
  ...Object.entries(VALIDATION_TRACKS).map(([name, points]) => [`${name} (never trained on, used to choose the driver)`, points]),
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
