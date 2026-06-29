export class RhythmEngine {
  private audio: HTMLAudioElement | null = null;
  public bpm: number = 130; // Alan Walker - Fade is 130 BPM
  public isPlaying: boolean = false;

  init() {
    if (!this.audio) {
      this.audio = new Audio('/alan_walker_fade.mp3');
      this.audio.loop = true;
      this.audio.volume = 0.6; // Not too loud so we can still hear the coach
    }
  }

  start() {
    if (!this.audio) this.init();
    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(e => console.warn('Audio play failed:', e));
      this.isPlaying = true;
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.isPlaying = false;
    }
  }

  // Returns 0 to 1, representing how close the current time is to the next beat
  getBeatProgress(): number {
    if (!this.audio || !this.isPlaying) return 0;
    const timeInSeconds = this.audio.currentTime;
    const beatDuration = 60 / this.bpm;
    const currentBeat = timeInSeconds / beatDuration;
    return currentBeat % 1;
  }

  // Returns a rating based on how perfectly the user hit the beat
  evaluateHit(): 'PERFECT' | 'GOOD' | 'MISS' {
    if (!this.audio || !this.isPlaying) return 'MISS';
    const progress = this.getBeatProgress();
    const offset = Math.min(progress, 1 - progress); 
    
    // Within 15% of the beat is PERFECT
    if (offset < 0.15) return 'PERFECT';
    // Within 30% of the beat is GOOD
    if (offset < 0.3) return 'GOOD';
    
    return 'MISS';
  }
}

export const rhythmEngine = new RhythmEngine();
