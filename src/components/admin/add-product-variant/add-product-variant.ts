import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../Service/products/product-service';

@Component({
  selector: 'app-add-product-variant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product-variant.html',
  styleUrl: './add-product-variant.css',
})
export class AddProductVariant implements OnInit {

  @Input() productId!: number;
  @Input() editVariant: any = null; // If passed, we are in edit mode
  @Output() close = new EventEmitter<void>();

  selectedImage: File | null = null;
  selectedImageName: string | null = null; // Track file name for UI
  existingImageUrl: string | null = null; // Track existing image URL if editing

  variant = {
    title: '',
    sku: '',
    barcode: '',
    size: '',
    color: '',
    price: null as number | null,
    discountPrice: null as number | null,
    initialStock: 0,
    isActive: true
  };

  constructor(
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    if (this.editVariant) {
      this.variant.title = this.editVariant.title || '';
      this.variant.sku = this.editVariant.sku || '';
      this.variant.barcode = this.editVariant.barcode || '';
      this.variant.size = this.editVariant.size || '';
      this.variant.color = this.editVariant.color || '';
      this.variant.price = this.editVariant.price;
      this.variant.discountPrice = this.editVariant.discountPrice;
      this.variant.initialStock = this.editVariant.initialStock ?? this.editVariant.availableQuantity ?? 0;
      this.variant.isActive = this.editVariant.isActive !== false;
      this.existingImageUrl = this.editVariant.imageUrl || null;
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
      this.selectedImageName = this.selectedImage.name;
    } else {
      this.selectedImage = null;
      this.selectedImageName = null;
    }
  }

  saveVariant(): void {
    const formData = new FormData();

    formData.append('ProductId', this.productId.toString());
    formData.append('Title', this.variant.title);
    formData.append('Sku', this.variant.sku);
    formData.append('InitialStock', this.variant.initialStock.toString());
    formData.append('Price', (this.variant.price ?? 0).toString());
    formData.append('IsActive', this.variant.isActive ? 'true' : 'false');

    if (this.variant.barcode) formData.append('Barcode', this.variant.barcode);
    if (this.variant.size) formData.append('Size', this.variant.size);
    if (this.variant.color) formData.append('Color', this.variant.color);
    if (this.variant.discountPrice !== null && this.variant.discountPrice !== undefined) {
      formData.append('DiscountPrice', this.variant.discountPrice.toString());
    }

    if (this.selectedImage) {
      formData.append('ImageUrl', this.selectedImage); // Matches backend parameter name
    }

    if (this.editVariant) {
      this.productService.updateProductVariant(this.editVariant.id, formData).subscribe({
        next: (res) => {
          alert('Variant updated successfully');
          this.closeModal();
          window.location.reload();
        },
        error: (err) => {
          console.error('Error updating variant:', err);
          alert('Failed to update variant');
        }
      });
    } else {
      this.productService.addProductVariant(formData).subscribe({
        next: (res) => {
          alert('Variant added successfully');
          this.closeModal();
          window.location.reload();
        },
        error: (err) => {
          console.error('Error creating variant:', err);
          alert('Failed to add variant');
        }
      });
    }
  }

  deleteVariant(): void {
    if (!this.editVariant || !this.editVariant.id) return;
    if (confirm('Are you sure you want to delete this variant?')) {
      this.productService.deleteProductVariant(this.editVariant.id).subscribe({
        next: (res) => {
          alert('Variant deleted successfully');
          this.closeModal();
          window.location.reload();
        },
        error: (err) => {
          console.error('Error deleting variant:', err);
          alert('Failed to delete variant');
        }
      });
    }
  }

  closeModal(): void {
    this.close.emit();
  }
}