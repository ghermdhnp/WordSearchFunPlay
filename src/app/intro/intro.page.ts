import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.page.html',
  styleUrls: ['./intro.page.scss'],
  standalone: false,
})
export class IntroPage {
  private backButtonSub?: Subscription;

  constructor(
    private router: Router,
    private platform: Platform
  ) {}

  ionViewDidEnter() {
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(10, () => {
      // Menahan tombol back agar tidak bisa kembali saat intro splash
    });
  }

  ionViewWillLeave() {
    if (this.backButtonSub) {
      this.backButtonSub.unsubscribe();
    }
  }

  ngOnInit() {
    setTimeout(() => {
      this.router.navigate(['/loading']);
    }, 1500);
  }
}
