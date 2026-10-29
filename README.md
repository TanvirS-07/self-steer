# Self Steer

A top-down 2D racing game where cars teach themselves to drive.

The plan is for a population of cars, each controlled by a small neural network, to learn the track
through neuroevolution. The best drivers from each generation get copied and mutated, and over time
they figure out the racing line on their own.

**Status:** early days. Right now there's the track and a car you can drive yourself. You can't
just hold the throttle all the way round: brake too late and you'll run wide, brake too hard
without ABS and the wheels lock.

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
| R | Restart |

## How it's put together

- `src/track.js` - the circuit is a loop of hand-placed points smoothed with a Catmull-Rom spline
- `src/scenery.js` - draws the grass, road, kerbs, trees, buildings and farmland once to an offscreen canvas sized to the screen
- `src/car.js` - top-down car physics built around a tyre grip budget (see below)
- `src/effects.js` - skid marks and tyre smoke
- `src/laps.js` - lap counting and timing
- `src/carSprite.js` - draws the car, kept separate from the physics in `src/car.js`
- `src/hud.js` - the timing panel across the top

## Car physics

The car is simple but tries to behave like a real one:

- **Friction circle.** Each tyre can only produce so much grip. Grip used for braking or
  accelerating isn't available for turning, so braking mid-corner makes the car run wide.
- **Cornering limit.** Turning at speed `v` needs `v × turn rate` of sideways grip. Ask for more
  than the front tyres have and the car understeers; if the rears run out it oversteers.
- **Weight transfer.** Braking shifts load onto the front tyres and accelerating shifts it to
  the rear, which changes how much grip each end has.
- **Wheel lock and ABS.** The brakes are stronger than the tyres. Without ABS, braking hard locks
  the fronts and the car slides straight on with no steering. ABS holds the brakes just below
  the locking point.
- **Wheelspin and traction control.** It's rear wheel drive, so with traction control off,
  flooring it at low speed spins the rears and steps the back out.
- **Brake pressure.** The brakes build up over a quarter of a second, so a quick tap scrubs off
  a little speed rather than stopping the car dead. The tyres also grip less front-to-back than
  sideways (a friction ellipse), which keeps braking distances believable.
- **Barriers.** A barrier runs round the whole circuit a fixed distance from the centre line.
  Hit it and you bounce off and lose most of your speed.
