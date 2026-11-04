import { Car } from './car.js';
import { AIDriver } from './driver.js';
import { LapTimer } from './laps.js';
import { crossover, mutate, tournament } from './genetics.js';

const POPULATION = 50;
const ELITES = 2;            // the very best carry over untouched, so we never go backwards
const MUTATION_RATE = 0.1;
const MUTATION_AMOUNT = 0.3;
const TIME_LIMIT = 45;       // seconds per generation
const STUCK_TIME = 3;        // seconds without real progress before a car is out
const STUCK_PROGRESS = 8;    // path points it has to gain in that time
const COLOURS = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#fb8c00', '#8e24aa', '#00acc1', '#f06292', '#6d4c41', '#c0ca33'];

// Runs a whole population of AI cars at once. When every car has crashed, got
// stuck or run out of time, the best ones are bred into the next generation.
//
// It can train on several tracks at once: every driver gets a car on each one
// and its fitness is the total. Training on a single circuit taught the AI to
// favour one turning direction, so tools/train.mjs uses the circuit both ways round.
export class Trainer {
  constructor(tracks) {
    this.tracks = Array.isArray(tracks) ? tracks : [tracks];
    this.track = this.tracks[0]; // the one shown in the game
    this.generation = 1;
    this.history = []; // best fitness of each generation, for the chart
    this.best = null;  // the best driver found in any generation so far
    this.start(Array.from({ length: POPULATION }, () => new AIDriver()));
  }

  start(drivers) {
    this.time = 0;
    this.drivers = drivers;
    this.racers = drivers.flatMap((driver, i) => this.tracks.map((track) => this.racer(driver, i, track)));
  }

  // One driver's car on one track, lined up on the grid
  racer(driver, i, track) {
    const s = track.start;
    const car = new Car(
      s.x - s.dirX * 30,
      s.y - s.dirY * 30,
      Math.atan2(s.dirY, s.dirX),
      COLOURS[i % COLOURS.length],
    );
    // no driver aids, so the AI has to learn not to lock the brakes or spin the wheels
    car.abs = false;
    car.tractionControl = false;
    return {
      car,
      driver,
      track,
      timer: new LapTimer(track),
      alive: true,
      fitness: 0,
      checkProgress: 0,
      checkTime: 0,
    };
  }

  get alive() {
    return this.racers.filter((r) => r.alive).length;
  }

  // The racer that's furthest along right now on the track shown in the game
  get leader() {
    return this.racers
      .filter((r) => r.track === this.track)
      .reduce((best, r) => (r.timer.progress > best.timer.progress ? r : best));
  }

  update(dt) {
    this.time += dt;

    for (const r of this.racers) {
      if (!r.alive) continue;
      r.car.update(r.driver.drive(r.car, r.track), r.track, dt);
      r.timer.update(r.car, dt);
      r.fitness = this.score(r);

      if (r.car.hitBarrier || r.timer.progress < -10 || this.isStuck(r)) r.alive = false;
    }

    if (this.alive === 0 || this.time > TIME_LIMIT) this.nextGeneration();
  }

  // Fitness is mostly how far round the track a car got. Finishing laps quickly
  // earns a bonus on top, so once they can get round, faster ones win.
  score(r) {
    const lapBonus = r.timer.bestLap === null ? 0 : (60 - r.timer.bestLap) * 20;
    return r.timer.progress + lapBonus;
  }

  isStuck(r) {
    if (this.time - r.checkTime < STUCK_TIME) return false;
    const gained = r.timer.progress - r.checkProgress;
    r.checkProgress = r.timer.progress;
    r.checkTime = this.time;
    return gained < STUCK_PROGRESS;
  }

  nextGeneration() {
    // add up each driver's score across all its tracks
    const ranked = this.drivers
      .map((driver) => {
        const runs = this.racers.filter((r) => r.driver === driver);
        return {
          driver,
          fitness: runs.reduce((sum, r) => sum + r.fitness, 0),
          bestLap: runs[0].timer.bestLap, // lap time on the track shown in the game
        };
      })
      .sort((a, b) => b.fitness - a.fitness);
    this.history.push({
      generation: this.generation,
      best: ranked[0].fitness,
      average: ranked.reduce((sum, r) => sum + r.fitness, 0) / ranked.length,
      bestLap: ranked[0].bestLap,
    });

    // keep hold of the best brain ever seen, not just this generation's
    if (!this.best || ranked[0].fitness > this.best.fitness) {
      this.best = {
        brain: ranked[0].driver.brain.copy(),
        fitness: ranked[0].fitness,
        bestLap: ranked[0].bestLap,
        generation: this.generation,
      };
    }

    const children = ranked.slice(0, ELITES).map((r) => new AIDriver(r.driver.brain.copy()));
    while (children.length < POPULATION) {
      const mum = tournament(ranked).driver.brain;
      const dad = tournament(ranked).driver.brain;
      children.push(new AIDriver(mutate(crossover(mum, dad), MUTATION_RATE, MUTATION_AMOUNT)));
    }

    this.generation++;
    this.start(children);
  }
}
