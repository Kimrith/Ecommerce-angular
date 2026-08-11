import { Component, EventEmitter, Output, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FavoriteService } from '../../../Service/Favorite/favorite';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  @Output() toggleSidebarMobile = new EventEmitter<void>();

  cartCount: number = 0;
  favoriteCount: number = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private favoriteService: FavoriteService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // 1. Initial counts update
    this.updateCartCount();
    this.updateFavoriteCount();

    // 2. Listen to router navigation ends to refresh badges
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        this.updateCartCount();
        this.updateFavoriteCount();
      })
    );

    // 3. Listen to local storage cart update event
    const onCartUpdate = () => {
      this.updateCartCount();
    };
    window.addEventListener('cartUpdated', onCartUpdate);

    // Clean up event listener on destroy by wrapping it in subscription add
    this.subscriptions.add(new Subscription(() => {
      window.removeEventListener('cartUpdated', onCartUpdate);
    }));

    // 4. Listen to favorites service changes
    this.subscriptions.add(
      this.favoriteService.favoriteChanges$.subscribe(() => {
        this.updateFavoriteCount(true);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  updateCartCount() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        this.cartCount = Array.isArray(items) ? items.reduce((acc, item) => acc + (item.quantity || 0), 0) : 0;
      } catch (e) {
        this.cartCount = 0;
      }
    } else {
      this.cartCount = 0;
    }
    this.cdr.detectChanges();
  }

  updateFavoriteCount(forceRefresh = false) {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
      this.favoriteCount = 0;
      this.cdr.detectChanges();
      return;
    }

    try {
      const userData = JSON.parse(userDataStr);
      const userId = userData.userId || userData.id;
      if (!userId) {
        this.favoriteCount = 0;
        this.cdr.detectChanges();
        return;
      }

      this.favoriteService.getAllFavorite(userId, forceRefresh).subscribe({
        next: (favorites: any[]) => {
          this.favoriteCount = favorites.length;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading favorites count in navbar:', err);
          this.favoriteCount = 0;
          this.cdr.detectChanges();
        }
      });
    } catch (e) {
      this.favoriteCount = 0;
      this.cdr.detectChanges();
    }
  }

  onToggleSidebar() {
    this.toggleSidebarMobile.emit();
  }

  onSearch(query: string) {
    if (query && query.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: query.trim() } });
    } else {
      this.router.navigate(['/products']);
    }
  }
}
