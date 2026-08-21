import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductCart } from '../product-cart/product-cart';
import { Pagination } from '../../../shared/components/main-layout/pagination/pagination';
import { ProductService } from '../../../Service/products/product-service';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ProductCart, Pagination],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit, OnDestroy {
  products: any[] = [];
  pageNumber: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  isLoading: boolean = false;
  searchTerm: string = '';
  sortBy: string = 'newest';

  private queryParamsSubscription!: Subscription;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // Listen to query parameters dynamically
    this.queryParamsSubscription = this.route.queryParams.subscribe({
      next: (params) => {
        this.searchTerm = params['search'] || '';
        this.sortBy = params['sortBy'] || 'newest';
        this.pageNumber = 1; // Reset to page 1 for new search/sort queries
        this.loadProducts();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  loadProducts() {
    this.isLoading = true;

    this.productService
      .getAllProduct(this.pageNumber, this.pageSize, this.searchTerm, null, 'Approved', this.sortBy)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (data: any) => {
          if (Array.isArray(data)) {
            this.products = data;
          } else {
            this.products = data.products || data.items || data.data || [];
            this.totalCount = data.totalCount || data.totalItems || 0;
          }
        },
        error: (err) => {
          console.error('Error fetching paginated products', err);
        },
      });
  }

  onPageChange(newPage: number) {
    this.pageNumber = newPage;
    this.loadProducts();
  }

  onSortChange(event: any) {
    const value = event.target.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sortBy: value },
      queryParamsHandling: 'merge'
    });
  }
}
