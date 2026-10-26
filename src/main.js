const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
}

window.addEventListener('resize', resize);
resize();

let lastTime = performance.now();

function frame(now) {
  // cap dt so a backgrounded tab doesn't make everything jump
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  update(dt);
  draw();
  requestAnimationFrame(frame);
}

function update(dt) {}

function draw() {
  ctx.fillStyle = '#5a9a3c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

requestAnimationFrame(frame);
