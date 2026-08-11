import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductCart } from '../product-cart/product-cart';
import { Pagination } from '../../../shared/components/main-layout/pagination/pagination';
import { ProductService } from '../../../Service/products/product-service';
import { CategoriesService } from '../../../Service/categories/categories-service';

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

  imgs = [
    {
      id: 1,
      img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1600'
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.categoryId = +idParam;
        this.loadCategoryDetail();
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
    this.productService.getAllProduct(1, 100, undefined, this.categoryId, 'Approved').subscribe({
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
}