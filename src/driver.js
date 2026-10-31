import { NeuralNetwork } from './network.js';
import { Sensors } from './sensors.js';
import { TOP_SPEED } from './car.js';
import { clamp } from './math.js';

const HIDDEN = 10;

// Connects a neural network to a car. Each frame it turns what the car can sense
// into numbers, runs them through the network, and turns the answer into controls.
//
// Inputs (11): the nine sensor readings, forward speed and sideways slide.
// Outputs (2): steering, and one pedal where positive is throttle and negative is brake.
// A single pedal means the network can't do something silly like floor both at once.
export class AIDriver {
  constructor(brain = null) {
    this.sensors = new Sensors();
    const inputCount = this.sensors.angles.length + 2;
    this.brain = brain ?? new NeuralNetwork([inputCount, HIDDEN, 2]);
  }

  drive(car, track) {
    const inputs = [
      ...this.sensors.read(car, track),
      car.forwardSpeed / TOP_SPEED,
      clamp(car.sidewaysSpeed / 100, -1, 1),
    ];
    const [steer, pedal] = this.brain.predict(inputs);

    return {
      steer,
      throttle: Math.max(0, pedal),
      brake: Math.max(0, -pedal),
    };
  }
}
