const SECTION_WIDTH = 104;
const PANEL_HEIGHT = 48;
const LABEL_FONT = '600 10px system-ui, sans-serif';
const VALUE_FONT = '600 18px ui-monospace, Menlo, Consolas, monospace';

function formatTime(seconds) {
  if (seconds === null) return '--.---';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs;
}

function carWarning(car) {
  if (car.locked) return 'WHEELS LOCKED';
  if (car.wheelspin) return 'WHEELSPIN';
  if (car.hitBarrier) return 'BARRIER';
  if (!car.onRoad) return 'OFF TRACK';
  return null;
}

function drawSection(ctx, x, label, value, valueColor = '#fff') {
  const centre = x + SECTION_WIDTH / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = LABEL_FONT;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.letterSpacing = '1.5px';
  ctx.fillText(label, centre, 15);
  ctx.letterSpacing = '0px';

  ctx.font = VALUE_FONT;
  ctx.fillStyle = valueColor;
  ctx.fillText(value, centre, 33);
}

// A single timing panel centred along the top of the screen
export function drawHud(ctx, timer, car, pixelRatio) {
  ctx.save();
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const bestIsLast = timer.bestLap !== null && timer.bestLap === timer.lastLap;
  const sections = [
    ['LAP', String(timer.lap)],
    ['TIME', formatTime(timer.lapTime)],
    ['LAST', formatTime(timer.lastLap), bestIsLast ? '#b388ff' : '#fff'],
    ['BEST', formatTime(timer.bestLap), '#b388ff'],
    ['KM/H', String(Math.round(car.speed * 0.6))],
    ['ABS · B', car.abs ? 'ON' : 'OFF', car.abs ? '#69f0ae' : '#ff8a80'],
    ['TC · T', car.tractionControl ? 'ON' : 'OFF', car.tractionControl ? '#69f0ae' : '#ff8a80'],
  ];

  const width = sections.length * SECTION_WIDTH;
  const screenWidth = ctx.canvas.width / pixelRatio;
  const left = Math.round((screenWidth - width) / 2);

  ctx.fillStyle = 'rgba(16, 20, 24, 0.82)';
  ctx.beginPath();
  ctx.roundRect(left, 6, width, PANEL_HEIGHT, 10);
  ctx.fill();

  sections.forEach(([label, value, color], i) => {
    const x = left + i * SECTION_WIDTH;
    if (i > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(x, 16, 1, PANEL_HEIGHT - 20);
    }
    ctx.save();
    ctx.translate(0, 6);
    drawSection(ctx, x, label, value, color);
    ctx.restore();
  });

  const warning = carWarning(car);
  if (warning) {
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.letterSpacing = '1.5px';
    const pillWidth = ctx.measureText(warning).width + 28;
    const x = Math.round((screenWidth - pillWidth) / 2);
    ctx.fillStyle = 'rgba(211, 47, 47, 0.92)';
    ctx.beginPath();
    ctx.roundRect(x, PANEL_HEIGHT + 12, pillWidth, 24, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(warning, x + pillWidth / 2, PANEL_HEIGHT + 24);
  }

  ctx.restore();
}
