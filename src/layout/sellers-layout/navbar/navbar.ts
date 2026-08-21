import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Auths } from '../../../Service/Auth/auths';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  sellerProfile: any = null;
  imageUrl = environment.apiUrl;
  defaultAvatar = 'https://ui-avatars.com/api/?name=Seller&background=ffedd5&color=ea580c';

  private subscriptions = new Subscription();

  constructor(
    private authService: Auths,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSellerProfile();
  }

  loadSellerProfile(): void {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      try {
        const currentUser = JSON.parse(userDataStr);
        const sellerId = currentUser.userId || currentUser.sellerId || currentUser.id || 0;
        if (sellerId) {
          this.subscriptions.add(
            this.authService.getUserById(sellerId).subscribe({
              next: (res: any) => {
                this.sellerProfile = res.data || res;
                this.cdr.detectChanges();
              },
              error: (err) => {
                console.error('Failed to fetch seller info in navbar', err);
              }
            })
          );
        }
      } catch (e) {
        console.error('Failed to parse user data from localStorage', e);
      }
    }
  }

  get profileImageUrl(): string {
    const imgPath =
      this.sellerProfile?.profileImageUrl ||
      this.sellerProfile?.productImageUrl ||
      this.sellerProfile?.avatar;
    if (!imgPath) return this.defaultAvatar;
    return imgPath.startsWith('http') ? imgPath : `${this.imageUrl}/${imgPath.replace(/^\//, '')}`;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
