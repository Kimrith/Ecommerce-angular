import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProductCart } from '../../../components/main/product-cart/product-cart';
import { Pagination } from '../../../shared/components/main-layout/pagination/pagination';
import { Banner } from '../../../shared/components/main-layout/banner/banner';
import { ProductService } from '../../../Service/products/product-service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ProductCart, Pagination, Banner],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  products: any[] = [];

  constructor(private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.productService.getBestSellers().subscribe({
      next: (data: any) => {
        this.products = Array.isArray(data) ? data : data.products || [];
        this.cdr.detectChanges()
      },
      error: (err) => {
        console.error('Error fetching dashboard products', err);
      },
    });
  }

  onFilterChange(event: any) {
    const filterValue = event.target.value;
    if (filterValue === 'low-high') {
      this.products.sort((a, b) => a.price - b.price);
    } else if (filterValue === 'high-low') {
      this.products.sort((a, b) => b.price - a.price);
    } else {
      this.products.sort((a, b) => b.salesCount - a.salesCount);
    }
  }
}
