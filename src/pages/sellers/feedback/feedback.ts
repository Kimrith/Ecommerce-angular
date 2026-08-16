import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../Service/products/product-service';
import { ReviewService } from '../../../Service/Review/review';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback.html',
  styleUrl: './feedback.css',
})
export class Feedback implements OnInit {
  sellerId: number = 0;
  reviews: any[] = [];
  isLoading = true;

  // Stats
  averageRating: string = '0.0';
  totalReviews: number = 0;
  fiveStarCount: number = 0;

  constructor(
    private productService: ProductService,
    private reviewService: ReviewService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadSellerFeedback();
  }

  loadSellerFeedback() {
    const currentUserStr = localStorage.getItem('userData');
    if (!currentUserStr) {
      this.isLoading = false;
      return;
    }

    try {
      const currentUser = JSON.parse(currentUserStr);
      this.sellerId = currentUser.userId || currentUser.sellerId || 0;
    } catch (e) {
      console.error('Error parsing user data:', e);
      this.isLoading = false;
      return;
    }

    if (!this.sellerId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    // 1. Fetch all seller products
    this.productService.getProductSeller(this.sellerId, 1, 1000).subscribe({
      next: (res) => {
        let products: any[] = [];
        if (Array.isArray(res)) {
          products = res;
        } else if (res && Array.isArray(res.$values)) {
          products = res.$values;
        } else if (res && Array.isArray(res.data)) {
          products = res.data;
        } else if (res && res.items && Array.isArray(res.items.$values)) {
          products = res.items.$values;
        } else if (res && res.items && Array.isArray(res.items)) {
          products = res.items;
        }

        if (products.length === 0) {
          this.reviews = [];
          this.calculateStats();
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }

        // 2. Fetch reviews for each product in parallel
        const reviewQueries = products.map(p =>
          this.reviewService.getProductReview(p.id).pipe(
            catchError(err => {
              console.error(`Error loading reviews for product ${p.id}:`, err);
              return of([]); // Fallback to empty array on error
            })
          )
        );

        forkJoin(reviewQueries).subscribe({
          next: (results: any[]) => {
            const allReviews: any[] = [];
            results.forEach(resList => {
              let list: any[] = [];
              if (Array.isArray(resList)) {
                list = resList;
              } else if (resList && Array.isArray(resList.$values)) {
                list = resList.$values;
              } else if (resList && Array.isArray(resList.data)) {
                list = resList.data;
              }

              allReviews.push(...list);
            });

            // Sort reviews by date descending
            this.reviews = allReviews.sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            this.calculateStats();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Failed to resolve parallel review requests:', err);
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Failed to load seller products:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats() {
    this.totalReviews = this.reviews.length;
    if (this.totalReviews > 0) {
      const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
      this.averageRating = (sum / this.totalReviews).toFixed(1);
      this.fiveStarCount = this.reviews.filter(r => r.rating === 5).length;
    } else {
      this.averageRating = '0.0';
      this.fiveStarCount = 0;
    }
  }

  getStarString(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
