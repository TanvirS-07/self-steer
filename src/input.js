const keys = new Set();

window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());

// Turns whatever keys are held into the same shape of controls the AI will use later
export function readKeyboard() {
  const up = keys.has('ArrowUp') || keys.has('KeyW');
  const down = keys.has('ArrowDown') || keys.has('KeyS');
  const left = keys.has('ArrowLeft') || keys.has('KeyA');
  const right = keys.has('ArrowRight') || keys.has('KeyD');

  return {
    throttle: up ? 1 : 0,
    brake: down ? 1 : 0,
    steer: (right ? 1 : 0) - (left ? 1 : 0),
  };
}
