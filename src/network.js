// A small feed-forward neural network, written from scratch.
//
// Numbers go in one end (the inputs), pass through one or more hidden layers,
// and come out the other end (the outputs). Each neuron takes every value from
// the layer before, multiplies each one by a weight, adds them up with a bias,
// and squashes the total with tanh so it lands between -1 and 1.
//
// There's no backpropagation here. The weights will be found by evolution
// (see the genetic algorithm), so the network only needs to run forwards.
export class NeuralNetwork {
  // sizes is the number of neurons in each layer, e.g. [11, 10, 2]
  constructor(sizes) {
    this.sizes = sizes;
    this.layers = [];

    for (let l = 1; l < sizes.length; l++) {
      const inputs = sizes[l - 1];
      const outputs = sizes[l];
      // weights[o][i] connects input i to output neuron o.
      // Starting values are random, scaled down for layers with lots of inputs
      // so the sums don't blow up before tanh squashes them.
      const spread = 1 / Math.sqrt(inputs);
      this.layers.push({
        weights: Array.from({ length: outputs }, () =>
          Array.from({ length: inputs }, () => randomBetween(-spread, spread) * 2),
        ),
        biases: Array.from({ length: outputs }, () => randomBetween(-0.5, 0.5)),
      });
    }

    // the value of every neuron from the last run, so it can be drawn later
    this.activations = sizes.map((size) => new Array(size).fill(0));
  }

  // Runs the inputs through every layer and returns the output layer
  predict(inputs) {
    let values = inputs;
    this.activations[0] = inputs.slice();

    this.layers.forEach((layer, l) => {
      values = layer.weights.map((row, o) => {
        let sum = layer.biases[o];
        for (let i = 0; i < row.length; i++) sum += row[i] * values[i];
        return Math.tanh(sum);
      });
      this.activations[l + 1] = values;
    });

    return values;
  }

  copy() {
    return NeuralNetwork.fromJSON(this.toJSON());
  }

  // Plain objects so a trained brain can be saved and loaded later
  toJSON() {
    return {
      sizes: this.sizes,
      layers: this.layers.map((layer) => ({
        weights: layer.weights.map((row) => row.slice()),
        biases: layer.biases.slice(),
      })),
    };
  }

  static fromJSON(data) {
    const network = new NeuralNetwork(data.sizes);
    network.layers = data.layers.map((layer) => ({
      weights: layer.weights.map((row) => row.slice()),
      biases: layer.biases.slice(),
    }));
    return network;
  }
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
