import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  public settings = {
    music: true,
    sfx: true,
    vibration: true
  };

  private bgmAudio: HTMLAudioElement;
  private sfxAudios: { [key: string]: HTMLAudioElement } = {};

  constructor() {
    this.loadSettings();
    
    // Initialize Audio Elements
    this.bgmAudio = new Audio('assets/sounds/bgm.mp3');
    this.bgmAudio.loop = true;
    
    // Handle error quietly if file is missing
    this.bgmAudio.addEventListener('error', () => {
      console.warn('BGM file not found. Ready to play once added to assets/sounds/bgm.mp3');
    });

    // Initialize SFX
    this.sfxAudios['click'] = new Audio('assets/sounds/click.mp3');
    this.sfxAudios['success'] = new Audio('assets/sounds/success.mp3');

    // Handle missing SFX quietly
    Object.values(this.sfxAudios).forEach(audio => {
      audio.addEventListener('error', () => {
        // silent fail for placeholders
      });
    });

    // TRICK: Unlock Audio on First Touch
    this.unlockAudio();

    // Handle app going to background (mobile)
    document.addEventListener('pause', () => {
      if (this.bgmAudio) {
        this.bgmAudio.pause();
      }
    });

    // Handle app returning to foreground (mobile)
    document.addEventListener('resume', () => {
      if (this.settings.music && this.bgmAudio) {
        this.playBgm();
      }
    });

    // Handle browser tab visibility (web)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.bgmAudio) {
          this.bgmAudio.pause();
        }
      } else {
        if (this.settings.music && this.bgmAudio) {
          this.playBgm();
        }
      }
    });
  }

  private unlockAudio() {
    const unlock = () => {
      // Coba mainkan musik jika pengaturannya on
      if (this.settings.music && this.bgmAudio.paused) {
        this.playBgm();
      }
      
      // Hapus pendengar (listener) agar tidak dijalankan berkali-kali
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };

    // Pasang pelacak sentuhan pertama
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
  }

  private loadSettings() {
    const saved = localStorage.getItem('gameSettings');
    if (saved) {
      this.settings = JSON.parse(saved);
    } else {
      this.saveSettings();
    }
  }

  public saveSettings() {
    localStorage.setItem('gameSettings', JSON.stringify(this.settings));
  }

  // --- MUSIC CONTROLS ---

  public toggleMusic() {
    this.settings.music = !this.settings.music;
    this.saveSettings();
    
    if (this.settings.music) {
      this.playBgm();
    } else {
      this.stopBgm();
    }
  }

  public playBgm() {
    if (this.settings.music && this.bgmAudio) {
      // Promise handling to prevent errors if user hasn't interacted with page yet
      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("BGM playback prevented or file missing.", error);
        });
      }
    }
  }

  public stopBgm() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }

  // --- SFX CONTROLS ---

  public toggleSfx() {
    this.settings.sfx = !this.settings.sfx;
    this.saveSettings();
  }

  public playSfx(type: 'click' | 'success') {
    if (this.settings.sfx && this.sfxAudios[type]) {
      // Create clone to allow overlapping sounds (e.g., rapid clicks)
      const audioClone = this.sfxAudios[type].cloneNode() as HTMLAudioElement;
      
      const playPromise = audioClone.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // silent fail
        });
      }
    }
  }

  // --- VIBRATION CONTROLS ---

  public toggleVibration() {
    this.settings.vibration = !this.settings.vibration;
    this.saveSettings();
  }

  public async vibrate(style: 'light' | 'heavy') {
    if (!this.settings.vibration) return;

    if (Capacitor.isNativePlatform()) {
      try {
        if (style === 'light') {
          await Haptics.impact({ style: ImpactStyle.Light });
        } else {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }
      } catch (e) {
        console.warn('Haptics failed', e);
      }
    } else {
      // Browser fallback (if supported)
      if (navigator.vibrate) {
        if (style === 'light') {
          navigator.vibrate(20);
        } else {
          navigator.vibrate([50, 50, 50]);
        }
      }
    }
  }

}
