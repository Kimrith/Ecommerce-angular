import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddProductFormModel } from '../../../components/admin/add-product-form-model/add-product-form-model';
import { ProductService } from '../../../Service/products/product-service';
import { CategoriesService } from '../../../Service/categories/categories-service';
import { ProductViewDetail } from '../../../components/admin/product-view-detail/product-view-detail';
import { Pagination } from '../../../shared/components/admin/pagination/pagination';
import { environment } from '../../../environments/environment.development';
import { ToastComponent } from '../../../shared/components/toast';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, AddProductFormModel, ProductViewDetail, Pagination,
    ToastComponent
  ],
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class Product implements OnInit {
  showAddProductModal = false;
  products: any[] = [];
  selectedItem: any = null;
  selectedProductToEdit: any = null;
  imageUrl = environment.apiUrl;

  // Filter & Search state variables
  searchTerm: string = '';
  selectedStatus: number | null = null;
  selectedCategory: number | null = null;
  categories: any[] = [];
  showSizeColor = false;

  showSuccessToast = false;
  toastMessage = '';

  stats: any = {
    totalProducts: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
    suspended: 0
  };

  // 👇 Pagination state variables matching your API response
  pageNumber: number = 1;
  pageSize: number = 7;
  totalItems: number = 0;
  totalPages: number = 1;

  constructor(
    private productService: ProductService,
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadStatistics();
    this.loadProducts(this.pageNumber);
  }

  triggerToast(message: string) {
    this.toastMessage = message;
    this.showSuccessToast = false;
    setTimeout(() => {
      this.showSuccessToast = true;
      this.cdr.detectChanges();
    }, 50);
  }

  loadCategories() {
    this.categoriesService.getCategories().subscribe({
      next: (cats: any[]) => {
        this.categories = cats;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
      }
    });
  }

  loadStatistics() {
    this.productService.ProductStatiStics().subscribe({
      next: (res: any) => {
        this.stats = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching product statistics:', err);
      }
    });
  }

  getStatusValue(statusStr: string | number): number {
    if (typeof statusStr === 'number') return statusStr;
    switch (statusStr?.toLowerCase()) {
      case 'draft': return 0;
      case 'pending': return 1;
      case 'approved': return 2;
      case 'rejected': return 3;
      case 'archived': return 4;
      case 'suspended': return 5;
      default: return 0;
    }
  }

  loadProducts(page: number = 1) {
    const rawCat: any = this.selectedCategory;
    let catId: number | null = null;
    if (rawCat !== null && rawCat !== undefined && rawCat !== 'null' && rawCat !== '') {
      catId = Number(rawCat);
      if (isNaN(catId)) catId = null;
    }

    const rawStatus: any = this.selectedStatus;
    let statusVal: number | null = null;
    if (rawStatus !== null && rawStatus !== undefined && rawStatus !== 'null' && rawStatus !== '') {
      statusVal = Number(rawStatus);
      if (isNaN(statusVal)) statusVal = null;
    }

    this.productService.getAllProduct(
      page,
      this.pageSize,
      this.searchTerm || undefined,
      catId,
      statusVal
    ).subscribe({
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
          this.pageNumber = response.pageNumber ?? page;
          this.pageSize = response.pageSize ?? 10;
          this.totalItems = response.totalItems ?? 0;
          this.totalPages = response.totalPages ?? 1;
        } else {
          items = response.items || [];
          this.pageNumber = response.pageNumber ?? page;
          this.pageSize = response.pageSize ?? 10;
          this.totalItems = response.totalItems ?? 0;
          this.totalPages = response.totalPages ?? 1;
        }

        // Sanitize product status to always be numeric
        this.products = items.map(p => {
          const numericStatus = this.getStatusValue(p.status);
          return {
            ...p,
            status: numericStatus,
            statusText: p.statusText || this.getStatusText(numericStatus)
          };
        });

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching products:', error);
      }
    });
  }

  searchProducts() {
    this.pageNumber = 1;
    this.loadProducts(this.pageNumber);
  }

  filterByStatus(status: number | null) {
    this.selectedStatus = status;
    this.searchProducts();
  }

  // 👇 This is triggered when you click next/previous or a page number
  onPageChanged(newPage: number) {
    this.pageNumber = newPage;
    this.loadProducts(this.pageNumber); // This will fetch the new page!
  }

  openAddProductModal() {
    this.selectedProductToEdit = null;
    this.showAddProductModal = true;
  }

  closeAddProductModal() {
    this.showAddProductModal = false;
    this.selectedProductToEdit = null;
    this.loadProducts(this.pageNumber);
  }

  openEditProductModal(product: any) {
    this.selectedItem = null; // Close detail panel
    this.selectedProductToEdit = product;
    this.showAddProductModal = true;
  }

  viewDetail(product: any) {
    this.selectedItem = product;
  }

  onStatusChange(product: any, event: Event) {
    const select = event.target as HTMLInputElement;
    const newStatus = parseInt(select.value, 10);

    if (isNaN(newStatus)) return;

    const statusObservable = newStatus === 5
      ? this.productService.suspendProduct(product.id)
      : this.productService.updateProductStatus(product.id, newStatus);

    statusObservable.subscribe({
      next: (res: any) => {
        const updatedStatus = this.getStatusValue(res?.status ?? newStatus);
        product.status = updatedStatus;
        product.statusText = res?.statusText || this.getStatusText(updatedStatus);

        // Refresh stats and data seamlessly
        this.loadStatistics();
        this.loadProducts(this.pageNumber);

        // Trigger your custom toast and execute a single refresh/detection cycle
        this.triggerToast('Product status updated successfully');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating status:', err);
        const errorMsg = err.error?.Message || err.error?.message || 'Failed to update product status';
        this.triggerToast(errorMsg);

        // Reset select element back to previous value
        select.value = product.status.toString();
        this.cdr.detectChanges();
      }
    });
  }

  private getStatusText(status: number): string {
    switch (status) {
      case 0: return 'Draft';
      case 1: return 'Pending';
      case 2: return 'Approved';
      case 3: return 'Rejected';
      case 4: return 'Archived';
      case 5: return 'Suspended';
      default: return 'Unknown';
    }
  }

  startEditStock(product: any) {
    product.isEditingStock = true;
    product.tempStock = product.stockQuantity ?? product.initialStock ?? product.availableQuantity ?? 0;
  }

  cancelEditStock(product: any) {
    product.isEditingStock = false;
  }

  saveStock(product: any) {
    if (product.tempStock === undefined || product.tempStock === null || product.tempStock < 0) {
      this.triggerToast('Stock cannot be negative');
      return;
    }

    const formData = new FormData();
    formData.append('Name', product.name || '');
    formData.append('Description', product.description || '');
    formData.append('Price', product.price?.toString() || '0');
    formData.append('DiscountPrice', product.discountPrice?.toString() || '0');
    formData.append('CategoryId', product.categoryId?.toString() || '');
    formData.append('Status', product.status?.toString() || '0');
    formData.append('InitialStock', product.tempStock.toString());

    this.productService.updateProduct(product.id, formData).subscribe({
      next: (res: any) => {
        product.stockQuantity = res.stockQuantity;
        product.availableQuantity = res.availableQuantity;
        product.initialStock = res.stockQuantity;
        product.isEditingStock = false;
        
        this.loadStatistics();
        this.triggerToast('Stock updated successfully');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating stock:', err);
        const errorMsg = err.error?.Message || err.error?.message || 'Failed to update stock';
        this.triggerToast(errorMsg);
      }
    });
  }
}