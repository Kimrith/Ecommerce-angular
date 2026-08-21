import { Component, Input, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.development';
import { FavoriteService } from '../../../Service/Favorite/favorite';
import { ReviewService } from '../../../Service/Review/review';
import { ToastComponent } from '../../../shared/components/toast';
import { ProductService } from '../../../Service/products/product-service';

@Component({
  selector: 'app-product-cart',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  templateUrl: './product-cart.html',
  styleUrl: './product-cart.css',
})
export class ProductCart implements OnInit {
  imageUrl = environment.apiUrl;

  @Input() product: any = {
    productId: 4,
    name: 'BOOK',
    imageUrl: '/uploads/products/f631bcd6-a6e1-4fff-be24-52153e1dbaff_study1.jpg',
    slug: 'book',
    price: 0.02,
    salesCount: 2,
    revenue: 0.04,
    isFavorite: false
  };

  showToast = false;
  toastMessage = '';

  // Rating states
  averageRating: number = 0;
  reviewCount: number = 0;

  productVariant: any[] = [];

  private router = inject(Router);
  private favoriteService = inject(FavoriteService);
  private reviewService = inject(ReviewService);
  private cdr = inject(ChangeDetectorRef);
  private productService = inject(ProductService);

  ngOnInit(): void {
    this.checkIfFavorite();
    this.loadProductRating();
    this.loadingProductVariant();
  }

  checkIfFavorite() {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return;

    try {
      const userData = JSON.parse(userDataStr);
      const userId = userData.userId || userData.id;
      if (!userId) return;

      const pId = this.product.productId ?? this.product.id;
      if (!pId) return;

      this.favoriteService.getAllFavorite(userId).subscribe({
        next: (favorites: any[]) => {
          const isFav = favorites.some((fav: any) => {
            const favProductId = fav.productId ?? fav.product?.id ?? fav.product?.productId;
            return favProductId === pId;
          });

          this.product.isFavorite = isFav;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching favorites for card:', err);
        }
      });
    } catch (e) {
      console.error('Error parsing user data for favorites check', e);
    }
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

  viewProductDetails(productId: any) {
    const id = productId ?? this.product?.id;
    if (id !== undefined && id !== null) {
      this.router.navigate(['/products', id]);
    } else {
      console.error('Product ID is undefined, cannot navigate.');
    }
  }

  toggleFavorite() {
    const id = this.product.productId ?? this.product.id;

    if (!id) {
      console.error('Product ID is missing, cannot toggle favorite.');
      return;
    }

    if (this.product.isFavorite) {
      // Remove from favorite
      this.favoriteService.deleteFavoriteByProduct(id).subscribe({
        next: () => {
          this.product.isFavorite = false;
          this.triggerToast('Removed from favorites');
        },
        error: (err) => {
          console.error('Error removing from favorites:', err);
          this.triggerToast('Failed to remove from favorites');
        }
      });
    } else {
      // Add to favorite
      const payload = { productId: id };
      this.favoriteService.postFavorite(payload).subscribe({
        next: () => {
          this.product.isFavorite = true;
          this.triggerToast('Added to favorites!');
        },
        error: (err) => {
          if (err.error?.includes('already in your favorites') || err.status === 400) {
            this.product.isFavorite = true;
            this.triggerToast('Already in your favorites');
          } else {
            console.error('Error adding to favorites:', err);
            this.triggerToast('Failed to add to favorites');
          }
        }
      });
    }
  }

  loadingProductVariant() {
    const pId = this.product.productId ?? this.product.id;
    if (!pId) return;

    this.productService.getProductVariants(pId).subscribe({
      next: (res: any) => {
        this.productVariant = Array.isArray(res) ? res : (res.data || res.$values || []);
        console.warn("count productVaraint: ", this.productVariant.length)
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load product variant', err)
    });
  }

  loadProductRating() {
    const pId = this.product.productId ?? this.product.id;
    if (!pId) return;

    this.reviewService.getProductReview(pId).subscribe({
      next: (res: any) => {
        let reviewsList: any[] = [];
        if (Array.isArray(res)) {
          reviewsList = res;
        } else if (res && Array.isArray(res.$values)) {
          reviewsList = res.$values;
        } else if (res && Array.isArray(res.data)) {
          reviewsList = res.data;
        }

        this.reviewCount = reviewsList.length;
        if (this.reviewCount > 0) {
          const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
          this.averageRating = Math.round((sum / this.reviewCount) * 10) / 10;
        } else {
          this.averageRating = 0;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load rating for card:', err);
      }
    });
  }
}