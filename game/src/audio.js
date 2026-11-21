// Moonlight Heist — all sound is synthesised with WebAudio: no audio files.
// Footsteps tick (louder and faster when running, faint when sneaking),
// guards' steps are panned by where they stand relative to the player, and
// the alarm, the gem and the win/lose moments get short stingers.
export function makeAudio() {
  const audio = {
    ctx: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext ?? window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    },
    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    },
    // A short filtered noise burst: the basic footstep.
    blip(freq, dur, gain, pan = 0, type = 'sine') {
      if (this.muted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const amp = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.6), t + dur);
      amp.gain.setValueAtTime(gain, t);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(amp);
      if (panner) {
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        amp.connect(panner);
        panner.connect(this.ctx.destination);
      } else {
        amp.connect(this.ctx.destination);
      }
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },
    step(stance) {
      if (stance === 'run') this.blip(150 + Math.random() * 40, 0.09, 0.16, 0, 'triangle');
      else if (stance === 'sneak') this.blip(110 + Math.random() * 20, 0.07, 0.05, 0, 'sine');
      else this.blip(130 + Math.random() * 30, 0.08, 0.09, 0, 'triangle');
    },
    // A guard's step, quieter the further away it is, panned left/right.
    guardStep(guard, player) {
      const dx = guard.x - player.x;
      const dy = guard.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 300) return;
      const gain = 0.11 * (1 - dist / 300);
      this.blip(95 + Math.random() * 20, 0.1, gain, dx / 300, 'triangle');
    },
    alarm() {
      // Two rising notes: the night just got loud.
      this.blip(392, 0.16, 0.2, 0, 'sawtooth');
      setTimeout(() => this.blip(523, 0.22, 0.2, 0, 'sawtooth'), 150);
    },
    gem() {
      // A little sparkle arpeggio for the Moon Opal.
      [880, 1174, 1568].forEach((f, i) => {
        setTimeout(() => this.blip(f, 0.18, 0.14, 0, 'sine'), i * 90);
      });
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => {
        setTimeout(() => this.blip(f, 0.3, 0.16, 0, 'triangle'), i * 130);
      });
    },
    lose() {
      [330, 262, 196].forEach((f, i) => {
        setTimeout(() => this.blip(f, 0.32, 0.16, 0, 'sawtooth'), i * 160);
      });
    },
  };
  return audio;
}
