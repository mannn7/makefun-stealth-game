// Moonlight Heist — the player: Wren, the burglar. Walks quietly by default,
// runs loud on Shift, sneaks near-silently on C/Ctrl. Stepping within reach
// of the pedestal lifts the Moon Opal; standing on the green mat with the gem
// ends the night in triumph.
import { NOISE, SPEED, TILE } from './config.js';
import { moveCircle } from './level.js';

// Close enough to reach over the pedestal and lift the gem.
export const GEM_REACH = 74;

export function makePlayer(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    radius: 13,
    stance: 'walk', // walk | run | sneak
    moving: false,
    facing: -Math.PI / 2, // facing up the gallery to start
    stepTimer: 0,
    gemStolen: false,
  };
}

export function updatePlayer(player, input, dt, game) {
  const run = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
  const sneak = input.keys.has('KeyC') || input.keys.has('ControlLeft') || input.keys.has('ControlRight');
  player.stance = run ? 'run' : sneak ? 'sneak' : 'walk';

  let dx = 0;
  let dy = 0;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) dy -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) dy += 1;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) dx -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) dx += 1;

  player.moving = dx !== 0 || dy !== 0;
  if (player.moving) {
    const len = Math.hypot(dx, dy);
    const speed = player.stance === 'run'
      ? SPEED.playerRun
      : player.stance === 'sneak' ? SPEED.playerSneak : SPEED.playerWalk;
    const step = speed * dt;
    const moved = moveCircle(player.x, player.y, (dx / len) * step, (dy / len) * step, player.radius);
    player.x = moved.x;
    player.y = moved.y;
    player.facing = Math.atan2(dy, dx);

    // Footsteps: a noise ring the guards can hear, and a sound for the player.
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      player.stepTimer = player.stance === 'run' ? 0.26 : player.stance === 'sneak' ? 0.62 : 0.42;
      const radius = NOISE[player.stance];
      game.noises.push({ x: player.x, y: player.y, radius, age: 0, maxAge: 0.5 });
      game.onStep?.(player);
    }
  }

  // Lift the gem by reaching over its pedestal.
  if (!player.gemStolen && game.level.gem) {
    const d = Math.hypot(game.level.gem.x - player.x, game.level.gem.y - player.y);
    if (d < GEM_REACH) {
      player.gemStolen = true;
      game.onGemStolen?.();
    }
  }

  // The exit only counts once the gem is in hand.
  if (player.gemStolen && game.level.exit) {
    const col = Math.floor(player.x / TILE);
    const row = Math.floor(player.y / TILE);
    if (col === game.level.exit.col && row === game.level.exit.row) {
      game.onEscape?.();
    }
  }
}
