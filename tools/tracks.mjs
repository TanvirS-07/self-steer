// Circuits for checking whether the AI has learned to drive or has just
// memorised the track it practised on. The AI trains on the main circuit in
// both directions, so everything in VALIDATION_TRACKS and TEST_TRACKS is new to it.
// The validation circuit is for choosing which trained driver to ship; the test
// circuits are only for reporting how well that driver does, never for choosing.
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

// Two extra practice circuits with very sharp corners, as tight as the technical
// test track's, but laid out nothing like it
const CHEVRONS = [
  [250, 760], [1350, 760], [1450, 600], [1300, 500], [1450, 400], [1350, 250], [1000, 330],
  [800, 150], [600, 330], [300, 180], [180, 400], [350, 550], [180, 650],
];

const SWITCHBACK = [
  [250, 780], [800, 790], [1350, 770], [1470, 660], [1380, 560], [1150, 540], [980, 450],
  [1150, 360], [1380, 340], [1470, 240], [1350, 130], [800, 110], [250, 130], [150, 250],
  [260, 360], [500, 380], [680, 470], [500, 560], [260, 580], [150, 680],
];

// A mix of everything: a long straight, fast sweepers, a chicane, and a hairpin
// as tight as the technical test track's, laid out like none of the others
const VALIDATION = [
  [300, 760], [750, 780], [1200, 760], [1420, 680], [1460, 500], [1330, 420], [1180, 500],
  [1040, 430], [1100, 300], [1300, 250], [1450, 160], [1280, 80], [900, 90], [600, 70],
  [350, 120], [250, 260], [380, 360], [560, 300], [720, 380], [640, 540], [400, 520],
  [200, 560], [160, 680],
];

export const TRAINING_TRACKS = {
  main: MAIN_TRACK,
  'main, reversed': [...MAIN_TRACK].reverse(),
};

// The main circuit plus the sharp-cornered practice circuits, all both ways round
export const VARIED_TRAINING_TRACKS = {
  ...TRAINING_TRACKS,
  chevrons: CHEVRONS,
  'chevrons, reversed': [...CHEVRONS].reverse(),
  switchback: SWITCHBACK,
  'switchback, reversed': [...SWITCHBACK].reverse(),
};

// Never trained on, and kept apart from the test tracks: tools/select.mjs races
// every trained driver here to decide which one ships
export const VALIDATION_TRACKS = {
  validation: VALIDATION,
  'validation, reversed': [...VALIDATION].reverse(),
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
