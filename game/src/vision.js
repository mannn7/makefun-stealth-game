// Moonlight Heist — the shared sight maths: can a guard see the player from
// where it stands, and how fast does suspicion grow while it can?
import { VISION } from './config.js';
import { isShadow, lineBlocked, blocksSight } from './level.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Returns { seen, distance, inShadow } for one guard looking at the player.
export function canSee(guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const distance = Math.hypot(dx, dy);
  const inShadow = isShadow(player.x, player.y);
  const range = VISION.range * (inShadow ? VISION.shadowRangeFactor : 1);
  if (distance > range) return { seen: false, distance, inShadow };
  const angleTo = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(angleTo, guard.facing)) > VISION.halfAngle) {
    return { seen: false, distance, inShadow };
  }
  if (lineBlocked(guard.x, guard.y, player.x, player.y, blocksSight)) {
    return { seen: false, distance, inShadow };
  }
  return { seen: true, distance, inShadow };
}

// Suspicion gained per second while the guard has the player in its cone.
// Nearer is worse; sneaking and shadow slow it down; running speeds it up.
export function suspicionRate(distance, player) {
  const closeness = 1 - distance / VISION.range;
  const base = VISION.fillPerSecondFar +
    (VISION.fillPerSecondNear - VISION.fillPerSecondFar) * Math.max(0, closeness);
  let rate = base;
  if (player.stance === 'sneak') rate *= VISION.sneakRateFactor;
  if (player.stance === 'run') rate *= VISION.runRateFactor;
  if (isShadow(player.x, player.y)) rate *= VISION.shadowRateFactor;
  return rate;
}
