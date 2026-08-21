import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductCart } from '../product-cart/product-cart';
import { Pagination } from '../../../shared/components/main-layout/pagination/pagination';
import { ProductService } from '../../../Service/products/product-service';
import { CategoriesService } from '../../../Service/categories/categories-service';
import { combineLatest } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-category-detail',
  imports: [ProductCart, Pagination, RouterLink],
  templateUrl: './category-detail.html',
  styleUrl: './category-detail.css',
})
export class CategoryDetail implements OnInit {
  categoryId: number = 0;
  category: any = null;
  products: any[] = []; // Strongly typed as an array
  sortBy: string = 'newest';
  imgUrls = environment.apiUrl

  defaultCategoriesimg = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-YKwoMPIgLj0eGd4fimf49IclMWAIbMJQRe_r21HTcJ0TCmDfQk9CJSU&s=10"

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParams]).subscribe({
      next: ([paramMap, queryParams]) => {
        const idParam = paramMap.get('id');
        if (idParam) {
          const newCategoryId = +idParam;
          if (newCategoryId !== this.categoryId) {
            this.categoryId = newCategoryId;
            this.loadCategoryDetail();
          }
        }
        this.sortBy = queryParams['sortBy'] || 'newest';
        this.loadProducts();
      }
    });
  }

  loadCategoryDetail() {
    this.categoriesService.getCategories().subscribe({
      next: (cats: any[]) => {
        this.category = cats.find(c => c.id === this.categoryId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching category detail:', err);
      }
    });
  }

  loadProducts() {
    this.productService.getAllProduct(1, 100, undefined, this.categoryId, 'Approved', this.sortBy).subscribe({
      next: (response: any) => {
        let items: any[] = [];
        if (Array.isArray(response)) {
          items = response;
        } else if (response && Array.isArray(response.$values)) {
          items = response.$values;
        } else if (response && Array.isArray(response.data)) {
          items = response.data;
        } else if (response && Array.isArray(response.items)) {
          items = response.items;
        } else if (response && response.products) {
          items = response.products;
        }
        this.products = items;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching category products', err);
      },
    });
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