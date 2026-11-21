// Moonlight Heist — the guards: patrol routes, suspicion, investigation,
// chase and the alarm. A guard has one job at a time, and its state is what
// the vision cone's colour shows the player.
import { GUARDS, SPEED, TILE, VISION, ALARM_HOLD_SECONDS, CATCH_DISTANCE } from './config.js';
import { canSee, suspicionRate } from './vision.js';
import { moveCircle, tileCenter } from './level.js';

function makeGuard(def) {
  const start = tileCenter(def.spawn[0], def.spawn[1]);
  return {
    name: def.name,
    color: def.color,
    waypoints: def.waypoints,
    x: start.x,
    y: start.y,
    facing: Math.PI / 2, // looking down the hall to start
    waypointIndex: 1,
    state: 'patrol', // patrol | investigate | chase | search | return
    suspicion: 0,
    lastSeen: null,
    pauseTimer: 0,
    scanPhase: 0,
    searchTimer: 0,
    stepTimer: 0,
    stepGap: 0.55,
  };
}

export function makeGuards() {
  return GUARDS.map(makeGuard);
}

function walkTowards(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  const moved = moveCircle(guard.x, guard.y, nx - guard.x, ny - guard.y, 13);
  guard.facing = Math.atan2(dy, dx);
  guard.x = moved.x;
  guard.y = moved.y;
  return dist <= speed * dt + 2;
}

function tickSteps(guard, dt, game) {
  guard.stepTimer -= dt;
  if (guard.stepTimer <= 0) {
    guard.stepTimer = guard.stepGap;
    game.onGuardStep?.(guard);
  }
}

export function updateGuards(guards, dt, game) {
  const player = game.player;
  for (const guard of guards) {
    const sight = canSee(guard, player);

    if (sight.seen) {
      guard.suspicion = Math.min(100, guard.suspicion + suspicionRate(sight.distance, player) * dt);
      guard.lastSeen = { x: player.x, y: player.y };
      game.maxSuspicion = Math.max(game.maxSuspicion, guard.suspicion);
      if (guard.suspicion >= VISION.alarmAt && !game.alarm) {
        game.alarm = true;
        game.alarmTimer = ALARM_HOLD_SECONDS;
        game.onAlarm?.();
      }
    } else {
      guard.suspicion = Math.max(0, guard.suspicion - VISION.decayPerSecond * dt);
    }

    // A loud footstep nearby sends a patrolling guard to have a look.
    for (const noise of game.noises) {
      const d = Math.hypot(noise.x - guard.x, noise.y - guard.y);
      if (d < noise.radius + 40 && guard.state === 'patrol') {
        guard.state = 'investigate';
        guard.lastSeen = { x: noise.x, y: noise.y };
        guard.suspicion = Math.max(guard.suspicion, 35);
      }
    }

    if (game.alarm && guard.state !== 'chase') guard.state = 'chase';

    switch (guard.state) {
      case 'patrol': {
        if (guard.suspicion >= VISION.investigateAt) {
          guard.state = 'investigate';
          break;
        }
        if (guard.pauseTimer > 0) {
          guard.pauseTimer -= dt;
          // Look around while waiting at a waypoint.
          guard.scanPhase += dt;
          guard.facing += Math.sin(guard.scanPhase * 2.2) * 0.9 * dt;
          break;
        }
        const wp = guard.waypoints[guard.waypointIndex];
        const target = tileCenter(wp[0], wp[1]);
        if (walkTowards(guard, target.x, target.y, SPEED.guardPatrol, dt)) {
          guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
          guard.pauseTimer = 1.1 + Math.random() * 0.9;
          guard.scanPhase = 0;
        }
        tickSteps(guard, dt, game);
        break;
      }
      case 'investigate': {
        if (guard.suspicion >= VISION.alarmAt) {
          guard.state = 'chase';
          break;
        }
        if (!guard.lastSeen) {
          guard.state = 'return';
          break;
        }
        if (walkTowards(guard, guard.lastSeen.x, guard.lastSeen.y, SPEED.guardInvestigate, dt)) {
          guard.state = 'search';
          guard.searchTimer = 2.6;
          guard.scanPhase = 0;
        }
        tickSteps(guard, dt, game);
        break;
      }
      case 'chase': {
        if (sight.seen) {
          game.alarmTimer = ALARM_HOLD_SECONDS;
          walkTowards(guard, player.x, player.y, SPEED.guardChase, dt);
        } else if (guard.lastSeen) {
          walkTowards(guard, guard.lastSeen.x, guard.lastSeen.y, SPEED.guardChase, dt);
          if (Math.hypot(guard.lastSeen.x - guard.x, guard.lastSeen.y - guard.y) < 14) {
            guard.state = 'search';
            guard.searchTimer = 3;
          }
        }
        tickSteps(guard, dt, game);
        break;
      }
      case 'search': {
        guard.searchTimer -= dt;
        guard.scanPhase += dt;
        guard.facing += Math.sin(guard.scanPhase * 2.6) * 1.4 * dt;
        if (guard.suspicion >= VISION.investigateAt && sight.seen) {
          guard.state = 'investigate';
          break;
        }
        if (guard.searchTimer <= 0) guard.state = 'return';
        break;
      }
      case 'return': {
        if (guard.suspicion >= VISION.investigateAt) {
          guard.state = 'investigate';
          break;
        }
        // Walk back to the nearest waypoint, then resume the patrol.
        let best = 0;
        let bestD = Infinity;
        guard.waypoints.forEach((wp, i) => {
          const c = tileCenter(wp[0], wp[1]);
          const d = Math.hypot(c.x - guard.x, c.y - guard.y);
          if (d < bestD) { bestD = d; best = i; }
        });
        const target = tileCenter(guard.waypoints[best][0], guard.waypoints[best][1]);
        if (walkTowards(guard, target.x, target.y, SPEED.guardPatrol, dt)) {
          guard.waypointIndex = (best + 1) % guard.waypoints.length;
          guard.state = 'patrol';
          guard.pauseTimer = 0.6;
        }
        tickSteps(guard, dt, game);
        break;
      }
    }

    // Caught: a guard close enough to grab the player ends the night.
    if (Math.hypot(guard.x - player.x, guard.y - player.y) < CATCH_DISTANCE) {
      game.onCaught?.(guard);
    }
  }

  // The alarm only lasts while someone is still hunting.
  if (game.alarm) {
    game.alarmTimer -= dt;
    const anyoneHunting = guards.some((g) => g.state === 'chase' || g.state === 'investigate');
    if (game.alarmTimer <= 0 && !anyoneHunting) {
      game.alarm = false;
      for (const g of guards) if (g.state === 'chase') g.state = 'search';
    }
  }
}
