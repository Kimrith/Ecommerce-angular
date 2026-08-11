import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { BannerService } from '../../../../Service/Banner/banner';
import { Banner as BannerType } from '../../../../type/banner'; // Adjust path if needed
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner.html',
  styleUrl: './banner.css',
})
export class Banner implements OnInit, OnDestroy {
  currentIndex = 0;
  imageUrl = environment.apiUrl

  private intervalId!: ReturnType<typeof setInterval>;
  private bannerService = inject(BannerService);
  private cdr = inject(ChangeDetectorRef);

  banners: BannerType[] = [];

  ngOnInit(): void {
    this.loadBanners();
  }

  loadBanners(): void {
    this.bannerService.getBanners().subscribe({
      next: (data) => {
        this.banners = data || [];
        if (this.banners.length > 0) {
          this.startSlider();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to fetch banners:', err);
      }
    });
  }

  startSlider(): void {
    this.intervalId = setInterval(() => {
      this.next();
      this.cdr.markForCheck();
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  next(): void {
    if (this.banners.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.banners.length;
  }

  previous(): void {
    if (this.banners.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.banners.length) % this.banners.length;
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
  }
}