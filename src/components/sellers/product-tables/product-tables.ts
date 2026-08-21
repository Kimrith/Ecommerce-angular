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
  private _searchTerm: string = '';
  @Input()
  get searchTerm(): string { return this._searchTerm; }
  set searchTerm(val: string) {
    this._searchTerm = val;
    this.getProductSeller();
  }

  private _selectedCategoryId: string = '';
  @Input()
  get selectedCategoryId(): string { return this._selectedCategoryId; }
  set selectedCategoryId(val: string) {
    this._selectedCategoryId = val;
    this.getProductSeller();
  }

  private _selectedStatus: string = '';
  @Input()
  get selectedStatus(): string { return this._selectedStatus; }
  set selectedStatus(val: string) {
    this._selectedStatus = val;
    this.getProductSeller();
  }

  private _pageNumber: number = 1;
  @Input()
  get pageNumber(): number { return this._pageNumber; }
  set pageNumber(val: number) {
    this._pageNumber = val;
    this.getProductSeller();
  }

  private _pageSize: number = 7;
  @Input()
  get pageSize(): number { return this._pageSize; }
  set pageSize(val: number) {
    this._pageSize = val;
    this.getProductSeller();
  }

  @Input() showSizeColor: boolean = false;

  productData: any[] = [];
  totalItems: number = 0;
  totalPages: number = 1;
  imgBaseUrl = environment.apiUrl;
  defaultProductImage = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-YKwoMPIgLj0eGd4fimf49IclMWAIbMJQRe_r21HTcJ0TCmDfQk9CJSU&s=10';

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
    const rawUserData = localStorage.getItem('userData') || localStorage.getItem('currentUser');
    console.log('Raw localStorage userData on refresh:', rawUserData);

    const currentUser = rawUserData ? JSON.parse(rawUserData) : {};
    const sellerId = currentUser.userId || currentUser.sellerId || 24;

    console.log('Resolved Seller ID for API:', sellerId);

    this.productService.getProductSeller(
      sellerId,
      this.pageNumber,
      this.pageSize,
      this.searchTerm,
      this.selectedCategoryId,
      this.selectedStatus
    ).subscribe({
      next: (data) => {
        console.log('API Response payload:', data);

        let items: any[] = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (data && Array.isArray(data.items)) {
          items = data.items;
        } else if (data && data.items && Array.isArray(data.items.$values)) {
          items = data.items.$values;
        } else if (data && Array.isArray(data.$values)) {
          items = data.$values;
        } else if (data && data.data) {
          if (Array.isArray(data.data)) {
            items = data.data;
          } else if (Array.isArray(data.data.$values)) {
            items = data.data.$values;
          } else {
            items = [];
          }
        } else {
          items = [];
        }

        this.productData = items;
        this.totalItems = data.totalItems ?? items.length;
        this.totalPages = data.totalPages ?? 1;

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
    return this.productData;
  }

  get filteredProducts() {
    return this.productData;
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