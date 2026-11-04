// Circuits for checking whether the AI has learned to drive or has just
// memorised the track it practised on. The AI trains on the main circuit in
// both directions, so everything in TEST_TRACKS is new to it.
import { MAIN_TRACK } from '../src/track.js';

const KIDNEY = [
  [300, 700], [700, 720], [1100, 700], [1350, 600], [1400, 400], [1250, 250],
  [1000, 200], [800, 300], [650, 420], [500, 350], [350, 200], [200, 280], [160, 500],
];

const TECHNICAL = [
  [250, 750], [600, 760], [800, 700], [900, 560], [1100, 520], [1300, 600],
  [1450, 500], [1420, 300], [1200, 180], [950, 150], [750, 250], [600, 180],
  [400, 150], [220, 250], [180, 450], [300, 550], [180, 650],
];

export const TRAINING_TRACKS = {
  main: MAIN_TRACK,
  'main, reversed': [...MAIN_TRACK].reverse(),
};

export const TEST_TRACKS = {
  // a mirror image: the same corners, but the shapes flipped
  mirrored: MAIN_TRACK.map(([x, y]) => [1660 - x, y]).reverse(),

  // fast and flowing, mostly long sweeping corners, both ways round
  kidney: KIDNEY,
  'kidney, reversed': [...KIDNEY].reverse(),

  // slow and twisty, with a couple of hairpins, both ways round
  technical: TECHNICAL,
  'technical, reversed': [...TECHNICAL].reverse(),
};
