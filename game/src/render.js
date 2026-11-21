// Moonlight Heist — everything the eye sees, drawn on one canvas: the dark
// gallery floor with warm lamp pools, the cover you can read at a glance,
// the guards' vision cones (yellow calm, orange suspicious, red hunting),
// the glowing Moon Opal and the green exit mat.
import { COLS, FIELD_X, FIELD_Y, LAMPS, ROWS, TILE, VIEW_H, VIEW_W, VISION } from './config.js';
import { isShadow } from './level.js';

function coneColor(guard, alarm) {
  if (alarm || guard.state === 'chase') return { fill: 'rgba(229,72,77,0.30)', edge: 'rgba(229,72,77,0.65)' };
  if (guard.state === 'investigate' || guard.state === 'search' || guard.suspicion >= 25) {
    return { fill: 'rgba(245,165,36,0.26)', edge: 'rgba(245,165,36,0.6)' };
  }
  return { fill: 'rgba(232,193,90,0.20)', edge: 'rgba(232,193,90,0.5)' };
}

function drawCone(ctx, guard, alarm) {
  const { fill, edge } = coneColor(guard, alarm);
  const range = VISION.range;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.facing - VISION.halfAngle, guard.facing + VISION.halfAngle);
  ctx.closePath();
  const grad = ctx.createRadialGradient(guard.x, guard.y, 8, guard.x, guard.y, range);
  grad.addColorStop(0, fill.replace(/[\d.]+\)$/, '0.42)'));
  grad.addColorStop(1, fill);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, level) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = col * TILE;
      const y = row * TILE;
      const even = (col + row) % 2 === 0;
      ctx.fillStyle = even ? '#241d18' : '#201a15';
      ctx.fillRect(x, y, TILE, TILE);
      // Parquet seams.
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
  }
  // Shadow zones: cold dark patches where a guard's eyes slide off you.
  for (const s of level.shadows) {
    ctx.fillStyle = 'rgba(38,68,120,0.34)';
    ctx.fillRect(s.x, s.y, TILE, TILE);
    ctx.fillStyle = 'rgba(120,160,220,0.10)';
    ctx.fillRect(s.x + 3, s.y + 3, TILE - 6, TILE - 6);
  }
  // Warm pools under the ceiling lamps.
  ctx.globalCompositeOperation = 'lighter';
  for (const [col, row] of LAMPS) {
    const cx = (col + 0.5) * TILE;
    const cy = (row + 0.5) * TILE;
    const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 150);
    grad.addColorStop(0, 'rgba(255,196,110,0.20)');
    grad.addColorStop(1, 'rgba(255,196,110,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 150, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
}

function drawWalls(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = '#171226';
    ctx.fillRect(w.x, w.y, TILE, TILE);
    ctx.fillStyle = '#2c2350';
    ctx.fillRect(w.x, w.y, TILE, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(w.x, w.y + 5, TILE, 2);
  }
}

