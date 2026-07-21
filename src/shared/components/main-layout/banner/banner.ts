import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';

@Component({
  selector: 'app-banner',
  standalone: true,
  templateUrl: './banner.html',
  styleUrl: './banner.css',
})
export class Banner implements OnInit, OnDestroy {
  currentIndex = 0;
  private intervalId!: ReturnType<typeof setInterval>;
  
  // Inject ChangeDetectorRef
  private cdr = inject(ChangeDetectorRef);

  banners = [
    { img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9NJEj1HPey8XaXxIORTaJZMC1O_JtzzqRFrlDz1-_BpL7cznYObKcbp0&s=10' },
    { img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIFYEZ8GBsaxPL6u_2SPvDvXQJU0SuwL3DOOeKuFub-g&s=10' },
    { img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThkWIJle1hOqQTSqdxqTsXPQ5oZ3caSNhCa1u9uCw9RFct53STdQQv2Ss&s=10' }
  ];

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.next();
      this.cdr.markForCheck(); // Tells Angular to update the view
    }, 3000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.banners.length;
  }

  previous(): void {
    this.currentIndex = (this.currentIndex - 1 + this.banners.length) % this.banners.length;
  }

  goToSlide(index: number): void {
    this.currentIndex = index;
  }
}