import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../Service/products/product-service';
import { AddProductVariant } from '../add-product-variant/add-product-variant';

@Component({
  selector: 'app-product-view-detail',
  standalone: true,
  imports: [CommonModule, AddProductVariant],
  templateUrl: './product-view-detail.html',
  styleUrl: './product-view-detail.css'
})
export class ProductViewDetail implements OnInit, OnChanges {
  @Input() product: any = {};
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<any>();

  variants: any[] = [];
  showVariants: boolean = false;
  showAddVariantModal: boolean = false;
  showProductDetail: boolean = true;
  selectedVariantToEdit: any = null;

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef // 👈 Inject ChangeDetectorRef here
  ) { }

  ngOnInit(): void {
    this.checkAndFetchVariants();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && !changes['product'].firstChange) {
      this.checkAndFetchVariants();
    }
  }

  private checkAndFetchVariants() {
    this.showVariants = false;
    if (this.product && this.product.id) {
      this.fetchVariants(this.product.id);
    } else {
      this.variants = [];
    }
  }

  fetchVariants(productId: number) {
    this.productService.getProductVariants(productId).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.variants = res;
        } else if (res && Array.isArray(res.$values)) {
          this.variants = res.$values;
        } else if (res && Array.isArray(res.data)) {
          this.variants = res.data;
        } else if (res && Array.isArray(res.items)) {
          this.variants = res.items;
        } else {
          this.variants = [];
        }

        // 👈 Force change detection so badge count and lists update immediately
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching variants:', err);
        this.variants = [];
        this.cdr.detectChanges();
      }
    });
  }

  deleteProduct() {
    if (!this.product || !this.product.id) return;

    if (confirm('Are you sure you want to delete this product and all its variants?')) {
      this.productService.deleteProductWithVariants(this.product.id).subscribe({
        next: (response) => {
          console.log('Product and variants deleted successfully', response);
          this.closeModal();
          window.location.reload();
        },
        error: (err) => {
          console.error('Error deleting product', err);
          alert('Failed to delete the product. Please try again.');
        }
      });
    }
  }

  closeAddVariantModal() {
    this.showAddVariantModal = false;
    this.selectedVariantToEdit = null;
  }

  openAddVariantModal() {
    this.selectedVariantToEdit = null;
    this.showAddVariantModal = true;
  }

  openEditVariantModal(variant: any) {
    this.selectedVariantToEdit = variant;
    this.showAddVariantModal = true;
  }

  deleteVariant(variantId: number, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this variant?')) {
      this.productService.deleteProductVariant(variantId).subscribe({
        next: (res) => {
          alert('Variant deleted successfully');
          this.fetchVariants(this.product.id);
        },
        error: (err) => {
          console.error('Error deleting variant:', err);
          alert('Failed to delete variant');
        }
      });
    }
  }

  editProduct() {
    this.edit.emit(this.product);
  }

  toggleVariants() {
    this.showVariants = !this.showVariants;
  }

  closeModal() {
    this.close.emit();
  }

  getStatusText(status: any): string {
    if (status === null || status === undefined) return 'Active';
    // If status is already a string (e.g. 'Draft'), return it
    if (typeof status === 'string' && isNaN(Number(status))) {
      return status;
    }
    const num = Number(status);
    switch (num) {
      case 0: return 'Draft';
      case 1: return 'Pending';
      case 2: return 'Approved';
      case 3: return 'Rejected';
      case 4: return 'Archived';
      case 5: return 'Suspended';
      default: return 'Active';
    }
  }
}