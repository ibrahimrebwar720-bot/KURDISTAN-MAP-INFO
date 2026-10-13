/**
 * Ambient Audio Synthesizer for Cinematic Historical Time-Machine
 * Uses Native Web Audio API - 100% offline, zero network requests, instant playback.
 */

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public startAtmosphere() {
    if (this.isPlaying) return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      // Warm low-pass filter for ancient mountain ambiance
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(240, this.ctx.currentTime);
      this.filterNode.connect(this.masterGain);

      // Low Root Drone Oscillator (D2 ~ 73.4 Hz - authentic Kurdish modal root)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(73.416, this.ctx.currentTime);

      // Fifth Harmonic (A2 ~ 110 Hz)
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(110.0, this.ctx.currentTime);

      const oscGain1 = this.ctx.createGain();
      oscGain1.gain.setValueAtTime(0.35, this.ctx.currentTime);

      const oscGain2 = this.ctx.createGain();
      oscGain2.gain.setValueAtTime(0.15, this.ctx.currentTime);

      this.droneOsc1.connect(oscGain1);
      this.droneOsc2.connect(oscGain2);

      oscGain1.connect(this.filterNode);
      oscGain2.connect(this.filterNode);

      this.droneOsc1.start();
      this.droneOsc2.start();

      this.isPlaying = true;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public playStationTransitionChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      // Synthesize soft string resonance (Tanbur / Daf shimmer)
      const freqs = [220.0, 329.63, 440.0]; // A3, E4, A4 ancient chord
      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.06, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2 + idx * 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now + idx * 0.05);
        osc.stop(now + 1.4);
      });
    } catch {
      // Ignore audio context errors
    }
  }

  public stopAtmosphere() {
    if (!this.isPlaying) return;
    try {
      if (this.droneOsc1) {
        this.droneOsc1.stop();
        this.droneOsc1.disconnect();
        this.droneOsc1 = null;
      }
      if (this.droneOsc2) {
        this.droneOsc2.stop();
        this.droneOsc2.disconnect();
        this.droneOsc2 = null;
      }
      this.isPlaying = false;
    } catch {
      // Ignore
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.08,
        this.ctx.currentTime
      );
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const ambientAudio = new AmbientAudioEngine();
