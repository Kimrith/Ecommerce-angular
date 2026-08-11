import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../Service/products/product-service';
import { environment } from '../../../environments/environment.development';
import { ToastComponent } from '../../../shared/components/toast';

@Component({
  selector: 'app-product-tables',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  templateUrl: './product-tables.html',
  styleUrl: './product-tables.css',
})
export class ProductTables implements OnInit, OnChanges {
  @Output() editProduct = new EventEmitter<any>();
  @Output() productDeleted = new EventEmitter<void>();
  @Output() productsLoaded = new EventEmitter<number>();
  @Output() totalItemsChange = new EventEmitter<number>();
  @Output() totalPagesChange = new EventEmitter<number>();
  @Input() searchTerm: string = '';
  @Input() selectedCategoryId: string = '';
  @Input() selectedStatus: string = '';
  @Input() pageNumber: number = 1;
  @Input() pageSize: number = 7;
  @Input() showSizeColor: boolean = false;

  productData: any[] = [];
  imgBaseUrl = environment.apiUrl;

  toastMessage = '';
  showSuccessToast = false;

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef // Helps force UI update if zone timing misbehaves on refresh
  ) { }

  ngOnInit(): void {
    this.getProductSeller();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.emitPaginationInfo();
  }

  emitPaginationInfo(): void {
    setTimeout(() => {
      this.totalItemsChange.emit(this.totalItems);
      this.totalPagesChange.emit(this.totalPages);
    });
  }

  getProductSeller() {
    // 1. Debug what's actually in localStorage on refresh
    const rawUserData = localStorage.getItem('userData') || localStorage.getItem('currentUser');
    console.log('Raw localStorage userData on refresh:', rawUserData);

    const currentUser = rawUserData ? JSON.parse(rawUserData) : {};
    const sellerId = currentUser.userId || currentUser.sellerId || 24; // fallback safety

    console.log('Resolved Seller ID for API:', sellerId);

    this.productService.getProductSeller(sellerId).subscribe({
      next: (data) => {
        console.log('API Response payload:', data);

        if (Array.isArray(data)) {
          this.productData = data;
        } else if (data && Array.isArray(data.items)) {
          this.productData = data.items;
        } else if (data && data.items && Array.isArray(data.items.$values)) {
          this.productData = data.items.$values;
        } else if (data && Array.isArray(data.$values)) {
          this.productData = data.$values;
        } else if (data && data.data) {
          if (Array.isArray(data.data)) {
            this.productData = data.data;
          } else if (Array.isArray(data.data.$values)) {
            this.productData = data.data.$values;
          } else {
            this.productData = [];
          }
        } else {
          this.productData = [];
        }

        // Force UI refresh cycle in case zone runner misses async event on hard reload
        this.productsLoaded.emit(this.totalItems);
        this.cdr.detectChanges();
        this.emitPaginationInfo();
      },
      error: (err) => {
        console.error('Failed to fetch seller products on refresh. Check Auth Token:', err);
      }
    });
  }

  getStatusValue(statusStr: string | number | null | undefined): number {
    if (statusStr === null || statusStr === undefined) return -1;
    const num = Number(statusStr);
    if (!isNaN(num) && statusStr.toString().trim() !== '') return num;
    switch (statusStr.toString().trim().toLowerCase()) {
      case 'draft': return 0;
      case 'pending': return 1;
      case 'approved': case 'active': return 2;
      case 'rejected': return 3;
      case 'archived': return 4;
      case 'suspended': return 5;
      default: return -1;
    }
  }

  get allFilteredProducts() {
    let temp = [...this.productData];
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const search = this.searchTerm.toLowerCase().trim();
      temp = temp.filter(p =>
        (p.name && p.name.toLowerCase().includes(search)) ||
        (p.sku && p.sku.toLowerCase().includes(search)) ||
        (p.description && p.description.toLowerCase().includes(search))
      );
    }
    if (this.selectedCategoryId && this.selectedCategoryId !== '') {
      temp = temp.filter(p => p.categoryId && p.categoryId.toString() === this.selectedCategoryId.toString());
    }
    if (this.selectedStatus !== undefined && this.selectedStatus !== '') {
      const targetVal = this.getStatusValue(this.selectedStatus);
      temp = temp.filter(p => this.getStatusValue(p.status) === targetVal);
    }
    return temp;
  }

  get filteredProducts() {
    const page = Number(this.pageNumber || 1);
    const size = Number(this.pageSize || 10);
    const startIndex = (page - 1) * size;
    return this.allFilteredProducts.slice(startIndex, startIndex + size);
  }

  get totalItems(): number {
    return this.allFilteredProducts.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showSuccessToast = false;
    setTimeout(() => {
      this.showSuccessToast = true;
      this.cdr.detectChanges();
    }, 50);
  }

  deleteProduct(product: any) {
    if (confirm(`Are you sure you want to delete product "${product.name}"?`)) {
      this.productService.deleteProductWithVariants(product.id).subscribe({
        next: () => {
          this.triggerToast('Product and its variants deleted successfully.');
          this.productDeleted.emit();
          this.getProductSeller();
        },
        error: (err) => {
          console.error('Failed to delete product', err);
          this.triggerToast('Failed to delete product. Please try again.');
        }
      });
    }
  }
}