/**
 * The Nail Canvas - Web Audio Sound Engine
 * Synthesizes all sound effects natively using the Web Audio API.
 * No external MP3 files needed - 100% reliable, zero latency, offline capable!
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initAudioContext();
  }

  initAudioContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  ensureActive() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound(enabled) {
    this.enabled = enabled !== undefined ? enabled : !this.enabled;
    return this.enabled;
  }

  /**
   * Crisp mechanical ratchet click for wheel peg bouncing
   */
  playTick(pitchMod = 1.0) {
    if (!this.enabled) return;
    this.ensureActive();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Click snap (short filtered noise/pulse)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 * pitchMod, now);
      osc.frequency.exponentialRampToValueAtTime(140 * pitchMod, now + 0.025);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);

      // High wooden-click harmonic
      const highOsc = this.ctx.createOscillator();
      const highGain = this.ctx.createGain();
      highOsc.type = 'sine';
      highOsc.frequency.setValueAtTime(1400 * pitchMod, now);
      highOsc.frequency.exponentialRampToValueAtTime(300, now + 0.015);
      highGain.gain.setValueAtTime(0.2, now);
      highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      highOsc.connect(highGain);
      highGain.connect(this.ctx.destination);

      highOsc.start(now);
      highOsc.stop(now + 0.02);
    } catch {
      // Ignore audio synthesis errors on restricted environments
    }
  }

  /**
   * Elegant spin whoosh sound
   */
  playSpinStart() {
    if (!this.enabled) return;
    this.ensureActive();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.7);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Normal win celebration chime (for 10%, 20%, 30%)
   */
  playWinNormal() {
    if (!this.enabled) return;
    this.ensureActive();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major)
      const now = this.ctx.currentTime;

      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteStart = now + i * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.28, noteStart + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.65);
      });
    } catch {
      // Safe fallback
    }
  }

  /**
   * Grand Mega Celebration Fanfare (for 40% and 50% Jackpots!)
   */
  playWinJackpot() {
    if (!this.enabled) return;
    this.ensureActive();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Brass / Fanfare chord sequence
      const chords = [
        { time: 0.0, notes: [523.25, 659.25, 783.99], dur: 0.25 }, // C
        { time: 0.25, notes: [587.33, 739.99, 880.00], dur: 0.25 }, // D
        { time: 0.50, notes: [659.25, 830.61, 987.77], dur: 0.35 }, // E
        { time: 0.90, notes: [783.99, 987.77, 1318.51], dur: 1.2 }  // G High triumphant
      ];

      chords.forEach(chord => {
        const startTime = now + chord.time;
        chord.notes.forEach(freq => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.18, startTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + chord.dur);

          // Subtle lowpass filter for silky brass warmth
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1800, startTime);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + chord.dur + 0.05);
        });
      });

      // Shimmer sparkles on top
      for (let i = 0; i < 8; i++) {
        const sparkleTime = now + 0.9 + i * 0.1;
        const sparkleOsc = this.ctx.createOscillator();
        const sparkleGain = this.ctx.createGain();

        sparkleOsc.type = 'sine';
        sparkleOsc.frequency.setValueAtTime(1500 + Math.random() * 1200, sparkleTime);

        sparkleGain.gain.setValueAtTime(0, sparkleTime);
        sparkleGain.gain.linearRampToValueAtTime(0.15, sparkleTime + 0.02);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, sparkleTime + 0.25);

        sparkleOsc.connect(sparkleGain);
        sparkleGain.connect(this.ctx.destination);

        sparkleOsc.start(sparkleTime);
        sparkleOsc.stop(sparkleTime + 0.28);
      }
    } catch {
      // Safe fallback
    }
  }
}

export const soundEngine = new SoundEngine();
