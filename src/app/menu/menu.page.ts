import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AudioService } from '../services/audio.service';
import { Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  standalone: false,
})
export class MenuPage {
  showSettings: boolean = false;
  private backButtonSub?: Subscription;

  constructor(
    private router: Router,
    public audioService: AudioService,
    private platform: Platform
  ) {}

  hasSavedGame: boolean = false;

  ionViewWillEnter() {
    const savedLevel = localStorage.getItem('currentLevelIndex');
    this.hasSavedGame = savedLevel !== null && parseInt(savedLevel, 10) > 0;
  }

  ionViewDidEnter() {
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.showSettings) {
        this.closeSettings();
      } else {
        App.exitApp();
      }
    });
  }

  ionViewWillLeave() {
    if (this.backButtonSub) {
      this.backButtonSub.unsubscribe();
    }
  }

  ngOnInit() {
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
