export class SoundController {
  private ctx: AudioContext | null = null;
  private muted = false;

  constructor() {
    const saved = localStorage.getItem("tong_mon_muted");
    this.muted = saved === "1";
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem("tong_mon_muted", this.muted ? "1" : "0");
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playSlash(): void {
    this.playTone(340, 140, 0.09, "triangle");
  }

  public playSkill(): void {
    this.playTone(520, 780, 0.18, "sine");
  }

  public playPortal(): void {
    this.playTone(392, 587, 0.25, "sine");
  }

  public playCoin(): void {
    this.playTone(660, 880, 0.14, "sine");
  }

  public playCeremony(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, freq * 1.02, 0.22, "triangle"), idx * 95);
    });
  }

  private playTone(
    startFreq: number,
    endFreq: number,
    durationSec: number,
    type: OscillatorType
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), ctx.currentTime + durationSec);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      return;
    }
  }
}
