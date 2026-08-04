import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddProductFormModel } from '../../../components/admin/add-product-form-model/add-product-form-model';
import { ProductService } from '../../../Service/products/product-service';
import { ProductViewDetail } from '../../../components/admin/product-view-detail/product-view-detail';
import { Pagination } from '../../../shared/components/admin/pagination/pagination';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, AddProductFormModel, ProductViewDetail, Pagination],
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class Product implements OnInit {
  showAddProductModal = false;
  products: any[] = [];
  selectedItem: any = null;

  // 👇 Pagination state variables matching your API response
  pageNumber: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 1;

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadProducts(this.pageNumber);
  }

  loadProducts(page: number = 1) {
    // 👇 Make sure you pass `page` and `this.pageSize` here!
    this.productService.getAllProduct(page, this.pageSize).subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.products = response;
        } else if (response && Array.isArray(response.$values)) {
          this.products = response.$values;
        } else if (response && Array.isArray(response.data)) {
          this.products = response.data;
        } else if (response && Array.isArray(response.items)) {
          this.products = response.items;
          // Capture pagination meta properties
          this.pageNumber = response.pageNumber ?? page;
          this.pageSize = response.pageSize ?? 10;
          this.totalItems = response.totalItems ?? 0;
          this.totalPages = response.totalPages ?? 1;
        } else {
          // If your backend returns an object wrapper directly containing items
          this.products = response.items || [];
          this.pageNumber = response.pageNumber ?? page;
          this.pageSize = response.pageSize ?? 10;
          this.totalItems = response.totalItems ?? 0;
          this.totalPages = response.totalPages ?? 1;
        }
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching products:', error);
      }
    });
  }

  // 👇 This is triggered when you click next/previous or a page number
  onPageChanged(newPage: number) {
    this.pageNumber = newPage;
    this.loadProducts(this.pageNumber); // This will fetch the new page!
  }

  openAddProductModal() {
    this.showAddProductModal = true;
  }

  closeAddProductModal() {
    this.showAddProductModal = false;
    this.loadProducts(this.pageNumber);
  }

  viewDetail(product: any) {
    this.selectedItem = product;
  }
}