import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AudioService } from '../services/audio.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.page.html',
  styleUrls: ['./loading.page.scss'],
  standalone: false,
})
export class LoadingPage {

  progress = 0;

  constructor(
    private router: Router,
    private audioService: AudioService
  ) {}

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
