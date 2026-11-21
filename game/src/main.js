// Moonlight Heist — the game loop, the states and the wiring: title, playing,
// caught and escaped. Input is WASD/arrows to move, Shift to run, C/Ctrl to
// sneak, M to mute, and the on-screen buttons for start and retry.
import { FIELD_X, FIELD_Y, VIEW_H, VIEW_W } from './config.js';
import { parseLevel } from './level.js';
import { makeGuards, updateGuards } from './guards.js';
import { makePlayer, updatePlayer } from './player.js';
import { makeAudio } from './audio.js';
import { makeHud } from './hud.js';
import { render } from './render.js';
import { STAGES } from './shots.js';

window.__errors = [];
window.addEventListener('error', (event) => {
  window.__errors.push(String(event.message ?? event.error ?? 'unknown error'));
});

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = makeHud();
const audio = makeAudio();
const level = parseLevel();

const input = { keys: new Set() };
const IGNORE_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
window.addEventListener('keydown', (event) => {
  if (IGNORE_KEYS.has(event.code)) event.preventDefault();
  if (event.code === 'KeyM') {
    audio.ensure();
    hud.say(audio.toggleMute() ? 'Sound muted' : 'Sound on');
    return;
  }
  input.keys.add(event.code);
  audio.ensure();
});
window.addEventListener('keyup', (event) => input.keys.delete(event.code));
window.addEventListener('blur', () => input.keys.clear());

const game = {
  level,
  player: makePlayer(level.playerSpawn),
  guards: makeGuards(),
  time: 0,
  mode: 'title', // title | playing | caught | escaped
  alarm: false,
  alarmTimer: 0,
  noises: [],
  maxSuspicion: 0,
  alarmEver: false,
  rating: '',
  finalTime: 0,
  onStep(player) {
    audio.step(player.stance);
  },
  onGuardStep(guard) {
    audio.guardStep(guard, game.player);
  },
  onAlarm() {
    game.alarmEver = true;
    audio.alarm();
    hud.say('Spotted! The alarm is up — break line of sight!');
  },
  onGemStolen() {
    audio.gem();
    hud.say('The Moon Opal is yours — now reach the EXIT!');
  },
  onEscape() {
    if (game.mode !== 'playing') return;
    game.mode = 'escaped';
    game.finalTime = game.time;
    game.rating = game.maxSuspicion < 60 ? 'GHOST' : game.alarmEver ? 'LOUD' : 'SHADOW';
    audio.win();
    showEnd(true);
  },
  onCaught(guard) {
    if (game.mode !== 'playing') return;
    game.mode = 'caught';
    game.finalTime = game.time;
    audio.lose();
    hud.say(`${guard.name} caught you!`);
    showEnd(false);
  },
};

function resetGame() {
  game.player = makePlayer(level.playerSpawn);
  game.guards = makeGuards();
  game.time = 0;
  game.mode = 'playing';
  game.alarm = false;
  game.alarmTimer = 0;
  game.noises = [];
  game.maxSuspicion = 0;
  game.alarmEver = false;
  game.rating = '';
}

function formatTime(t) {
  const s = Math.floor(t);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function showEnd(won) {
  const overlay = document.getElementById(won ? 'end-win' : 'end-lose');
  const title = document.getElementById(won ? 'win-title' : 'lose-title');
  const stats = document.getElementById(won ? 'win-stats' : 'lose-stats');
  if (won) {
    title.textContent = `ESCAPED — ${game.rating}`;
    const line = game.rating === 'GHOST'
      ? 'Never once suspected. A perfect ghost.'
      : game.rating === 'SHADOW'
        ? 'Seen, but never caught. The gallery never knew your name.'
        : 'Loud, messy — but the Opal is yours.';
    stats.textContent = `${line} Time ${formatTime(game.finalTime)} · Highest suspicion ${Math.round(game.maxSuspicion)}%.`;
  } else {
    stats.textContent = `Caught after ${formatTime(game.finalTime)} · Highest suspicion ${Math.round(game.maxSuspicion)}%.`;
  }
  overlay.classList.add('show');
}

function hideOverlays() {
  for (const id of ['title-screen', 'end-win', 'end-lose']) {
    document.getElementById(id).classList.remove('show');
  }
}

document.getElementById('start-btn').addEventListener('click', () => {
  audio.ensure();
  hideOverlays();
  resetGame();
});
for (const id of ['retry-btn', 'again-btn']) {
  document.getElementById(id).addEventListener('click', () => {
    audio.ensure();
    hideOverlays();
    resetGame();
  });
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game.mode === 'playing') {
    game.time += dt;
    updatePlayer(game.player, input, dt, game);
    updateGuards(game.guards, dt, game);
    for (const noise of game.noises) noise.age += dt;
    game.noises = game.noises.filter((n) => n.age < n.maxAge);
    hud.update(game, dt);
  }
  render(ctx, game);
  if (game.mode !== 'title') {
    // Keep the HUD honest on the end screens too.
    hud.update(game, dt);
  }
  requestAnimationFrame(loop);
}

// Staged screenshot: ?shot=start|patrol|spotted|escape renders one exact
// frame and stops, so the screenshot is deterministic.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot && STAGES[shot]) {
  hideOverlays();
  if (shot === 'start') document.getElementById('title-screen').classList.add('show');
  STAGES[shot](game);
  hud.update(game, 0);
  render(ctx, game);
  window.__shotReady = true;
} else {
  document.getElementById('title-screen').classList.add('show');
  render(ctx, game);
  requestAnimationFrame(loop);
}

window.__game = game;
