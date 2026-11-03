import { Track } from '../src/track.js';
import { Car } from '../src/car.js';

export const track = new Track();

// A car on the grid, pointing down the start straight
export function carOnGrid() {
  const s = track.start;
  return new Car(s.x - s.dirX * 30, s.y - s.dirY * 30, Math.atan2(s.dirY, s.dirX));
}

export function run(car, controls, seconds, onStep = () => {}) {
  for (let t = 0; t < seconds; t += 1 / 60) {
    car.update(controls, track, 1 / 60);
    onStep();
  }
}
