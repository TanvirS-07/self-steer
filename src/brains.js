import { NeuralNetwork } from './network.js';

const STORAGE_KEY = 'self-steer-best-driver';

// The pre-trained driver that ships with the game (made by tools/train.mjs)
export async function loadProBrain() {
  try {
    const response = await fetch('models/pro.json');
    const data = await response.json();
    return { brain: NeuralNetwork.fromJSON(data.brain), bestLap: data.bestLap };
  } catch {
    return null;
  }
}

// The best driver you've trained yourself is kept in the browser, so it's
// still there after a refresh. Storage can be blocked (private windows), so
// failing quietly is fine; you just lose the saved driver.
export function saveBrain(best) {
  try {
    const data = { bestLap: best.bestLap, brain: best.brain.toJSON() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // nothing to do
  }
}

export function loadSavedBrain() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return data ? { brain: NeuralNetwork.fromJSON(data.brain), bestLap: data.bestLap } : null;
  } catch {
    return null;
  }
}
