import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductTables } from '../../../components/sellers/product-tables/product-tables';
import { ProductFormModal } from '../../../components/sellers/product-form-modal/product-form-modal';
import { Pagination } from '../../../shared/components/sellers-layout/pagination/pagination';
import { CategoriesService, Category } from '../../../Service/categories/categories-service';
import { ProductService } from '../../../Service/products/product-service';
import { ProductStatistics } from '../../../type/product';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [ProductTables, ProductFormModal, Pagination, CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  showProductModal = false;
  selectedProduct: any = null;
  showSizeColor = false;

  pageNumber: number = 1;
  pageSize: number = 7;
  totalItems: number = 0;
  totalPages: number = 1;

  private _searchTerm: string = '';
  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(val: string) {
    this._searchTerm = val;
    this.pageNumber = 1;
  }

  private _selectedCategoryId: string = '';
  get selectedCategoryId(): string {
    return this._selectedCategoryId;
  }
  set selectedCategoryId(val: string) {
    this._selectedCategoryId = val;
    this.pageNumber = 1;
  }

  categories: Category[] = [];

  selectedStatus: string = '';
  stats: ProductStatistics = {
    totalProducts: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
    suspended: 0
  };

  constructor(
    private categoriesService: CategoriesService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadStatistics();
  }

  loadCategories() {
    // Retrieve sellerId dynamically from local storage
    const storedUser = localStorage.getItem('userData') || localStorage.getItem('currentUser');
    const currentUser = storedUser ? JSON.parse(storedUser) : {};
    const sellerId = currentUser.userId || currentUser.sellerId;

    this.categoriesService.getAllCategoriesSeller(sellerId).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.categories = res;
        } else if (res && Array.isArray(res.$values)) {
          this.categories = res.$values;
        } else if (res && Array.isArray(res.data)) {
          this.categories = res.data;
        } else {
          this.categories = [];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      }
    });
  }

  loadStatistics() {
    const storedUser = localStorage.getItem('userData') || localStorage.getItem('currentUser');
    const currentUser = storedUser ? JSON.parse(storedUser) : {};
    const sellerId = currentUser.userId || currentUser.sellerId || 24;
    this.productService.ProductStatiStics(sellerId).subscribe({
      next: (data) => {
        this.stats = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load product statistics', err);
      }
    });
  }

  filterByStatus(status: string) {
    this.selectedStatus = status;
    this.pageNumber = 1;
    this.cdr.detectChanges();
  }

  onPageChanged(page: number) {
    this.pageNumber = page;
    this.cdr.detectChanges();
  }

  openProductModal(product?: any) {
    this.selectedProduct = product || null;
    this.showProductModal = true;
  }

  closeProductModal() {
    this.showProductModal = false;
    this.selectedProduct = null;
    this.loadStatistics(); // reload statistics when modal closes
  }
}