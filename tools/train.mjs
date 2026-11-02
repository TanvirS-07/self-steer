// Trains a driver without the browser and saves the best brain it finds.
// Runs the same Trainer as the game, just as fast as Node can go.
//
//   node tools/train.mjs [generations] [output file]
//   node tools/train.mjs 100 models/pro.json
import { writeFileSync } from 'node:fs';
import { Track } from '../src/track.js';
import { Trainer } from '../src/trainer.js';

const generations = Number(process.argv[2] ?? 100);
const output = process.argv[3] ?? 'models/pro.json';

const trainer = new Trainer(new Track());
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
writeFileSync(output, JSON.stringify({ bestLap, generation, brain: brain.toJSON() }));
console.log(`saved the generation ${generation} driver (best lap ${bestLap?.toFixed(2)}s) to ${output}`);
console.log(`took ${((Date.now() - started) / 1000).toFixed(0)}s`);
