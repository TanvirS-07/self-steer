// Trains a driver without the browser and saves the best brain it finds.
// Runs the same Trainer as the game, just as fast as Node can go, on the
// circuit in both directions so it doesn't learn to favour one way of turning.
//
//   node tools/train.mjs [generations] [output file] [seed]
//   node tools/train.mjs 120 models/pro.json 1
import { writeFileSync } from 'node:fs';
import { Track } from '../src/track.js';
import { Trainer } from '../src/trainer.js';
import { seededRandom } from '../src/math.js';
import { TRAINING_TRACKS } from './tracks.mjs';

const generations = Number(process.argv[2] ?? 120);
const output = process.argv[3] ?? 'models/pro.json';
const seed = process.argv[4];

// With a seed, every "random" choice repeats exactly, so a run can be reproduced
if (seed !== undefined) Math.random = seededRandom(Number(seed));

const tracks = Object.values(TRAINING_TRACKS).map((points) => new Track(points));
const trainer = new Trainer(tracks);
const started = Date.now();

while (trainer.generation <= generations) {
  const before = trainer.generation;
  trainer.update(1 / 60);
  if (trainer.generation !== before && before % 10 === 0) {
    const lap = trainer.best.bestLap?.toFixed(2) ?? 'no lap yet';
    console.log(`generation ${before}: best lap ${lap}`);
  }
}

const { brain, bestLap, generation } = trainer.best;
const history = trainer.history.map((h) => ({ best: Math.round(h.best), bestLap: h.bestLap }));
writeFileSync(output, JSON.stringify({ bestLap, generation, seed: seed ?? null, brain: brain.toJSON(), history }));
console.log(`saved the generation ${generation} driver (best lap ${bestLap?.toFixed(2)}s) to ${output}`);
console.log(`took ${((Date.now() - started) / 1000).toFixed(0)}s`);
