// Tracks how far round the circuit a car is, and times each lap.
// The car has to pass the halfway point before crossing the line counts,
// otherwise you could just reverse over the line back and forth.
export class LapTimer {
  constructor(track) {
    this.track = track;
    this.lap = 1;
    this.lapTime = 0;
    this.lastLap = null;
    this.bestLap = null;
    this.lastIndex = 0;
    this.passedHalfway = false;
  }

  update(car, dt) {
    this.lapTime += dt;

    const total = this.track.path.length;
    const { index } = this.track.nearest(car.x, car.y);
    const progress = index / total;

    if (progress > 0.45 && progress < 0.55) this.passedHalfway = true;

    // crossed the line going forwards: index jumps from the end of the loop back to the start
    const crossedLine = this.lastIndex > total * 0.9 && index < total * 0.1;
    if (crossedLine && this.passedHalfway) {
      this.lastLap = this.lapTime;
      if (this.bestLap === null || this.lapTime < this.bestLap) this.bestLap = this.lapTime;
      this.lap++;
      this.lapTime = 0;
      this.passedHalfway = false;
    }

    this.lastIndex = index;
  }
}
