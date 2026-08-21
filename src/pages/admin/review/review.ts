import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../Service/Review/review';
import { ToastComponent } from '../../../shared/components/toast';
import { Pagination } from '../../../shared/components/admin/pagination/pagination';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent, Pagination],
  templateUrl: './review.html',
  styleUrl: './review.css',
})
export class Review implements OnInit {
  reviews: any[] = [];
  paginatedReviews: any[] = [];
  isLoading = true;

  // Pagination states
  pageNumber: number = 1;
  pageSize: number = 7;
  totalItems: number = 0;
  totalPages: number = 1;

  totalReviews = 0;

  // Details
  selectedReview: any = null;

  // Toast States
  showToast = false;
  toastMessage = '';

  constructor(
    private reviewService: ReviewService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadReviews();
  }

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showToast = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showToast = true;
      this.cdr.detectChanges();
    }, 10);
  }

  loadReviews() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.reviewService.getAllReviews().subscribe({
      next: (data) => {
        this.reviews = data;
        this.totalReviews = this.reviews.length;
        this.applyPagination();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load reviews for admin:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyPagination() {
    this.totalItems = this.reviews.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
    if (this.pageNumber > this.totalPages) {
      this.pageNumber = this.totalPages;
    }
    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedReviews = this.reviews.slice(start, end);
  }

  onPageChange(newPage: number) {
    this.pageNumber = newPage;
    this.applyPagination();
    this.cdr.detectChanges();
  }

  deleteReview(review: any) {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;

    this.reviewService.deleteReview(review.id).subscribe({
      next: () => {
        this.triggerToast('Review deleted permanently.');
        this.reviews = this.reviews.filter(r => r.id !== review.id);
        this.totalReviews = this.reviews.length;
        
        if (this.selectedReview && this.selectedReview.id === review.id) {
          this.selectedReview = null;
        }

        this.applyPagination();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to delete review:', err);
        this.triggerToast('Failed to delete review.');
      }
    });
  }

  viewReviewDetails(review: any) {
    this.selectedReview = review;
    this.cdr.detectChanges();
  }

  closeReviewDetails() {
    this.selectedReview = null;
    this.cdr.detectChanges();
  }

  getStarString(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
