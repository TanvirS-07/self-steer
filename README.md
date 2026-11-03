# Self Steer

A top-down racing game where cars teach themselves to drive.

![The pre-trained AI driving, with its sensors and live network view](docs/screenshot.jpg)

You can drive the car yourself, hand it to an AI, race against the AI, or watch 50 AI cars learn
the circuit from scratch. Each AI car is controlled by a small neural network, and the networks
are improved by a genetic algorithm: the drivers that get furthest are bred together, mutated a
little, and raced again. Everything is plain JavaScript with no libraries, including the network.

## Running it

There's no build step, but it uses ES modules so it needs to be served rather than opened as a file:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Controls

| Key | Action |
| --- | --- |
| W / ↑ | Accelerate |
| S / ↓ | Brake (reverse once stopped) |
| A / ← | Steer left |
| D / → | Steer right |
| B | Toggle ABS |
| T | Toggle traction control |
| R | Restart (replays the start lights) |
| I | Hand the car to the best trained AI |
| N | Hand the car to an untrained AI, to see where it starts from |
| P | Race against the best trained AI |
| G | Training mode: watch 50 AI cars evolve |
| F | Change training speed (1x, 3x, 10x) |
| C | Chase cam |
| V | Show the distance sensors |
| H | Show or hide the controls |

## How it works

**The track** is 26 hand-placed points smoothed into a loop with a Catmull-Rom spline and sampled
into evenly spaced points along the centre line. Almost everything is worked out from the distance
to that centre line: whether you're on the road, where the barriers are, what the sensors see and
how far round the lap you are. Finding the nearest point only searches near where the car was last
frame, which is about 7x faster than checking the whole loop.

**The car** has a simple but believable physics model. The tyres have a grip budget that braking,
accelerating and cornering all share, split between the axles by weight transfer. Ask for more than
the front tyres have and the car understeers; run out at the rear and it oversteers. Braking harder
than the tyres can take locks the wheels so you can't steer, unless ABS is on. Too much throttle
spins the rear wheels, unless traction control is on. The car hits steel barriers rather than
driving off into the countryside.

**The AI** sees the track through nine rays that measure the distance to the barrier, plus its own
speed and how much it's sliding. Those 11 numbers go into a neural network (11 → 10 → 2, tanh
activations), which outputs a steering value and a single pedal: positive for throttle, negative
for brake. The rays use sphere tracing, so each one only needs about ten distance checks.

**Evolution** races 50 cars at once with ABS and traction control off, so they have to learn car
control themselves. A car is out if it hits a barrier, goes backwards or stalls. Its fitness is how
far round the track it got, plus a bonus for fast laps once it can complete one. The top two brains
carry over unchanged, and the rest are bred from tournament-selected parents using uniform crossover
and Gaussian mutation. The first lap usually appears around generation 18, and by about generation
70 it laps as fast as a hand-written driver.

## Training your own driver

Press G in the game to watch the cars evolve, and F to speed it up. The best driver found is saved
in your browser, and I or P will use it if it's faster than the one that ships with the game.

Training is much faster without the browser:

```bash
npm run train -- 120 models/pro.json
```

The included `models/pro.json` was made this way: 120 generations in about three minutes, and it
laps in around 18.3 seconds.

## Tests

```bash
npm test
```

The tests use Node's built-in test runner. They cover the maths helpers, the neural network, the
genetic operators, lap counting, the car physics (including ABS and the barriers), and check that
the pre-trained driver can still get round a lap cleanly. They run on every push with GitHub Actions.

## Project layout

- `src/main.js` - game loop, controls and modes; wires everything else together
- `src/track.js` - the circuit: spline, centre-line points, nearest point and barrier distance
- `src/car.js` - car physics
- `src/input.js` - turns keys into throttle, brake and steering
- `src/laps.js` - progress round the track and lap timing
- `src/sensors.js` - rays that measure the distance to the barrier
- `src/network.js` - the neural network
- `src/driver.js` - feeds the sensors into the network and turns its outputs into controls
- `src/genetics.js` - crossover, mutation and tournament selection
- `src/trainer.js` - runs a population of AI cars and breeds the next generation
- `src/brains.js` - loads the pre-trained driver and saves the best one you train
- `src/scenery.js`, `src/carSprite.js`, `src/effects.js`, `src/atmosphere.js`, `src/startLights.js`,
  `src/hud.js`, `src/panels.js` - everything you see: scenery, cars, effects, start lights, HUD,
  the fitness chart and the live network view
- `tools/train.mjs` - trains a driver in Node without the browser
- `models/pro.json` - the pre-trained driver
- `tests/` - unit tests

The simulation code never touches the canvas, which is what lets the same physics and AI run in
the browser, in the tests and in the training script.

## Things it doesn't do (yet)

- The physics is an arcade model, not a full simulation: no tyre slip curves or yaw inertia.
- The AI is trained on one circuit, so it may not cope as well with a different layout.
- Cars don't collide with each other.
