// Moonlight Heist — tuning numbers and the level map.
//
// The gallery is a tile grid; one tile is 40 px. Legend:
//   # wall (blocks movement and sight)      . floor
//   C crate (cover: blocks movement+sight)  D display case (cover)
//   P pillar (cover)                        S shadow floor (hides the player)
//   G gem pedestal (blocks movement only)   E exit mat
//   @ player spawn                          1-5 guard spawns
export const TILE = 40;

export const MAP = [
  '##########################',
  '#....S......D......S.....#',
  '#.P....C........C....P...#',
  '#...C......1..2.....C....#',
  '#.....D....####....D.....#',
  '#..S....C..#GG#..C....S..#',
  '#.......C..#GG#..C.......#',
  '#.P.......C....C......P..#',
  '#....3.......4.......5...#',
  '#..C.....D........D...C..#',
  '#......S....C......S.....#',
  '#.P....C.........C....P..#',
  '#....D......C......D.....#',
  '#..S.................S...#',
  '#..@..................E..#',
  '##########################',
];

export const COLS = MAP[0].length;
export const ROWS = MAP.length;

// Canvas size and where the playfield sits inside it.
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const FIELD_X = 120;
export const FIELD_Y = 90;

// Guard patrols: tile waypoints (col, row), walked in order, looping.
// Every edge was checked to run along open floor (see the validate step).
export const GUARDS = [
  {
    name: 'Marlow', spawn: [11, 3], color: '#5b7fa6',
    waypoints: [[11, 3], [15, 3], [15, 2], [8, 2], [8, 3]],
  },
  {
    name: 'Iris', spawn: [14, 3], color: '#8a6fb8',
    waypoints: [[14, 3], [18, 3], [18, 4], [15, 4]],
  },
  {
    name: 'Bram', spawn: [5, 8], color: '#6fa68a',
    waypoints: [[5, 8], [8, 8], [8, 10], [4, 10], [4, 8]],
  },
  {
    name: 'Sable', spawn: [13, 8], color: '#b08a5b',
    waypoints: [[13, 8], [16, 8], [16, 9], [11, 9], [11, 8]],
  },
  {
    name: 'Rook', spawn: [21, 8], color: '#a65b6f',
    waypoints: [[21, 8], [23, 8], [23, 10], [19, 10], [19, 8]],
  },
];

// Movement speeds in px per second.
export const SPEED = {
  playerWalk: 112,
  playerRun: 178,
  playerSneak: 62,
  guardPatrol: 56,
  guardInvestigate: 88,
  guardChase: 122,
};

// Vision: how far a guard sees, and how wide the cone is.
export const VISION = {
  range: 205,
  halfAngle: 0.61, // ~35 degrees each side
  shadowRangeFactor: 0.55, // a player standing in shadow is seen much later
  sneakRateFactor: 0.45, // sneaking fills suspicion slowly
  runRateFactor: 1.5, // running fills it fast
  shadowRateFactor: 0.5,
  fillPerSecondNear: 95, // suspicion gained per second at point blank
  fillPerSecondFar: 34, // ...at the edge of the cone
  decayPerSecond: 26, // suspicion lost per second while unseen
  investigateAt: 60, // suspicion at which a guard walks over to look
  alarmAt: 100,
};

// Noise: footsteps carry this far (px) by stance.
export const NOISE = { sneak: 34, walk: 72, run: 175 };

// Alarm: how long guards keep hunting after losing sight.
export const ALARM_HOLD_SECONDS = 6;
// Catch distance: a guard this close to the player ends the night.
export const CATCH_DISTANCE = 25;

// Warm ceiling lamps: tile positions that pool light on the floor.
export const LAMPS = [
  [4, 2], [13, 2], [21, 2], [8, 6], [18, 6],
  [4, 11], [13, 11], [21, 11], [8, 13], [18, 13],
];
