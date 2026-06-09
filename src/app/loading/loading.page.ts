import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AudioService } from '../services/audio.service';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.page.html',
  styleUrls: ['./loading.page.scss'],
  standalone: false,
})
export class LoadingPage {

  progress = 0;
  private backButtonSub?: Subscription;

  constructor(
    private router: Router,
    private audioService: AudioService,
    private platform: Platform
  ) {}

  ionViewDidEnter() {
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(10, () => {
      // Menahan tombol back agar tidak bisa kembali saat loading
    });
  }

  ionViewWillLeave() {
    if (this.backButtonSub) {
      this.backButtonSub.unsubscribe();
    }
  }

  ngOnInit() {
    const interval = setInterval(() => {

      this.progress += Math.random() * 10; // 🔥 biar natural

      if (this.progress >= 100) {
        this.progress = 100;
        clearInterval(interval);

        setTimeout(() => {
          this.router.navigate(['/menu']);
        }, 300);
      }

    }, 200);
  }
}
