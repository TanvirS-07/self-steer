const TILE_WIDTH = 150;
const TILE_HEIGHT = 46;

function formatTime(seconds) {
  if (seconds === null) return '--.---';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs;
}

function drawTile(ctx, x, label, value, color) {
  ctx.fillStyle = 'rgba(20, 28, 36, 0.85)';
  ctx.fillRect(x, 0, TILE_WIDTH, TILE_HEIGHT);

  ctx.fillStyle = color;
  ctx.fillRect(x, 0, TILE_WIDTH, 18);

  ctx.font = 'italic bold 13px "Trebuchet MS", sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + TILE_WIDTH / 2, 9);

  ctx.font = 'italic bold 20px "Trebuchet MS", sans-serif';
  ctx.fillText(value, x + TILE_WIDTH / 2, 32);
}

export function drawHud(ctx, timer, car, pixelRatio) {
  ctx.save();
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const tiles = [
    ['LAP', String(timer.lap), '#1e88e5'],
    ['TIME', formatTime(timer.lapTime), '#e53935'],
    ['LAST', formatTime(timer.lastLap), '#8e24aa'],
    ['BEST', formatTime(timer.bestLap), '#43a047'],
    ['SPEED', `${Math.round(car.speed * 0.6)} km/h`, '#fb8c00'],
  ];

  tiles.forEach(([label, value, color], i) => {
    drawTile(ctx, i * (TILE_WIDTH + 2), label, value, color);
  });

  if (!car.onRoad) {
    ctx.font = 'italic bold 16px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText('Off track!', 12, TILE_HEIGHT + 22);
  }

  ctx.restore();
}