function drawCover(ctx, level, time) {
  for (const c of level.cover) {
    if (c.kind === 'C') {
      // Crate: timber box with cross planks.
      ctx.fillStyle = '#6b4a2b';
      ctx.fillRect(c.x + 3, c.y + 3, TILE - 6, TILE - 6);
      ctx.strokeStyle = '#4a3018';
      ctx.lineWidth = 3;
      ctx.strokeRect(c.x + 3, c.y + 3, TILE - 6, TILE - 6);
      ctx.beginPath();
      ctx.moveTo(c.x + 3, c.y + 3);
      ctx.lineTo(c.x + TILE - 3, c.y + TILE - 3);
      ctx.moveTo(c.x + TILE - 3, c.y + 3);
      ctx.lineTo(c.x + 3, c.y + TILE - 3);
      ctx.stroke();
    } else if (c.kind === 'D') {
      // Display case: glass top, gold trim, a little treasure inside.
      ctx.fillStyle = '#1c2a3a';
      ctx.fillRect(c.x + 2, c.y + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = 'rgba(150,210,255,0.20)';
      ctx.fillRect(c.x + 6, c.y + 6, TILE - 12, TILE - 12);
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x + 2, c.y + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = '#e8c15a';
      ctx.beginPath();
      ctx.arc(c.x + TILE / 2, c.y + TILE / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Pillar: a round column with a lit rim.
      ctx.fillStyle = '#2e2a3e';
      ctx.beginPath();
      ctx.arc(c.x + TILE / 2, c.y + TILE / 2, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#574a7d';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,220,150,0.25)';
      ctx.beginPath();
      ctx.arc(c.x + TILE / 2 - 4, c.y + TILE / 2 - 4, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  void time;
}

function drawGem(ctx, level, time, stolen) {
  if (stolen || !level.gem) return;
  const { x, y } = level.gem;
  const pulse = 0.75 + Math.sin(time * 3) * 0.25;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(x, y, 4, x, y, 60);
  glow.addColorStop(0, `rgba(120,240,255,${0.5 * pulse})`);
  glow.addColorStop(1, 'rgba(120,240,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Pedestal.
  ctx.fillStyle = '#3a3348';
  ctx.fillRect(x - 34, y - 34, 68, 68);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 34, y - 34, 68, 68);
  // The Moon Opal itself: a cut diamond, slowly turning.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 0.8) * 0.25);
  ctx.fillStyle = '#9ff3ff';
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(11, 0);
  ctx.lineTo(0, 15);
  ctx.lineTo(-11, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8fdff';
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(5, 0);
  ctx.lineTo(0, 15);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Sparkles.
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 3; i++) {
    const a = time * 1.4 + (i * Math.PI * 2) / 3;
    const r = 24 + Math.sin(time * 2 + i) * 5;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawExit(ctx, level, time) {
  if (!level.exit) return;
  const { x, y } = level.exit;
  const pulse = 0.6 + Math.sin(time * 2.4) * 0.25;
  ctx.fillStyle = `rgba(46,160,90,${0.5 + pulse * 0.3})`;
  ctx.fillRect(x - 19, y - 19, 38, 38);
  ctx.strokeStyle = '#7dd87d';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 19, y - 19, 38, 38);
  ctx.fillStyle = '#d8ffd8';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', x, y);
}

function drawGuard(ctx, guard) {
  // Body: a dark uniform disc with a coloured ring, facing tick for direction.
  ctx.fillStyle = '#1d2436';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = guard.color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#e8ddc8';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 6, 0, Math.PI * 2);
  ctx.fill();
  const fx = guard.x + Math.cos(guard.facing) * 13;
  const fy = guard.y + Math.sin(guard.facing) * 13;
  ctx.strokeStyle = '#e8ddc8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(fx, fy);
  ctx.stroke();
  // "?" while suspicious, "!" once hunting.
  if (guard.suspicion >= 25) {
    const mark = guard.suspicion >= 60 ? '!' : '?';
    const color = guard.suspicion >= 60 ? '#e5484d' : '#f5a524';
    ctx.fillStyle = color;
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(mark, guard.x, guard.y - 18);
  }
}

function drawPlayer(ctx, player, time) {
  const hidden = isShadow(player.x, player.y);
  if (hidden) {
    ctx.strokeStyle = 'rgba(120,170,255,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 19, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Wren: a hooded teal figure with a cloak that flares as she moves.
  const bob = player.moving ? Math.sin(time * 14) * 1.5 : 0;
  ctx.fillStyle = '#2fae8e';
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob * 0.3, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d7a64';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - 4);
  ctx.lineTo(player.x - 11, player.y + 11);
  ctx.lineTo(player.x + 11, player.y + 11);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0e2b25';
  ctx.beginPath();
  ctx.arc(player.x, player.y - 2, 6.5, 0, Math.PI * 2);
  ctx.fill();
  // A glint of the stolen gem under her cloak.
  if (player.gemStolen) {
    ctx.fillStyle = '#9ff3ff';
    ctx.beginPath();
    ctx.arc(player.x + 8, player.y + 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  // The gallery sits on a black surround; the playfield is centred.
  ctx.fillStyle = '#0a0812';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.translate(FIELD_X, FIELD_Y);
  drawFloor(ctx, game.level);
  drawExit(ctx, game.level, game.time);
  drawGem(ctx, game.level, game.time, game.player.gemStolen);
  drawCover(ctx, game.level, game.time);
  drawWalls(ctx, game.level);
  for (const guard of game.guards) drawCone(ctx, guard, game.alarm);
  // Footstep noise rings, expanding and fading.
  for (const noise of game.noises) {
    const t = noise.age / noise.maxAge;
    ctx.strokeStyle = `rgba(255,255,255,${0.4 * (1 - t)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(noise.x, noise.y, 8 + noise.radius * t, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const guard of game.guards) drawGuard(ctx, guard);
  drawPlayer(ctx, game.player, game.time);
  ctx.restore();
  // A soft vignette: the night presses in at the edges.
  const vig = ctx.createRadialGradient(
    VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.42,
    VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.85,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}
