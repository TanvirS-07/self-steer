// A two-minute race for one driver on one track, shared by the evaluation and
// model selection tools.
import { Car } from '../src/car.js';
import { LapTimer } from '../src/laps.js';

export const RACE_TIME = 120; // seconds

export function race(track, driver, aids) {
  const s = track.start;
  const car = new Car(s.x - s.dirX * 30, s.y - s.dirY * 30, Math.atan2(s.dirY, s.dirX));
  car.abs = aids;
  car.tractionControl = aids;
  const timer = new LapTimer(track);
  let barrierHits = 0;

  for (let t = 0; t < RACE_TIME; t += 1 / 60) {
    car.update(driver.drive(car, track), track, 1 / 60);
    timer.update(car, 1 / 60);
    if (car.hitBarrier) barrierHits++;
  }
  return { laps: timer.lap - 1, best: timer.bestLap, barrierHits };
}

export const format = (r) => (r.laps === 0 ? `no lap (${Math.round(r.barrierHits / 60)}s on barrier)` : `${r.best.toFixed(2)}s × ${r.laps}${r.barrierHits ? `, ${(r.barrierHits / 60).toFixed(1)}s on barrier` : ''}`);
