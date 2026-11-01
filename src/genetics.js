// The building blocks of evolution: breeding two brains together and making
// small random changes. Both work on the network's raw weights and biases.

// Uniform crossover: the child takes each weight from one parent or the other at random.
export function crossover(mum, dad) {
  const child = mum.copy();
  child.layers.forEach((layer, l) => {
    const other = dad.layers[l];
    layer.weights.forEach((row, o) => {
      row.forEach((_, i) => {
        if (Math.random() < 0.5) row[i] = other.weights[o][i];
      });
    });
    layer.biases.forEach((_, o) => {
      if (Math.random() < 0.5) layer.biases[o] = other.biases[o];
    });
  });
  return child;
}

// Nudges a fraction (rate) of the weights by a random amount. Most nudges are
// small, but a bell-curve shaped random number occasionally gives a big jump,
// which helps the population escape from a dead end.
export function mutate(network, rate, amount) {
  const nudge = (value) => (Math.random() < rate ? value + gaussian() * amount : value);
  for (const layer of network.layers) {
    for (const row of layer.weights) {
      for (let i = 0; i < row.length; i++) row[i] = nudge(row[i]);
    }
    layer.biases = layer.biases.map(nudge);
  }
  return network;
}

// Tournament selection: pick a few at random and keep the fittest.
// Better drivers win more often, but weaker ones still get the odd chance,
// which keeps some variety in the gene pool.
export function tournament(ranked, size = 3) {
  let best = null;
  for (let i = 0; i < size; i++) {
    const entrant = ranked[Math.floor(Math.random() * ranked.length)];
    if (!best || entrant.fitness > best.fitness) best = entrant;
  }
  return best;
}

// Normally distributed random number (mean 0, spread 1), using the Box-Muller method
function gaussian() {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
