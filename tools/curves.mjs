// Turns several training runs (saved by tools/train.mjs) into a chart of best
// lap time per generation, so you can see whether evolution is repeatable or
// just got lucky once. Also prints a summary table.
//
//   node tools/curves.mjs docs/training-curves.svg runs/seed1.json runs/seed2.json ...
import { readFileSync, writeFileSync } from 'node:fs';

const [output, ...files] = process.argv.slice(2);
const BASELINE = Number(process.env.BASELINE ?? 19.3); // hand-written driver, no aids
const COLOURS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00acc1', '#6d4c41', '#d81b60', '#7cb342', '#3949ab', '#f4511e'];

const runs = files.map((file) => {
  const data = JSON.parse(readFileSync(file));
  // best lap found so far at each generation (null until the first lap)
  let best = null;
  const bestSoFar = data.history.map((h) => {
    if (h.bestLap !== null && (best === null || h.bestLap < best)) best = h.bestLap;
    return best;
  });
  return { seed: data.seed, bestSoFar };
});

const width = 760;
const height = 400;
const plot = { x: 60, y: 54, w: width - 90, h: height - 104 };
const generations = Math.max(...runs.map((r) => r.bestSoFar.length));
const slowest = 40;
const fastest = 15;
const toX = (g) => plot.x + (plot.w * g) / (generations - 1);
const toY = (lap) => plot.y + (plot.h * (slowest - lap)) / (slowest - fastest);

const parts = [
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" font-family="system-ui, sans-serif" font-size="12">`,
  `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
  `<text x="${plot.x}" y="18" font-weight="bold" fill="#222">Best lap time so far, by generation (${runs.length} runs, different random seeds)</text>`,
];

for (let lap = fastest; lap <= slowest; lap += 5) {
  parts.push(`<line x1="${plot.x}" x2="${plot.x + plot.w}" y1="${toY(lap)}" y2="${toY(lap)}" stroke="#eee"/>`);
  parts.push(`<text x="${plot.x - 8}" y="${toY(lap) + 4}" text-anchor="end" fill="#666">${lap}s</text>`);
}
for (let g = 0; g < generations; g += 20) {
  parts.push(`<text x="${toX(g)}" y="${plot.y + plot.h + 18}" text-anchor="middle" fill="#666">${g + 1}</text>`);
}
parts.push(`<text x="${plot.x + plot.w / 2}" y="${height - 8}" text-anchor="middle" fill="#666">generation</text>`);

// the hand-written driver as a dashed line to beat
parts.push(`<line x1="${plot.x}" x2="${plot.x + plot.w}" y1="${toY(BASELINE)}" y2="${toY(BASELINE)}" stroke="#222" stroke-dasharray="6 4"/>`);
parts.push(`<text x="${plot.x + 8}" y="${toY(BASELINE) + 16}" fill="#222">hand-written driver (${BASELINE}s)</text>`);

runs.forEach((run, i) => {
  const points = run.bestSoFar
    .map((lap, g) => (lap === null ? null : `${toX(g).toFixed(1)},${toY(Math.min(lap, slowest)).toFixed(1)}`))
    .filter(Boolean);
  const colour = COLOURS[i % COLOURS.length];
  parts.push(`<polyline points="${points.join(' ')}" fill="none" stroke="${colour}" stroke-width="2"/>`);
  parts.push(`<text x="${plot.x + i * 62}" y="40" fill="${colour}">seed ${run.seed}</text>`);
});

parts.push('</svg>');
writeFileSync(output, parts.join('\n'));

console.log('| Seed | First lap at generation | Best lap by gen 30 | by gen 70 | by gen 120 |');
console.log('| --- | --- | --- | --- | --- |');
for (const run of runs) {
  const first = run.bestSoFar.findIndex((lap) => lap !== null) + 1;
  const at = (g) => run.bestSoFar[Math.min(g, run.bestSoFar.length) - 1]?.toFixed(2) ?? '-';
  console.log(`| ${run.seed} | ${first || '-'} | ${at(30)} | ${at(70)} | ${at(120)} |`);
}
