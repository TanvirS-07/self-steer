// Tracks how far round the circuit a car has got and times each lap.
//
// Progress is the distance travelled along the centre line, counted in path
// points. Driving forwards adds to it and reversing takes it away, so a lap only
// counts once you've genuinely gone all the way round. You can't wiggle back and
// forth over the line. The same number will be the AI's score later.
export class LapTimer {
  constructor(track) {
    this.track = track;
    this.lap = 1;
    this.lapTime = 0;
    this.lastLap = null;
    this.bestLap = null;
    this.lastIndex = null;
    this.progress = 0;
  }

  // How far through the current lap the car is, from 0 to 1
  get lapFraction() {
    const total = this.track.path.length;
    return this.progress / total - (this.lap - 1);
  }

  update(car, dt) {
    this.lapTime += dt;

    const total = this.track.path.length;
    const index = car.trackIndex;

    if (this.lastIndex === null) {
      // the grid is just behind the line, so start slightly negative
      this.progress = index > total / 2 ? index - total : index;
    } else {
      // the shortest way between the two indices, allowing for wrapping round the loop
      let step = index - this.lastIndex;
      if (step > total / 2) step -= total;
      if (step < -total / 2) step += total;
      this.progress += step;
    }
    this.lastIndex = index;

    if (this.lapFraction >= 1) {
      this.lastLap = this.lapTime;
      if (this.bestLap === null || this.lapTime < this.bestLap) this.bestLap = this.lapTime;
      this.lap++;
      this.lapTime = 0;
    }
  }
}
