import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../Service/Review/review';
import { ToastComponent } from '../../../shared/components/toast';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './review.html',
  styleUrl: './review.css',
})
export class Review implements OnInit {
  reviews: any[] = [];
  filteredReviews: any[] = [];
  isLoading = true;
  selectedFilter = 'all';

  // Stats
  totalReviews = 0;
  approvedCount = 0;
  pendingCount = 0;

  // Modals / Details
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
        this.calculateStats();
        this.filterReviews(this.selectedFilter);
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

  calculateStats() {
    this.totalReviews = this.reviews.length;
    this.approvedCount = this.reviews.filter(r => r.isApproved === true).length;
    this.pendingCount = this.reviews.filter(r => r.isApproved === false || r.isApproved === null || r.isApproved === undefined).length;
  }

  filterReviews(filter: string) {
    this.selectedFilter = filter;
    if (filter === 'all') {
      this.filteredReviews = [...this.reviews];
    } else if (filter === 'approved') {
      this.filteredReviews = this.reviews.filter(r => r.isApproved === true);
    } else if (filter === 'pending') {
      this.filteredReviews = this.reviews.filter(r => r.isApproved === false || r.isApproved === null || r.isApproved === undefined);
    }
  }

  approveReview(review: any) {
    this.reviewService.editReview(review.id, { isApproved: true }).subscribe({
      next: (updatedReview) => {
        this.triggerToast('Review approved successfully!');
        
        // Update locally
        const index = this.reviews.findIndex(r => r.id === review.id);
        if (index > -1) {
          this.reviews[index].isApproved = true;
        }
        
        if (this.selectedReview && this.selectedReview.id === review.id) {
          this.selectedReview.isApproved = true;
        }

        this.calculateStats();
        this.filterReviews(this.selectedFilter);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to approve review:', err);
        this.triggerToast('Failed to approve review.');
      }
    });
  }

  rejectReview(review: any) {
    this.reviewService.editReview(review.id, { isApproved: false }).subscribe({
      next: (updatedReview) => {
        this.triggerToast('Review rejected/suspended.');
        
        // Update locally
        const index = this.reviews.findIndex(r => r.id === review.id);
        if (index > -1) {
          this.reviews[index].isApproved = false;
        }

        if (this.selectedReview && this.selectedReview.id === review.id) {
          this.selectedReview.isApproved = false;
        }

        this.calculateStats();
        this.filterReviews(this.selectedFilter);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to reject review:', err);
        this.triggerToast('Failed to reject review.');
      }
    });
  }

  deleteReview(review: any) {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;

    this.reviewService.deleteReview(review.id).subscribe({
      next: () => {
        this.triggerToast('Review deleted permanently.');
        this.reviews = this.reviews.filter(r => r.id !== review.id);
        
        if (this.selectedReview && this.selectedReview.id === review.id) {
          this.selectedReview = null;
        }

        this.calculateStats();
        this.filterReviews(this.selectedFilter);
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
