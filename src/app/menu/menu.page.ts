import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AudioService } from '../services/audio.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false,
})
export class MenuPage {
  showSettings: boolean = false;

  constructor(
    private router: Router,
    public audioService: AudioService
  ) {}

  hasSavedGame: boolean = false;

  ionViewWillEnter() {
    const savedLevel = localStorage.getItem('currentLevelIndex');
    this.hasSavedGame = savedLevel !== null && parseInt(savedLevel, 10) > 0;
  }

  ngOnInit() {
    // Coba putar musik saat menu terbuka (akan tertahan browser sampai ada sentuhan)
    this.audioService.playBgm();
  }

  openSettings() {
    this.audioService.playSfx('click');
    this.showSettings = true;
  }

  closeSettings() {
    this.audioService.playSfx('click');
    this.showSettings = false;
  }

  toggleMusic() {
    this.audioService.playSfx('click');
    this.audioService.toggleMusic();
  }

  toggleSfx() {
    this.audioService.toggleSfx();
    this.audioService.playSfx('click');
  }

  toggleVibration() {
    this.audioService.playSfx('click');
    this.audioService.toggleVibration();
    if (this.audioService.settings.vibration) {
      this.audioService.vibrate('light');
    }
  }

  continueGame() {
    this.audioService.playSfx('click');
    this.router.navigate(['/home']);
  }
}
