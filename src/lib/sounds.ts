class SoundSystem {
  private ctx: AudioContext | null = null;
  private isEnabled = true;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    if (!this.isEnabled || !this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playRepComplete() {
    this.playTone(880, 'sine', 0.2, 0.3); 
    setTimeout(() => this.playTone(1760, 'sine', 0.3, 0.2), 100); 
  }

  playError() {
    this.playTone(150, 'sawtooth', 0.4, 0.2); 
  }

  playCombo() {
    this.playTone(440, 'square', 0.1, 0.1);
    setTimeout(() => this.playTone(554, 'square', 0.1, 0.1), 100);
    setTimeout(() => this.playTone(659, 'square', 0.1, 0.1), 200);
    setTimeout(() => this.playTone(880, 'square', 0.4, 0.2), 300);
  }

  playClick() {
    this.playTone(1200, 'sine', 0.05, 0.05);
  }
}

export const sfx = new SoundSystem();
