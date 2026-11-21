// Moonlight Heist — staged scenes for the screenshots. Each scene sets the
// game to one exact, readable moment (positions, facing, suspicion, alarm),
// renders a single frame and raises window.__shotReady. The screenshots are
// real renders of the game's own code, taken through ?shot=<name>.
import { TILE } from './config.js';
import { tileCenter } from './level.js';

function placeGuard(game, index, col, row, facing, suspicion, state) {
  const guard = game.guards[index];
  const c = tileCenter(col, row);
  guard.x = c.x;
  guard.y = c.y;
  guard.facing = facing;
  guard.suspicion = suspicion;
  guard.state = state;
  guard.pauseTimer = 0;
  return guard;
}

function placePlayer(game, col, row, stance = 'sneak') {
  const c = tileCenter(col, row);
  game.player.x = c.x;
  game.player.y = c.y;
  game.player.stance = stance;
  game.player.moving = false;
  return game.player;
}

// The title screen: the whole gallery at rest, guards mid-patrol, the gem
// glowing on its pedestal, Wren waiting at the door.
export function stageStart(game) {
  game.mode = 'title';
  game.time = 1.7;
  game.alarm = false;
  game.player.gemStolen = false;
  placePlayer(game, 3, 14, 'walk');
  game.player.facing = -Math.PI / 2;
  placeGuard(game, 0, 12, 2, 0, 0, 'patrol');
  placeGuard(game, 1, 19, 3, Math.PI, 0, 'patrol');
  placeGuard(game, 2, 6, 9, Math.PI / 2, 0, 'patrol');
  placeGuard(game, 3, 14, 9, -Math.PI / 2, 0, 'patrol');
  placeGuard(game, 4, 21, 9, Math.PI / 2, 0, 'patrol');
}

// The cover: Wren pressed behind a display case while Sable's cone sweeps
// past, suspicion just starting to rise. Cones, cover, gem and exit all read.
export function stagePatrol(game) {
  game.mode = 'playing';
  game.time = 2.3;
  game.alarm = false;
  game.player.gemStolen = false;
  placePlayer(game, 10, 9, 'sneak');
  game.player.facing = Math.PI;
  placeGuard(game, 0, 12, 2, 0, 0, 'patrol');
  placeGuard(game, 1, 19, 3, Math.PI, 0, 'patrol');
  placeGuard(game, 2, 6, 9, Math.PI / 2, 0, 'patrol');
  placeGuard(game, 3, 13, 9, Math.PI, 22, 'patrol');
  placeGuard(game, 4, 21, 9, Math.PI / 2, 0, 'patrol');
  game.maxSuspicion = 22;
}

// The near miss: Wren caught at the edge of Marlow's cone below the vault,
// the eye almost full, the guard turning with a "!".
export function stageSpotted(game) {
  game.mode = 'playing';
  game.time = 3.1;
  game.alarm = false;
  game.player.gemStolen = false;
  placePlayer(game, 15, 6, 'walk');
  game.player.facing = -Math.PI / 2;
  placeGuard(game, 0, 15, 3, Math.PI / 2, 74, 'investigate');
  game.guards[0].lastSeen = { x: game.player.x, y: game.player.y };
  placeGuard(game, 1, 19, 3, Math.PI, 0, 'patrol');
  placeGuard(game, 2, 6, 9, Math.PI / 2, 0, 'patrol');
  placeGuard(game, 3, 14, 9, -Math.PI / 2, 0, 'patrol');
  placeGuard(game, 4, 21, 9, Math.PI / 2, 0, 'patrol');
  game.maxSuspicion = 74;
}

// The escape: the Opal stolen, the alarm up, Rook closing in while Wren
// sprints for the green EXIT mat.
export function stageEscape(game) {
  game.mode = 'playing';
  game.time = 4.2;
  game.alarm = true;
  game.alarmTimer = 6;
  game.player.gemStolen = true;
  placePlayer(game, 22, 14, 'run');
  game.player.facing = 0;
  placeGuard(game, 0, 12, 2, 0, 0, 'patrol');
  placeGuard(game, 1, 19, 3, Math.PI, 0, 'patrol');
  placeGuard(game, 2, 6, 9, Math.PI / 2, 0, 'patrol');
  placeGuard(game, 3, 14, 9, -Math.PI / 2, 0, 'patrol');
  placeGuard(game, 4, 20, 10, Math.PI / 2, 100, 'chase');
  game.guards[4].lastSeen = { x: game.player.x, y: game.player.y };
  game.maxSuspicion = 100;
  game.alarmEver = true;
}

export const STAGES = { start: stageStart, patrol: stagePatrol, spotted: stageSpotted, escape: stageEscape };
