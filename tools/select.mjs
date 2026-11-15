// Chooses which trained driver to ship. Every finished training run races for
// two minutes on the validation circuit in both directions, with no driver
// aids, and the one that completes the most laps wins (fastest laps break a
// tie). The test tracks are never looked at here, so the shipped driver's
// results on them stay an honest measure of how it copes with new circuits.
//
//   node tools/select.mjs          prints the ranking
//   node tools/select.mjs --save   also copies the winner to models/pro.json
import { readFileSync, readdirSync, copyFileSync } from 'node:fs';
import { Track } from '../src/track.js';
import { AIDriver } from '../src/driver.js';
import { NeuralNetwork } from '../src/network.js';
import { HandDriver } from './handDriver.mjs';
import { VALIDATION_TRACKS } from './tracks.mjs';
import { race, format } from './race.mjs';

const RUN_FOLDERS = { 'docs/runs': 'main', 'docs/runs-varied': 'varied' };
const tracks = Object.entries(VALIDATION_TRACKS).map(([name, points]) => [name, new Track(points)]);

// Seed 5's first attempt is kept for the write-up but was superseded by the re-run
const candidates = Object.entries(RUN_FOLDERS).flatMap(([folder, trainedOn]) =>
  readdirSync(folder)
    .filter((file) => /^seed\d+\.json$/.test(file))
    .sort((a, b) => parseInt(a.slice(4)) - parseInt(b.slice(4)))
    .map((file) => ({ file: `${folder}/${file}`, name: `${trainedOn} seed ${parseInt(file.slice(4))}` })));

for (const c of candidates) {
  const brain = NeuralNetwork.fromJSON(JSON.parse(readFileSync(c.file)).brain);
  c.results = tracks.map(([, track]) => race(track, new AIDriver(brain.copy()), false));
  c.laps = c.results.reduce((sum, r) => sum + r.laps, 0);
  c.lapTime = c.results.reduce((sum, r) => sum + (r.best ?? Infinity), 0);
}
candidates.sort((a, b) => b.laps - a.laps || a.lapTime - b.lapTime);

console.log(`| Rank | Driver | ${tracks.map(([name]) => name).join(' | ')} | Laps |`);
console.log(`| --- | --- | ${tracks.map(() => '---').join(' | ')} | --- |`);
const baseline = tracks.map(([, track]) => race(track, new HandDriver(track), false));
console.log(`| - | hand-written | ${baseline.map(format).join(' | ')} | ${baseline.reduce((sum, r) => sum + r.laps, 0)} |`);
candidates.forEach((c, i) => console.log(`| ${i + 1} | ${c.name} | ${c.results.map(format).join(' | ')} | ${c.laps} |`));

const winner = candidates[0];
console.log(`
chosen: ${winner.name} (${winner.file})`);
if (process.argv.includes('--save')) {
  copyFileSync(winner.file, 'models/pro.json');
  console.log('copied to models/pro.json');
}
