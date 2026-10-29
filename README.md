# Self Steer

A top-down 2D racing game where cars teach themselves to drive.

The plan is for a population of cars, each controlled by a small neural network, to learn the track
through neuroevolution. The best drivers from each generation get copied and mutated, and over time
they figure out the racing line on their own.

**Status:** early days. Right now there's the track and a car you can drive yourself.

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
| S / ↓ | Brake / reverse |
| A / ← | Steer left |
| D / → | Steer right |

## How it's put together

- `src/track.js` - the circuit is a loop of hand-placed points smoothed with a Catmull-Rom spline
- `src/scenery.js` - draws the grass, road, kerbs and trees once to an offscreen canvas
- `src/car.js` - simple top-down car physics with separate forward and sideways grip
- `src/laps.js` - lap counting and timing
- `src/hud.js` - the timing bar across the top
