import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, ActivatedRoute } from '@angular/router';
import { CategoriesService } from '../../../Service/categories/categories-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  categories: any[] = [];
  maxPrice: number = 1000;
  isLoggedIn: boolean = false;
  userName: string = '';

  constructor(
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.checkAuthStatus();
    this.loadCategories();
    this.subscribeToQueryParams();
  }

  checkAuthStatus(): void {
    const token = localStorage.getItem('authToken');
    const userDataString = localStorage.getItem('userData');
    if (token && userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        this.isLoggedIn = true;
        this.userName = userData.name || userData.user?.name || userData.email || userData.user?.email || 'User';
      } catch (e) {
        console.error('Error parsing user data in sidebar', e);
        this.isLoggedIn = false;
      }
    } else {
      this.isLoggedIn = false;
    }
  }

  loadCategories(): void {
    this.categoriesService.getCategories().subscribe({
      next: (res: any) => {
        this.categories = Array.isArray(res) ? res : (res.data || res.$values || []);
        this.cdr.detectChanges(); // Forces Angular to update the UI
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  subscribeToQueryParams(): void {
    this.route.queryParams.subscribe({
      next: (params) => {
        if (params['maxPrice']) {
          const val = Number(params['maxPrice']);
          if (!isNaN(val)) {
            this.maxPrice = val;
            this.cdr.detectChanges();
          }
        }
      }
    });
  }

  onPriceChange(): void {
    this.router.navigate(['/products'], {
      queryParams: { maxPrice: this.maxPrice },
      queryParamsHandling: 'merge'
    });
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    this.isLoggedIn = false;
    this.userName = '';
    this.router.navigate(['/login']);
  }
}