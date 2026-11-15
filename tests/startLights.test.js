import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StartLights } from '../src/startLights.js';

const idle = { throttle: 0 };

test('the on-screen lights are fully visible during the countdown', () => {
  const lights = new StartLights();
  lights.update(idle, 3);
  assert.equal(lights.racing, false);
  assert.equal(lights.overlayAlpha, 1);
});

test('the on-screen lights fade out after the lights go out', () => {
  const lights = new StartLights();
  lights.update(idle, lights.outAt);
  assert.equal(lights.racing, true);
  assert.equal(lights.lightsOn, 0);
  assert.equal(lights.overlayAlpha, 1);

  lights.update(idle, 0.3);
  assert.ok(lights.overlayAlpha > 0 && lights.overlayAlpha < 1);

  lights.update(idle, 1);
  assert.equal(lights.overlayAlpha, 0);
});

test('restarting brings the on-screen lights back', () => {
  const lights = new StartLights();
  lights.update(idle, lights.outAt + 2);
  lights.reset();
  assert.equal(lights.overlayAlpha, 1);
});
