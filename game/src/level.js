// Moonlight Heist — turns the text map in config.js into the level the game
// plays on: wall and cover rectangles, shadow zones, the gem pedestal, the
// exit mat and the spawn points for the player and the guards.
import { COLS, MAP, ROWS, TILE } from './config.js';

// A tile blocks sight when it is a wall or a piece of cover. The gem pedestal
// is waist-high: it blocks movement but a guard can see over it.
export function blocksSight(tile) {
  return tile === '#' || tile === 'C' || tile === 'D' || tile === 'P';
}

export function blocksMove(tile) {
  return tile === '#' || tile === 'C' || tile === 'D' || tile === 'P' || tile === 'G';
}

export function tileAt(col, row) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return '#';
  return MAP[row][col];
}

export function tileCenter(col, row) {
  return { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
}

// Walk a straight line in world pixels and answer whether any blocking tile
// sits on it. Samples every 6 px, which is finer than half a tile.
export function lineBlocked(x0, y0, x1, y1, blocks) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const col = Math.floor((x0 + dx * t) / TILE);
    const row = Math.floor((y0 + dy * t) / TILE);
    if (blocks(tileAt(col, row))) return true;
  }
  return false;
}

// Circle-vs-tiles collision: try the move on one axis at a time so the mover
// slides along walls instead of sticking to corners.
export function moveCircle(x, y, dx, dy, radius) {
  let nx = x + dx;
  if (circleHits(nx, y, radius)) nx = x;
  let ny = y + dy;
  if (circleHits(nx, ny, radius)) ny = y;
  return { x: nx, y: ny };
}

function circleHits(x, y, radius) {
  const c0 = Math.floor((x - radius) / TILE);
  const c1 = Math.floor((x + radius) / TILE);
  const r0 = Math.floor((y - radius) / TILE);
  const r1 = Math.floor((y + radius) / TILE);
  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      if (!blocksMove(tileAt(col, row))) continue;
      const bx = Math.max(col * TILE, Math.min(x, (col + 1) * TILE));
      const by = Math.max(row * TILE, Math.min(y, (row + 1) * TILE));
      if ((x - bx) * (x - bx) + (y - by) * (y - by) < radius * radius) return true;
    }
  }
  return false;
}

export function isShadow(x, y) {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  return tileAt(col, row) === 'S';
}

// Parse the map once into the pieces the renderer and the AI need.
export function parseLevel() {
  const walls = [];
  const cover = [];
  const shadows = [];
  let gem = null;
  let exit = null;
  let playerSpawn = null;
  const guardSpawns = {};
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const t = MAP[row][col];
      const cx = (col + 0.5) * TILE;
      const cy = (row + 0.5) * TILE;
      if (t === '#') walls.push({ col, row, x: col * TILE, y: row * TILE });
      else if (t === 'C' || t === 'D' || t === 'P') cover.push({ kind: t, col, row, x: col * TILE, y: row * TILE });
      else if (t === 'S') shadows.push({ col, row, x: col * TILE, y: row * TILE });
      else if (t === 'G') gem = gem ?? { x: cx, y: cy, col, row };
      else if (t === 'E') exit = { x: cx, y: cy, col, row };
      else if (t === '@') playerSpawn = { x: cx, y: cy, col, row };
      else if (t >= '1' && t <= '9') guardSpawns[t] = { x: cx, y: cy, col, row };
    }
  }
  // The gem is a 2x2 pedestal; its centre is the middle of the four G tiles.
  const gemTiles = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (MAP[row][col] === 'G') gemTiles.push({ col, row });
    }
  }
  if (gemTiles.length) {
    const cx = gemTiles.reduce((s, t) => s + t.col, 0) / gemTiles.length;
    const cy = gemTiles.reduce((s, t) => s + t.row, 0) / gemTiles.length;
    gem = { x: (cx + 0.5) * TILE, y: (cy + 0.5) * TILE };
  }
  return { walls, cover, shadows, gem, exit, playerSpawn, guardSpawns };
}
