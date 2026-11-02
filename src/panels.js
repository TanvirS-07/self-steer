// Small dark panels drawn over the scene: a chart of how training is going,
// and a live picture of a neural network thinking.

const INPUT_LABELS = ['←', '↖', '↖', '↑', '↑', '↑', '↗', '↗', '→', 'speed', 'slide'];
const OUTPUT_LABELS = ['steer', 'pedal'];

function drawPanelBox(ctx, rect, title) {
  ctx.fillStyle = 'rgba(16, 20, 24, 0.82)';
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, rect.x + 12, rect.y + 10);
  ctx.letterSpacing = '0px';
}

// Best and average fitness for every generation so far
export function drawFitnessChart(ctx, history, rect) {
  drawPanelBox(ctx, rect, 'FITNESS PER GENERATION');
  const plot = { x: rect.x + 12, y: rect.y + 30, w: rect.w - 24, h: rect.h - 46 };

  // faint grid lines so the shape is easier to read
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = plot.y + (plot.h * i) / 3;
    ctx.beginPath();
    ctx.moveTo(plot.x, y);
    ctx.lineTo(plot.x + plot.w, y);
    ctx.stroke();
  }

  if (history.length < 2) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Waiting for the first generations…', plot.x, plot.y + plot.h / 2 - 6);
    return;
  }

  const top = Math.max(...history.map((h) => h.best)) * 1.1;
  const toX = (i) => plot.x + (plot.w * i) / (history.length - 1);
  const toY = (value) => plot.y + plot.h - (Math.max(0, value) / top) * plot.h;

  const line = (key, colour, width) => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    history.forEach((h, i) => (i === 0 ? ctx.moveTo(toX(i), toY(h[key])) : ctx.lineTo(toX(i), toY(h[key]))));
    ctx.stroke();
  };

  // shade under the best line, then draw both lines on top
  ctx.fillStyle = 'rgba(255, 213, 79, 0.15)';
  ctx.beginPath();
  ctx.moveTo(toX(0), plot.y + plot.h);
  history.forEach((h, i) => ctx.lineTo(toX(i), toY(h.best)));
  ctx.lineTo(toX(history.length - 1), plot.y + plot.h);
  ctx.fill();
  line('average', 'rgba(255, 255, 255, 0.45)', 1.5);
  line('best', '#ffd54f', 2);

  const last = history[history.length - 1];
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(toX(history.length - 1), toY(last.best), 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '11px system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffd54f';
  ctx.fillText('best', plot.x, plot.y + plot.h + 4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('average', plot.x + 36, plot.y + plot.h + 4);
}

// Every neuron as a circle, lit up by how strongly it's firing right now, and
// every connection as a line: green pushes up, red pushes down, and thicker
// means a bigger weight
export function drawBrain(ctx, network, rect) {
  drawPanelBox(ctx, rect, 'BRAIN');
  const area = { x: rect.x + 46, y: rect.y + 28, w: rect.w - 100, h: rect.h - 38 };
  const sizes = network.sizes;

  const position = (layer, index) => ({
    x: area.x + (area.w * layer) / (sizes.length - 1),
    y: area.y + (area.h * (index + 0.5)) / sizes[layer],
  });

  network.layers.forEach((layer, l) => {
    layer.weights.forEach((row, o) => {
      const to = position(l + 1, o);
      row.forEach((weight, i) => {
        const from = position(l, i);
        // how much this connection matters right now: its weight times what's flowing in
        const signal = Math.min(1, Math.abs(weight * network.activations[l][i]));
        ctx.strokeStyle = weight > 0 ? `rgba(105, 240, 174, ${0.08 + signal * 0.7})` : `rgba(255, 110, 100, ${0.08 + signal * 0.7})`;
        ctx.lineWidth = 0.5 + Math.min(2, Math.abs(weight));
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      });
    });
  });

  sizes.forEach((size, l) => {
    for (let i = 0; i < size; i++) {
      const { x, y } = position(l, i);
      const value = network.activations[l][i] ?? 0;
      const brightness = Math.min(1, Math.abs(value));
      ctx.fillStyle = value >= 0 ? `rgba(255, 213, 79, ${0.2 + brightness * 0.8})` : `rgba(100, 181, 246, ${0.2 + brightness * 0.8})`;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });

  ctx.font = '9px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.textAlign = 'right';
  INPUT_LABELS.forEach((label, i) => {
    const { x, y } = position(0, i);
    ctx.fillText(label, x - 8, y);
  });
  ctx.textAlign = 'left';
  OUTPUT_LABELS.forEach((label, i) => {
    const { x, y } = position(sizes.length - 1, i);
    const value = network.activations[sizes.length - 1][i] ?? 0;
    ctx.fillText(`${label} ${value.toFixed(2)}`, x + 8, y);
  });
}
