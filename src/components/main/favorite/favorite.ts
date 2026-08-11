import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProductCart } from '../product-cart/product-cart';
import { FavoriteService } from '../../../Service/Favorite/favorite';

@Component({
  selector: 'app-favorite',
  standalone: true,
  imports: [CommonModule, ProductCart, RouterLink],
  templateUrl: './favorite.html',
  styleUrl: './favorite.css',
})
export class Favorite implements OnInit, OnDestroy {
  products: any[] = [];
  isLoading = true;
  isLoggedIn = false;
  private favSub!: Subscription;

  private favoriteService = inject(FavoriteService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.checkAuthAndLoad();

    // Subscribe to favorite changes to auto-refresh the list reactively
    this.favSub = this.favoriteService.favoriteChanges$.subscribe(() => {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          const userId = userData.userId || userData.id;
          if (userId) {
            this.loadFavoritesSilent(userId);
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.favSub) {
      this.favSub.unsubscribe();
    }
  }

  checkAuthAndLoad() {
    const token = localStorage.getItem('authToken');
    const userDataStr = localStorage.getItem('userData');

    if (token && userDataStr) {
      this.isLoggedIn = true;
      try {
        const userData = JSON.parse(userDataStr);
        const userId = userData.userId || userData.id;
        if (userId) {
          this.loadFavorites(userId);
        } else {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      } catch (e) {
        console.error('Error parsing userData in Favorite component', e);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    } else {
      this.isLoggedIn = false;
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  loadFavorites(userId: number) {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.favoriteService.getAllFavorite(userId, true).subscribe({
      next: (favorites: any[]) => {
        this.products = favorites.map(fav => {
          return {
            productId: fav.productId,
            name: fav.productName || fav.name || '',
            imageUrl: fav.productImageUrl || fav.imageUrl || '',
            slug: fav.productSlug || fav.slug || '',
            price: fav.price,
            isFavorite: true
          };
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load favorites', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadFavoritesSilent(userId: number) {
    this.favoriteService.getAllFavorite(userId, true).subscribe({
      next: (favorites: any[]) => {
        this.products = favorites.map(fav => {
          return {
            productId: fav.productId,
            name: fav.productName || fav.name || '',
            imageUrl: fav.productImageUrl || fav.imageUrl || '',
            slug: fav.productSlug || fav.slug || '',
            price: fav.price,
            isFavorite: true
          };
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to reload favorites silently', err);
      }
    });
  }
}
