// Moonlight Heist — the DOM HUD above the canvas: the current objective, the
// detection eye (it fills and reddens as any guard's suspicion grows), the
// gem, the timer and the alarm banner. The canvas carries the game; the HUD
// carries the readable state.
export function makeHud() {
  const el = (id) => document.getElementById(id);
  return {
    objective: el('objective'),
    eyeFill: el('eye-fill'),
    eyeBox: el('eye-box'),
    gemState: el('gem-state'),
    clock: el('clock'),
    alarmBanner: el('alarm-banner'),
    message: el('message'),
    update(game, dt) {
      const detection = Math.max(0, ...game.guards.map((g) => g.suspicion));
      this.eyeFill.style.width = `${detection.toFixed(0)}%`;
      this.eyeFill.style.background =
        detection >= 100 ? '#e5484d'
        : detection >= 60 ? '#f5a524'
        : detection >= 25 ? '#e8c15a' : '#7dd87d';
      this.eyeBox.classList.toggle('hot', detection >= 60);
      this.eyeBox.title = detection >= 100 ? 'SPOTTED — run!'
        : detection >= 60 ? 'Suspicious — they are coming to look'
        : detection >= 25 ? 'Something caught their eye'
        : 'Unseen';

      this.objective.textContent = game.player.gemStolen
        ? 'Gem stolen — reach the green EXIT mat'
        : 'Steal the Moon Opal from its pedestal';
      this.gemState.textContent = game.player.gemStolen ? '◆ OPAL — STOLEN' : '◇ OPAL — ON DISPLAY';
      this.gemState.classList.toggle('stolen', game.player.gemStolen);

      const t = Math.floor(game.time);
      const mm = String(Math.floor(t / 60)).padStart(2, '0');
      const ss = String(t % 60).padStart(2, '0');
      this.clock.textContent = `${mm}:${ss}`;

      this.alarmBanner.classList.toggle('on', game.alarm);
      this.alarmBanner.textContent = game.alarm ? '⚠ ALARM — THEY ARE HUNTING YOU' : '';
    },
    // A one-line feed message that fades after a few seconds.
    say(text) {
      this.message.textContent = text;
      this.message.classList.add('show');
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.message.classList.remove('show'), 3200);
    },
  };
}
