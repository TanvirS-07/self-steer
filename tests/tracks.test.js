import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Track, WORLD_WIDTH, WORLD_HEIGHT } from '../src/track.js';
import { TRAINING_TRACKS, VARIED_TRAINING_TRACKS, VALIDATION_TRACKS, TEST_TRACKS } from '../tools/tracks.mjs';

// Two circuits are the same layout if one is the other driven the opposite way
const layout = (points) => [JSON.stringify(points), JSON.stringify([...points].reverse())].sort()[0];
const layouts = (set) => new Set(Object.values(set).map(layout));
const trained = layouts({ ...TRAINING_TRACKS, ...VARIED_TRAINING_TRACKS });

test('the validation circuit is never trained on', () => {
  for (const l of layouts(VALIDATION_TRACKS)) assert.ok(!trained.has(l));
});

test('the validation circuit is kept apart from the test circuits', () => {
  const tested = layouts(TEST_TRACKS);
  for (const l of layouts(VALIDATION_TRACKS)) assert.ok(!tested.has(l));
});

test('the test circuits are never trained on', () => {
  for (const l of layouts(TEST_TRACKS)) assert.ok(!trained.has(l));
});

test('the validation circuit is driven both ways round', () => {
  const [forwards, backwards] = Object.values(VALIDATION_TRACKS);
  assert.deepEqual(backwards, [...forwards].reverse());
});

test('the validation circuit fits in the world', () => {
  for (const points of Object.values(VALIDATION_TRACKS)) {
    for (const p of new Track(points).path) {
      assert.ok(p.x > 0 && p.x < WORLD_WIDTH && p.y > 0 && p.y < WORLD_HEIGHT);
    }
  }
});
