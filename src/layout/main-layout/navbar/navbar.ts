import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FavoriteService } from '../../../Service/Favorite/favorite';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { Auths } from '../../../Service/Auth/auths';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  @Output() toggleSidebarMobile = new EventEmitter<void>();

  cartCount: number = 0;
  favoriteCount: number = 0;
  imageUrl = environment.apiUrl;
  userProfile: any = null;

  defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private favoriteService: FavoriteService,
    private authService: Auths,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // 1. Initial counts & profile load
    this.updateCartCount();
    this.updateFavoriteCount();
    this.loadUserProfile();

    // 2. Refresh on navigation
    this.subscriptions.add(
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
        this.updateCartCount();
        this.updateFavoriteCount();
      }),
    );

    // 3. Listen to local storage cart update event
    const onCartUpdate = () => {
      this.updateCartCount();
    };
    window.addEventListener('cartUpdated', onCartUpdate);

    this.subscriptions.add(
      new Subscription(() => {
        window.removeEventListener('cartUpdated', onCartUpdate);
      }),
    );

    // 4. Listen to favorites service changes
    this.subscriptions.add(
      this.favoriteService.favoriteChanges$.subscribe(() => {
        this.updateFavoriteCount(true);
      }),
    );
  }

  loadUserProfile(): void {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return;

    try {
      const userData = JSON.parse(userDataStr);
      const userId = userData.userId || userData.id;
      if (userId) {
        this.getProfile(userId);
      }
    } catch (e) {
      console.error('Failed to parse userData', e);
    }
  }

  getProfile(userId: number | string): void {
    this.subscriptions.add(
      this.authService.getUserById(+userId).subscribe({
        next: (res: any) => {
          this.userProfile = res;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Failed to fetch user profile:', err);
        },
      }),
    );
  }

  get profileImageUrl(): string {
    const imgPath =
      this.userProfile?.productImageUrl ||
      this.userProfile?.profileImageUrl ||
      this.userProfile?.avatar;
    if (!imgPath) return this.defaultAvatar;
    return imgPath.startsWith('http') ? imgPath : `${this.imageUrl}/${imgPath.replace(/^\//, '')}`;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  updateCartCount(): void {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        this.cartCount = Array.isArray(items)
          ? items.reduce((acc, item) => acc + (item.quantity || 0), 0)
          : 0;
      } catch (e) {
        this.cartCount = 0;
      }
    } else {
      this.cartCount = 0;
    }
    this.cdr.detectChanges();
  }

  updateFavoriteCount(forceRefresh = false): void {
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
        },
      });
    } catch (e) {
      this.favoriteCount = 0;
      this.cdr.detectChanges();
    }
  }

  onToggleSidebar(): void {
    this.toggleSidebarMobile.emit();
  }

  onSearch(query: string): void {
    if (query && query.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: query.trim() } });
    } else {
      this.router.navigate(['/products']);
    }
  }
}
