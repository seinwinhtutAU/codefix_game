// src/game/AudioManager.ts
import Phaser from "phaser";

// 1. Define a specific type that covers both audio implementations
// This guarantees that 'volume' exists without using 'any'
type GameSound = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
type SoundConfig = Phaser.Types.Sound.SoundConfig;

export default class AudioManager {
  private static instance: AudioManager;
  private soundManager: Phaser.Sound.BaseSoundManager | null = null;

  // Keep strict typing here
  private currentMusic: GameSound | null = null;

  private musicVolume: number = 1;
  private sfxVolume: number = 1;
  private isMuted: boolean = false;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public init(game: Phaser.Game): void {
    this.soundManager = game.sound;
  }

  public playMusic(
    key: string,
    config: SoundConfig = { loop: true, volume: 0 }
  ): void {
    if (!this.soundManager) return;

    // 1. If the SAME song is already playing, do nothing (Seamless transition)
    if (
      this.currentMusic &&
      this.currentMusic.key === key &&
      this.currentMusic.isPlaying
    ) {
      return;
    }

    // 2. If a DIFFERENT song is playing, fade it out and kill it
    if (this.currentMusic) {
      this.fadeOutAndDestroy(this.currentMusic, 500);
    }

    // 3. Setup the new sound
    // We force volume to 0 in the config
    const startConfig: SoundConfig = { ...config, volume: 0 };

    this.currentMusic = this.soundManager.add(key, startConfig) as GameSound;

    // --- CRITICAL FIX START ---
    // Force volume to 0 directly on the object immediately
    this.currentMusic.volume = 0;

    // Play the sound (it is now guaranteed to be silent)
    this.currentMusic.play();
    // --- CRITICAL FIX END ---

    // 4. Start the Fade In
    const targetVol = (config.volume ?? 1) * this.musicVolume;

    // We wait 50ms before starting the fade to let the audio engine "warm up"
    // preventing any initial pop
    setTimeout(() => {
      if (this.currentMusic && this.currentMusic.key === key) {
        this.fadeIn(this.currentMusic, targetVol, 1000);
      }
    }, 50);
  }

  public stopMusic(): void {
    if (this.currentMusic) {
      this.fadeOutAndDestroy(this.currentMusic, 500);
      this.currentMusic = null;
    }
  }

  public playSound(key: string, config: SoundConfig = {}): void {
    if (!this.soundManager || this.isMuted) return;
    const finalVol = (config.volume ?? 1) * this.sfxVolume;
    this.soundManager.play(key, { ...config, volume: finalVol });
  }

  public setGlobalVolume(volume: number): void {
    if (!this.soundManager) return;
    const v = Math.max(0, Math.min(1, volume));
    this.soundManager.volume = v;
  }

  public toggleMute(muted: boolean): void {
    if (!this.soundManager) return;
    this.isMuted = muted;
    this.soundManager.mute = muted;
  }

  /* ==============================
     Internal Fading Logic
     ============================== */

  // 3. Update parameter types to GameSound
  private fadeOutAndDestroy(sound: GameSound, duration: number): void {
    this.fadeVolume(sound, 0, duration, () => {
      sound.stop();
      sound.destroy();
    });
  }

  private fadeIn(sound: GameSound, targetVol: number, duration: number): void {
    this.fadeVolume(sound, targetVol, duration);
  }

  private fadeVolume(
    sound: GameSound, // 4. This type now has the .volume property
    targetVolume: number,
    duration: number,
    onComplete?: () => void
  ): void {
    if (duration <= 0) {
      sound.volume = targetVolume;
      if (onComplete) onComplete();
      return;
    }

    const stepTime = 50;
    const steps = duration / stepTime;

    // Now TypeScript knows .volume exists on GameSound
    const startVolume = sound.volume;
    const volStep = (targetVolume - startVolume) / steps;

    let currentStep = 0;

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      currentStep++;

      // 'manager' exists on BaseSound, which GameSound inherits from, so this check works
      if (!sound || !sound.manager) {
        clearInterval(interval);
        return;
      }

      const newVol = startVolume + volStep * currentStep;
      sound.volume = Math.max(0, Math.min(1, newVol));

      if (currentStep >= steps) {
        clearInterval(interval);
        sound.volume = targetVolume;
        if (onComplete) onComplete();
      }
    }, stepTime);
  }
}
